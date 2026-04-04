package postgres

import (
	"context"
	"database/sql"
	"fmt"
	"strings"

	"github.com/cttxl/Hackathon2026-test/internal/core/domain"
	"github.com/cttxl/Hackathon2026-test/internal/core/repository/postgres"
)

type RequestRepository struct {
	*postgres.Repository
}

func NewRequestRepository(db *sql.DB) *RequestRepository {
	return &RequestRepository{Repository: postgres.NewRepository(db)}
}

func (r *RequestRepository) Create(ctx context.Context, input domain.RequestCreate) (domain.Request, error) {
	var req domain.Request
	emergency := input.Emergency
	if emergency == "" {
		emergency = "default"
	}

	err := r.DB().QueryRowContext(ctx,
		`INSERT INTO requests (product_id, quantity, delivery_point_id, emergency)
		 VALUES ($1, $2, $3, $4)
		 RETURNING id, product_id, quantity, delivery_point_id, emergency, status, created_at, updated_at`,
		input.ProductID, input.Quantity, input.DeliveryPointID, emergency,
	).Scan(&req.ID, &req.ProductID, &req.Quantity, &req.DeliveryPointID, &req.Emergency, &req.Status, &req.CreatedAt, &req.UpdatedAt)
	return req, err
}

func (r *RequestRepository) GetByID(ctx context.Context, id string) (domain.Request, error) {
	var req domain.Request
	err := r.DB().QueryRowContext(ctx,
		`SELECT id, product_id, quantity, delivery_point_id, emergency, status, created_at, updated_at
		 FROM requests WHERE id = $1`, id,
	).Scan(&req.ID, &req.ProductID, &req.Quantity, &req.DeliveryPointID, &req.Emergency, &req.Status, &req.CreatedAt, &req.UpdatedAt)
	return req, err
}

type RequestFilters struct {
	ProductID       string
	DeliveryPointID string
	SkuID           string
	Status          string
	ClientOwnerID   string
}

func (r *RequestRepository) List(ctx context.Context, page, limit int, filters RequestFilters) ([]domain.Request, int, error) {
	whereClauses := []string{}
	args := []any{}
	argIdx := 1

	if filters.ProductID != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("product_id = $%d", argIdx))
		args = append(args, filters.ProductID)
		argIdx++
	}
	if filters.DeliveryPointID != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("delivery_point_id = $%d", argIdx))
		args = append(args, filters.DeliveryPointID)
		argIdx++
	}
	if filters.Status != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("status = $%d", argIdx))
		args = append(args, filters.Status)
		argIdx++
	}
	if filters.SkuID != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("id IN (SELECT request_id FROM arrivals_requests WHERE sku_id = $%d)", argIdx))
		args = append(args, filters.SkuID)
		argIdx++
	}
	if filters.ClientOwnerID != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("delivery_point_id IN (SELECT id FROM delivery_points WHERE owner_id = $%d)", argIdx))
		args = append(args, filters.ClientOwnerID)
		argIdx++
	}

	whereSQL := ""
	if len(whereClauses) > 0 {
		whereSQL = "WHERE " + strings.Join(whereClauses, " AND ")
	}

	total, err := r.Count(ctx, "requests", whereSQL, args...)
	if err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * limit
	args = append(args, limit, offset)
	query := fmt.Sprintf(
		`SELECT id, product_id, quantity, delivery_point_id, emergency, status, created_at, updated_at
		 FROM requests %s ORDER BY created_at DESC LIMIT $%d OFFSET $%d`,
		whereSQL, argIdx, argIdx+1,
	)

	rows, err := r.DB().QueryContext(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var requests []domain.Request
	for rows.Next() {
		var req domain.Request
		if err := rows.Scan(&req.ID, &req.ProductID, &req.Quantity, &req.DeliveryPointID, &req.Emergency, &req.Status, &req.CreatedAt, &req.UpdatedAt); err != nil {
			return nil, 0, err
		}
		requests = append(requests, req)
	}
	return requests, total, rows.Err()
}

func (r *RequestRepository) Update(ctx context.Context, id string, input domain.RequestUpdate) (domain.Request, error) {
	setClauses := []string{}
	args := []any{}
	argIdx := 1

	if input.ProductID != nil {
		setClauses = append(setClauses, fmt.Sprintf("product_id = $%d", argIdx))
		args = append(args, *input.ProductID)
		argIdx++
	}
	if input.Quantity != nil {
		setClauses = append(setClauses, fmt.Sprintf("quantity = $%d", argIdx))
		args = append(args, *input.Quantity)
		argIdx++
	}
	if input.DeliveryPointID != nil {
		setClauses = append(setClauses, fmt.Sprintf("delivery_point_id = $%d", argIdx))
		args = append(args, *input.DeliveryPointID)
		argIdx++
	}
	if input.Emergency != nil {
		setClauses = append(setClauses, fmt.Sprintf("emergency = $%d", argIdx))
		args = append(args, *input.Emergency)
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

	query, defaultArgs := postgres.BuildUpdateQuery("requests", id, setClauses, argIdx)
	args = append(args, defaultArgs...)

	var req domain.Request
	err := r.DB().QueryRowContext(ctx, query+" RETURNING id, product_id, quantity, delivery_point_id, emergency, status, created_at, updated_at", args...).Scan(
		&req.ID, &req.ProductID, &req.Quantity, &req.DeliveryPointID, &req.Emergency, &req.Status, &req.CreatedAt, &req.UpdatedAt,
	)
	return req, err
}

func (r *RequestRepository) Delete(ctx context.Context, id string) error {
	return r.DeleteByID(ctx, "requests", id)
}

func (r *RequestRepository) IsClientOwnerOfDeliveryPoint(ctx context.Context, dpID string, clientID string) (bool, error) {
	var ownerID string
	err := r.DB().QueryRowContext(ctx, "SELECT owner_id FROM delivery_points WHERE id = $1", dpID).Scan(&ownerID)
	if err != nil {
		if err == sql.ErrNoRows {
			return false, nil
		}
		return false, err
	}
	return ownerID == clientID, nil
}

func (r *RequestRepository) IsClientOwnerOfRequest(ctx context.Context, reqID string, clientID string) (bool, error) {
	var ownerID string
	query := `SELECT dp.owner_id FROM requests r JOIN delivery_points dp ON r.delivery_point_id = dp.id WHERE r.id = $1`
	err := r.DB().QueryRowContext(ctx, query, reqID).Scan(&ownerID)
	if err != nil {
		if err == sql.ErrNoRows {
			return false, nil
		}
		return false, err
	}
	return ownerID == clientID, nil
}
