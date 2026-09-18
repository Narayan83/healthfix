package main

import (
	"fmt"
	handler "health-fix-api/handlers"
	"health-fix-api/initializers"
	"health-fix-api/middleware"
	"health-fix-api/models"
	"health-fix-api/seeds"
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
)

func init() {
	initializers.LoadEnviromentVariables()
	initializers.ConnectToDb()
	initializers.EnsurePlaceToAreaMigration()

	if err := initializers.DB.AutoMigrate(
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
		&models.AreaMaster{},
		&models.DoctorMaster{},
		&models.ChemistMaster{},
		&models.StockistMaster{},
		&models.DesignationMaster{},
		&models.RepresentativeMaster{},
		&models.PromotionItemMaster{},
		&models.PromotionStockEntry{},
		&models.DailyCallReport{},
		&models.DailyCallReportPromotion{},
		&models.Order{},
		&models.OrderLine{},
	); err != nil {
		log.Fatalf("Failed to migrate tables: %v", err)
	}

	initializers.EnsureProductMasterProductCode()
	if err := initializers.DB.AutoMigrate(&models.ProductMaster{}); err != nil {
		log.Fatalf("Failed to migrate product_masters: %v", err)
	}
	initializers.EnsureAuditLogsTable()

	initializers.CreateRequiredDirectories()
	seeds.SeedAll()
}

func main() {
	fmt.Println("Hello welcome, main is runnings")

	handler.SetUserDB(initializers.DB)
	handler.SetRolesDB(initializers.DB)
	handler.SetRoleManagementDB(initializers.DB)
	handler.SetRolesManagementDB(initializers.DB)
	handler.SetMenusDB(initializers.DB)
	handler.SetUserMenuPermDB(initializers.DB)
	handler.SetUserRoleDB(initializers.DB)
	handler.SetUserAddressDB(initializers.DB)
	handler.SetUserBankDB(initializers.DB)
	handler.SetUserDocumentDB(initializers.DB)
	handler.SetAuditLogDB(initializers.DB)
	handler.SetMasterDB(initializers.DB)
	handler.SetTransactionDB(initializers.DB)
	initializers.EnsureAuditLogsTable()

	app := fiber.New()

	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		AllowMethods: "GET,POST,PUT,PATCH,DELETE,OPTIONS",
	}))

	app.Static("/uploads", "./uploads")

	app.Get("/api", func(c *fiber.Ctx) error {
		return c.SendString("Welcome to the Healthfix API!")
	})

	api := app.Group("/api")

	api.Post("/login", handler.Login)
	api.Get("/debug/login-check", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok"})
	})

	api.Use(middleware.Protected())

	api.Get("/my-menus", handler.GetCurrentUserMenuTree)
	api.Put("/change-password", handler.ChangeMyPassword)
	api.Post("/change-password", handler.ChangeMyPassword)
	api.Put("/me/password", handler.ChangeMyPassword)
	api.Post("/me/password", handler.ChangeMyPassword)

	//users
	api.Post("/users", handler.CreateUser)
	api.Get("/users", handler.GetUsers)
	api.Get("/users/:id", handler.GetUser)
	api.Put("/users/:id", handler.UpdateUser)
	api.Put("/users/:id/password", handler.ChangeUserPassword)
	api.Delete("/users/:id", handler.DeleteUser)
	api.Put("/users/restore/:id", handler.RestoreUser)
	api.Delete("/users/force/:id", handler.ForceDeleteUser)

	// user - addresses
	api.Post("/user-address", handler.CreateUserAddress)
	api.Get("/user-address", handler.GetUserAddresses)
	api.Get("/user-address/:id", handler.GetUserAddress)
	api.Put("/user-address/:id", handler.UpdateUserAddress)
	api.Delete("/user-address/:id", handler.DeleteUserAddress)

	//user-bank
	api.Post("/user-bank", handler.CreateUserBankAccount)
	api.Get("/user-bank", handler.GetUserBankAccounts)
	api.Get("/user-bank/:id", handler.GetUserBankAccount)
	api.Put("/user-bank/:id", handler.UpdateUserBankAccount)
	api.Delete("/user-bank/:id", handler.DeleteUserBankAccount)

	//user documents
	api.Post("/document", handler.CreateUserDocument)
	api.Get("/document", handler.GetUserDocuments)
	api.Get("/document/:id", handler.GetUserDocumentByID)
	api.Put("/document/:id", handler.UpdateUserDocument)
	api.Delete("/document/:id", handler.DeleteUserDocument)

	// menus (healthfix paths)
	api.Get("/menu", handler.GetAllMenus)
	api.Get("/menu/tree", handler.GetMenuTree)
	api.Post("/menu/reorder", handler.ReorderMenus)
	api.Get("/menu/:id", handler.GetMenuByID)
	api.Post("/menu", handler.CreateMenu)
	api.Patch("/menu/:id/move", handler.MoveMenu)
	api.Put("/menu/:id", handler.UpdateMenu)
	api.Delete("/menu/:id", handler.DeleteMenu)

	// menus (ERP-compatible paths)
	api.Get("/loadMenus", handler.GetAllMenus)
	api.Get("/menus/tree", handler.GetMenuTree)
	api.Patch("/menus/reorder", handler.ReorderMenus)
	api.Get("/menus/:id", handler.GetMenuByID)
	api.Post("/menus", handler.CreateMenu)
	api.Patch("/menus/:id/move", handler.MoveMenu)
	api.Put("/menus/:id", handler.UpdateMenu)
	api.Delete("/menus/:id", handler.DeleteMenu)

	//roles
	api.Get("/roles", handler.GetAllRoles)
	api.Get("/roles/:id", handler.GetRoleByID)
	api.Post("/roles", handler.CreateRole)
	api.Put("/roles/:id", handler.UpdateRole)
	api.Delete("/roles/:id", handler.DeleteRole)

	// role permissions (ERP-style)
	api.Get("/roles/:id/permissions", handler.GetRolePermissions)
	api.Get("/roles/:id/permissions/menu-tree", handler.GetRoleMenuTreeWithPermissions)
	api.Put("/roles/:id/permissions", handler.UpdateRolePermissions)
	api.Delete("/roles/:id/permissions", handler.ResetRolePermissions)

	//role management (healthfix paths)
	api.Get("/roleManage", handler.GetRoleMenuPermissions)
	api.Post("/roleManage", handler.SaveRoleMenuPermission)
	api.Delete("/roleManage/:id", handler.DeleteRoleMenuPermission)

	//userrole mapping
	api.Get("/user-role", handler.GetUserRoles)
	api.Post("/user-role", handler.AssignRoleToUser)
	api.Delete("/user-role/:id", handler.RemoveRoleFromUser)

	//individual menu permissions
	api.Get("/user-menu-permissions", handler.GetUserMenuPermissions)
	api.Post("/user-menu-permissions", handler.SaveUserMenuPermission)
	api.Delete("/user-menu-permissions/:id", handler.DeleteUserMenuPermission)

	// masters
	api.Get("/product-masters", handler.GetProductMasters)
	api.Get("/product-masters/:id", handler.GetProductMasterByID)
	api.Post("/product-masters", handler.CreateProductMaster)
	api.Put("/product-masters/:id", handler.UpdateProductMaster)
	api.Delete("/product-masters/:id", handler.DeleteProductMaster)

	api.Get("/area-masters/options", handler.GetAreaMasterOptions)
	api.Get("/area-masters", handler.GetAreaMasters)
	api.Get("/area-masters/:id", handler.GetAreaMasterByID)
	api.Post("/area-masters", handler.CreateAreaMaster)
	api.Put("/area-masters/:id", handler.UpdateAreaMaster)
	api.Delete("/area-masters/:id", handler.DeleteAreaMaster)

	// Head Quarter Master (alias of area-masters)
	api.Get("/head-quarter-masters/options", handler.GetAreaMasterOptions)
	api.Get("/head-quarter-masters", handler.GetAreaMasters)
	api.Get("/head-quarter-masters/:id", handler.GetAreaMasterByID)
	api.Post("/head-quarter-masters", handler.CreateAreaMaster)
	api.Put("/head-quarter-masters/:id", handler.UpdateAreaMaster)
	api.Delete("/head-quarter-masters/:id", handler.DeleteAreaMaster)

	api.Get("/doctor-masters", handler.GetDoctorMasters)
	api.Get("/doctor-masters/:id", handler.GetDoctorMasterByID)
	api.Post("/doctor-masters", handler.CreateDoctorMaster)
	api.Put("/doctor-masters/:id", handler.UpdateDoctorMaster)
	api.Delete("/doctor-masters/:id", handler.DeleteDoctorMaster)

	api.Get("/stockist-masters", handler.GetStockistMasters)
	api.Get("/stockist-masters/:id", handler.GetStockistMasterByID)
	api.Post("/stockist-masters", handler.CreateStockistMaster)
	api.Put("/stockist-masters/:id", handler.UpdateStockistMaster)
	api.Delete("/stockist-masters/:id", handler.DeleteStockistMaster)

	api.Get("/chemist-masters", handler.GetChemistMasters)
	api.Get("/chemist-masters/:id", handler.GetChemistMasterByID)
	api.Post("/chemist-masters", handler.CreateChemistMaster)
	api.Put("/chemist-masters/:id", handler.UpdateChemistMaster)
	api.Delete("/chemist-masters/:id", handler.DeleteChemistMaster)

	api.Get("/designation-masters", handler.GetDesignationMasters)
	api.Get("/designation-masters/:id", handler.GetDesignationMasterByID)
	api.Post("/designation-masters", handler.CreateDesignationMaster)
	api.Put("/designation-masters/:id", handler.UpdateDesignationMaster)
	api.Delete("/designation-masters/:id", handler.DeleteDesignationMaster)

	api.Get("/representative-masters/options", handler.GetRepresentativeMasterOptions)
	api.Get("/representative-masters", handler.GetRepresentativeMasters)
	api.Get("/representative-masters/:id", handler.GetRepresentativeMasterByID)
	api.Post("/representative-masters", handler.CreateRepresentativeMaster)
	api.Put("/representative-masters/:id", handler.UpdateRepresentativeMaster)
	api.Delete("/representative-masters/:id", handler.DeleteRepresentativeMaster)

	api.Get("/promotion-items/options", handler.GetPromotionItemOptions)
	api.Get("/promotion-items", handler.GetPromotionItems)
	api.Get("/promotion-items/:id", handler.GetPromotionItemByID)
	api.Post("/promotion-items", handler.CreatePromotionItem)
	api.Put("/promotion-items/:id", handler.UpdatePromotionItem)
	api.Delete("/promotion-items/:id", handler.DeletePromotionItem)

	api.Get("/promotion-stocks/summary", handler.GetPromotionStockSummaries)
	api.Get("/promotion-stocks", handler.GetPromotionStockEntries)
	api.Get("/promotion-stocks/:id", handler.GetPromotionStockEntryByID)
	api.Post("/promotion-stocks", handler.CreatePromotionStockEntry)
	api.Put("/promotion-stocks/:id", handler.UpdatePromotionStockEntry)
	api.Delete("/promotion-stocks/:id", handler.DeletePromotionStockEntry)

	// transactions / daily call report
	api.Get("/daily-call-reports/yesterday-check", handler.CheckDCRYesterdayRequirement)
	api.Post("/daily-call-reports", handler.CreateDailyCallReport)

	// reports
	api.Get("/reports/daily-call/representatives", handler.GetDailyCallRepresentatives)
	api.Get("/reports/daily-call/details", handler.GetDailyCallDetails)
	api.Get("/reports/order-products", handler.GetOrderProductsReport)
	api.Get("/reports/doctor-visits", handler.GetDoctorVisitsReport)
	api.Get("/reports/promotion-stock", handler.GetPromotionStockReport)

	// audit logs
	api.Get("/audit-logs", handler.ListAuditLogs)
	api.Get("/audit_logs", handler.ListAuditLogs)
	api.Get("/audit-logs/:id", handler.GetAuditLog)

	log.Fatal(app.Listen(":8000"))
}
