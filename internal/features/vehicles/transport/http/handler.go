package http

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"

	"github.com/cttxl/Hackathon2026-test/internal/core/domain"
	repo "github.com/cttxl/Hackathon2026-test/internal/features/vehicles/repository/postgres"
	"github.com/cttxl/Hackathon2026-test/internal/core/transport/http/response"
	"github.com/cttxl/Hackathon2026-test/internal/core/transport/http/request"
)

type VehicleHandler struct {
	repo *repo.VehicleRepository
}

func NewVehicleHandler(repo *repo.VehicleRepository) *VehicleHandler {
	return &VehicleHandler{repo: repo}
}

func (h *VehicleHandler) RegisterRoutes(r chi.Router) {
	r.Route("/vehicles", func(r chi.Router) {
		r.Post("/", h.Create)
		r.Get("/", h.List)
		r.Get("/{id}", h.GetByID)
		r.Patch("/{id}", h.Update)
		r.Delete("/{id}", h.Delete)
	})
}

func (h *VehicleHandler) Create(w http.ResponseWriter, r *http.Request) {
	var input domain.VehicleCreate
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		response.Error(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	v, err := h.repo.Create(r.Context(), input)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, err.Error())
		return
	}

	response.JSON(w, http.StatusCreated, v)
}

func (h *VehicleHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	v, err := h.repo.GetByID(r.Context(), id)
	if err != nil {
		response.Error(w, http.StatusNotFound, "Resource not found")
		return
	}

	response.JSON(w, http.StatusOK, v)
}

func (h *VehicleHandler) List(w http.ResponseWriter, r *http.Request) {
	page, limit := request.Pagination(r)
	
	vs, total, err := h.repo.List(r.Context(), page, limit)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, err.Error())
		return
	}

	response.SuccessList(w, vs, page, limit, total)
}

func (h *VehicleHandler) Update(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var input domain.VehicleUpdate
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		response.Error(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	v, err := h.repo.Update(r.Context(), id, input)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, err.Error())
		return
	}

	response.JSON(w, http.StatusOK, v)
}

func (h *VehicleHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	err := h.repo.Delete(r.Context(), id)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, err.Error())
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
