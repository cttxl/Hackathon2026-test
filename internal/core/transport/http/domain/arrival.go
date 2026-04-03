package domain

import "time"

type Arrival struct {
	ID            string    `json:"id"`
	TransportID   string    `json:"transport_id"`
	DriverID      string    `json:"driver_id"`
	TimeToArrival time.Time `json:"time_to_arrival"`
	Status        string    `json:"status"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

type ArrivalCreate struct {
	TransportID   string    `json:"transport_id"`
	DriverID      string    `json:"driver_id"`
	TimeToArrival time.Time `json:"time_to_arrival"`
}

type ArrivalUpdate struct {
	TransportID   *string    `json:"transport_id,omitempty"`
	DriverID      *string    `json:"driver_id,omitempty"`
	TimeToArrival *time.Time `json:"time_to_arrival,omitempty"`
	Status        *string    `json:"status,omitempty"`
}
