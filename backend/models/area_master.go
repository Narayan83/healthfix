package models

import "time"

type AreaMaster struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	Name      string    `json:"name" gorm:"type:varchar(255);not null;uniqueIndex"`
	Status    string    `json:"status" gorm:"type:varchar(32);default:active"`
	CreatedAt time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt time.Time `json:"updated_at" gorm:"autoUpdateTime"`
}

func (AreaMaster) TableName() string {
	return "area_masters"
}
