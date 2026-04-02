package server

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
)

func writeJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if data != nil {
		json.NewEncoder(w).Encode(data)
	}
}

func writeList(w http.ResponseWriter, status int, list any) {
	writeJSON(w, status, map[string]any{
		"data": list,
		"meta": map[string]any{
			"page":  1,
			"limit": 10,
			"total": 50,
		},
	})
}

func registerCRUD(r chi.Router, path string, mockData map[string]any) {
	r.Get(path, func(w http.ResponseWriter, _ *http.Request) {
		writeList(w, http.StatusOK, []any{mockData})
	})
	r.Post(path, func(w http.ResponseWriter, _ *http.Request) {
		writeJSON(w, http.StatusOK, mockData)
	})
	r.Get(path+"/{id}", func(w http.ResponseWriter, _ *http.Request) {
		writeJSON(w, http.StatusOK, mockData)
	})
	r.Patch(path+"/{id}", func(w http.ResponseWriter, _ *http.Request) {
		writeJSON(w, http.StatusOK, mockData)
	})
	r.Delete(path+"/{id}", func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	})
}

// RegisterHardcodedHandlers registers all mock endpoints according to API_DOCUMENTATION.md.
func RegisterHardcodedHandlers(r chi.Router) {
	r.Post("/login", func(w http.ResponseWriter, req *http.Request) {
		writeJSON(w, http.StatusOK, map[string]any{
			"token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjNlNDU2NyIsIm5hbWUiOiJKb2huIERvZSIsImlhdCI6MTUxNjIzOTAyMn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
			"user": map[string]any{
				"id":   "123e4567-e89b-12d3-a456-426614174000",
				"type": "employee",
				"role": "logistician",
			},
		})
	})

	registerCRUD(r, "/employees", map[string]any{
		"id":       "123e4567-e89b-12d3-a456-426614174001",
		"fullname": "John Doe",
		"email":    "john.doe@example.com",
		"phone":    "+1234567890",
		"role":     "driver",
	})

	registerCRUD(r, "/clients", map[string]any{
		"id":    "123e4567-e89b-12d3-a456-426614174002",
		"name":  "Acme Corp",
		"email": "contact@acme.com",
		"phone": "+1234567891",
	})

	registerCRUD(r, "/delivery-points", map[string]any{
		"id":       "123e4567-e89b-12d3-a456-426614174004",
		"name":     "Central Warehouse A",
		"address":  "123 Industry Ave, Cityville",
		"owner_id": "123e4567-e89b-12d3-a456-426614174002",
		"type":     "warehouse",
		"height":   500,
		"width":    1000,
		"length":   2000,
	})

	registerCRUD(r, "/products", map[string]any{
		"id":     "123e4567-e89b-12d3-a456-426614174005",
		"name":   "Steel Pipes 5m",
		"weight": 200,
		"height": 50,
		"width":  50,
		"length": 500,
	})

	registerCRUD(r, "/sku", map[string]any{
		"id":                "123e4567-e89b-12d3-a456-426614174006",
		"product_id":        "123e4567-e89b-12d3-a456-426614174005",
		"delivery_point_id": "123e4567-e89b-12d3-a456-426614174004",
	})

	registerCRUD(r, "/requests", map[string]any{
		"id":                "123e4567-e89b-12d3-a456-426614174007",
		"product_id":        "123e4567-e89b-12d3-a456-426614174005",
		"quantity":          50,
		"delivery_point_id": "123e4567-e89b-12d3-a456-426614174004",
		"emergency":         false,
		"status":            "pending",
	})

	registerCRUD(r, "/arrivals", map[string]any{
		"id":              "123e4567-e89b-12d3-a456-426614174008",
		"transport_id":    "123e4567-e89b-12d3-a456-426614174100",
		"driver_id":       "123e4567-e89b-12d3-a456-426614174001",
		"time_to_arrival": "2026-04-05T10:00:00Z",
		"status":          "pending",
	})

	registerCRUD(r, "/arrivals-schedule", map[string]any{
		"id":         "123e4567-e89b-12d3-a456-426614174009",
		"arrival_id": "123e4567-e89b-12d3-a456-426614174008",
	})

	registerCRUD(r, "/arrivals-requests", map[string]any{
		"id":         "123e4567-e89b-12d3-a456-426614174010",
		"arrival_id": "123e4567-e89b-12d3-a456-426614174008",
		"request_id": "123e4567-e89b-12d3-a456-426614174007",
		"sku_id":     "123e4567-e89b-12d3-a456-426614174006",
		"priority":   1,
	})

	registerCRUD(r, "/vehicles", map[string]any{
		"id":               "123e4567-e89b-12d3-a456-426614174100",
		"name":             "Volvo Truck XL",
		"fuel_type":        "diesel",
		"fuel_consumption": 25,
		"max_weight":       20000,
		"max_height":       400,
		"max_width":        250,
		"max_length":       1200,
		"address":          "Depot 1, Route 66",
	})
}
