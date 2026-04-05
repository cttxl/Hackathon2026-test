package postgres

import (
	"context"
	"database/sql"

	"github.com/cttxl/Hackathon2026-test/internal/core/auth"
	"github.com/cttxl/Hackathon2026-test/internal/core/domain"
	"github.com/cttxl/Hackathon2026-test/internal/core/repository/postgres"
)

type AuthRepository struct {
	*postgres.Repository
}

func NewAuthRepository(db *sql.DB) *AuthRepository {
	return &AuthRepository{Repository: postgres.NewRepository(db)}
}

func (r *AuthRepository) Authenticate(ctx context.Context, email, password string) (*domain.LoginUser, error) {
	query := `
		SELECT id, 'employee' as type, role, password_hash
		FROM employees 
		WHERE email = $1
		UNION
		SELECT id, 'client' as type, '' as role, password_hash
		FROM clients 
		WHERE email = $1
	`
	var user domain.LoginUser
	var hash string
	err := r.DB().QueryRowContext(ctx, query, email).Scan(&user.ID, &user.Type, &user.Role, &hash)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	if !auth.CheckPasswordHash(password, hash) {
		return nil, nil
	}

	return &user, nil
}
