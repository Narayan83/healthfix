package models

import "time"

const (
	PromotionStockEntryAdd    = "add"
	PromotionStockEntryDeduct = "deduct"
)

type PromotionStockEntry struct {
	ID              uint                 `json:"id" gorm:"primaryKey"`
	PromotionItemID uint                 `json:"promotion_item_id" gorm:"not null;index"`
	PromotionItem   *PromotionItemMaster `json:"promotion_item,omitempty" gorm:"foreignKey:PromotionItemID"`
	EntryType       string               `json:"entry_type" gorm:"type:varchar(16);not null"` // add | deduct
	Quantity        float64              `json:"quantity" gorm:"not null"`
	Value           float64              `json:"value" gorm:"not null"`
	EntryDate       time.Time            `json:"entry_date" gorm:"type:date;not null"`
	Remarks         string               `json:"remarks"`
	CreatedAt       time.Time            `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt       time.Time            `json:"updated_at" gorm:"autoUpdateTime"`
}

// PromotionStockSummary is aggregated stock per promotion item (list view).
type PromotionStockSummary struct {
	PromotionItemID  uint    `json:"promotion_item_id"`
	ItemName         string  `json:"item_name"`
	BalanceQuantity  float64 `json:"balance_quantity"`
	BalanceValue     float64 `json:"balance_value"`
}
