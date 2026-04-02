package http

import (
	"encoding/json"
	"net/http"
	"strconv"
	"sync"

	"github.com/go-chi/chi/v5"
)

type Client struct {
	ID       int    `json:"id"`
	Name     string `json:"name"`
	Industry string `json:"industry"`
}

type Handler struct {
	mu      sync.RWMutex
	clients map[int]Client
	nextID  int
}

func NewHandler() *Handler {
	return &Handler{
		clients: map[int]Client{
			1: {ID: 1, Name: "Acme Corp", Industry: "Manufacturing"},
			2: {ID: 2, Name: "Globex", Industry: "Technology"},
		},
		nextID: 3,
	}
}

func (h *Handler) RegisterRoutes(r chi.Router) {
	r.Post("/", h.CreateClient)
	r.Get("/", h.ListClients)
	r.Get("/{client_id}", h.GetClient)
	r.Patch("/{client_id}", h.UpdateClient)
	r.Delete("/{client_id}", h.DeleteClient)
}

func (h *Handler) CreateClient(w http.ResponseWriter, r *http.Request) {
	var cli Client
	if err := json.NewDecoder(r.Body).Decode(&cli); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	h.mu.Lock()
	cli.ID = h.nextID
	h.nextID++
	h.clients[cli.ID] = cli
	h.mu.Unlock()

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(cli)
}

func (h *Handler) ListClients(w http.ResponseWriter, r *http.Request) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	list := make([]Client, 0, len(h.clients))
	for _, c := range h.clients {
		list = append(list, c)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(list)
}

func (h *Handler) GetClient(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "client_id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "invalid client_id", http.StatusBadRequest)
		return
	}

	h.mu.RLock()
	cli, ok := h.clients[id]
	h.mu.RUnlock()

	if !ok {
		http.Error(w, "client not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(cli)
}

func (h *Handler) UpdateClient(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "client_id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "invalid client_id", http.StatusBadRequest)
		return
	}

	var updates map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&updates); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	h.mu.Lock()
	cli, ok := h.clients[id]
	if !ok {
		h.mu.Unlock()
		http.Error(w, "client not found", http.StatusNotFound)
		return
	}

	if name, ok := updates["name"].(string); ok {
		cli.Name = name
	}
	if industry, ok := updates["industry"].(string); ok {
		cli.Industry = industry
	}
	h.clients[id] = cli
	h.mu.Unlock()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(cli)
}

func (h *Handler) DeleteClient(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "client_id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "invalid client_id", http.StatusBadRequest)
		return
	}

	h.mu.Lock()
	_, ok := h.clients[id]
	if ok {
		delete(h.clients, id)
	}
	h.mu.Unlock()

	if !ok {
		http.Error(w, "client not found", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
