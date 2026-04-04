package http

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"

	"github.com/cttxl/Hackathon2026-test/internal/core/domain"
	repo "github.com/cttxl/Hackathon2026-test/internal/features/requests/repository/postgres"
	"github.com/cttxl/Hackathon2026-test/internal/core/transport/http/response"
	"github.com/cttxl/Hackathon2026-test/internal/core/transport/http/request"
	"github.com/cttxl/Hackathon2026-test/internal/core/transport/http/middleware"
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
	claims := middleware.GetClaims(r.Context())
	var input domain.RequestCreate
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		response.Error(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if claims != nil && claims.Type == "client" {
		isOwner, err := h.repo.IsClientOwnerOfDeliveryPoint(r.Context(), input.DeliveryPointID, claims.ID)
		if err != nil || !isOwner {
			response.Error(w, http.StatusForbidden, "You can only create requests for your own delivery points")
			return
		}
	}

	req, err := h.repo.Create(r.Context(), input)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, err.Error())
		return
	}

	response.JSON(w, http.StatusCreated, req)
}

func (h *RequestHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r.Context())
	id := chi.URLParam(r, "id")

	if claims != nil && claims.Type == "client" {
		isOwner, err := h.repo.IsClientOwnerOfRequest(r.Context(), id, claims.ID)
		if err != nil || !isOwner {
			response.Error(w, http.StatusForbidden, "Access denied")
			return
		}
	}

	req, err := h.repo.GetByID(r.Context(), id)
	if err != nil {
		response.Error(w, http.StatusNotFound, "Resource not found")
		return
	}

	response.JSON(w, http.StatusOK, req)
}

func (h *RequestHandler) List(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r.Context())
	page, limit := request.Pagination(r)
	
	filters := repo.RequestFilters{
		ProductID:       r.URL.Query().Get("product_id"),
		DeliveryPointID: r.URL.Query().Get("delivery_point_id"),
		SkuID:           r.URL.Query().Get("sku_id"),
		Status:          r.URL.Query().Get("status"),
	}

	if claims != nil && claims.Type == "client" {
		filters.ClientOwnerID = claims.ID
	}

	reqs, total, err := h.repo.List(r.Context(), page, limit, filters)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, err.Error())
		return
	}

	response.SuccessList(w, reqs, page, limit, total)
}

func (h *RequestHandler) Update(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r.Context())
	if claims != nil && claims.Type == "client" {
		response.Error(w, http.StatusForbidden, "Clients cannot edit requests")
		return
	}

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
	claims := middleware.GetClaims(r.Context())
	id := chi.URLParam(r, "id")

	if claims != nil && claims.Type == "client" {
		isOwner, err := h.repo.IsClientOwnerOfRequest(r.Context(), id, claims.ID)
		if err != nil || !isOwner {
			response.Error(w, http.StatusForbidden, "Access denied")
			return
		}
	}

	err := h.repo.Delete(r.Context(), id)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, err.Error())
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
