package domain

import "time"

type Employee struct {
	ID        string    `json:"id"`
	Fullname  string    `json:"fullname"`
	Email     string    `json:"email"`
	Phone     string    `json:"phone"`
	Role      string    `json:"role"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type EmployeeCreate struct {
	Fullname string `json:"fullname"`
	Email    string `json:"email"`
	Password string `json:"password"`
	Phone    string `json:"phone"`
	Role     string `json:"role"`
}

type EmployeeUpdate struct {
	Fullname *string `json:"fullname,omitempty"`
	Email    *string `json:"email,omitempty"`
	Password *string `json:"password,omitempty"`
	Phone    *string `json:"phone,omitempty"`
	Role     *string `json:"role,omitempty"`
}
