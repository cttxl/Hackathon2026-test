package domain

import "time"

type SKU struct {
	ID              string    `json:"id"`
	ProductID       string    `json:"product_id"`
	DeliveryPointID string    `json:"delivery_point_id"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

type SKUCreate struct {
	ProductID       string `json:"product_id"`
	DeliveryPointID string `json:"delivery_point_id"`
}

type SKUUpdate struct {
	ProductID       *string `json:"product_id,omitempty"`
	DeliveryPointID *string `json:"delivery_point_id,omitempty"`
}
