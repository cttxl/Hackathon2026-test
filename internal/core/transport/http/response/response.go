package response

import (
	"encoding/json"
	"net/http"
)

type Meta struct {
	Page  int `json:"page"`
	Limit int `json:"limit"`
	Total int `json:"total"`
}

type ListResponse struct {
	Data interface{} `json:"data"`
	Meta Meta        `json:"meta"`
}

type ErrorResponse struct {
	Error string `json:"error"`
}

func JSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if data != nil {
		json.NewEncoder(w).Encode(data)
	}
}

func Error(w http.ResponseWriter, status int, msg string) {
	JSON(w, status, ErrorResponse{Error: msg})
}

func SuccessList(w http.ResponseWriter, data interface{}, page, limit, total int) {
	JSON(w, http.StatusOK, ListResponse{
		Data: data,
		Meta: Meta{
			Page:  page,
			Limit: limit,
			Total: total,
		},
	})
}
