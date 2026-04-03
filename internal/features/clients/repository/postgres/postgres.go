package postgres

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/cttxl/Hackathon2026-test/internal/core/domain"
	"github.com/cttxl/Hackathon2026-test/internal/core/repository/postgres"
)

type ClientRepository struct {
	*postgres.Repository
}

func NewClientRepository(db *sql.DB) *ClientRepository {
	return &ClientRepository{Repository: postgres.NewRepository(db)}
}

func (r *ClientRepository) Create(ctx context.Context, input domain.ClientCreate) (domain.Client, error) {
	var c domain.Client
	err := r.DB().QueryRowContext(ctx,
		`INSERT INTO clients (name, password_hash, email, phone)
		 VALUES ($1, $2, $3, $4)
		 RETURNING id, name, email, phone, created_at, updated_at`,
		input.Name, input.Password, input.Email, input.Phone,
	).Scan(&c.ID, &c.Name, &c.Email, &c.Phone, &c.CreatedAt, &c.UpdatedAt)
	return c, err
}

func (r *ClientRepository) GetByID(ctx context.Context, id string) (domain.Client, error) {
	var c domain.Client
	err := r.DB().QueryRowContext(ctx,
		`SELECT id, name, email, phone, created_at, updated_at
		 FROM clients WHERE id = $1`, id,
	).Scan(&c.ID, &c.Name, &c.Email, &c.Phone, &c.CreatedAt, &c.UpdatedAt)
	return c, err
}

func (r *ClientRepository) List(ctx context.Context, page, limit int) ([]domain.Client, int, error) {
	total, err := r.Count(ctx, "clients", "")
	if err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * limit
	rows, err := r.DB().QueryContext(ctx,
		`SELECT id, name, email, phone, created_at, updated_at
		 FROM clients ORDER BY created_at DESC LIMIT $1 OFFSET $2`, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var clients []domain.Client
	for rows.Next() {
		var c domain.Client
		if err := rows.Scan(&c.ID, &c.Name, &c.Email, &c.Phone, &c.CreatedAt, &c.UpdatedAt); err != nil {
			return nil, 0, err
		}
		clients = append(clients, c)
	}
	return clients, total, rows.Err()
}

func (r *ClientRepository) Update(ctx context.Context, id string, input domain.ClientUpdate) (domain.Client, error) {
	setClauses := []string{}
	args := []any{}
	argIdx := 1

	if input.Name != nil {
		setClauses = append(setClauses, fmt.Sprintf("name = $%d", argIdx))
		args = append(args, *input.Name)
		argIdx++
	}
	if input.Email != nil {
		setClauses = append(setClauses, fmt.Sprintf("email = $%d", argIdx))
		args = append(args, *input.Email)
		argIdx++
	}
	if input.Password != nil {
		setClauses = append(setClauses, fmt.Sprintf("password_hash = $%d", argIdx))
		args = append(args, *input.Password)
		argIdx++
	}
	if input.Phone != nil {
		setClauses = append(setClauses, fmt.Sprintf("phone = $%d", argIdx))
		args = append(args, *input.Phone)
		argIdx++
	}

	if len(setClauses) == 0 {
		return r.GetByID(ctx, id)
	}

	query, defaultArgs := postgres.BuildUpdateQuery("clients", id, setClauses, argIdx)
	args = append(args, defaultArgs...)

	var c domain.Client
	err := r.DB().QueryRowContext(ctx, query+" RETURNING id, name, email, phone, created_at, updated_at", args...).Scan(
		&c.ID, &c.Name, &c.Email, &c.Phone, &c.CreatedAt, &c.UpdatedAt,
	)
	return c, err
}

func (r *ClientRepository) Delete(ctx context.Context, id string) error {
	return r.DeleteByID(ctx, "clients", id)
}
