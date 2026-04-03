package domain

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginResponse struct {
	Token string    `json:"token"`
	User  LoginUser `json:"user"`
}

type LoginUser struct {
	ID   string `json:"id"`
	Type string `json:"type"`
	Role string `json:"role"`
}
