package domain

import "time"

type ArrivalSchedule struct {
	ID        string    `json:"id"`
	ArrivalID string    `json:"arrival_id"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type ArrivalScheduleCreate struct {
	ArrivalID string `json:"arrival_id"`
}

type ArrivalScheduleUpdate struct {
	ArrivalID *string `json:"arrival_id,omitempty"`
}
