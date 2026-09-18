package handler

import (
	"errors"
	"health-fix-api/models"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

var userDB *gorm.DB

func SetUserDB(db *gorm.DB) {
	userDB = db
}

type ChangePasswordRequest struct {
	Password        string `json:"password"`
	PasswordConfirm string `json:"password_confirm"`
}

type ChangeMyPasswordRequest struct {
	OldPassword     string `json:"old_password"`
	Password        string `json:"password"`
	PasswordConfirm string `json:"password_confirm"`
}

type CreateUserRequest struct {
	Usercode     *string `json:"usercode"`
	Salutation   *string `json:"salutation"`
	Firstname    string  `json:"firstname"`
	Lastname     string  `json:"lastname"`
	DOB          *string `json:"dob"`
	Gender       string  `json:"gender"`
	CountryCode  string  `json:"country_code"`
	MobileNumber string  `json:"mobile_number"`
	Email        string  `json:"email"`
	Password        string `json:"password"`
	PasswordConfirm string `json:"password_confirm"`

	IsUser        bool `json:"is_user"`
	IsCustomer    bool `json:"is_customer"`
	IsSupplier    bool `json:"is_supplier"`
	IsEmployee    bool `json:"is_employee"`
	IsDealer      bool `json:"is_dealer"`
	IsDistributor bool `json:"is_distributor"`

	RepresentativeID *uint `json:"representative_id"`
	Active           *bool `json:"active"`
}

type UpdateUserRequest struct {
	Salutation   *string `json:"salutation"`
	Firstname    *string `json:"firstname"`
	Lastname     *string `json:"lastname"`
	MobileNumber *string `json:"mobile_number"`
	Email        *string `json:"email"`
	Password     *string `json:"password"`
	Gender       *string `json:"gender"`
	RepresentativeID *uint `json:"representative_id"`
	Active           *bool `json:"active"`
}

func hashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(bytes), err
}

func validatePasswordPair(password, confirm string) error {
	if password == "" {
		return errors.New("Password is required")
	}
	if len(password) < 6 {
		return errors.New("Password must be at least 6 characters")
	}
	if password != confirm {
		return errors.New("Passwords do not match")
	}
	return nil
}

func CreateUser(c *fiber.Ctx) error {
	var body CreateUserRequest

	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid Request"})
	}

	if err := validatePasswordPair(body.Password, body.PasswordConfirm); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	hashedPassword, err := hashPassword(body.Password)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Password encryption failed"})
	}

	user := models.User{
		Usercode:      body.Usercode,
		Salutation:    body.Salutation,
		Firstname:     body.Firstname,
		Lastname:      body.Lastname,
		CountryCode:   body.CountryCode,
		MobileNumber:  body.MobileNumber,
		Email:         body.Email,
		Password:      hashedPassword,
		Gender:        models.Gender(body.Gender),
		IsUser:        body.IsUser,
		IsCustomer:    body.IsCustomer,
		IsSupplier:    body.IsSupplier,
		IsEmployee:    body.IsEmployee,
		IsDealer:         body.IsDealer,
		IsDistributor:    body.IsDistributor,
	}
	if body.RepresentativeID != nil && *body.RepresentativeID > 0 {
		user.RepresentativeID = body.RepresentativeID
	}
	if body.Active != nil {
		user.Active = *body.Active
	} else {
		user.Active = true
	}
	if user.IsUser == false && user.IsCustomer == false && user.IsSupplier == false &&
		user.IsEmployee == false && user.IsDealer == false && user.IsDistributor == false {
		user.IsUser = true
	}

	if err := userDB.Create(&user).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(201).JSON(user)
}

func GetUsers(c *fiber.Ctx) error {
	search := c.Query("search")

	var users []models.User
	query := userDB.Model(&models.User{})

	if search != "" {
		query = query.Where("firstname ILIKE ? OR lastname ILIKE ? OR email ILIKE ? OR mobile_number ILIKE ?",
			"%"+search+"%", "%"+search+"%", "%"+search+"%", "%"+search+"%")
	}

	if err := query.
		Preload("Representative").
		Preload("Addresses").
		Preload("BankAccounts").
		Preload("Documents").
		Find(&users).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(users)
}

func GetUser(c *fiber.Ctx) error {
	id := c.Params("id")

	var user models.User
	err := userDB.Preload("Representative").
		Preload("Addresses").
		Preload("BankAccounts").
		Preload("Documents").
		First(&user, id).Error

	if errors.Is(err, gorm.ErrRecordNotFound) {
		return c.Status(404).JSON(fiber.Map{"error": "User not found"})
	}

	return c.JSON(user)
}

func UpdateUser(c *fiber.Ctx) error {
	id := c.Params("id")

	var body UpdateUserRequest
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	var user models.User
	if err := userDB.First(&user, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "User not found"})
	}

	updateData := map[string]interface{}{}

	if body.Firstname != nil {
		updateData["firstname"] = *body.Firstname
	}
	if body.Lastname != nil {
		updateData["lastname"] = *body.Lastname
	}
	if body.Email != nil {
		updateData["email"] = *body.Email
	}
	if body.MobileNumber != nil {
		updateData["mobile_number"] = *body.MobileNumber
	}

	if body.Gender != nil {
		updateData["gender"] = *body.Gender
	}
	if body.RepresentativeID != nil {
		if *body.RepresentativeID == 0 {
			updateData["representative_id"] = nil
		} else {
			updateData["representative_id"] = *body.RepresentativeID
		}
	}
	if body.Active != nil {
		updateData["active"] = *body.Active
	}

	if len(updateData) > 0 {
		updateData["updated_at"] = time.Now()
		userDB.Model(&user).Updates(updateData)
	}

	return c.JSON(user)
}

func ChangeMyPassword(c *fiber.Ctx) error {
	userID, err := parseLocalUserID(c.Locals("user_id"))
	if err != nil {
		return c.Status(401).JSON(fiber.Map{"error": "Unauthorized"})
	}

	var body ChangeMyPasswordRequest
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	body.OldPassword = strings.TrimSpace(body.OldPassword)
	body.Password = strings.TrimSpace(body.Password)
	body.PasswordConfirm = strings.TrimSpace(body.PasswordConfirm)

	if body.OldPassword == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Current password is required"})
	}

	if err := validatePasswordPair(body.Password, body.PasswordConfirm); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	if body.OldPassword == body.Password {
		return c.Status(400).JSON(fiber.Map{"error": "New password must be different from current password"})
	}

	var user models.User
	if err := userDB.First(&user, userID).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "User not found"})
	}

	if !verifyUserPassword(&user, body.OldPassword) {
		return c.Status(400).JSON(fiber.Map{"error": "Current password is incorrect"})
	}

	hashed, err := hashPassword(body.Password)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Password encryption failed"})
	}

	user.Password = hashed
	user.PlainPassword = ""
	if err := userDB.Save(&user).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"message": "Password changed successfully"})
}

func ChangeUserPassword(c *fiber.Ctx) error {
	id := c.Params("id")

	var body ChangePasswordRequest
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	if err := validatePasswordPair(body.Password, body.PasswordConfirm); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	var user models.User
	if err := userDB.First(&user, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "User not found"})
	}

	hashed, err := hashPassword(body.Password)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Password encryption failed"})
	}

	if err := userDB.Model(&user).Updates(map[string]interface{}{
		"password":   hashed,
		"updated_at": time.Now(),
	}).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"message": "Password updated successfully"})
}

func DeleteUser(c *fiber.Ctx) error {
	id := c.Params("id")

	if err := userDB.Delete(&models.User{}, id).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"message": "User soft-deleted"})
}

func RestoreUser(c *fiber.Ctx) error {
	id := c.Params("id")

	if err := userDB.Unscoped().Model(&models.User{}).
		Where("id = ?", id).
		Update("deleted_at", nil).Error; err != nil {

		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"message": "User restored"})
}

func ForceDeleteUser(c *fiber.Ctx) error {
	id := c.Params("id")

	if err := userDB.Unscoped().Delete(&models.User{}, id).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"message": "User permanently deleted"})
}
