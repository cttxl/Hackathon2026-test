package postgres

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
	"time"

	"github.com/cttxl/Hackathon2026-test/internal/core/config"
)

type Repository struct {
	db *sql.DB
}

func NewRepository(db *sql.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) DB() *sql.DB {
	return r.db
}

func GetDSN(cfg *config.Config) string {
	return fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=disable", cfg.POSTGRES_USER, cfg.POSTGRES_PASSWORD, cfg.POSTGRES_HOST, cfg.POSTGRES_PORT, cfg.POSTGRES_DB)
}

func BuildUpdateQuery(tableName string, id string, setClauses []string, argIdx int) (string, []any) {
	setClauses = append(setClauses, fmt.Sprintf("updated_at = $%d", argIdx))

	query := fmt.Sprintf(
		`UPDATE %s SET %s WHERE id = $%d`,
		tableName, strings.Join(setClauses, ", "), argIdx+1,
	)

	return query, []any{time.Now(), id}
}

func (r *Repository) DeleteByID(ctx context.Context, tableName string, id string) error {
	query := fmt.Sprintf(`DELETE FROM %s WHERE id = $1`, tableName)
	_, err := r.db.ExecContext(ctx, query, id)
	return err
}

func (r *Repository) Count(ctx context.Context, tableName string, whereSQL string, args ...any) (int, error) {
	var total int
	query := fmt.Sprintf(`SELECT COUNT(*) FROM %s %s`, tableName, whereSQL)
	err := r.db.QueryRowContext(ctx, query, args...).Scan(&total)
	return total, err
}
