package seeds

import (
	"fmt"
	"log"
	"strconv"
	"strings"

	"health-fix-api/initializers"
	"health-fix-api/models"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

const representativeInitialPassword = "123456"

// SeedRepresentativeUsers ensures every representative has one linked login user.
// Existing users with the same email, mobile number, or user code are linked
// instead of duplicated.
func SeedRepresentativeUsers() {
	var representatives []models.RepresentativeMaster
	if err := initializers.DB.Find(&representatives).Error; err != nil {
		log.Printf("SeedRepresentativeUsers: load representatives: %v", err)
		return
	}

	var userRole models.Role
	if err := initializers.DB.Where("role_name = ?", "User").First(&userRole).Error; err != nil {
		log.Printf("SeedRepresentativeUsers: User role not found: %v", err)
		return
	}

	passwordHash, err := bcrypt.GenerateFromPassword(
		[]byte(representativeInitialPassword),
		bcrypt.DefaultCost,
	)
	if err != nil {
		log.Printf("SeedRepresentativeUsers: hash initial password: %v", err)
		return
	}

	created := 0
	linked := 0
	skipped := 0

	for i := range representatives {
		rep := &representatives[i]
		result, err := ensureRepresentativeUser(initializers.DB, rep, userRole.ID, string(passwordHash))
		if err != nil {
			skipped++
			log.Printf("SeedRepresentativeUsers: representative %d (%s): %v", rep.ID, rep.Name, err)
			continue
		}

		switch result {
		case "created":
			created++
		case "linked":
			linked++
		}
	}

	fmt.Printf(
		"Representative users synced: %d created, %d existing linked, %d skipped (initial password: %s)\n",
		created,
		linked,
		skipped,
		representativeInitialPassword,
	)
}

func ensureRepresentativeUser(db *gorm.DB, rep *models.RepresentativeMaster, roleID uint, passwordHash string) (string, error) {
	var user models.User
	result := db.Where("representative_id = ?", rep.ID).Limit(1).Find(&user)
	if result.Error != nil {
		return "", result.Error
	}
	if result.RowsAffected > 0 {
		return "existing", ensureUserRole(db, user.ID, roleID)
	}

	email := strings.TrimSpace(strings.ToLower(rep.Email))
	if email == "" {
		email = fmt.Sprintf("representative-%d@healthfix.local", rep.ID)
	}

	mobile := strings.TrimSpace(rep.Mobile)
	if mobile == "" {
		mobile = "REP-" + strconv.FormatUint(uint64(rep.ID), 10)
	}

	code := strings.TrimSpace(rep.Code)
	var codePtr *string
	if code != "" {
		codePtr = &code
	}

	query := db.Model(&models.User{}).Where("LOWER(email) = ? OR mobile_number = ?", email, mobile)
	if code != "" {
		query = query.Or("usercode = ?", code)
	}
	result = query.Limit(1).Find(&user)
	if result.Error != nil {
		return "", result.Error
	}
	if result.RowsAffected > 0 {
		if user.RepresentativeID == nil || *user.RepresentativeID == rep.ID {
			if err := db.Model(&user).Update("representative_id", rep.ID).Error; err != nil {
				return "", err
			}
			return "linked", ensureUserRole(db, user.ID, roleID)
		}
	}

	// Duplicate representative contact data cannot be used by two users because
	// these columns are unique. Preserve it on the first account and generate
	// stable fallback login values for later duplicates.
	email, err := uniqueRepresentativeValue(
		db,
		"LOWER(email) = ?",
		email,
		fmt.Sprintf("representative-%d@healthfix.local", rep.ID),
	)
	if err != nil {
		return "", err
	}
	mobile, err = uniqueRepresentativeValue(
		db,
		"mobile_number = ?",
		mobile,
		"REP-"+strconv.FormatUint(uint64(rep.ID), 10),
	)
	if err != nil {
		return "", err
	}
	if code != "" {
		var count int64
		if err := db.Model(&models.User{}).Where("usercode = ?", code).Count(&count).Error; err != nil {
			return "", err
		}
		if count > 0 {
			codePtr = nil
		}
	}

	firstname, lastname := splitRepresentativeName(rep.Name)
	active := !strings.EqualFold(strings.TrimSpace(rep.Status), "inactive")
	user = models.User{
		Usercode:         codePtr,
		Firstname:        firstname,
		Lastname:         lastname,
		MobileNumber:     mobile,
		Email:            email,
		Password:         passwordHash,
		Active:           active,
		IsUser:           true,
		IsEmployee:       true,
		RepresentativeID: &rep.ID,
	}

	if err := db.Create(&user).Error; err != nil {
		return "", err
	}
	if err := ensureUserRole(db, user.ID, roleID); err != nil {
		return "", err
	}

	return "created", nil
}

func uniqueRepresentativeValue(db *gorm.DB, condition, preferred, fallback string) (string, error) {
	var count int64
	if err := db.Model(&models.User{}).Where(condition, preferred).Count(&count).Error; err != nil {
		return "", err
	}
	if count == 0 {
		return preferred, nil
	}

	if err := db.Model(&models.User{}).Where(condition, fallback).Count(&count).Error; err != nil {
		return "", err
	}
	if count > 0 {
		return "", fmt.Errorf("generated login value %q is already in use", fallback)
	}
	return fallback, nil
}

func ensureUserRole(db *gorm.DB, userID, roleID uint) error {
	var mapping models.UserRoleMapping
	result := db.Where("user_id = ? AND role_id = ?", userID, roleID).Limit(1).Find(&mapping)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected > 0 {
		return nil
	}

	return db.Create(&models.UserRoleMapping{
		UserID: userID,
		RoleID: roleID,
	}).Error
}

func splitRepresentativeName(name string) (string, string) {
	parts := strings.Fields(name)
	if len(parts) == 0 {
		return "Representative", ""
	}
	if len(parts) == 1 {
		return parts[0], ""
	}
	return parts[0], strings.Join(parts[1:], " ")
}
