package models

import "time"

type Gender string

const (
	Male   Gender = "Male"
	Female Gender = "Female"
	Other  Gender = "Other"
)

type User struct {
	ID           uint       `gorm:"primaryKey" json:"id"`
	Usercode     *string    `gorm:"uniqueIndex;size:100" json:"usercode,omitempty"`
	Salutation   *string    `json:"salutation,omitempty"`
	Firstname    string     `json:"firstname"`
	Lastname     string     `json:"lastname"`
	DOB          *time.Time `json:"dob,omitempty"`
	Gender       Gender     `gorm:"type:varchar(10)" json:"gender"`
	CountryCode  string     `json:"country_code"`
	MobileNumber string     `gorm:"unique" json:"mobile_number"`
	Email           string     `gorm:"unique;not null" json:"email"`
	Password        string     `json:"-"` // never return to frontend
	PlainPassword   string     `json:"plain_password,omitempty"`
	Active          bool       `json:"active"`

	// Roles & Type Flags
	IsUser        bool `json:"is_user"`
	IsCustomer    bool `json:"is_customer"`
	IsSupplier    bool `json:"is_supplier"`
	IsEmployee    bool `json:"is_employee"`
	IsDealer      bool `json:"is_dealer"`
	IsDistributor bool `json:"is_distributor"`

	RepresentativeID *uint                 `json:"representative_id,omitempty" gorm:"index"`
	Representative   *RepresentativeMaster `json:"representative,omitempty" gorm:"foreignKey:RepresentativeID"`

	// Relations
	Addresses    []UserAddress     `gorm:"foreignKey:UserID" json:"addresses"`
	BankAccounts []UserBankAccount `gorm:"foreignKey:UserID" json:"bank_accounts"`
	Documents    []UserDocument    `gorm:"foreignKey:UserID" json:"documents"`
	CreatedAt    time.Time         `json:"created_at"`
	UpdatedAt    time.Time         `json:"updated_at"`
}
