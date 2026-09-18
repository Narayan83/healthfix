package models

import "time"

type PromotionItemMaster struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	ItemName  string    `json:"item_name" gorm:"type:varchar(255);not null"`
	Status    string    `json:"status" gorm:"type:varchar(32);default:active"`
	CreatedAt time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt time.Time `json:"updated_at" gorm:"autoUpdateTime"`
}
