package models

import "time"

type Order struct {
	ID                uint      `json:"id" gorm:"primaryKey"`
	DailyCallReportID uint      `json:"daily_call_report_id" gorm:"not null;uniqueIndex"`
	UserID            uint      `json:"user_id" gorm:"not null;index"`
	OrderDate         time.Time `json:"order_date" gorm:"type:date;not null"`
	AreaID            *uint     `json:"area_id"`
	DoctorID          *uint     `json:"doctor_id"`
	ChemistID         *uint     `json:"chemist_id"`
	Remarks           string    `json:"remarks"`
	CreatedAt         time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt         time.Time `json:"updated_at" gorm:"autoUpdateTime"`

	Lines []OrderLine `json:"lines,omitempty" gorm:"foreignKey:OrderID"`
}

type OrderLine struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	OrderID   uint           `json:"order_id" gorm:"not null;index"`
	ProductID uint           `json:"product_id" gorm:"not null"`
	Product   *ProductMaster `json:"product,omitempty" gorm:"foreignKey:ProductID"`
	Quantity  float64        `json:"quantity" gorm:"not null;default:1"`
	CreatedAt time.Time      `json:"created_at" gorm:"autoCreateTime"`
}
