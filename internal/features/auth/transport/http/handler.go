package http

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"

	"github.com/cttxl/Hackathon2026-test/internal/core/auth"
	"github.com/cttxl/Hackathon2026-test/internal/core/domain"
	"github.com/cttxl/Hackathon2026-test/internal/core/transport/http/response"
	repo "github.com/cttxl/Hackathon2026-test/internal/features/auth/repository/postgres"
)

type AuthHandler struct {
	repo *repo.AuthRepository
}

func NewAuthHandler(repo *repo.AuthRepository) *AuthHandler {
	return &AuthHandler{repo: repo}
}

func (h *AuthHandler) RegisterRoutes(r chi.Router) {
	r.Post("/login", h.Login)
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var input domain.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		response.Error(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	user, err := h.repo.Authenticate(r.Context(), input.Email, input.Password)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "Internal Server Error")
		return
	}

	if user == nil {
		response.Error(w, http.StatusUnauthorized, "Invalid credentials")
		return
	}

	token, err := auth.GenerateToken(user.ID, user.Type, user.Role)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "Failed to generate token")
		return
	}

	res := domain.LoginResponse{
		Token: token,
		User:  *user,
	}

	response.JSON(w, http.StatusOK, res)
}
