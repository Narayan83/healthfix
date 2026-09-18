package models

import "time"

const (
	DCREntryTypeReport  = "report"
	DCREntryTypeLeave   = "leave"
	DCREntryTypeHoliday = "holiday"

	DCRVisitTypeDoctor  = "doctor"
	DCRVisitTypeChemist = "chemist"
)

type DailyCallReport struct {
	ID         uint      `json:"id" gorm:"primaryKey"`
	UserID     uint      `json:"user_id" gorm:"not null;index"`
	EntryType  string    `json:"entry_type" gorm:"type:varchar(16);not null"` // report | leave | holiday
	EntryDate  time.Time `json:"entry_date" gorm:"type:date;not null;index"`
	AreaID     *uint     `json:"area_id"`
	Area       *AreaMaster `json:"area,omitempty" gorm:"foreignKey:AreaID"`
	VisitType  string    `json:"visit_type" gorm:"type:varchar(16)"` // doctor | chemist
	DoctorID   *uint     `json:"doctor_id"`
	Doctor     *DoctorMaster `json:"doctor,omitempty" gorm:"foreignKey:DoctorID"`
	ChemistID  *uint     `json:"chemist_id"`
	Chemist    *ChemistMaster `json:"chemist,omitempty" gorm:"foreignKey:ChemistID"`
	Remarks    string    `json:"remarks"`
	CreatedAt  time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt  time.Time `json:"updated_at" gorm:"autoUpdateTime"`

	PromotionLines []DailyCallReportPromotion `json:"promotion_lines,omitempty" gorm:"foreignKey:DailyCallReportID"`
	Order          *Order                     `json:"order,omitempty" gorm:"foreignKey:DailyCallReportID"`
}

type DailyCallReportPromotion struct {
	ID                uint                 `json:"id" gorm:"primaryKey"`
	DailyCallReportID uint                 `json:"daily_call_report_id" gorm:"not null;index"`
	PromotionItemID   uint                 `json:"promotion_item_id" gorm:"not null"`
	PromotionItem     *PromotionItemMaster `json:"promotion_item,omitempty" gorm:"foreignKey:PromotionItemID"`
	Quantity          float64              `json:"quantity" gorm:"not null;default:0"`
	Value             float64              `json:"value" gorm:"not null;default:0"`
	CreatedAt         time.Time            `json:"created_at" gorm:"autoCreateTime"`
}
