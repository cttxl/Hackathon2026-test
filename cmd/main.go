package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"
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

func main() {
	// --- DB Connection ---
	user := envOrDefault("POSTGRES_USER", "testuser")
	pass := envOrDefault("POSTGRES_PASSWORD", "1111")
	dbname := envOrDefault("POSTGRES_DB", "testdb")
	host := envOrDefault("POSTGRES_HOST", "localhost")
	port := envOrDefault("POSTGRES_PORT", "5432")

	dsn := fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=disable", user, pass, host, port, dbname)
	db, err := sql.Open("postgres", dsn)
	if err != nil {
		log.Fatalf("failed to open db: %v", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatalf("failed to ping db: %v", err)
	}
	log.Println("✅ Connected to database")

	// --- Start HTTP server ---
	serverConfig := server.Config{
		Host:            "0.0.0.0",
		Port:            8080,
		ReadTimeout:     15 * time.Second,
		WriteTimeout:    15 * time.Second,
		IdleTimeout:     60 * time.Second,
		ShutdownTimeout: 30 * time.Second,
	}

	srv := server.New(serverConfig)
	router := srv.Router()

	// Public routes
	authHttp.NewAuthHandler(authRepo.NewAuthRepository(db)).RegisterRoutes(router)

	// Protected routes
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

func envOrDefault(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}
