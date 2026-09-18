package handler

import (
	"health-fix-api/models"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

var rmDB *gorm.DB

func SetRoleManagementDB(db *gorm.DB) {
	rmDB = db
	rolemanageDB = db
}

func GetRoleMenuPermissions(c *fiber.Ctx) error {
	roleID := c.QueryInt("role_id")

	var mappings []models.RoleManagement
	query := rmDB.Preload("Menu").Where("role_id = ?", roleID)

	query.Find(&mappings)
	return c.JSON(mappings)
}

func SaveRoleMenuPermission(c *fiber.Ctx) error {
	var data models.RoleManagement

	if err := c.BodyParser(&data); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
	}

	// Upsert
	err := rmDB.Where("role_id = ? AND menu_id = ?", data.RoleID, data.MenuID).
		Assign(data).
		FirstOrCreate(&data).Error

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(data)
}

func DeleteRoleMenuPermission(c *fiber.Ctx) error {
	id := c.Params("id")

	var record models.RoleManagement
	if err := rmDB.First(&record, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Record not found"})
	}

	rmDB.Delete(&record)
	return c.SendStatus(204)
}
