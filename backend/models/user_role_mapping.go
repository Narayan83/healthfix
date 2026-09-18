package models

import (
	"time"

	"gorm.io/gorm"
)

type UserRoleMapping struct {
	ID       uint `json:"id" gorm:"primaryKey"`
	UserID   uint `json:"user_id" gorm:"not null;index"`
	RoleID   uint `json:"role_id" gorm:"not null;index"`
	Priority int  `json:"priority" gorm:"default:1"`

	CreatedAt time.Time      `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt time.Time      `json:"updated_at" gorm:"autoUpdateTime"`
	DeletedAt gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index"`

	User User `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Role Role `gorm:"foreignKey:RoleID" json:"role,omitempty"`
}

// Table name override
func (UserRoleMapping) TableName() string {
	return "user_role_mappings"
}
