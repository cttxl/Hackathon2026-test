package http

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"

	"github.com/cttxl/Hackathon2026-test/internal/core/domain"
	repo "github.com/cttxl/Hackathon2026-test/internal/features/sku/repository/postgres"
	"github.com/cttxl/Hackathon2026-test/internal/core/transport/http/response"
	"github.com/cttxl/Hackathon2026-test/internal/core/transport/http/request"
)

type SKUHandler struct {
	repo *repo.SKURepository
}

func NewSKUHandler(repo *repo.SKURepository) *SKUHandler {
	return &SKUHandler{repo: repo}
}

func (h *SKUHandler) RegisterRoutes(r chi.Router) {
	r.Route("/sku", func(r chi.Router) {
		r.Post("/", h.Create)
		r.Get("/", h.List)
		r.Get("/{id}", h.GetByID)
		r.Patch("/{id}", h.Update)
		r.Delete("/{id}", h.Delete)
	})
}

func (h *SKUHandler) Create(w http.ResponseWriter, r *http.Request) {
	var input domain.SKUCreate
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		response.Error(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	sku, err := h.repo.Create(r.Context(), input)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, err.Error())
		return
	}

	response.JSON(w, http.StatusCreated, sku)
}

func (h *SKUHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	sku, err := h.repo.GetByID(r.Context(), id)
	if err != nil {
		response.Error(w, http.StatusNotFound, "Resource not found")
		return
	}

	response.JSON(w, http.StatusOK, sku)
}

func (h *SKUHandler) List(w http.ResponseWriter, r *http.Request) {
	page, limit := request.Pagination(r)
	
	filterProductID := r.URL.Query().Get("product_id")
	filterDeliveryPointID := r.URL.Query().Get("delivery_point_id")

	skus, total, err := h.repo.List(r.Context(), page, limit, filterProductID, filterDeliveryPointID)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, err.Error())
		return
	}

	response.SuccessList(w, skus, page, limit, total)
}

func (h *SKUHandler) Update(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var input domain.SKUUpdate
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		response.Error(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	sku, err := h.repo.Update(r.Context(), id, input)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, err.Error())
		return
	}

	response.JSON(w, http.StatusOK, sku)
}

func (h *SKUHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	err := h.repo.Delete(r.Context(), id)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, err.Error())
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
