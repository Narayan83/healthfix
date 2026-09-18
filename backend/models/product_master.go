package models

import "time"

type ProductMaster struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	ProductCode string    `json:"product_code" gorm:"type:varchar(64);not null;uniqueIndex:idx_product_masters_product_code"`
	Name        string    `json:"name" gorm:"type:varchar(255);not null"`
	Description string    `json:"description"`
	Packing     string    `json:"packing" gorm:"type:varchar(64)"`
	Status      string    `json:"status" gorm:"type:varchar(32);default:active"`
	Category    string    `json:"category" gorm:"type:varchar(64)"`
	CreatedAt   time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt   time.Time `json:"updated_at" gorm:"autoUpdateTime"`
}
