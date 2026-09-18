package models

import "time"

type RepresentativeMaster struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	Name      string    `json:"name" gorm:"type:varchar(255);not null"`
	Code      string    `json:"code" gorm:"type:varchar(64)"`
	Mobile    string    `json:"mobile" gorm:"type:varchar(32)"`
	Email     string    `json:"email" gorm:"type:varchar(255)"`
	Territory string    `json:"territory" gorm:"type:varchar(255)"`
	Status    string    `json:"status" gorm:"type:varchar(32);default:active"`
	CreatedAt time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt time.Time `json:"updated_at" gorm:"autoUpdateTime"`
}
