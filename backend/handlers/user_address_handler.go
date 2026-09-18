package handler

import (
	"health-fix-api/models"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

var userAddressDB *gorm.DB

func SetUserAddressDB(db *gorm.DB) {
	userAddressDB = db
}

type CreateUserAddressRequest struct {
	UserID   uint   `json:"user_id"`
	Title    string `json:"title"`
	Address1 string `json:"address1"`
	Address2 string `json:"address2"`
	City     string `json:"city"`
	State    string `json:"state"`
	Country  string `json:"country"`
	Pincode  string `json:"pincode"`
}

type UpdateUserAddressRequest struct {
	Title    *string `json:"title"`
	Address1 *string `json:"address1"`
	Address2 *string `json:"address2"`
	City     *string `json:"city"`
	State    *string `json:"state"`
	Country  *string `json:"country"`
	Pincode  *string `json:"pincode"`
}

func CreateUserAddress(c *fiber.Ctx) error {
	var body CreateUserAddressRequest
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	// ensure user exists
	var user models.User
	if err := userAddressDB.First(&user, body.UserID).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "User not found"})
	}

	addr := models.UserAddress{
		UserID:   body.UserID,
		Title:    body.Title,
		Address1: body.Address1,
		Address2: body.Address2,
		City:     body.City,
		State:    body.State,
		Country:  body.Country,
		Pincode:  body.Pincode,
	}

	if err := userAddressDB.Create(&addr).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(201).JSON(addr)
}

func GetUserAddresses(c *fiber.Ctx) error {
	var addresses []models.UserAddress
	var total int64

	page := c.QueryInt("page", 1)
	limit := c.QueryInt("limit", 10)
	search := c.Query("search")
	userID := c.Query("user_id")

	offset := (page - 1) * limit
	query := userAddressDB.Model(&models.UserAddress{})

	if search != "" {
		query = query.Where("title ILIKE ? OR city ILIKE ? OR state ILIKE ? OR country ILIKE ? OR pincode ILIKE ?",
			"%"+search+"%", "%"+search+"%", "%"+search+"%", "%"+search+"%", "%"+search+"%")
	}

	if userID != "" {
		query = query.Where("user_id = ?", userID)
	}

	if err := query.Count(&total).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to count records"})
	}

	if err := query.Limit(limit).Offset(offset).Order("id desc").Find(&addresses).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{
		"data":  addresses,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

func GetUserAddress(c *fiber.Ctx) error {
	id := c.Params("id")

	var addr models.UserAddress
	if err := userAddressDB.First(&addr, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Address not found"})
	}

	return c.JSON(addr)
}

func UpdateUserAddress(c *fiber.Ctx) error {
	id := c.Params("id")

	var addr models.UserAddress
	if err := userAddressDB.First(&addr, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Address not found"})
	}

	var body UpdateUserAddressRequest
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	updateData := map[string]interface{}{}

	if body.Title != nil {
		updateData["title"] = *body.Title
	}
	if body.Address1 != nil {
		updateData["address1"] = *body.Address1
	}
	if body.Address2 != nil {
		updateData["address2"] = *body.Address2
	}
	if body.City != nil {
		updateData["city"] = *body.City
	}
	if body.State != nil {
		updateData["state"] = *body.State
	}
	if body.Country != nil {
		updateData["country"] = *body.Country
	}
	if body.Pincode != nil {
		updateData["pincode"] = *body.Pincode
	}

	userAddressDB.Model(&addr).Updates(updateData)

	return c.JSON(addr)
}

func DeleteUserAddress(c *fiber.Ctx) error {
	id := c.Params("id")

	if err := userAddressDB.Delete(&models.UserAddress{}, id).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"message": "Address deleted"})
}
