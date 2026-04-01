package users

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
)

var now = time.Date(2026, 4, 1, 12, 0, 0, 0, time.UTC)

var warehouseID1 = 1
var vehicleID1 = 1

var hardcodedClients = []Client{
	{ID: 1, Name: "Acme Corp", Email: "contact@acme.com", Phone: "+380501234567", CreatedAt: now, UpdatedAt: now},
	{ID: 2, Name: "Globex Inc", Email: "info@globex.com", Phone: "+380509876543", CreatedAt: now, UpdatedAt: now},
	{ID: 3, Name: "Umbrella LLC", Email: "sales@umbrella.com", Phone: "+380505551234", CreatedAt: now, UpdatedAt: now},
}

var hardcodedEmployees = []Employee{
	{ID: 1, Fullname: "John Doe", Email: "john@company.com", Phone: "+380671112233", Role: "driver", VehicleID: &vehicleID1, CreatedAt: now, UpdatedAt: now},
	{ID: 2, Fullname: "Jane Smith", Email: "jane@company.com", Phone: "+380672223344", Role: "logist", CreatedAt: now, UpdatedAt: now},
	{ID: 3, Fullname: "Bob Wilson", Email: "bob@company.com", Phone: "+380673334455", Role: "warehouse_operator", WarehouseID: &warehouseID1, CreatedAt: now, UpdatedAt: now},
}

// --- Clients ---

func ListClients(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, hardcodedClients)
}

func GetClient(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid id"})
		return
	}
	for _, c := range hardcodedClients {
		if c.ID == id {
			writeJSON(w, http.StatusOK, c)
			return
		}
	}
	writeJSON(w, http.StatusNotFound, map[string]string{"error": "client not found"})
}

// --- Employees ---

func ListEmployees(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, hardcodedEmployees)
}

func GetEmployee(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid id"})
		return
	}
	for _, e := range hardcodedEmployees {
		if e.ID == id {
			writeJSON(w, http.StatusOK, e)
			return
		}
	}
	writeJSON(w, http.StatusNotFound, map[string]string{"error": "employee not found"})
}

// --- helpers ---

func writeJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if data != nil {
		json.NewEncoder(w).Encode(data)
	}
}
