package postgres

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
	"time"

	"github.com/cttxl/Hackathon2026-test/internal/core/domain"
)

type ArrivalScheduleRepository struct {
	db *sql.DB
}

func NewArrivalScheduleRepository(db *sql.DB) *ArrivalScheduleRepository {
	return &ArrivalScheduleRepository{db: db}
}

func (r *ArrivalScheduleRepository) Create(ctx context.Context, input domain.ArrivalScheduleCreate) (domain.ArrivalSchedule, error) {
	var as domain.ArrivalSchedule
	err := r.db.QueryRowContext(ctx,
		`INSERT INTO arrival_schedules (arrival_id)
		 VALUES ($1)
		 RETURNING id, arrival_id, created_at, updated_at`,
		input.ArrivalID,
	).Scan(&as.ID, &as.ArrivalID, &as.CreatedAt, &as.UpdatedAt)
	return as, err
}

func (r *ArrivalScheduleRepository) GetByID(ctx context.Context, id string) (domain.ArrivalSchedule, error) {
	var as domain.ArrivalSchedule
	err := r.db.QueryRowContext(ctx,
		`SELECT id, arrival_id, created_at, updated_at
		 FROM arrival_schedules WHERE id = $1`, id,
	).Scan(&as.ID, &as.ArrivalID, &as.CreatedAt, &as.UpdatedAt)
	return as, err
}

func (r *ArrivalScheduleRepository) List(ctx context.Context, page, limit int) ([]domain.ArrivalSchedule, int, error) {
	var total int
	err := r.db.QueryRowContext(ctx, `SELECT COUNT(*) FROM arrival_schedules`).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * limit
	rows, err := r.db.QueryContext(ctx,
		`SELECT id, arrival_id, created_at, updated_at
		 FROM arrival_schedules ORDER BY created_at DESC LIMIT $1 OFFSET $2`, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var schedules []domain.ArrivalSchedule
	for rows.Next() {
		var as domain.ArrivalSchedule
		if err := rows.Scan(&as.ID, &as.ArrivalID, &as.CreatedAt, &as.UpdatedAt); err != nil {
			return nil, 0, err
		}
		schedules = append(schedules, as)
	}
	return schedules, total, rows.Err()
}

func (r *ArrivalScheduleRepository) Update(ctx context.Context, id string, input domain.ArrivalScheduleUpdate) (domain.ArrivalSchedule, error) {
	setClauses := []string{}
	args := []any{}
	argIdx := 1

	if input.ArrivalID != nil {
		setClauses = append(setClauses, fmt.Sprintf("arrival_id = $%d", argIdx))
		args = append(args, *input.ArrivalID)
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
		`UPDATE arrival_schedules SET %s WHERE id = $%d
		 RETURNING id, arrival_id, created_at, updated_at`,
		strings.Join(setClauses, ", "), argIdx,
	)

	var as domain.ArrivalSchedule
	err := r.db.QueryRowContext(ctx, query, args...).Scan(
		&as.ID, &as.ArrivalID, &as.CreatedAt, &as.UpdatedAt,
	)
	return as, err
}

func (r *ArrivalScheduleRepository) Delete(ctx context.Context, id string) error {
	_, err := r.db.ExecContext(ctx, `DELETE FROM arrival_schedules WHERE id = $1`, id)
	return err
}
