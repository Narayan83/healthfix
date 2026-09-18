package handler

import (
	"strconv"

	"health-fix-api/auditlog"
	"health-fix-api/models"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

var rolesDB *gorm.DB

func SetRolesDB(db *gorm.DB) {
	rolesDB = db
}

func GetAllRoles(c *fiber.Ctx) error {
	var roles []models.Role
	var total int64

	page := c.QueryInt("page", 1)
	limit := c.QueryInt("limit", 10)
	filter := c.Query("filter")

	offset := (page - 1) * limit

	query := rolesDB.Model(&models.Role{})
	if filter != "" {
		query = query.Where("role_name ILIKE ? OR description ILIKE ?", "%"+filter+"%", "%"+filter+"%")
	}

	query.Count(&total)
	query.Limit(limit).Offset(offset).Order("role_name").Find(&roles)

	return c.JSON(fiber.Map{
		"data": roles,
		"page": page, "limit": limit, "total": total,
	})
}

func GetRoleByID(c *fiber.Ctx) error {
	id := c.Params("id")
	var role models.Role

	if err := rolesDB.First(&role, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Role not found"})
	}
	return c.JSON(role)
}

func CreateRole(c *fiber.Ctx) error {
	var role models.Role
	if err := c.BodyParser(&role); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
	}

	if role.RoleName == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Role name is required"})
	}

	if err := rolesDB.Create(&role).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	auditlog.RecordCreate(rolesDB, c, "role", strconv.FormatUint(uint64(role.ID), 10), role)

	return c.Status(201).JSON(role)
}

func UpdateRole(c *fiber.Ctx) error {
	id := c.Params("id")
	var role models.Role
	if err := rolesDB.First(&role, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Role not found"})
	}
	oldCopy := role

	var updateData models.Role
	if err := c.BodyParser(&updateData); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
	}

	rolesDB.Model(&role).Updates(updateData)
	rolesDB.First(&role, id)
	auditlog.RecordUpdate(rolesDB, c, "role", id, oldCopy, role)
	return c.JSON(role)
}

func DeleteRole(c *fiber.Ctx) error {
	id := c.Params("id")
	var role models.Role

	if err := rolesDB.First(&role, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Role not found"})
	}

	rolesDB.Delete(&role)
	auditlog.RecordDelete(rolesDB, c, "role", id, role)
	return c.SendStatus(204)
}
