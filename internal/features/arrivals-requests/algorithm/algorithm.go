package algorithm

import (
	"context"
	"database/sql"
	"sort"
	"strings"
	"time"

	"github.com/cttxl/Hackathon2026-test/internal/core/domain"
)

// stringDistance calculates a simple Levenshtein distance between two strings
func stringDistance(a, b string) int {
	a = strings.ToLower(a)
	b = strings.ToLower(b)
	if len(a) == 0 {
		return len(b)
	}
	if len(b) == 0 {
		return len(a)
	}

	d := make([][]int, len(a)+1)
	for i := range d {
		d[i] = make([]int, len(b)+1)
		d[i][0] = i
	}
	for j := range d[0] {
		d[0][j] = j
	}
	for j := 1; j <= len(b); j++ {
		for i := 1; i <= len(a); i++ {
			if a[i-1] == b[j-1] {
				d[i][j] = d[i-1][j-1]
			} else {
				min := d[i-1][j]
				if d[i][j-1] < min {
					min = d[i][j-1]
				}
				if d[i-1][j-1] < min {
					min = d[i-1][j-1]
				}
				d[i][j] = min + 1
			}
		}
	}
	return d[len(a)][len(b)]
}

// GetRecommended calculates the best arrival-requests mapping priorities
func GetRecommended(ctx context.Context, db *sql.DB) ([]domain.ArrivalRequest, error) {
	// A massive join to pull all variables we want to process for pending entries
	query := `
		SELECT 
			a.id AS arrival_id,
			a.time_to_arrival,
			v.max_weight, v.max_height, v.max_width, v.max_length,
			v.address AS vehicle_address,
			v.fuel_consumption,
			v.fuel_type,
			r.id AS request_id,
			r.quantity,
			r.emergency,
			p.weight, p.height, p.width, p.length,
			dp.address AS dp_address,
			s.id AS sku_id
		FROM arrivals a
		JOIN vehicles v ON a.transport_id = v.id
		CROSS JOIN requests r
		JOIN products p ON r.product_id = p.id
		JOIN delivery_points dp ON r.delivery_point_id = dp.id
		JOIN sku s ON s.product_id = p.id AND s.delivery_point_id = dp.id
		WHERE a.status = 'pending' AND r.status = 'pending'
	`

	rows, err := db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	type recommendation struct {
		ar    domain.ArrivalRequest
		score int
	}

	var recs []recommendation

	for rows.Next() {
		var (
			arrivalID     string
			timeToArrival time.Time
			vMaxWeight    int
			vMaxHeight    int
			vMaxWidth     int
			vMaxLength    int
			vAddress      string
			vFuelCons     int
			vFuelType     string
			requestID     string
			rQuantity     int
			rEmergency    string
			pWeight       int
			pHeight       int
			pWidth        int
			pLength       int
			dpAddress     string
			skuID         string
		)

		if err := rows.Scan(
			&arrivalID, &timeToArrival,
			&vMaxWeight, &vMaxHeight, &vMaxWidth, &vMaxLength,
			&vAddress, &vFuelCons, &vFuelType,
			&requestID, &rQuantity, &rEmergency,
			&pWeight, &pHeight, &pWidth, &pLength,
			&dpAddress, &skuID,
		); err != nil {
			continue
		}

		// 1. Constraints Check
		totalWeight := pWeight * rQuantity
		if totalWeight > vMaxWeight {
			continue // Too heavy
		}
		if pHeight > vMaxHeight || pWidth > vMaxWidth || pLength > vMaxLength {
			continue // Dimensions mismatch
		}

		volProduct := pHeight * pWidth * pLength * rQuantity
		volVehicle := vMaxHeight * vMaxWidth * vMaxLength
		if volProduct > volVehicle {
			continue // Total package volume exceeded
		}

		// 2. Score Calculation
		score := 0

		// Emergency prioritization
		if rEmergency == "critical" {
			score += 10000
		} else if rEmergency == "high" {
			score += 5000
		} else {
			score += 1000 // default
		}

		// Penalize distance between DP and Vehicle Depot
		distancePenalty := stringDistance(vAddress, dpAddress)
		score -= (distancePenalty * 10)

		// Penalize heavy fuel consumption
		score -= vFuelCons * 5

		// Reward eco-friendly fuel types (electric/etc)
		if vFuelType == "electric" {
			score += 500
		} else if vFuelType == "gasoline" {
			score -= 100
		}

		// Time to arrival: reward closer schedules
		hoursUntil := time.Until(timeToArrival).Hours()
		if hoursUntil < 0 {
			hoursUntil = 0
		}
		score -= int(hoursUntil * 20)

		recs = append(recs, recommendation{
			ar: domain.ArrivalRequest{
				ArrivalID: arrivalID,
				RequestID: requestID,
				SkuID:     skuID,
				CreatedAt: time.Now(),
				UpdatedAt: time.Now(),
			},
			score: score,
		})
	}

	// 3. Sort by score descending
	sort.Slice(recs, func(i, j int) bool {
		return recs[i].score > recs[j].score
	})

	// 4. Map into domain array injecting dynamic priority value
	finalArrivalRequests := make([]domain.ArrivalRequest, 0)
	currentRank := 1
	for _, rec := range recs {
		rec.ar.Priority = currentRank
		finalArrivalRequests = append(finalArrivalRequests, rec.ar)
		currentRank++
	}

	return finalArrivalRequests, nil
}
