package handler

import (
	"health-fix-api/models"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

var userMenuPermDB *gorm.DB

func SetUserMenuPermDB(db *gorm.DB) {
	userMenuPermDB = db
}

func GetUserMenuPermissions(c *fiber.Ctx) error {
	userID := c.QueryInt("user_id")
	var perms []models.UserMenuPermission

	userMenuPermDB.Preload("Menu").Where("user_id = ?", userID).Find(&perms)

	return c.JSON(perms)
}

func SaveUserMenuPermission(c *fiber.Ctx) error {
	var req models.UserMenuPermission

	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
	}

	err := userMenuPermDB.
		Where("user_id = ? AND menu_id = ?", req.UserID, req.MenuID).
		Assign(req).
		FirstOrCreate(&req).Error

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(req)
}

func DeleteUserMenuPermission(c *fiber.Ctx) error {
	id := c.Params("id")

	if err := userMenuPermDB.Delete(&models.UserMenuPermission{}, id).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.SendStatus(204)
}
