package models

import (
	"time"

	"gorm.io/datatypes"
)

type UserMenuPermission struct {
	ID          uint           `json:"id" gorm:"primaryKey"`
	UserID      uint           `json:"user_id" gorm:"index"`
	MenuID      uint           `json:"menu_id" gorm:"index"`
	Permissions datatypes.JSON `json:"permissions" gorm:"type:jsonb;default:'{}'"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	User User `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Menu Menu `gorm:"foreignKey:MenuID" json:"menu,omitempty"`
}

func (UserMenuPermission) TableName() string {
	return "user_menu_permissions"
}
