package config

import (
	"log"
	"os"
	"strconv"
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
