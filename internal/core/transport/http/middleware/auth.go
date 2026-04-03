package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/cttxl/Hackathon2026-test/internal/core/auth"
	"github.com/cttxl/Hackathon2026-test/internal/core/transport/http/response"
)

type contextKey string

const ClaimsContextKey = contextKey("jwt_claims")

// AuthMiddleware intercepts requests, validates the JWT, and adds the claims to the context
func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Extract token from Auth header
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			response.Error(w, http.StatusUnauthorized, "Missing Authorization header")
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			response.Error(w, http.StatusUnauthorized, "Invalid Authorization header format")
			return
		}

		tokenStr := parts[1]
		claims, err := auth.ParseToken(tokenStr)
		if err != nil {
			response.Error(w, http.StatusUnauthorized, "Invalid or expired token")
			return
		}

		// Inject claims into context
		ctx := context.WithValue(r.Context(), ClaimsContextKey, claims)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// GetClaims is a helper string to retrieve claims from context inside handlers
func GetClaims(ctx context.Context) *auth.Claims {
	claims, ok := ctx.Value(ClaimsContextKey).(*auth.Claims)
	if !ok {
		return nil
	}
	return claims
}

// AdminOnly intercepts requests and validates that the authenticated user is an admin
func AdminOnly(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		claims := GetClaims(r.Context())
		if claims == nil || claims.Role != "admin" {
			response.Error(w, http.StatusForbidden, "Admin privileges required to perform this action")
			return
		}
		next.ServeHTTP(w, r)
	})
}

