package models

import "time"

type DoctorMaster struct {
	ID                 uint        `json:"id" gorm:"primaryKey"`
	SearchDoctor       string      `json:"search_doctor" gorm:"type:varchar(128)"`
	FullName           string      `json:"full_name" gorm:"type:varchar(255);not null"`
	AddressLine1       string      `json:"address_line1" gorm:"type:varchar(255)"`
	AddressLine2       string      `json:"address_line2" gorm:"type:varchar(255)"`
	City               string      `json:"city" gorm:"type:varchar(128)"`
	State              string      `json:"state" gorm:"type:varchar(128)"`
	PostalCode         string      `json:"postal_code" gorm:"type:varchar(32)"`
	Degree             string      `json:"degree" gorm:"type:varchar(64)"`
	Department         string      `json:"department" gorm:"type:varchar(128)"`
	TypeOfActivity     string      `json:"type_of_activity" gorm:"type:varchar(64)"`
	NumberOfVisits     int         `json:"number_of_visits" gorm:"default:0"`
	AreaID             *uint       `json:"area_id"`
	Area               *AreaMaster `json:"area,omitempty" gorm:"foreignKey:AreaID;references:ID"`
	Mobile             string      `json:"mobile" gorm:"type:varchar(20)"`
	HospitalNumber     string      `json:"hospital_number" gorm:"type:varchar(32)"`
	Gender             string      `json:"gender" gorm:"type:varchar(16)"`
	DateOfBirth        string      `json:"date_of_birth" gorm:"type:varchar(32)"`
	WeddingAnniversary string      `json:"wedding_anniversary" gorm:"type:varchar(32)"`
	Status             string      `json:"status" gorm:"type:varchar(32);default:active"`
	CreatedAt          time.Time   `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt          time.Time   `json:"updated_at" gorm:"autoUpdateTime"`
}
