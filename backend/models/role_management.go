package models

import (
	"time"

	"gorm.io/datatypes"
)

type RoleManagement struct {
	ID                        uint           `json:"id" gorm:"primaryKey"`
	RoleID                    uint           `json:"role_id"`
	MenuID                    uint           `json:"menu_id"`
	RoleManagementPermissions datatypes.JSON `json:"permissions" gorm:"column:role_management_permissions;type:jsonb;default:'{}'"`

	CreatedAt time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt time.Time `json:"updated_at" gorm:"autoUpdateTime"`

	Role Role `gorm:"foreignKey:RoleID" json:"role,omitempty"`
	Menu Menu `gorm:"foreignKey:MenuID" json:"menu,omitempty"`
}
