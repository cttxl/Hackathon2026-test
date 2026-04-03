package postgres

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
	"time"
)

// Repository provides common database operations
type Repository struct {
	db *sql.DB
}

// NewRepository creates a new base repository instance
func NewRepository(db *sql.DB) *Repository {
	return &Repository{db: db}
}

// DB returns the underlying *sql.DB instance for custom queries
func (r *Repository) DB() *sql.DB {
	return r.db
}

// BuildUpdateQuery helper constructs an UPDATE query dynamically
func BuildUpdateQuery(tableName string, id string, setClauses []string, argIdx int) (string, []any) {
	setClauses = append(setClauses, fmt.Sprintf("updated_at = $%d", argIdx))
	
	query := fmt.Sprintf(
		`UPDATE %s SET %s WHERE id = $%d`,
		tableName, strings.Join(setClauses, ", "), argIdx+1,
	)
	
	return query, []any{time.Now(), id}
}

// DeleteByID is a common delete method that can be reused
func (r *Repository) DeleteByID(ctx context.Context, tableName string, id string) error {
	query := fmt.Sprintf(`DELETE FROM %s WHERE id = $1`, tableName)
	_, err := r.db.ExecContext(ctx, query, id)
	return err
}

// Count returns the total number of records for a query with conditions
func (r *Repository) Count(ctx context.Context, tableName string, whereSQL string, args ...any) (int, error) {
	var total int
	query := fmt.Sprintf(`SELECT COUNT(*) FROM %s %s`, tableName, whereSQL)
	err := r.db.QueryRowContext(ctx, query, args...).Scan(&total)
	return total, err
}
