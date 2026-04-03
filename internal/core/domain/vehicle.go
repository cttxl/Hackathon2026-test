package domain

import "time"

type Vehicle struct {
	ID              string    `json:"id"`
	Name            string    `json:"name"`
	FuelType        string    `json:"fuel_type"`
	FuelConsumption int       `json:"fuel_consumption"`
	MaxWeight       int       `json:"max_weight"`
	MaxHeight       int       `json:"max_height"`
	MaxWidth        int       `json:"max_width"`
	MaxLength       int       `json:"max_length"`
	Address         string    `json:"address"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

type VehicleCreate struct {
	Name            string `json:"name"`
	FuelType        string `json:"fuel_type"`
	FuelConsumption int    `json:"fuel_consumption"`
	MaxWeight       int    `json:"max_weight"`
	MaxHeight       int    `json:"max_height"`
	MaxWidth        int    `json:"max_width"`
	MaxLength       int    `json:"max_length"`
	Address         string `json:"address"`
}

type VehicleUpdate struct {
	Name            *string `json:"name,omitempty"`
	FuelType        *string `json:"fuel_type,omitempty"`
	FuelConsumption *int    `json:"fuel_consumption,omitempty"`
	MaxWeight       *int    `json:"max_weight,omitempty"`
	MaxHeight       *int    `json:"max_height,omitempty"`
	MaxWidth        *int    `json:"max_width,omitempty"`
	MaxLength       *int    `json:"max_length,omitempty"`
	Address         *string `json:"address,omitempty"`
}
