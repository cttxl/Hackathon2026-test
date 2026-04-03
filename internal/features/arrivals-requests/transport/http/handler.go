package http

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"

	"github.com/cttxl/Hackathon2026-test/internal/core/domain"
	repo "github.com/cttxl/Hackathon2026-test/internal/features/arrivals-requests/repository/postgres"
	"github.com/cttxl/Hackathon2026-test/internal/core/transport/http/response"
	"github.com/cttxl/Hackathon2026-test/internal/core/transport/http/request"
)

type ArrivalRequestHandler struct {
	repo *repo.ArrivalRequestRepository
}

func NewArrivalRequestHandler(repo *repo.ArrivalRequestRepository) *ArrivalRequestHandler {
	return &ArrivalRequestHandler{repo: repo}
}

func (h *ArrivalRequestHandler) RegisterRoutes(r chi.Router) {
	r.Route("/arrivals-requests", func(r chi.Router) {
		r.Post("/", h.Create)
		r.Get("/", h.List)
		r.Get("/{id}", h.GetByID)
		r.Patch("/{id}", h.Update)
		r.Delete("/{id}", h.Delete)
	})
}

func (h *ArrivalRequestHandler) Create(w http.ResponseWriter, r *http.Request) {
	var input domain.ArrivalRequestCreate
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		response.Error(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	ar, err := h.repo.Create(r.Context(), input)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, err.Error())
		return
	}

	response.JSON(w, http.StatusCreated, ar)
}

func (h *ArrivalRequestHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	ar, err := h.repo.GetByID(r.Context(), id)
	if err != nil {
		response.Error(w, http.StatusNotFound, "Resource not found")
		return
	}

	response.JSON(w, http.StatusOK, ar)
}

func (h *ArrivalRequestHandler) List(w http.ResponseWriter, r *http.Request) {
	page, limit := request.Pagination(r)
	
	ars, total, err := h.repo.List(r.Context(), page, limit)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, err.Error())
		return
	}

	response.SuccessList(w, ars, page, limit, total)
}

func (h *ArrivalRequestHandler) Update(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var input domain.ArrivalRequestUpdate
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		response.Error(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	ar, err := h.repo.Update(r.Context(), id, input)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, err.Error())
		return
	}

	response.JSON(w, http.StatusOK, ar)
}

func (h *ArrivalRequestHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	err := h.repo.Delete(r.Context(), id)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, err.Error())
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
