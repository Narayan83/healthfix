package main

import (
	"health-fix-api/initializers"
	"health-fix-api/models"
	"log"
)

func init() {
	initializers.LoadEnviromentVariables()
	initializers.ConnectToDb()
}

func main() {
	err := initializers.DB.AutoMigrate(
		&models.User{},
		&models.Role{},
		&models.RoleManagement{},
		&models.Menu{},
		&models.UserAddress{},
		&models.UserBankAccount{},
		&models.UserDocument{},
		&models.UserRoleMapping{},
		&models.UserMenuPermission{},
		&models.AuditLog{},
	)

	if err != nil {
		log.Fatal("Migration failed:", err)
	}

	log.Println("Migration completed successfully")
}
