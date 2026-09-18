package models

import "time"

type Role struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	RoleName    string    `json:"role_name" gorm:"type:varchar(255);not null;unique"`
	Description string    `json:"description"`
	IsActive    bool      `json:"is_active" gorm:"default:true"`
	CreatedAt   time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt   time.Time `json:"updated_at" gorm:"autoUpdateTime"`
}
