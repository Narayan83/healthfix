package models

type UserAddress struct {
	ID       uint   `gorm:"primaryKey" json:"id"`
	UserID   uint   `json:"user_id"`
	Title    string `json:"title"` // Home, Office, Billing, Shipping
	Address1 string `json:"address1"`
	Address2 string `json:"address2"`
	City     string `json:"city"`
	State    string `json:"state"`
	Country  string `json:"country"`
	Pincode  string `json:"pincode"`
}
