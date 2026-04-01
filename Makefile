include .env
export

export PROJECT_ROOT := $(shell pwd)

up: docker-up backend-run
down: docker-down backend-down

docker-up:
	@docker-compose up -d postgres

docker-down:
	@docker-compose down postgres

docker-cleanup:
	@printf "Are you sure you want to delete the database? (y/n): "; \
	read ans; \
	if [ "$$ans" = "y" ]; then \
		echo "Deleting database..."; \
		rm -rf $(PROJECT_ROOT)/out/pgdata; \
		echo "Database deleted"; \
	else \
		echo "Database not deleted"; \
	fi

backend-run:
	@docker-compose up --build backend

backend-down:
	@docker-compose down backend


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