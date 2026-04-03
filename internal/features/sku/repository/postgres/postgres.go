package postgres

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
	"time"

	"github.com/cttxl/Hackathon2026-test/internal/core/domain"
)

type SKURepository struct {
	db *sql.DB
}

func NewSKURepository(db *sql.DB) *SKURepository {
	return &SKURepository{db: db}
}

func (r *SKURepository) Create(ctx context.Context, input domain.SKUCreate) (domain.SKU, error) {
	var s domain.SKU
	err := r.db.QueryRowContext(ctx,
		`INSERT INTO sku (product_id, delivery_point_id)
		 VALUES ($1, $2)
		 RETURNING id, product_id, delivery_point_id, created_at, updated_at`,
		input.ProductID, input.DeliveryPointID,
	).Scan(&s.ID, &s.ProductID, &s.DeliveryPointID, &s.CreatedAt, &s.UpdatedAt)
	return s, err
}

func (r *SKURepository) GetByID(ctx context.Context, id string) (domain.SKU, error) {
	var s domain.SKU
	err := r.db.QueryRowContext(ctx,
		`SELECT id, product_id, delivery_point_id, created_at, updated_at
		 FROM sku WHERE id = $1`, id,
	).Scan(&s.ID, &s.ProductID, &s.DeliveryPointID, &s.CreatedAt, &s.UpdatedAt)
	return s, err
}

func (r *SKURepository) List(ctx context.Context, page, limit int, filterProductID, filterDeliveryPointID string) ([]domain.SKU, int, error) {
	whereClauses := []string{}
	args := []any{}
	argIdx := 1

	if filterProductID != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("product_id = $%d", argIdx))
		args = append(args, filterProductID)
		argIdx++
	}
	if filterDeliveryPointID != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("delivery_point_id = $%d", argIdx))
		args = append(args, filterDeliveryPointID)
		argIdx++
	}

	whereSQL := ""
	if len(whereClauses) > 0 {
		whereSQL = "WHERE " + strings.Join(whereClauses, " AND ")
	}

	var total int
	err := r.db.QueryRowContext(ctx, fmt.Sprintf(`SELECT COUNT(*) FROM sku %s`, whereSQL), args...).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * limit
	args = append(args, limit, offset)
	query := fmt.Sprintf(
		`SELECT id, product_id, delivery_point_id, created_at, updated_at
		 FROM sku %s ORDER BY created_at DESC LIMIT $%d OFFSET $%d`,
		whereSQL, argIdx, argIdx+1,
	)

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var skus []domain.SKU
	for rows.Next() {
		var s domain.SKU
		if err := rows.Scan(&s.ID, &s.ProductID, &s.DeliveryPointID, &s.CreatedAt, &s.UpdatedAt); err != nil {
			return nil, 0, err
		}
		skus = append(skus, s)
	}
	return skus, total, rows.Err()
}

func (r *SKURepository) Update(ctx context.Context, id string, input domain.SKUUpdate) (domain.SKU, error) {
	setClauses := []string{}
	args := []any{}
	argIdx := 1

	if input.ProductID != nil {
		setClauses = append(setClauses, fmt.Sprintf("product_id = $%d", argIdx))
		args = append(args, *input.ProductID)
		argIdx++
	}
	if input.DeliveryPointID != nil {
		setClauses = append(setClauses, fmt.Sprintf("delivery_point_id = $%d", argIdx))
		args = append(args, *input.DeliveryPointID)
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
		`UPDATE sku SET %s WHERE id = $%d
		 RETURNING id, product_id, delivery_point_id, created_at, updated_at`,
		strings.Join(setClauses, ", "), argIdx,
	)

	var s domain.SKU
	err := r.db.QueryRowContext(ctx, query, args...).Scan(
		&s.ID, &s.ProductID, &s.DeliveryPointID, &s.CreatedAt, &s.UpdatedAt,
	)
	return s, err
}

func (r *SKURepository) Delete(ctx context.Context, id string) error {
	_, err := r.db.ExecContext(ctx, `DELETE FROM sku WHERE id = $1`, id)
	return err
}
