package domain

import "time"

type Request struct {
	ID              string    `json:"id"`
	ProductID       string    `json:"product_id"`
	Quantity        int       `json:"quantity"`
	DeliveryPointID string    `json:"delivery_point_id"`
	Emergency       bool      `json:"emergency"`
	Status          string    `json:"status"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

type RequestCreate struct {
	ProductID       string `json:"product_id"`
	Quantity        int    `json:"quantity"`
	DeliveryPointID string `json:"delivery_point_id"`
	Emergency       bool   `json:"emergency"`
}

type RequestUpdate struct {
	ProductID       *string `json:"product_id,omitempty"`
	Quantity        *int    `json:"quantity,omitempty"`
	DeliveryPointID *string `json:"delivery_point_id,omitempty"`
	Emergency       *bool   `json:"emergency,omitempty"`
	Status          *string `json:"status,omitempty"`
}
