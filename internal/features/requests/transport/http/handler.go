package http

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"

	"github.com/cttxl/Hackathon2026-test/internal/core/domain"
	repo "github.com/cttxl/Hackathon2026-test/internal/features/requests/repository/postgres"
	"github.com/cttxl/Hackathon2026-test/internal/core/transport/http/response"
	"github.com/cttxl/Hackathon2026-test/internal/core/transport/http/request"
)

type RequestHandler struct {
	repo *repo.RequestRepository
}

func NewRequestHandler(repo *repo.RequestRepository) *RequestHandler {
	return &RequestHandler{repo: repo}
}

func (h *RequestHandler) RegisterRoutes(r chi.Router) {
	r.Route("/requests", func(r chi.Router) {
		r.Post("/", h.Create)
		r.Get("/", h.List)
		r.Get("/{id}", h.GetByID)
		r.Patch("/{id}", h.Update)
		r.Delete("/{id}", h.Delete)
	})
}

func (h *RequestHandler) Create(w http.ResponseWriter, r *http.Request) {
	var input domain.RequestCreate
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		response.Error(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	req, err := h.repo.Create(r.Context(), input)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, err.Error())
		return
	}

	response.JSON(w, http.StatusCreated, req)
}

func (h *RequestHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	req, err := h.repo.GetByID(r.Context(), id)
	if err != nil {
		response.Error(w, http.StatusNotFound, "Resource not found")
		return
	}

	response.JSON(w, http.StatusOK, req)
}

func (h *RequestHandler) List(w http.ResponseWriter, r *http.Request) {
	page, limit := request.Pagination(r)
	
	filters := repo.RequestFilters{
		ProductID:       r.URL.Query().Get("product_id"),
		DeliveryPointID: r.URL.Query().Get("delivery_point_id"),
		SkuID:           r.URL.Query().Get("sku_id"),
		Status:          r.URL.Query().Get("status"),
	}

	reqs, total, err := h.repo.List(r.Context(), page, limit, filters)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, err.Error())
		return
	}

	response.SuccessList(w, reqs, page, limit, total)
}

func (h *RequestHandler) Update(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var input domain.RequestUpdate
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		response.Error(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	req, err := h.repo.Update(r.Context(), id, input)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, err.Error())
		return
	}

	response.JSON(w, http.StatusOK, req)
}

func (h *RequestHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	err := h.repo.Delete(r.Context(), id)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, err.Error())
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
