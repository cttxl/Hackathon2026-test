package algorithm

import (
	"context"
	"database/sql"
	"log"
	"sort"
	"time"

	"github.com/cttxl/Hackathon2026-test/internal/core/domain"
)

// ──────────────────────────────────────────────────────────────────────────────
// GetRecommended distributes pending requests across pending arrivals.
//
// New Algorithm (Requested by user):
//  1. Load all pending requests.
//  2. Load all pending arrivals (sorted by time).
//  3. Sort requests by urgency: critical (0) > high (1) > default (2).
//  4. For each request, pick arrival sequentially (i % len(arrivals)).
// ──────────────────────────────────────────────────────────────────────────────
func GetRecommended(ctx context.Context, db *sql.DB) ([]domain.ArrivalRequest, error) {
	// 1. Fetch all pending requests
	requests, err := fetchPendingRequests(ctx, db)
	if err != nil {
		return nil, err
	}

	// 2. Fetch all pending arrivals (already sorted by a.time_to_arrival ASC)
	arrivals, err := fetchPendingArrivals(ctx, db)
	if err != nil {
		return nil, err
	}

	if len(arrivals) == 0 || len(requests) == 0 {
		return []domain.ArrivalRequest{}, nil
	}

	// 3. Sort requests by urgency rank
	sort.Slice(requests, func(i, j int) bool {
		return emergencyRank(requests[i].emergency) < emergencyRank(requests[j].emergency)
	})

	// 4. For each request, pick arrival sequentially
	now := time.Now()
	out := make([]domain.ArrivalRequest, 0, len(requests))

	for i, req := range requests {
		// Pick arrival sequentially based on urgency
		arrIdx := i % len(arrivals)
		
		out = append(out, domain.ArrivalRequest{
			ArrivalID: arrivals[arrIdx].arrivalID,
			RequestID: req.requestID,
			CreatedAt: now,
			UpdatedAt: now,
		})
	}

	return out, nil
}

func emergencyRank(e string) int {
	switch e {
	case "critical":
		return 0
	case "high":
		return 1
	default:
		return 2
	}
}

// ──────────────────────────────────────────────────────────────────────────────
// Internal data types
// ──────────────────────────────────────────────────────────────────────────────

type pendingRequest struct {
	requestID string
	productID string
	emergency string
	quantity  int
	createdAt time.Time

	pWeight, pHeight, pWidth, pLength int
	dpAddress                         string // delivery point address (destination)
}

type pendingArrival struct {
	arrivalID string

	maxWeight, maxHeight, maxWidth, maxLength int
	fuelConsumption                           int
	vehicleAddress                            string // vehicle starting address (point A)

	remainWeight int
	remainVol    int
}

// ──────────────────────────────────────────────────────────────────────────────
// Database queries
// ──────────────────────────────────────────────────────────────────────────────

func fetchPendingRequests(ctx context.Context, db *sql.DB) ([]pendingRequest, error) {
	const query = `
		SELECT
			r.id          AS request_id,
			r.product_id,
			r.emergency,
			r.quantity,
			r.created_at,
			p.weight,
			p.height,
			p.width,
			p.length,
			dp.address    AS dp_address
		FROM  requests        r
		JOIN  products        p  ON p.id  = r.product_id
		JOIN  delivery_points dp ON dp.id = r.delivery_point_id
		WHERE r.status IN ('pending', 'accepted')
	`

	rows, err := db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []pendingRequest
	for rows.Next() {
		var req pendingRequest
		if err := rows.Scan(
			&req.requestID,
			&req.productID,
			&req.emergency,
			&req.quantity,
			&req.createdAt,
			&req.pWeight, &req.pHeight, &req.pWidth, &req.pLength,
			&req.dpAddress,
		); err != nil {
			log.Printf("[algorithm] fetchPendingRequests: scan error: %v", err)
			continue
		}
		out = append(out, req)
	}
	return out, rows.Err()
}

func fetchPendingArrivals(ctx context.Context, db *sql.DB) ([]pendingArrival, error) {
	const query = `
		SELECT
			a.id              AS arrival_id,
			v.max_weight,
			v.max_height,
			v.max_width,
			v.max_length,
			v.fuel_consumption,
			v.address         AS vehicle_address
		FROM  arrivals  a
		JOIN  vehicles  v ON v.id = a.transport_id
		WHERE a.status IN ('pending', 'accepted')
		ORDER BY a.time_to_arrival ASC
	`

	rows, err := db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []pendingArrival
	for rows.Next() {
		var arr pendingArrival
		if err := rows.Scan(
			&arr.arrivalID,
			&arr.maxWeight,
			&arr.maxHeight,
			&arr.maxWidth,
			&arr.maxLength,
			&arr.fuelConsumption,
			&arr.vehicleAddress,
		); err != nil {
			log.Printf("[algorithm] fetchPendingArrivals: scan error: %v", err)
			continue
		}
		arr.remainWeight = arr.maxWeight
		arr.remainVol = arr.maxHeight * arr.maxWidth * arr.maxLength
		out = append(out, arr)
	}
	return out, rows.Err()
}

