package main

import (
	"log"
	"time"

	"github.com/cttxl/Hackathon2026-test/internal/core/transport/http/server"
	"github.com/go-chi/chi/v5"
)

func main() {
	serverConfig := server.Config{
		Host:            "0.0.0.0",
		Port:            8080,
		ReadTimeout:     15 * time.Second,
		WriteTimeout:    15 * time.Second,
		IdleTimeout:     60 * time.Second,
		ShutdownTimeout: 30 * time.Second,
	}

	srv := server.New(serverConfig)

	srv.Router().Route("/api", func(r chi.Router) {
	})

	if err := srv.Run(); err != nil {
		log.Fatalf("server error: %v", err)
	}
}
