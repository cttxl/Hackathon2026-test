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
// Output: one entry per arrival (per truck trip).
//
// Algorithm:
//  1. Load all pending requests (with product dimensions, weight, emergency,
//     and delivery_point address).
//  2. Sort by emergency urgency: critical → high → default (FIFO within tier).
//  3. Load all pending arrivals (with vehicle capacity, fuel_consumption,
//     and vehicle address — the starting point of the truck).
//  4. Pre-geocode all unique addresses (vehicle + delivery point) once
//     via Nominatim, then cache coordinates for route calculations.
//  5. For each request (in urgency order) pick the best arrival:
//     a. Filter: unit dimensions fit + enough remaining weight + volume.
//     b. Score: total_fuel_cost = distance_km × fuel_consumption.
//     Distance is calculated via OSRM from vehicle address to the
//     request's delivery point address.
//     c. Pick the arrival with the LOWEST fuel cost.
//     d. Deduct capacity → next request sees updated remainders (bin-packing).
//  6. One output entry per truck:
//     - arrival_id, request_id (most urgent), sku_ids (all products),
//     priority (truck rank, 1 = most urgent cargo).
//
// ──────────────────────────────────────────────────────────────────────────────
func GetRecommended(ctx context.Context, db *sql.DB) ([]domain.ArrivalRequest, error) {
	// ── 1. Fetch all pending requests ────────────────────────────────────────
	requests, err := fetchPendingRequests(ctx, db)
	if err != nil {
		return nil, err
	}

	// ── 2. Sort by emergency urgency, then FIFO ─────────────────────────────
	sortByUrgency(requests)

	// ── 3. Fetch all pending arrivals ────────────────────────────────────────
	arrivals, err := fetchPendingArrivals(ctx, db)
	if err != nil {
		return nil, err
	}

	if len(arrivals) == 0 || len(requests) == 0 {
		return []domain.ArrivalRequest{}, nil
	}

	// ── 4. Pack requests into arrivals ───────────────────────────────────────
	assignment := make(map[int][]int)
	var arrivalOrder []int
	arrivalSeen := make(map[int]bool)

	// Track delivery point addresses already assigned to each arrival,
	// so we can compute total route cost incrementally.
	arrivalDeliveryAddrs := make(map[int][]string)

	for reqIdx, req := range requests {
		cargoWeight := req.pWeight * req.quantity
		cargoVol := req.pHeight * req.pWidth * req.pLength * req.quantity

		bestIdx := pickBestArrival(
			req, cargoWeight, cargoVol,
			arrivals, arrivalDeliveryAddrs,
		)
		if bestIdx < 0 {
			log.Printf("[algorithm] no arrival fits request %s (product %s, qty %d) — skipped",
				req.requestID, req.productID, req.quantity)
			continue
		}

		// Deduct capacity.
		arrivals[bestIdx].remainWeight -= cargoWeight
		arrivals[bestIdx].remainVol -= cargoVol

		// Track delivery address for route cost calculation.
		arrivalDeliveryAddrs[bestIdx] = append(arrivalDeliveryAddrs[bestIdx], req.dpAddress)

		if !arrivalSeen[bestIdx] {
			arrivalSeen[bestIdx] = true
			arrivalOrder = append(arrivalOrder, bestIdx)
		}

		assignment[bestIdx] = append(assignment[bestIdx], reqIdx)
	}

	// ── 6. Build output: ONE entry per truck ─────────────────────────────────
	now := time.Now()
	out := make([]domain.ArrivalRequest, 0, len(arrivalOrder))

	for priority, arrIdx := range arrivalOrder {
		reqIdxList := assignment[arrIdx]

		seen := make(map[string]bool)
		var skuIDs []string
		for _, ri := range reqIdxList {
			pid := requests[ri].productID
			if !seen[pid] {
				seen[pid] = true
				skuIDs = append(skuIDs, pid)
			}
		}

		primaryRequestID := requests[reqIdxList[0]].requestID

		out = append(out, domain.ArrivalRequest{
			ArrivalID: arrivals[arrIdx].arrivalID,
			RequestID: primaryRequestID,
			SkuIDs:    skuIDs,
			Priority:  priority + 1,
			CreatedAt: now,
			UpdatedAt: now,
		})
	}

	return out, nil
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
		WHERE r.status = 'pending'
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
		WHERE a.status = 'pending'
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

// ──────────────────────────────────────────────────────────────────────────────
// Sorting
// ──────────────────────────────────────────────────────────────────────────────

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

func sortByUrgency(reqs []pendingRequest) {
	sort.SliceStable(reqs, func(i, j int) bool {
		ri, rj := emergencyRank(reqs[i].emergency), emergencyRank(reqs[j].emergency)
		if ri != rj {
			return ri < rj
		}
		return reqs[i].createdAt.Before(reqs[j].createdAt)
	})
}

// ──────────────────────────────────────────────────────────────────────────────
// Arrival selection
// ──────────────────────────────────────────────────────────────────────────────

// pickBestArrival finds the optimal arrival for a request.
//
// Phase 1 — filter arrivals where:
//   - product unit fits vehicle dimensions
//   - remaining weight + volume are sufficient
//
// Phase 2 — score each fitting arrival:
//
//	fuelCost = distance_km(vehicle → delivery_point) × fuel_consumption
//
// If multiple requests are already assigned to an arrival, we add the new
// delivery point distance to the total route cost to evaluate the incremental
// cost of packing one more request into this truck.
//
// Lowest total fuel cost wins.
func pickBestArrival(
	req pendingRequest,
	cargoWeight, cargoVol int,
	arrivals []pendingArrival,
	arrivalDeliveryAddrs map[int][]string,
) int {
	unitFits := func(a pendingArrival) bool {
		return req.pHeight <= a.maxHeight &&
			req.pWidth <= a.maxWidth &&
			req.pLength <= a.maxLength
	}

	// Phase 1: collect arrivals that fully fit.
	type candidate struct {
		idx      int
		fuelCost float64
	}
	var fits []candidate

	for i, a := range arrivals {
		if !unitFits(a) {
			continue
		}
		if a.remainWeight < cargoWeight || a.remainVol < cargoVol {
			continue
		}

		// Calculate fuel cost for this assignment.
		cost := estimateFuelCost(a, req.dpAddress, arrivalDeliveryAddrs[i])
		fits = append(fits, candidate{idx: i, fuelCost: cost})
	}

	// Phase 2: lowest fuel cost.
	if len(fits) > 0 {
		best := fits[0]
		for _, c := range fits[1:] {
			if c.fuelCost < best.fuelCost {
				best = c
			}
		}
		return best.idx
	}

	// Fallback: biggest remaining capacity.
	best := -1
	for i, a := range arrivals {
		if unitFits(a) {
			if best < 0 || a.remainWeight > arrivals[best].remainWeight {
				best = i
			}
		}
	}
	if best < 0 && len(arrivals) > 0 {
		best = 0
	}

	if best >= 0 {
		log.Printf(
			"[algorithm] request %s (product %s, qty %d, w=%d, v=%d) "+
				"overflows arrival %s (remain w=%d, v=%d) — fallback",
			req.requestID, req.productID, req.quantity, cargoWeight, cargoVol,
			arrivals[best].arrivalID,
			arrivals[best].remainWeight, arrivals[best].remainVol,
		)
	}

	return best
}

// estimateFuelCost calculates total fuel cost for an arrival if we add
// a new delivery point to its route.
//
// Cost = sum of distances from vehicle to each delivery point × fuel_consumption.
// Each delivery point is computed independently (hub-and-spoke model).
func estimateFuelCost(arrival pendingArrival, newAddr string, existingAddrs []string) float64 {
	// Collect all delivery addresses: existing + the new one.
	allAddrs := make([]string, 0, len(existingAddrs)+1)
	allAddrs = append(allAddrs, existingAddrs...)
	allAddrs = append(allAddrs, newAddr)

	// Deduplicate — same destination doesn't add extra distance.
	seen := make(map[string]bool)
	var unique []string
	for _, addr := range allAddrs {
		if !seen[addr] {
			seen[addr] = true
			unique = append(unique, addr)
		}
	}

	totalDistKm := 0.0
	for _, destAddr := range unique {
		totalDistKm += GetDistanceKm(arrival.vehicleAddress, destAddr)
	}

	// fuel_consumption is per km, so total fuel = distance × consumption.
	return totalDistKm * float64(arrival.fuelConsumption)
}
