package models

import "time"

type StockistMaster struct {
	ID        uint        `json:"id" gorm:"primaryKey"`
	Name      string      `json:"name" gorm:"type:varchar(255);not null"`
	Place     string      `json:"place" gorm:"type:varchar(255)"`
	Email     string      `json:"email" gorm:"type:varchar(255)"`
	AreaID    *uint       `json:"area_id"`
	Area      *AreaMaster `json:"area,omitempty" gorm:"foreignKey:AreaID;references:ID"`
	Status    string      `json:"status" gorm:"type:varchar(32);default:active"`
	CreatedAt time.Time   `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt time.Time   `json:"updated_at" gorm:"autoUpdateTime"`
}

func (StockistMaster) TableName() string {
	return "stockist_masters"
}
