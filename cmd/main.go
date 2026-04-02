package main

import (
	"log"
	"time"

	"github.com/cttxl/Hackathon2026-test/internal/core/transport/http/server"
	clientshttp "github.com/cttxl/Hackathon2026-test/internal/features/clients/transport/http"
	employeeshttp "github.com/cttxl/Hackathon2026-test/internal/features/employees/transport/http"
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

	employeesHandler := employeeshttp.NewHandler()
	clientsHandler := clientshttp.NewHandler()

	srv.Router().Route("/employees", func(r chi.Router) {
		employeesHandler.RegisterRoutes(r)
	})

	srv.Router().Route("/clients", func(r chi.Router) {
		clientsHandler.RegisterRoutes(r)
	})

	if err := srv.Run(); err != nil {
		log.Fatalf("server error: %v", err)
	}
}
