package postgres

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/cttxl/Hackathon2026-test/internal/core/auth"
	"github.com/cttxl/Hackathon2026-test/internal/core/domain"
	"github.com/cttxl/Hackathon2026-test/internal/core/repository/postgres"
)

type EmployeeRepository struct {
	*postgres.Repository
}

func NewEmployeeRepository(db *sql.DB) *EmployeeRepository {
	return &EmployeeRepository{Repository: postgres.NewRepository(db)}
}

func (r *EmployeeRepository) Create(ctx context.Context, input domain.EmployeeCreate) (domain.Employee, error) {
	var e domain.Employee

	hashedPassword, err := auth.HashPassword(input.Password)
	if err != nil {
		return e, fmt.Errorf("failed to hash password: %w", err)
	}

	err = r.DB().QueryRowContext(ctx,
		`INSERT INTO employees (fullname, password_hash, email, phone, role)
		 VALUES ($1, $2, $3, $4, $5)
		 RETURNING id, fullname, email, phone, role, created_at, updated_at`,
		input.Fullname, hashedPassword, input.Email, input.Phone, input.Role,
	).Scan(&e.ID, &e.Fullname, &e.Email, &e.Phone, &e.Role, &e.CreatedAt, &e.UpdatedAt)
	return e, err
}

func (r *EmployeeRepository) GetByID(ctx context.Context, id string) (domain.Employee, error) {
	var e domain.Employee
	err := r.DB().QueryRowContext(ctx,
		`SELECT id, fullname, email, phone, role, created_at, updated_at
		 FROM employees WHERE id = $1`, id,
	).Scan(&e.ID, &e.Fullname, &e.Email, &e.Phone, &e.Role, &e.CreatedAt, &e.UpdatedAt)
	return e, err
}

func (r *EmployeeRepository) List(ctx context.Context, page, limit int) ([]domain.Employee, int, error) {
	total, err := r.Count(ctx, "employees", "")
	if err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * limit
	rows, err := r.DB().QueryContext(ctx,
		`SELECT id, fullname, email, phone, role, created_at, updated_at
		 FROM employees ORDER BY created_at DESC LIMIT $1 OFFSET $2`, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var employees []domain.Employee
	for rows.Next() {
		var e domain.Employee
		if err := rows.Scan(&e.ID, &e.Fullname, &e.Email, &e.Phone, &e.Role, &e.CreatedAt, &e.UpdatedAt); err != nil {
			return nil, 0, err
		}
		employees = append(employees, e)
	}
	return employees, total, rows.Err()
}

func (r *EmployeeRepository) Update(ctx context.Context, id string, input domain.EmployeeUpdate) (domain.Employee, error) {
	setClauses := []string{}
	args := []any{}
	argIdx := 1

	if input.Fullname != nil {
		setClauses = append(setClauses, fmt.Sprintf("fullname = $%d", argIdx))
		args = append(args, *input.Fullname)
		argIdx++
	}
	if input.Email != nil {
		setClauses = append(setClauses, fmt.Sprintf("email = $%d", argIdx))
		args = append(args, *input.Email)
		argIdx++
	}
	if input.Password != nil {
		hashed, err := auth.HashPassword(*input.Password)
		if err != nil {
			return domain.Employee{}, fmt.Errorf("failed to hash password: %w", err)
		}
		setClauses = append(setClauses, fmt.Sprintf("password_hash = $%d", argIdx))
		args = append(args, hashed)
		argIdx++
	}
	if input.Phone != nil {
		setClauses = append(setClauses, fmt.Sprintf("phone = $%d", argIdx))
		args = append(args, *input.Phone)
		argIdx++
	}
	if input.Role != nil {
		setClauses = append(setClauses, fmt.Sprintf("role = $%d", argIdx))
		args = append(args, *input.Role)
		argIdx++
	}

	if len(setClauses) == 0 {
		return r.GetByID(ctx, id)
	}

	query, defaultArgs := postgres.BuildUpdateQuery("employees", id, setClauses, argIdx)
	args = append(args, defaultArgs...)

	var e domain.Employee
	err := r.DB().QueryRowContext(ctx, query+" RETURNING id, fullname, email, phone, role, created_at, updated_at", args...).Scan(
		&e.ID, &e.Fullname, &e.Email, &e.Phone, &e.Role, &e.CreatedAt, &e.UpdatedAt,
	)
	return e, err
}

func (r *EmployeeRepository) Delete(ctx context.Context, id string) error {
	return r.DeleteByID(ctx, "employees", id)
}
