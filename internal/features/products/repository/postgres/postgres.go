package postgres

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/cttxl/Hackathon2026-test/internal/core/domain"
	"github.com/cttxl/Hackathon2026-test/internal/core/repository/postgres"
)

type ProductRepository struct {
	*postgres.Repository
}

func NewProductRepository(db *sql.DB) *ProductRepository {
	return &ProductRepository{Repository: postgres.NewRepository(db)}
}

func (r *ProductRepository) Create(ctx context.Context, input domain.ProductCreate) (domain.Product, error) {
	var p domain.Product
	err := r.DB().QueryRowContext(ctx,
		`INSERT INTO products (name, weight, height, width, length)
		 VALUES ($1, $2, $3, $4, $5)
		 RETURNING id, name, weight, height, width, length, created_at, updated_at`,
		input.Name, input.Weight, input.Height, input.Width, input.Length,
	).Scan(&p.ID, &p.Name, &p.Weight, &p.Height, &p.Width, &p.Length, &p.CreatedAt, &p.UpdatedAt)
	return p, err
}

func (r *ProductRepository) GetByID(ctx context.Context, id string) (domain.Product, error) {
	var p domain.Product
	err := r.DB().QueryRowContext(ctx,
		`SELECT id, name, weight, height, width, length, created_at, updated_at
		 FROM products WHERE id = $1`, id,
	).Scan(&p.ID, &p.Name, &p.Weight, &p.Height, &p.Width, &p.Length, &p.CreatedAt, &p.UpdatedAt)
	return p, err
}

func (r *ProductRepository) List(ctx context.Context, page, limit int) ([]domain.Product, int, error) {
	total, err := r.Count(ctx, "products", "")
	if err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * limit
	rows, err := r.DB().QueryContext(ctx,
		`SELECT id, name, weight, height, width, length, created_at, updated_at
		 FROM products ORDER BY created_at DESC LIMIT $1 OFFSET $2`, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var products []domain.Product
	for rows.Next() {
		var p domain.Product
		if err := rows.Scan(&p.ID, &p.Name, &p.Weight, &p.Height, &p.Width, &p.Length, &p.CreatedAt, &p.UpdatedAt); err != nil {
			return nil, 0, err
		}
		products = append(products, p)
	}
	return products, total, rows.Err()
}

func (r *ProductRepository) Update(ctx context.Context, id string, input domain.ProductUpdate) (domain.Product, error) {
	setClauses := []string{}
	args := []any{}
	argIdx := 1

	if input.Name != nil {
		setClauses = append(setClauses, fmt.Sprintf("name = $%d", argIdx))
		args = append(args, *input.Name)
		argIdx++
	}
	if input.Weight != nil {
		setClauses = append(setClauses, fmt.Sprintf("weight = $%d", argIdx))
		args = append(args, *input.Weight)
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

	query, defaultArgs := postgres.BuildUpdateQuery("products", id, setClauses, argIdx)
	args = append(args, defaultArgs...)

	var p domain.Product
	err := r.DB().QueryRowContext(ctx, query+" RETURNING id, name, weight, height, width, length, created_at, updated_at", args...).Scan(
		&p.ID, &p.Name, &p.Weight, &p.Height, &p.Width, &p.Length, &p.CreatedAt, &p.UpdatedAt,
	)
	return p, err
}

func (r *ProductRepository) Delete(ctx context.Context, id string) error {
	return r.DeleteByID(ctx, "products", id)
}
