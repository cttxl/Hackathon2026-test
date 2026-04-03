package postgres

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
	"time"

	"github.com/cttxl/Hackathon2026-test/internal/core/domain"
)

type ArrivalRequestRepository struct {
	db *sql.DB
}

func NewArrivalRequestRepository(db *sql.DB) *ArrivalRequestRepository {
	return &ArrivalRequestRepository{db: db}
}

func (r *ArrivalRequestRepository) Create(ctx context.Context, input domain.ArrivalRequestCreate) (domain.ArrivalRequest, error) {
	var ar domain.ArrivalRequest
	err := r.db.QueryRowContext(ctx,
		`INSERT INTO arrivals_requests (arrival_id, request_id, sku_id, priority)
		 VALUES ($1, $2, $3, $4)
		 RETURNING id, arrival_id, request_id, sku_id, priority, created_at, updated_at`,
		input.ArrivalID, input.RequestID, input.SkuID, input.Priority,
	).Scan(&ar.ID, &ar.ArrivalID, &ar.RequestID, &ar.SkuID, &ar.Priority, &ar.CreatedAt, &ar.UpdatedAt)
	return ar, err
}

func (r *ArrivalRequestRepository) GetByID(ctx context.Context, id string) (domain.ArrivalRequest, error) {
	var ar domain.ArrivalRequest
	err := r.db.QueryRowContext(ctx,
		`SELECT id, arrival_id, request_id, sku_id, priority, created_at, updated_at
		 FROM arrivals_requests WHERE id = $1`, id,
	).Scan(&ar.ID, &ar.ArrivalID, &ar.RequestID, &ar.SkuID, &ar.Priority, &ar.CreatedAt, &ar.UpdatedAt)
	return ar, err
}

func (r *ArrivalRequestRepository) List(ctx context.Context, page, limit int) ([]domain.ArrivalRequest, int, error) {
	var total int
	err := r.db.QueryRowContext(ctx, `SELECT COUNT(*) FROM arrivals_requests`).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * limit
	rows, err := r.db.QueryContext(ctx,
		`SELECT id, arrival_id, request_id, sku_id, priority, created_at, updated_at
		 FROM arrivals_requests ORDER BY created_at DESC LIMIT $1 OFFSET $2`, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var arrivalRequests []domain.ArrivalRequest
	for rows.Next() {
		var ar domain.ArrivalRequest
		if err := rows.Scan(&ar.ID, &ar.ArrivalID, &ar.RequestID, &ar.SkuID, &ar.Priority, &ar.CreatedAt, &ar.UpdatedAt); err != nil {
			return nil, 0, err
		}
		arrivalRequests = append(arrivalRequests, ar)
	}
	return arrivalRequests, total, rows.Err()
}

func (r *ArrivalRequestRepository) Update(ctx context.Context, id string, input domain.ArrivalRequestUpdate) (domain.ArrivalRequest, error) {
	setClauses := []string{}
	args := []any{}
	argIdx := 1

	if input.ArrivalID != nil {
		setClauses = append(setClauses, fmt.Sprintf("arrival_id = $%d", argIdx))
		args = append(args, *input.ArrivalID)
		argIdx++
	}
	if input.RequestID != nil {
		setClauses = append(setClauses, fmt.Sprintf("request_id = $%d", argIdx))
		args = append(args, *input.RequestID)
		argIdx++
	}
	if input.SkuID != nil {
		setClauses = append(setClauses, fmt.Sprintf("sku_id = $%d", argIdx))
		args = append(args, *input.SkuID)
		argIdx++
	}
	if input.Priority != nil {
		setClauses = append(setClauses, fmt.Sprintf("priority = $%d", argIdx))
		args = append(args, *input.Priority)
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
		`UPDATE arrivals_requests SET %s WHERE id = $%d
		 RETURNING id, arrival_id, request_id, sku_id, priority, created_at, updated_at`,
		strings.Join(setClauses, ", "), argIdx,
	)

	var ar domain.ArrivalRequest
	err := r.db.QueryRowContext(ctx, query, args...).Scan(
		&ar.ID, &ar.ArrivalID, &ar.RequestID, &ar.SkuID, &ar.Priority, &ar.CreatedAt, &ar.UpdatedAt,
	)
	return ar, err
}

func (r *ArrivalRequestRepository) Delete(ctx context.Context, id string) error {
	_, err := r.db.ExecContext(ctx, `DELETE FROM arrivals_requests WHERE id = $1`, id)
	return err
}
