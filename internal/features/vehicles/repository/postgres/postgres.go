package postgres

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/cttxl/Hackathon2026-test/internal/core/domain"
	"github.com/cttxl/Hackathon2026-test/internal/core/repository/postgres"
)

type VehicleRepository struct {
	*postgres.Repository
}

func NewVehicleRepository(db *sql.DB) *VehicleRepository {
	return &VehicleRepository{Repository: postgres.NewRepository(db)}
}

func (r *VehicleRepository) Create(ctx context.Context, input domain.VehicleCreate) (domain.Vehicle, error) {
	var v domain.Vehicle
	err := r.DB().QueryRowContext(ctx,
		`INSERT INTO vehicles (name, fuel_type, fuel_consumption, max_weight, max_height, max_width, max_length, address)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		 RETURNING id, name, fuel_type, fuel_consumption, max_weight, max_height, max_width, max_length, address, created_at, updated_at`,
		input.Name, input.FuelType, input.FuelConsumption, input.MaxWeight, input.MaxHeight, input.MaxWidth, input.MaxLength, input.Address,
	).Scan(&v.ID, &v.Name, &v.FuelType, &v.FuelConsumption, &v.MaxWeight, &v.MaxHeight, &v.MaxWidth, &v.MaxLength, &v.Address, &v.CreatedAt, &v.UpdatedAt)
	return v, err
}

func (r *VehicleRepository) GetByID(ctx context.Context, id string) (domain.Vehicle, error) {
	var v domain.Vehicle
	err := r.DB().QueryRowContext(ctx,
		`SELECT id, name, fuel_type, fuel_consumption, max_weight, max_height, max_width, max_length, address, created_at, updated_at
		 FROM vehicles WHERE id = $1`, id,
	).Scan(&v.ID, &v.Name, &v.FuelType, &v.FuelConsumption, &v.MaxWeight, &v.MaxHeight, &v.MaxWidth, &v.MaxLength, &v.Address, &v.CreatedAt, &v.UpdatedAt)
	return v, err
}

func (r *VehicleRepository) List(ctx context.Context, page, limit int) ([]domain.Vehicle, int, error) {
	total, err := r.Count(ctx, "vehicles", "")
	if err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * limit
	rows, err := r.DB().QueryContext(ctx,
		`SELECT id, name, fuel_type, fuel_consumption, max_weight, max_height, max_width, max_length, address, created_at, updated_at
		 FROM vehicles ORDER BY created_at DESC LIMIT $1 OFFSET $2`, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var vehicles []domain.Vehicle
	for rows.Next() {
		var v domain.Vehicle
		if err := rows.Scan(&v.ID, &v.Name, &v.FuelType, &v.FuelConsumption, &v.MaxWeight, &v.MaxHeight, &v.MaxWidth, &v.MaxLength, &v.Address, &v.CreatedAt, &v.UpdatedAt); err != nil {
			return nil, 0, err
		}
		vehicles = append(vehicles, v)
	}
	return vehicles, total, rows.Err()
}

func (r *VehicleRepository) Update(ctx context.Context, id string, input domain.VehicleUpdate) (domain.Vehicle, error) {
	setClauses := []string{}
	args := []any{}
	argIdx := 1

	if input.Name != nil {
		setClauses = append(setClauses, fmt.Sprintf("name = $%d", argIdx))
		args = append(args, *input.Name)
		argIdx++
	}
	if input.FuelType != nil {
		setClauses = append(setClauses, fmt.Sprintf("fuel_type = $%d", argIdx))
		args = append(args, *input.FuelType)
		argIdx++
	}
	if input.FuelConsumption != nil {
		setClauses = append(setClauses, fmt.Sprintf("fuel_consumption = $%d", argIdx))
		args = append(args, *input.FuelConsumption)
		argIdx++
	}
	if input.MaxWeight != nil {
		setClauses = append(setClauses, fmt.Sprintf("max_weight = $%d", argIdx))
		args = append(args, *input.MaxWeight)
		argIdx++
	}
	if input.MaxHeight != nil {
		setClauses = append(setClauses, fmt.Sprintf("max_height = $%d", argIdx))
		args = append(args, *input.MaxHeight)
		argIdx++
	}
	if input.MaxWidth != nil {
		setClauses = append(setClauses, fmt.Sprintf("max_width = $%d", argIdx))
		args = append(args, *input.MaxWidth)
		argIdx++
	}
	if input.MaxLength != nil {
		setClauses = append(setClauses, fmt.Sprintf("max_length = $%d", argIdx))
		args = append(args, *input.MaxLength)
		argIdx++
	}
	if input.Address != nil {
		setClauses = append(setClauses, fmt.Sprintf("address = $%d", argIdx))
		args = append(args, *input.Address)
		argIdx++
	}

	if len(setClauses) == 0 {
		return r.GetByID(ctx, id)
	}

	query, defaultArgs := postgres.BuildUpdateQuery("vehicles", id, setClauses, argIdx)
	args = append(args, defaultArgs...)

	var v domain.Vehicle
	err := r.DB().QueryRowContext(ctx, query+" RETURNING id, name, fuel_type, fuel_consumption, max_weight, max_height, max_width, max_length, address, created_at, updated_at", args...).Scan(
		&v.ID, &v.Name, &v.FuelType, &v.FuelConsumption, &v.MaxWeight, &v.MaxHeight, &v.MaxWidth, &v.MaxLength, &v.Address, &v.CreatedAt, &v.UpdatedAt,
	)
	return v, err
}

func (r *VehicleRepository) Delete(ctx context.Context, id string) error {
	return r.DeleteByID(ctx, "vehicles", id)
}
