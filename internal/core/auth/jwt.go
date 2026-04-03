package auth

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

var JWTSecret = []byte("my_super_secret_hackathon_key")

type Claims struct {
	ID   string `json:"id"`
	Type string `json:"type"` // "employee" or "client"
	Role string `json:"role"` // "driver", "logistician", "warehouse_manager", "" (for clients)
	jwt.RegisteredClaims
}

func GenerateToken(userID, userType, userRole string) (string, error) {
	expirationTime := time.Now().Add(24 * time.Hour)
	claims := &Claims{
		ID:   userID,
		Type: userType,
		Role: userRole,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(JWTSecret)
}

func ParseToken(tokenStr string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		return JWTSecret, nil
	})

	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, errors.New("invalid token")
	}

	return claims, nil
}
