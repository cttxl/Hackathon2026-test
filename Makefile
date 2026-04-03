include .env
export

export PROJECT_ROOT := $(CURDIR)

ifeq ($(OS),Windows_NT)
    DOCKER_COMPOSE := $(shell docker compose version >NUL 2>&1 && echo docker compose || echo docker-compose)
else
    DOCKER_COMPOSE := $(shell docker compose version >/dev/null 2>&1 && echo "docker compose" || echo "docker-compose")
endif

ifeq ($(strip $(DOCKER_COMPOSE)),)
    DOCKER_COMPOSE := docker compose
endif

up: postgres-up backend-up frontend-up
down: postgres-down backend-down frontend-down

postgres-up:
	@$(DOCKER_COMPOSE) up -d postgres

postgres-down:
	@$(DOCKER_COMPOSE) down postgres

postgres-cleanup:
	@rm -rf ./out/pgdata

backend-up:
	@$(DOCKER_COMPOSE) up -d --build backend

backend-down:
	@$(DOCKER_COMPOSE) down backend

frontend-up:
	@$(DOCKER_COMPOSE) up -d --build frontend

frontend-down:
	@$(DOCKER_COMPOSE) down frontend


migrate-create:
	@$(DOCKER_COMPOSE) run postgres-migrate \
		create \
		-ext sql \
		-dir /migrations \
		-seq \    
		$(name)

migrate-up:
	@make migrate-action action=up
	 
migrate-down:
	@make migrate-action action=down

migrate-action:
	@$(DOCKER_COMPOSE) run --rm postgres-migrate \
		-path /migrations \
		-database "postgres://$(POSTGRES_USER):$(POSTGRES_PASSWORD)@postgres:5432/$(POSTGRES_DB)?sslmode=disable" \
		$(action)

test:
	@$(DOCKER_COMPOSE) run --rm tests