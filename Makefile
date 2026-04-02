include .env
export

export PROJECT_ROOT := $(shell pwd)

up: postgres-up frontend-up backend-up
down: postgres-down backend-down frontend-down

postgres-up:
	@docker-compose up -d postgres

postgres-down:
	@docker-compose down postgres

postgres-cleanup:
	@printf "Are you sure you want to delete the database? (y/n): "; \
	read ans; \
	if [ "$$ans" = "y" ]; then \
		rm -rf $(PROJECT_ROOT)/out/pgdata; \
	else \
		echo "Database not deleted"; \
	fi

backend-up:
	@docker-compose up --build backend

backend-down:
	@docker-compose down backend

frontend-up:
	@docker-compose up --build frontend

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