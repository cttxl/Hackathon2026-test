package domain

import "time"

type Product struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Weight    int       `json:"weight"`
	Height    int       `json:"height"`
	Width     int       `json:"width"`
	Length    int       `json:"length"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type ProductCreate struct {
	Name   string `json:"name"`
	Weight int    `json:"weight"`
	Height int    `json:"height"`
	Width  int    `json:"width"`
	Length int    `json:"length"`
}

type ProductUpdate struct {
	Name   *string `json:"name,omitempty"`
	Weight *int    `json:"weight,omitempty"`
	Height *int    `json:"height,omitempty"`
	Width  *int    `json:"width,omitempty"`
	Length *int    `json:"length,omitempty"`
}
