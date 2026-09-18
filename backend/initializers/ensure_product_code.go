package initializers

import (
	"fmt"
	"log"

	"health-fix-api/models"
)

const productCodeIndex = "idx_product_masters_product_code"

// EnsureProductMasterProductCode adds product_code safely when the table already has rows.
// Run before AutoMigrate on ProductMaster.
func EnsureProductMasterProductCode() {
	if DB == nil {
		return
	}
	if !DB.Migrator().HasTable(&models.ProductMaster{}) {
		return
	}

	if !DB.Migrator().HasColumn(&models.ProductMaster{}, "ProductCode") {
		if err := DB.Exec(`ALTER TABLE product_masters ADD COLUMN product_code varchar(64)`).Error; err != nil {
			log.Printf("EnsureProductMasterProductCode: add column: %v", err)
			return
		}
		log.Println("EnsureProductMasterProductCode: added product_code column")
	}

	if err := DB.Exec(`
		UPDATE product_masters
		SET product_code = 'PRD-' || id::text
		WHERE product_code IS NULL OR TRIM(product_code) = ''
	`).Error; err != nil {
		log.Printf("EnsureProductMasterProductCode: backfill: %v", err)
		return
	}

	if err := DB.Exec(`ALTER TABLE product_masters ALTER COLUMN product_code SET NOT NULL`).Error; err != nil {
		log.Printf("EnsureProductMasterProductCode: set not null: %v", err)
		return
	}

	if !DB.Migrator().HasIndex(&models.ProductMaster{}, productCodeIndex) {
		if err := DB.Exec(fmt.Sprintf(
			`CREATE UNIQUE INDEX IF NOT EXISTS %s ON product_masters (LOWER(product_code))`,
			productCodeIndex,
		)).Error; err != nil {
			log.Printf("EnsureProductMasterProductCode: unique index: %v", err)
			return
		}
		log.Println("EnsureProductMasterProductCode: unique index ready")
	}
}
