package users

import "github.com/go-chi/chi/v5"

func RegisterRoutes(r chi.Router) {
	r.Route("/clients", func(r chi.Router) {
		r.Get("/", ListClients)
		r.Get("/{id}", GetClient)
	})

	r.Route("/employees", func(r chi.Router) {
		r.Get("/", ListEmployees)
		r.Get("/{id}", GetEmployee)
	})
}
