package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"strconv"
	"time"

	_ "github.com/lib/pq"

	"github.com/cttxl/Hackathon2026-test/internal/core/transport/http/server"

	employeesRepo "github.com/cttxl/Hackathon2026-test/internal/features/employees/repository/postgres"
	employeesHttp "github.com/cttxl/Hackathon2026-test/internal/features/employees/transport/http"

	clientsRepo "github.com/cttxl/Hackathon2026-test/internal/features/clients/repository/postgres"
	clientsHttp "github.com/cttxl/Hackathon2026-test/internal/features/clients/transport/http"

	vehiclesRepo "github.com/cttxl/Hackathon2026-test/internal/features/vehicles/repository/postgres"
	vehiclesHttp "github.com/cttxl/Hackathon2026-test/internal/features/vehicles/transport/http"

	productsRepo "github.com/cttxl/Hackathon2026-test/internal/features/products/repository/postgres"
	productsHttp "github.com/cttxl/Hackathon2026-test/internal/features/products/transport/http"

	dpRepo "github.com/cttxl/Hackathon2026-test/internal/features/delivery-points/repository/postgres"
	dpHttp "github.com/cttxl/Hackathon2026-test/internal/features/delivery-points/transport/http"

	skuRepo "github.com/cttxl/Hackathon2026-test/internal/features/sku/repository/postgres"
	skuHttp "github.com/cttxl/Hackathon2026-test/internal/features/sku/transport/http"

	requestsRepo "github.com/cttxl/Hackathon2026-test/internal/features/requests/repository/postgres"
	requestsHttp "github.com/cttxl/Hackathon2026-test/internal/features/requests/transport/http"

	arrivalsRepo "github.com/cttxl/Hackathon2026-test/internal/features/arrivals/repository/postgres"
	arrivalsHttp "github.com/cttxl/Hackathon2026-test/internal/features/arrivals/transport/http"

	asRepo "github.com/cttxl/Hackathon2026-test/internal/features/arrivals-schedule/repository/postgres"
	asHttp "github.com/cttxl/Hackathon2026-test/internal/features/arrivals-schedule/transport/http"

	arRepo "github.com/cttxl/Hackathon2026-test/internal/features/arrivals-requests/repository/postgres"
	arHttp "github.com/cttxl/Hackathon2026-test/internal/features/arrivals-requests/transport/http"
	authRepo "github.com/cttxl/Hackathon2026-test/internal/features/auth/repository/postgres"
	authHttp "github.com/cttxl/Hackathon2026-test/internal/features/auth/transport/http"

	authMiddleware "github.com/cttxl/Hackathon2026-test/internal/core/transport/http/middleware"

	"github.com/go-chi/chi/v5"
)

type Config struct {
	POSTGRES_HOST           string `env:"POSTGRES_HOST"`
	POSTGRES_PORT           string `env:"POSTGRES_PORT"`
	POSTGRES_USER           string `env:"POSTGRES_USER"`
	POSTGRES_PASSWORD       string `env:"POSTGRES_PASSWORD"`
	POSTGRES_DB             string `env:"POSTGRES_DB"`
	SERVER_HOST             string `env:"SERVER_HOST"`
	SERVER_PORT             int    `env:"SERVER_PORT"`
	SERVER_READ_TIMEOUT     int    `env:"SERVER_READ_TIMEOUT"`
	SERVER_WRITE_TIMEOUT    int    `env:"SERVER_WRITE_TIMEOUT"`
	SERVER_IDLE_TIMEOUT     int    `env:"SERVER_IDLE_TIMEOUT"`
	SERVER_SHUTDOWN_TIMEOUT int    `env:"SERVER_SHUTDOWN_TIMEOUT"`
}

func NewConfig() *Config {
	return &Config{
		POSTGRES_HOST:           env("POSTGRES_HOST"),
		POSTGRES_PORT:           env("POSTGRES_PORT"),
		POSTGRES_USER:           env("POSTGRES_USER"),
		POSTGRES_PASSWORD:       env("POSTGRES_PASSWORD"),
		POSTGRES_DB:             env("POSTGRES_DB"),
		SERVER_HOST:             env("SERVER_HOST"),
		SERVER_PORT:             envAsInt("SERVER_PORT"),
		SERVER_READ_TIMEOUT:     envAsInt("SERVER_READ_TIMEOUT"),
		SERVER_WRITE_TIMEOUT:    envAsInt("SERVER_WRITE_TIMEOUT"),
		SERVER_IDLE_TIMEOUT:     envAsInt("SERVER_IDLE_TIMEOUT"),
		SERVER_SHUTDOWN_TIMEOUT: envAsInt("SERVER_SHUTDOWN_TIMEOUT"),
	}
}

func main() {
	cfg := NewConfig()
	dsn := fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=disable", cfg.POSTGRES_USER, cfg.POSTGRES_PASSWORD, cfg.POSTGRES_HOST, cfg.POSTGRES_PORT, cfg.POSTGRES_DB)
	db, err := sql.Open("postgres", dsn)
	if err != nil {
		log.Fatalf("failed to open db: %v", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatalf("failed to ping db: %v", err)
	}
	log.Println("✅ Connected to database")

	srv := server.New(server.Config{
		Host:            cfg.SERVER_HOST,
		Port:            cfg.SERVER_PORT,
		ReadTimeout:     time.Duration(cfg.SERVER_READ_TIMEOUT) * time.Second,
		WriteTimeout:    time.Duration(cfg.SERVER_WRITE_TIMEOUT) * time.Second,
		IdleTimeout:     time.Duration(cfg.SERVER_IDLE_TIMEOUT) * time.Second,
		ShutdownTimeout: time.Duration(cfg.SERVER_SHUTDOWN_TIMEOUT) * time.Second,
	})
	router := srv.Router()

	authHttp.NewAuthHandler(authRepo.NewAuthRepository(db)).RegisterRoutes(router)

	router.Group(func(r chi.Router) {
		r.Use(authMiddleware.AuthMiddleware)

		employeesHttp.NewEmployeeHandler(employeesRepo.NewEmployeeRepository(db)).RegisterRoutes(r)
		clientsHttp.NewClientHandler(clientsRepo.NewClientRepository(db)).RegisterRoutes(r)
		vehiclesHttp.NewVehicleHandler(vehiclesRepo.NewVehicleRepository(db)).RegisterRoutes(r)
		productsHttp.NewProductHandler(productsRepo.NewProductRepository(db)).RegisterRoutes(r)
		dpHttp.NewDeliveryPointHandler(dpRepo.NewDeliveryPointRepository(db)).RegisterRoutes(r)
		skuHttp.NewSKUHandler(skuRepo.NewSKURepository(db)).RegisterRoutes(r)
		requestsHttp.NewRequestHandler(requestsRepo.NewRequestRepository(db)).RegisterRoutes(r)
		arrivalsHttp.NewArrivalHandler(arrivalsRepo.NewArrivalRepository(db)).RegisterRoutes(r)
		asHttp.NewArrivalScheduleHandler(asRepo.NewArrivalScheduleRepository(db)).RegisterRoutes(r)
		arHttp.NewArrivalRequestHandler(arRepo.NewArrivalRequestRepository(db)).RegisterRoutes(r)
	})

	if err := srv.Run(); err != nil {
		log.Fatalf("server error: %v", err)
	}
}

func env(key string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	log.Fatalf("environment variable %s is not set", key)
	return ""
}

func envAsInt(key string) int {
	if v := os.Getenv(key); v != "" {
		if parsed, err := strconv.Atoi(v); err == nil {
			return parsed
		}
	}
	log.Fatalf("environment variable %s is not set", key)
	return 0
}
