package handler

import (
	"encoding/json"
	"strconv"

	"health-fix-api/models"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

func GetCurrentUserMenuTree(c *fiber.Ctx) error {
	userIDVal := c.Locals("user_id")
	if userIDVal == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}
	userID := uint(userIDVal.(float64))

	var roleMappings []models.UserRoleMapping
	if err := userDB.Where("user_id = ?", userID).Find(&roleMappings).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch user roles"})
	}

	roleIDs := make([]uint, 0)
	for _, mapping := range roleMappings {
		roleIDs = append(roleIDs, mapping.RoleID)
	}

	finalPermissions := make(map[string]map[string]bool)
	isSuperAdmin := false

	if len(roleIDs) > 0 {
		var roles []models.Role
		if err := userDB.Where("id IN ?", roleIDs).Find(&roles).Error; err == nil {
			for _, r := range roles {
				if r.RoleName == "Super Admin" {
					isSuperAdmin = true
					break
				}
			}
		}

		if !isSuperAdmin {
			var roleManagements []models.RoleManagement
			if err := rolemanageDB.Where("role_id IN ?", roleIDs).Find(&roleManagements).Error; err != nil {
				return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch role permissions"})
			}

			for _, rm := range roleManagements {
				var perms map[string]map[string]bool
				if len(rm.RoleManagementPermissions) > 0 {
					if err := json.Unmarshal(rm.RoleManagementPermissions, &perms); err == nil {
						for menuID, p := range perms {
							if _, exists := finalPermissions[menuID]; !exists {
								finalPermissions[menuID] = make(map[string]bool)
							}
							for action, allowed := range p {
								if allowed {
									finalPermissions[menuID][action] = true
								}
							}
						}
					}
				}
			}
		}
	}

	var menus []models.Menu
	if err := menusDB.
		Where("parent_id IS NULL AND is_active = true").
		Preload("Children", func(db *gorm.DB) *gorm.DB {
			return db.Where("is_active = true").Order("sort_order")
		}).
		Order("sort_order").
		Find(&menus).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch menus"})
	}

	var processMenu func(m models.Menu) (map[string]interface{}, bool)
	processMenu = func(m models.Menu) (map[string]interface{}, bool) {
		menuIDStr := strconv.FormatUint(uint64(m.ID), 10)

		var perms map[string]bool
		canView := false

		if isSuperAdmin {
			canView = true
			perms = map[string]bool{
				"can_view":   true,
				"can_create": true,
				"can_update": true,
				"can_delete": true,
				"can_all":    true,
			}
		} else {
			p, hasPerms := finalPermissions[menuIDStr]
			perms = p
			if hasPerms {
				if val, ok := perms["can_view"]; ok && val {
					canView = true
				}
			}
		}

		processedChildren := make([]map[string]interface{}, 0)
		for _, child := range m.Children {
			if childMap, childVisible := processMenu(child); childVisible {
				processedChildren = append(processedChildren, childMap)
			}
		}

		if len(processedChildren) > 0 {
			canView = true
		}

		if !canView {
			return nil, false
		}

		menuMap := map[string]interface{}{
			"id":          m.ID,
			"menu_name":   m.MenuName,
			"url":         m.URL,
			"icon":        m.Icon,
			"children":    processedChildren,
			"permissions": perms,
		}

		return menuMap, true
	}

	result := make([]map[string]interface{}, 0)
	for _, m := range menus {
		if menuMap, visible := processMenu(m); visible {
			result = append(result, menuMap)
		}
	}

	return c.JSON(result)
}
