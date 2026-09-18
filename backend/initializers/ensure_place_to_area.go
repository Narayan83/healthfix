package initializers

import "log"

// EnsurePlaceToAreaMigration renames legacy place tables/columns and menu entries to area.
func EnsurePlaceToAreaMigration() {
	if DB == nil {
		return
	}

	if DB.Migrator().HasTable("place_masters") && !DB.Migrator().HasTable("area_masters") {
		if err := DB.Exec(`ALTER TABLE place_masters RENAME TO area_masters`).Error; err != nil {
			log.Printf("EnsurePlaceToAreaMigration: rename place_masters: %v", err)
		} else {
			log.Println("EnsurePlaceToAreaMigration: renamed place_masters to area_masters")
		}
	}

	if DB.Migrator().HasTable("doctor_masters") && DB.Migrator().HasColumn("doctor_masters", "place_id") {
		if !DB.Migrator().HasColumn("doctor_masters", "area_id") {
			if err := DB.Exec(`ALTER TABLE doctor_masters RENAME COLUMN place_id TO area_id`).Error; err != nil {
				log.Printf("EnsurePlaceToAreaMigration: rename place_id: %v", err)
			} else {
				log.Println("EnsurePlaceToAreaMigration: renamed doctor_masters.place_id to area_id")
			}
		}
	}

	if err := DB.Exec(`
		UPDATE menus
		SET menu_name = 'Head Quarter Master', url = '/head-quarter-master'
		WHERE menu_name IN ('Place Master', 'Area Master')
		   OR url IN ('/place-master', '/Place-master', '/area-master')
	`).Error; err != nil {
		log.Printf("EnsurePlaceToAreaMigration: update menus: %v", err)
	}
}
