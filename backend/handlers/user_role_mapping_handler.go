package handler

import (
	"health-fix-api/models"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

var userRoleDB *gorm.DB

func SetUserRoleDB(db *gorm.DB) {
	userRoleDB = db
}

func GetUserRoles(c *fiber.Ctx) error {
	userID := c.QueryInt("user_id")
	var mapping []models.UserRoleMapping

	userRoleDB.Preload("Role").
		Where("user_id = ?", userID).
		Order("priority desc").
		Find(&mapping)

	return c.JSON(mapping)
}

func AssignRoleToUser(c *fiber.Ctx) error {
	var req models.UserRoleMapping
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
	}

	err := userRoleDB.
		Where("user_id = ? AND role_id = ?", req.UserID, req.RoleID).
		Assign(req).
		FirstOrCreate(&req).Error

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(req)
}

func RemoveRoleFromUser(c *fiber.Ctx) error {
	id := c.Params("id")

	var record models.UserRoleMapping
	if err := userRoleDB.First(&record, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "User role not found"})
	}

	userRoleDB.Delete(&record)
	return c.SendStatus(204)
}
