package handler

import (
	"strconv"

	"health-fix-api/auditlog"
	"health-fix-api/models"
	"health-fix-api/rolemenu"
	"health-fix-api/seeds"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

func syncMenusSeedFile(db *gorm.DB) {
	_ = seeds.SaveMenusSeedJSONFromDB(db)
}

var menusDB *gorm.DB

func SetMenusDB(db *gorm.DB) {
	menusDB = db
}

func GetAllMenus(c *fiber.Ctx) error {
	var items []models.Menu
	var total int64

	page := c.QueryInt("page", 1)
	limit := c.QueryInt("limit", 10)
	filter := c.Query("filter")
	menuType := c.Query("menu_type")
	isActive := c.Query("is_active")

	if page < 1 {
		page = 1
	}
	offset := (page - 1) * limit

	query := menusDB.Model(&models.Menu{}).Preload("Children")

	if filter != "" {
		query = query.Where("menu_name ILIKE ? OR description ILIKE ?", "%"+filter+"%", "%"+filter+"%")
	}

	if menuType != "" {
		query = query.Where("menu_type = ?", menuType)
	}

	if isActive != "" {
		if isActive == "true" {
			query = query.Where("is_active = ?", true)
		} else if isActive == "false" {
			query = query.Where("is_active = ?", false)
		}
	}

	if err := query.Count(&total).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to count records"})
	}

	if err := query.Order("menu_type, sort_order, menu_name").
		Limit(limit).
		Offset(offset).
		Find(&items).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{
		"data":  items,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

func GetMenuByID(c *fiber.Ctx) error {
	id := c.Params("id")
	var item models.Menu

	if err := menusDB.Preload("Children").First(&item, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Menu not found"})
	}
	return c.JSON(item)
}

func CreateMenu(c *fiber.Ctx) error {
	var item models.Menu

	if err := c.BodyParser(&item); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
	}
	if item.MenuName == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Menu name is required"})
	}

	if err := menusDB.Create(&item).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	if err := menusDB.Preload("Children").First(&item, item.ID).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to load created menu"})
	}

	_ = rolemenu.ExportMenusJSONFile(menusDB, rolemenu.MenusExportPath())
	syncMenusSeedFile(menusDB)
	auditlog.RecordCreate(menusDB, c, "menu", strconv.FormatUint(uint64(item.ID), 10), item)

	return c.Status(201).JSON(item)
}

func UpdateMenu(c *fiber.Ctx) error {
	id := c.Params("id")
	var item models.Menu

	if err := menusDB.First(&item, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Menu not found"})
	}
	oldCopy := item

	var updateData models.Menu
	if err := c.BodyParser(&updateData); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
	}

	if err := menusDB.Model(&item).Updates(updateData).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	if err := menusDB.Preload("Children").First(&item, id).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to load updated menu"})
	}

	_ = rolemenu.ExportMenusJSONFile(menusDB, rolemenu.MenusExportPath())
	syncMenusSeedFile(menusDB)
	auditlog.RecordUpdate(menusDB, c, "menu", id, oldCopy, item)

	return c.JSON(item)
}

func DeleteMenu(c *fiber.Ctx) error {
	id := c.Params("id")
	idUint, err := strconv.ParseUint(id, 10, 64)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid menu id"})
	}

	var item models.Menu
	if err := menusDB.First(&item, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Menu not found"})
	}

	if err := rolemenu.DeleteMenusSubtree(menusDB, uint(idUint)); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	_ = rolemenu.ExportMenusJSONFile(menusDB, rolemenu.MenusExportPath())
	syncMenusSeedFile(menusDB)
	auditlog.RecordDelete(menusDB, c, "menu", id, item)

	return c.SendStatus(204)
}

func GetMenuTree(c *fiber.Ctx) error {
	menuType := c.Query("menu_type", "main")
	isActive := c.QueryBool("is_active", true)

	var items []models.Menu
	query := menusDB.Where("parent_id IS NULL AND menu_type = ? AND is_active = ?", menuType, isActive).
		Preload("Children", func(db *gorm.DB) *gorm.DB {
			return db.Where("is_active = ?", isActive).Order("sort_order, menu_name")
		}).
		Order("sort_order, menu_name")

	if err := query.Find(&items).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(items)
}

func ReorderMenus(c *fiber.Ctx) error {
	type MenuOrder struct {
		ID        uint `json:"id"`
		SortOrder int  `json:"sort_order"`
	}

	var orders []MenuOrder
	if err := c.BodyParser(&orders); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
	}

	tx := menusDB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	for _, order := range orders {
		if err := tx.Model(&models.Menu{}).
			Where("id = ?", order.ID).
			Update("sort_order", order.SortOrder).Error; err != nil {
			tx.Rollback()
			return c.Status(500).JSON(fiber.Map{"error": err.Error()})
		}
	}

	if err := tx.Commit().Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	_ = rolemenu.ExportMenusJSONFile(menusDB, rolemenu.MenusExportPath())
	syncMenusSeedFile(menusDB)

	return c.JSON(fiber.Map{"message": "Menus reordered successfully"})
}

// MoveMenu changes a menu's parent and places it last under the new parent.
// Walking the target's ancestors prevents a menu from being moved below itself.
func MoveMenu(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid menu id"})
	}

	var input struct {
		ParentID *uint `json:"parent_id"`
	}
	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
	}
	if input.ParentID != nil && uint(id) == *input.ParentID {
		return c.Status(400).JSON(fiber.Map{"error": "A menu cannot be its own parent"})
	}

	var item models.Menu
	if err := menusDB.First(&item, uint(id)).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Menu not found"})
	}

	if input.ParentID != nil {
		var parent models.Menu
		if err := menusDB.First(&parent, *input.ParentID).Error; err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "Parent menu not found"})
		}

		current := &parent
		for current.ParentID != nil {
			if *current.ParentID == item.ID {
				return c.Status(400).JSON(fiber.Map{"error": "A menu cannot be moved inside one of its children"})
			}
			var ancestor models.Menu
			if err := menusDB.First(&ancestor, *current.ParentID).Error; err != nil {
				return c.Status(400).JSON(fiber.Map{"error": "Invalid parent hierarchy"})
			}
			current = &ancestor
		}
	}

	tx := menusDB.Begin()
	if tx.Error != nil {
		return c.Status(500).JSON(fiber.Map{"error": tx.Error.Error()})
	}

	var maxOrder int
	orderQuery := tx.Model(&models.Menu{}).Select("COALESCE(MAX(sort_order), 0)")
	if input.ParentID == nil {
		orderQuery = orderQuery.Where("parent_id IS NULL")
	} else {
		orderQuery = orderQuery.Where("parent_id = ?", *input.ParentID)
	}
	if err := orderQuery.Scan(&maxOrder).Error; err != nil {
		tx.Rollback()
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	if err := tx.Model(&item).Updates(map[string]interface{}{
		"parent_id":  input.ParentID,
		"sort_order": maxOrder + 1,
	}).Error; err != nil {
		tx.Rollback()
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	if err := tx.Commit().Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	_ = rolemenu.ExportMenusJSONFile(menusDB, rolemenu.MenusExportPath())
	syncMenusSeedFile(menusDB)
	auditlog.RecordUpdate(menusDB, c, "menu", c.Params("id"), item, fiber.Map{
		"parent_id":  input.ParentID,
		"sort_order": maxOrder + 1,
	})

	return c.JSON(fiber.Map{"message": "Menu moved successfully"})
}
