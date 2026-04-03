include .env
export

export PROJECT_ROOT := $(CURDIR)

up: postgres-up backend-up frontend-up
down: postgres-down backend-down frontend-down

postgres-up:
	@docker-compose up -d postgres

postgres-down:
	@docker-compose down postgres

postgres-cleanup:
	@go run scripts/postgres_cleanup.go

backend-up:
	@docker-compose up -d --build backend

backend-down:
	@docker-compose down backend

frontend-up:
	@docker-compose up -d --build frontend

frontend-down:
	@docker-compose down frontend


migrate-create:
	@docker-compose run postgres-migrate \
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
	@docker-compose run --rm postgres-migrate \
		-path /migrations \
		-database "postgres://$(POSTGRES_USER):$(POSTGRES_PASSWORD)@postgres:5432/$(POSTGRES_DB)?sslmode=disable" \
		$(action)