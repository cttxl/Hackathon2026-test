package postgres

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
	"time"

	"github.com/cttxl/Hackathon2026-test/internal/core/domain"
)

type DeliveryPointRepository struct {
	db *sql.DB
}

func NewDeliveryPointRepository(db *sql.DB) *DeliveryPointRepository {
	return &DeliveryPointRepository{db: db}
}

func (r *DeliveryPointRepository) Create(ctx context.Context, input domain.DeliveryPointCreate) (domain.DeliveryPoint, error) {
	var dp domain.DeliveryPoint
	err := r.db.QueryRowContext(ctx,
		`INSERT INTO delivery_points (name, address, owner_id, type, height, width, length)
		 VALUES ($1, $2, $3, $4, $5, $6, $7)
		 RETURNING id, name, address, owner_id, type, height, width, length, created_at, updated_at`,
		input.Name, input.Address, input.OwnerID, input.Type, input.Height, input.Width, input.Length,
	).Scan(&dp.ID, &dp.Name, &dp.Address, &dp.OwnerID, &dp.Type, &dp.Height, &dp.Width, &dp.Length, &dp.CreatedAt, &dp.UpdatedAt)
	return dp, err
}

func (r *DeliveryPointRepository) GetByID(ctx context.Context, id string) (domain.DeliveryPoint, error) {
	var dp domain.DeliveryPoint
	err := r.db.QueryRowContext(ctx,
		`SELECT id, name, address, owner_id, type, height, width, length, created_at, updated_at
		 FROM delivery_points WHERE id = $1`, id,
	).Scan(&dp.ID, &dp.Name, &dp.Address, &dp.OwnerID, &dp.Type, &dp.Height, &dp.Width, &dp.Length, &dp.CreatedAt, &dp.UpdatedAt)
	return dp, err
}

func (r *DeliveryPointRepository) List(ctx context.Context, page, limit int, filterType, filterOwnerID string) ([]domain.DeliveryPoint, int, error) {
	whereClauses := []string{}
	args := []any{}
	argIdx := 1

	if filterType != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("type = $%d", argIdx))
		args = append(args, filterType)
		argIdx++
	}
	if filterOwnerID != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("owner_id = $%d", argIdx))
		args = append(args, filterOwnerID)
		argIdx++
	}

	whereSQL := ""
	if len(whereClauses) > 0 {
		whereSQL = "WHERE " + strings.Join(whereClauses, " AND ")
	}

	var total int
	err := r.db.QueryRowContext(ctx, fmt.Sprintf(`SELECT COUNT(*) FROM delivery_points %s`, whereSQL), args...).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * limit
	args = append(args, limit, offset)
	query := fmt.Sprintf(
		`SELECT id, name, address, owner_id, type, height, width, length, created_at, updated_at
		 FROM delivery_points %s ORDER BY created_at DESC LIMIT $%d OFFSET $%d`,
		whereSQL, argIdx, argIdx+1,
	)

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var points []domain.DeliveryPoint
	for rows.Next() {
		var dp domain.DeliveryPoint
		if err := rows.Scan(&dp.ID, &dp.Name, &dp.Address, &dp.OwnerID, &dp.Type, &dp.Height, &dp.Width, &dp.Length, &dp.CreatedAt, &dp.UpdatedAt); err != nil {
			return nil, 0, err
		}
		points = append(points, dp)
	}
	return points, total, rows.Err()
}

func (r *DeliveryPointRepository) Update(ctx context.Context, id string, input domain.DeliveryPointUpdate) (domain.DeliveryPoint, error) {
	setClauses := []string{}
	args := []any{}
	argIdx := 1

	if input.Name != nil {
		setClauses = append(setClauses, fmt.Sprintf("name = $%d", argIdx))
		args = append(args, *input.Name)
		argIdx++
	}
	if input.Address != nil {
		setClauses = append(setClauses, fmt.Sprintf("address = $%d", argIdx))
		args = append(args, *input.Address)
		argIdx++
	}
	if input.OwnerID != nil {
		setClauses = append(setClauses, fmt.Sprintf("owner_id = $%d", argIdx))
		args = append(args, *input.OwnerID)
		argIdx++
	}
	if input.Type != nil {
		setClauses = append(setClauses, fmt.Sprintf("type = $%d", argIdx))
		args = append(args, *input.Type)
		argIdx++
	}
	if input.Height != nil {
		setClauses = append(setClauses, fmt.Sprintf("height = $%d", argIdx))
		args = append(args, *input.Height)
		argIdx++
	}
	if input.Width != nil {
		setClauses = append(setClauses, fmt.Sprintf("width = $%d", argIdx))
		args = append(args, *input.Width)
		argIdx++
	}
	if input.Length != nil {
		setClauses = append(setClauses, fmt.Sprintf("length = $%d", argIdx))
		args = append(args, *input.Length)
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
		`UPDATE delivery_points SET %s WHERE id = $%d
		 RETURNING id, name, address, owner_id, type, height, width, length, created_at, updated_at`,
		strings.Join(setClauses, ", "), argIdx,
	)

	var dp domain.DeliveryPoint
	err := r.db.QueryRowContext(ctx, query, args...).Scan(
		&dp.ID, &dp.Name, &dp.Address, &dp.OwnerID, &dp.Type, &dp.Height, &dp.Width, &dp.Length, &dp.CreatedAt, &dp.UpdatedAt,
	)
	return dp, err
}

func (r *DeliveryPointRepository) Delete(ctx context.Context, id string) error {
	_, err := r.db.ExecContext(ctx, `DELETE FROM delivery_points WHERE id = $1`, id)
	return err
}
