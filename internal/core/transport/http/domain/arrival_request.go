package domain

import "time"

type ArrivalRequest struct {
	ID        string    `json:"id"`
	ArrivalID string    `json:"arrival_id"`
	RequestID string    `json:"request_id"`
	SkuID     string    `json:"sku_id"`
	Priority  int       `json:"priority"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type ArrivalRequestCreate struct {
	ArrivalID string `json:"arrival_id"`
	RequestID string `json:"request_id"`
	SkuID     string `json:"sku_id"`
	Priority  int    `json:"priority"`
}

type ArrivalRequestUpdate struct {
	ArrivalID *string `json:"arrival_id,omitempty"`
	RequestID *string `json:"request_id,omitempty"`
	SkuID     *string `json:"sku_id,omitempty"`
	Priority  *int    `json:"priority,omitempty"`
}
