package domain

import "time"

type ArrivalRequest struct {
	ID        string    `json:"id"`
	ArrivalID string    `json:"arrival_id"`
	RequestID string    `json:"request_id"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type ArrivalRequestCreate struct {
	ArrivalID string `json:"arrival_id"`
	RequestID string `json:"request_id"`
}

type ArrivalRequestUpdate struct {
	ArrivalID *string `json:"arrival_id,omitempty"`
	RequestID *string `json:"request_id,omitempty"`
}
