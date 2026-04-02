package http

import (
	"encoding/json"
	"net/http"
	"strconv"
	"sync"

	"github.com/go-chi/chi/v5"
)

type Employee struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
	Role string `json:"role"`
}

type Handler struct {
	mu        sync.RWMutex
	employees map[int]Employee
	nextID    int
}

func NewHandler() *Handler {
	return &Handler{
		employees: map[int]Employee{
			1: {ID: 1, Name: "John Doe", Role: "Developer"},
			2: {ID: 2, Name: "Jane Smith", Role: "Manager"},
		},
		nextID: 3,
	}
}

func (h *Handler) RegisterRoutes(r chi.Router) {
	r.Post("/", h.CreateEmployee)
	r.Get("/", h.ListEmployees)
	r.Get("/{employee_id}", h.GetEmployee)
	r.Patch("/{employee_id}", h.UpdateEmployee)
	r.Delete("/{employee_id}", h.DeleteEmployee)
}

func (h *Handler) CreateEmployee(w http.ResponseWriter, r *http.Request) {
	var emp Employee
	if err := json.NewDecoder(r.Body).Decode(&emp); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	h.mu.Lock()
	emp.ID = h.nextID
	h.nextID++
	h.employees[emp.ID] = emp
	h.mu.Unlock()

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(emp)
}

func (h *Handler) ListEmployees(w http.ResponseWriter, r *http.Request) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	list := make([]Employee, 0, len(h.employees))
	for _, e := range h.employees {
		list = append(list, e)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(list)
}

func (h *Handler) GetEmployee(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "employee_id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "invalid employee_id", http.StatusBadRequest)
		return
	}

	h.mu.RLock()
	emp, ok := h.employees[id]
	h.mu.RUnlock()

	if !ok {
		http.Error(w, "employee not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(emp)
}

func (h *Handler) UpdateEmployee(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "employee_id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "invalid employee_id", http.StatusBadRequest)
		return
	}

	var updates map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&updates); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	h.mu.Lock()
	emp, ok := h.employees[id]
	if !ok {
		h.mu.Unlock()
		http.Error(w, "employee not found", http.StatusNotFound)
		return
	}

	if name, ok := updates["name"].(string); ok {
		emp.Name = name
	}
	if role, ok := updates["role"].(string); ok {
		emp.Role = role
	}
	h.employees[id] = emp
	h.mu.Unlock()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(emp)
}

func (h *Handler) DeleteEmployee(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "employee_id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "invalid employee_id", http.StatusBadRequest)
		return
	}

	h.mu.Lock()
	_, ok := h.employees[id]
	if ok {
		delete(h.employees, id)
	}
	h.mu.Unlock()

	if !ok {
		http.Error(w, "employee not found", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
