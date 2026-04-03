package domain

import "time"

type DeliveryPoint struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Address   string    `json:"address"`
	OwnerID   string    `json:"owner_id"`
	Type      string    `json:"type"`
	Height    *int      `json:"height,omitempty"`
	Width     *int      `json:"width,omitempty"`
	Length    *int      `json:"length,omitempty"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type DeliveryPointCreate struct {
	Name    string `json:"name"`
	Address string `json:"address"`
	OwnerID string `json:"owner_id"`
	Type    string `json:"type"`
	Height  *int   `json:"height,omitempty"`
	Width   *int   `json:"width,omitempty"`
	Length  *int   `json:"length,omitempty"`
}

type DeliveryPointUpdate struct {
	Name    *string `json:"name,omitempty"`
	Address *string `json:"address,omitempty"`
	OwnerID *string `json:"owner_id,omitempty"`
	Type    *string `json:"type,omitempty"`
	Height  *int    `json:"height,omitempty"`
	Width   *int    `json:"width,omitempty"`
	Length  *int    `json:"length,omitempty"`
}
