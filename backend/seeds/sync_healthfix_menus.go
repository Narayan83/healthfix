package seeds

import (
	"fmt"
	"log"

	"gorm.io/gorm"
	"health-fix-api/models"
	"health-fix-api/rolemenu"
)

// SyncHealthFixMenuCatalog deactivates ERP/extra menus and ensures HealthFix defaults exist.
func SyncHealthFixMenuCatalog(db *gorm.DB) error {
	allow := healthFixMenuURLs()

	if err := db.Model(&models.Menu{}).
		Where("url != '' AND url NOT IN ?", allow).
		Update("is_active", false).Error; err != nil {
		return err
	}

	if err := db.Model(&models.Menu{}).
		Where("url IN ?", allow).
		Update("is_active", true).Error; err != nil {
		return err
	}

	var inactiveParentIDs []uint
	if err := db.Model(&models.Menu{}).Where("is_active = ?", false).Pluck("id", &inactiveParentIDs).Error; err != nil {
		return err
	}
	if len(inactiveParentIDs) > 0 {
		if err := db.Model(&models.Menu{}).
			Where("parent_id IN ?", inactiveParentIDs).
			Update("is_active", false).Error; err != nil {
			return err
		}
	}

	seedHardcodedMenuRoots(db)
	ensureHealthFixChildMenus(db)
	pruneStaleChildMenus(db)

	if err := rolemenu.SyncRemoveOrphanedPermissionKeys(db); err != nil {
		log.Printf("SyncRemoveOrphanedPermissionKeys: %v", err)
	}
	return nil
}

func ensureHealthFixChildMenus(db *gorm.DB) {
	for _, root := range menuSeedHardcodedDefaults() {
		var parent models.Menu
		q := db.Where("parent_id IS NULL")
		if root.URL != "" {
			q = q.Where("url = ?", root.URL)
		} else {
			q = q.Where("menu_name = ?", root.MenuName)
		}
		if err := q.First(&parent).Error; err != nil {
			continue
		}
		for _, ch := range root.Children {
			if ch.URL == "" {
				continue
			}
			var existing models.Menu
			r := db.Where("url = ?", ch.URL).Limit(1).Find(&existing)
			if r.Error != nil {
				continue
			}
			updates := map[string]interface{}{
				"menu_name": ch.MenuName,
				"is_active": true,
				"icon":      ch.Icon,
				"menu_type": "main",
			}
			if r.RowsAffected > 0 {
				_ = db.Model(&existing).Updates(updates).Error
				continue
			}
			ch.ParentID = &parent.ID
			if err := db.Create(&ch).Error; err != nil {
				log.Printf("ensureHealthFixChildMenus: %s: %v", ch.MenuName, err)
			} else {
				fmt.Printf("Seeded child menu: %s\n", ch.MenuName)
			}
		}
	}
}

func pruneStaleChildMenus(db *gorm.DB) {
	for _, root := range menuSeedHardcodedDefaults() {
		if len(root.Children) == 0 {
			continue
		}
		var parent models.Menu
		q := db.Where("parent_id IS NULL")
		if root.URL != "" {
			q = q.Where("url = ?", root.URL)
		} else {
			q = q.Where("menu_name = ?", root.MenuName)
		}
		if err := q.First(&parent).Error; err != nil {
			continue
		}
		expected := make([]string, 0, len(root.Children))
		for _, ch := range root.Children {
			if ch.URL != "" {
				expected = append(expected, ch.URL)
			}
		}
		if len(expected) == 0 {
			continue
		}
		_ = db.Model(&models.Menu{}).
			Where("parent_id = ? AND url != '' AND url NOT IN ?", parent.ID, expected).
			Update("is_active", false).Error
	}
}
