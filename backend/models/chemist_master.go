package models

import "time"

type ChemistMaster struct {
	ID           uint        `json:"id" gorm:"primaryKey"`
	Name         string      `json:"name" gorm:"type:varchar(255);not null"`
	OwnerName    string      `json:"owner_name" gorm:"type:varchar(255)"`
	AreaID       *uint       `json:"area_id"`
	Area         *AreaMaster `json:"area,omitempty" gorm:"foreignKey:AreaID;references:ID"`
	SearchPlace  string      `json:"search_place" gorm:"type:varchar(255)"`
	AddressLine1 string    `json:"address_line1" gorm:"type:varchar(255)"`
	AddressLine2 string    `json:"address_line2" gorm:"type:varchar(255)"`
	AddressLine3 string    `json:"address_line3" gorm:"type:varchar(255)"`
	AddressLine4 string    `json:"address_line4" gorm:"type:varchar(255)"`
	AddressLine5 string    `json:"address_line5" gorm:"type:varchar(64)"`
	Mobile       string    `json:"mobile" gorm:"type:varchar(20)"`
	Status       string    `json:"status" gorm:"type:varchar(32);default:active"`
	CreatedAt    time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt    time.Time `json:"updated_at" gorm:"autoUpdateTime"`
}
