package request

import (
	"strconv"
	"net/http"
)

// Pagination extracts pagination params from query
func Pagination(r *http.Request) (int, int) {
	page := 1
	limit := 10

	if p := r.URL.Query().Get("page"); p != "" {
		if val, err := strconv.Atoi(p); err == nil && val > 0 {
			page = val
		}
	}
	if l := r.URL.Query().Get("limit"); l != "" {
		if val, err := strconv.Atoi(l); err == nil && val > 0 {
			limit = val
		}
	}

	return page, limit
}
