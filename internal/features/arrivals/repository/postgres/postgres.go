package postgres

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
	"time"

	"github.com/cttxl/Hackathon2026-test/internal/core/domain"
)

type ArrivalRepository struct {
	db *sql.DB
}

func NewArrivalRepository(db *sql.DB) *ArrivalRepository {
	return &ArrivalRepository{db: db}
}

func (r *ArrivalRepository) Create(ctx context.Context, input domain.ArrivalCreate) (domain.Arrival, error) {
	var a domain.Arrival
	err := r.db.QueryRowContext(ctx,
		`INSERT INTO arrivals (transport_id, driver_id, time_to_arrival)
		 VALUES ($1, $2, $3)
		 RETURNING id, transport_id, driver_id, time_to_arrival, status, created_at, updated_at`,
		input.TransportID, input.DriverID, input.TimeToArrival,
	).Scan(&a.ID, &a.TransportID, &a.DriverID, &a.TimeToArrival, &a.Status, &a.CreatedAt, &a.UpdatedAt)
	return a, err
}

func (r *ArrivalRepository) GetByID(ctx context.Context, id string) (domain.Arrival, error) {
	var a domain.Arrival
	err := r.db.QueryRowContext(ctx,
		`SELECT id, transport_id, driver_id, time_to_arrival, status, created_at, updated_at
		 FROM arrivals WHERE id = $1`, id,
	).Scan(&a.ID, &a.TransportID, &a.DriverID, &a.TimeToArrival, &a.Status, &a.CreatedAt, &a.UpdatedAt)
	return a, err
}

type ArrivalFilters struct {
	TransportID string
	DriverID    string
	Status      string
}

func (r *ArrivalRepository) List(ctx context.Context, page, limit int, filters ArrivalFilters) ([]domain.Arrival, int, error) {
	whereClauses := []string{}
	args := []any{}
	argIdx := 1

	if filters.TransportID != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("transport_id = $%d", argIdx))
		args = append(args, filters.TransportID)
		argIdx++
	}
	if filters.DriverID != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("driver_id = $%d", argIdx))
		args = append(args, filters.DriverID)
		argIdx++
	}
	if filters.Status != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("status = $%d", argIdx))
		args = append(args, filters.Status)
		argIdx++
	}

	whereSQL := ""
	if len(whereClauses) > 0 {
		whereSQL = "WHERE " + strings.Join(whereClauses, " AND ")
	}

	var total int
	err := r.db.QueryRowContext(ctx, fmt.Sprintf(`SELECT COUNT(*) FROM arrivals %s`, whereSQL), args...).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * limit
	args = append(args, limit, offset)
	query := fmt.Sprintf(
		`SELECT id, transport_id, driver_id, time_to_arrival, status, created_at, updated_at
		 FROM arrivals %s ORDER BY created_at DESC LIMIT $%d OFFSET $%d`,
		whereSQL, argIdx, argIdx+1,
	)

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var arrivals []domain.Arrival
	for rows.Next() {
		var a domain.Arrival
		if err := rows.Scan(&a.ID, &a.TransportID, &a.DriverID, &a.TimeToArrival, &a.Status, &a.CreatedAt, &a.UpdatedAt); err != nil {
			return nil, 0, err
		}
		arrivals = append(arrivals, a)
	}
	return arrivals, total, rows.Err()
}

func (r *ArrivalRepository) Update(ctx context.Context, id string, input domain.ArrivalUpdate) (domain.Arrival, error) {
	setClauses := []string{}
	args := []any{}
	argIdx := 1

	if input.TransportID != nil {
		setClauses = append(setClauses, fmt.Sprintf("transport_id = $%d", argIdx))
		args = append(args, *input.TransportID)
		argIdx++
	}
	if input.DriverID != nil {
		setClauses = append(setClauses, fmt.Sprintf("driver_id = $%d", argIdx))
		args = append(args, *input.DriverID)
		argIdx++
	}
	if input.TimeToArrival != nil {
		setClauses = append(setClauses, fmt.Sprintf("time_to_arrival = $%d", argIdx))
		args = append(args, *input.TimeToArrival)
		argIdx++
	}
	if input.Status != nil {
		setClauses = append(setClauses, fmt.Sprintf("status = $%d", argIdx))
		args = append(args, *input.Status)
		argIdx++
	}

	if len(setClauses) == 0 {
		return r.GetByID(ctx, id)
	}

	setClauses = append(setClauses, fmt.Sprintf("updated_at = $%d", argIdx))
	args = append(args, time.Now())
	argIdx++

	args = append(args, id)
	query := fmt.Sprintf(
		`UPDATE arrivals SET %s WHERE id = $%d
		 RETURNING id, transport_id, driver_id, time_to_arrival, status, created_at, updated_at`,
		strings.Join(setClauses, ", "), argIdx,
	)

	var a domain.Arrival
	err := r.db.QueryRowContext(ctx, query, args...).Scan(
		&a.ID, &a.TransportID, &a.DriverID, &a.TimeToArrival, &a.Status, &a.CreatedAt, &a.UpdatedAt,
	)
	return a, err
}

func (r *ArrivalRepository) Delete(ctx context.Context, id string) error {
	_, err := r.db.ExecContext(ctx, `DELETE FROM arrivals WHERE id = $1`, id)
	return err
}
