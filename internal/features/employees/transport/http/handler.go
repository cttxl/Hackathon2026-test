package http

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"

	"github.com/cttxl/Hackathon2026-test/internal/core/domain"
	"github.com/cttxl/Hackathon2026-test/internal/core/transport/http/middleware"
	"github.com/cttxl/Hackathon2026-test/internal/core/transport/http/request"
	"github.com/cttxl/Hackathon2026-test/internal/core/transport/http/response"
	repo "github.com/cttxl/Hackathon2026-test/internal/features/employees/repository/postgres"
)

type EmployeeHandler struct {
	repo *repo.EmployeeRepository
}

func NewEmployeeHandler(repo *repo.EmployeeRepository) *EmployeeHandler {
	return &EmployeeHandler{repo: repo}
}

func (h *EmployeeHandler) RegisterRoutes(r chi.Router) {
	r.Route("/employees", func(r chi.Router) {
		r.With(middleware.AdminOnly).Post("/", h.Create)
		r.Get("/", h.List)
		r.Get("/{id}", h.GetByID)
		r.With(middleware.AdminOnly).Patch("/{id}", h.Update)
		r.With(middleware.AdminOnly).Delete("/{id}", h.Delete)
	})
}

func (h *EmployeeHandler) Create(w http.ResponseWriter, r *http.Request) {
	var input domain.EmployeeCreate
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		response.Error(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if input.Fullname == "" || input.Email == "" || input.Role == "" || input.Phone == "" {
		response.Error(w, http.StatusBadRequest, "Missing required fields")
		return
	}
	if !strings.Contains(input.Email, "@") || !strings.Contains(input.Email, ".") {
		response.Error(w, http.StatusBadRequest, "Invalid email format")
		return
	}
	if input.Role != "driver" && input.Role != "logistician" && input.Role != "warehouse_manager" && input.Role != "admin" {
		response.Error(w, http.StatusBadRequest, "Invalid role")
		return
	}
	if !strings.HasPrefix(input.Phone, "+") {
		response.Error(w, http.StatusBadRequest, "Invalid phone format")
		return
	}

	e, err := h.repo.Create(r.Context(), input)
	if err != nil {
		if strings.Contains(err.Error(), "duplicate key value") {
			response.Error(w, http.StatusConflict, "Email already exists")
			return
		}
		response.Error(w, http.StatusInternalServerError, err.Error())
		return
	}

	response.JSON(w, http.StatusCreated, e)
}

func (h *EmployeeHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	e, err := h.repo.GetByID(r.Context(), id)
	if err != nil {
		response.Error(w, http.StatusNotFound, "Resource not found")
		return
	}

	response.JSON(w, http.StatusOK, e)
}

func (h *EmployeeHandler) List(w http.ResponseWriter, r *http.Request) {
	page, limit := request.Pagination(r)
	
	es, total, err := h.repo.List(r.Context(), page, limit, false)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, err.Error())
		return
	}

	response.SuccessList(w, es, page, limit, total)
}

func (h *EmployeeHandler) Update(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var input domain.EmployeeUpdate
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		response.Error(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	e, err := h.repo.Update(r.Context(), id, input)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, err.Error())
		return
	}

	response.JSON(w, http.StatusOK, e)
}

func (h *EmployeeHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	err := h.repo.Delete(r.Context(), id)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, err.Error())
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
