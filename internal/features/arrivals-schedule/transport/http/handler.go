package http

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"

	"github.com/cttxl/Hackathon2026-test/internal/core/domain"
	repo "github.com/cttxl/Hackathon2026-test/internal/features/arrivals-schedule/repository/postgres"
	"github.com/cttxl/Hackathon2026-test/internal/core/transport/http/response"
	"github.com/cttxl/Hackathon2026-test/internal/core/transport/http/request"
)

type ArrivalScheduleHandler struct {
	repo *repo.ArrivalScheduleRepository
}

func NewArrivalScheduleHandler(repo *repo.ArrivalScheduleRepository) *ArrivalScheduleHandler {
	return &ArrivalScheduleHandler{repo: repo}
}

func (h *ArrivalScheduleHandler) RegisterRoutes(r chi.Router) {
	r.Route("/arrivals-schedule", func(r chi.Router) {
		r.Post("/", h.Create)
		r.Get("/", h.List)
		r.Get("/{id}", h.GetByID)
		r.Patch("/{id}", h.Update)
		r.Delete("/{id}", h.Delete)
	})
}

func (h *ArrivalScheduleHandler) Create(w http.ResponseWriter, r *http.Request) {
	var input domain.ArrivalScheduleCreate
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		response.Error(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	as, err := h.repo.Create(r.Context(), input)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, err.Error())
		return
	}

	response.JSON(w, http.StatusCreated, as)
}

func (h *ArrivalScheduleHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	as, err := h.repo.GetByID(r.Context(), id)
	if err != nil {
		response.Error(w, http.StatusNotFound, "Resource not found")
		return
	}

	response.JSON(w, http.StatusOK, as)
}

func (h *ArrivalScheduleHandler) List(w http.ResponseWriter, r *http.Request) {
	page, limit := request.Pagination(r)
	
	ass, total, err := h.repo.List(r.Context(), page, limit)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, err.Error())
		return
	}

	response.SuccessList(w, ass, page, limit, total)
}

func (h *ArrivalScheduleHandler) Update(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var input domain.ArrivalScheduleUpdate
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		response.Error(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	as, err := h.repo.Update(r.Context(), id, input)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, err.Error())
		return
	}

	response.JSON(w, http.StatusOK, as)
}

func (h *ArrivalScheduleHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	err := h.repo.Delete(r.Context(), id)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, err.Error())
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
