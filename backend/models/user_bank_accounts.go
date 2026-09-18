package models

type UserBankAccount struct {
	ID            uint   `gorm:"primaryKey" json:"id"`
	UserID        uint   `json:"user_id"`
	BankName      string `json:"bank_name"`
	BranchName    string `json:"branch_name"`
	BranchAddress string `json:"branch_address"`
	AccountNumber string `json:"account_number"`
	IFSCCode      string `json:"ifsc_code"`
}
