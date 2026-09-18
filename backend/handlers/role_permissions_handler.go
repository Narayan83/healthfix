package handler

import (
	"encoding/json"
	"strconv"

	"health-fix-api/auditlog"
	"health-fix-api/models"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

var rolemanageDB *gorm.DB

func SetRolesManagementDB(db *gorm.DB) {
	rolemanageDB = db
}

func GetRolePermissions(c *fiber.Ctx) error {
	roleID := c.Params("id")

	var rolemanagement models.RoleManagement
	result := rolemanageDB.Where("role_id = ?", roleID).Find(&rolemanagement)
	if result.Error != nil {
		return c.Status(500).JSON(fiber.Map{"error": result.Error.Error()})
	}
	if result.RowsAffected == 0 {
		return c.Status(404).JSON(fiber.Map{"error": "Role permissions not found"})
	}

	var permissions map[string]interface{}
	if len(rolemanagement.RoleManagementPermissions) > 0 {
		if err := json.Unmarshal(rolemanagement.RoleManagementPermissions, &permissions); err != nil {
			permissions = make(map[string]interface{})
		}
	} else {
		permissions = make(map[string]interface{})
	}

	return c.JSON(fiber.Map{
		"role_id":     rolemanagement.RoleID,
		"menu_id":     rolemanagement.MenuID,
		"permissions": permissions,
	})
}

func UpdateRolePermissions(c *fiber.Ctx) error {
	roleID := c.Params("id")

	roleIDUint, err := strconv.ParseUint(roleID, 10, 32)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid role ID"})
	}

	var permissionsData map[string]interface{}
	if err := c.BodyParser(&permissionsData); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid permissions data"})
	}

	converted := make(map[string]interface{})
	var unknownKeys []string
	for k, v := range permissionsData {
		if _, err := strconv.ParseUint(k, 10, 64); err == nil {
			converted[k] = v
			continue
		}
		var menu models.Menu
		if err := rolemanageDB.Where("menu_name = ?", k).First(&menu).Error; err != nil {
			unknownKeys = append(unknownKeys, k)
			continue
		}
		key := strconv.FormatUint(uint64(menu.ID), 10)
		converted[key] = v
	}

	if len(unknownKeys) > 0 {
		return c.Status(400).JSON(fiber.Map{
			"error":        "Some permission keys could not be mapped to menu IDs",
			"unknown_keys": unknownKeys,
		})
	}

	permsBytes, err := json.Marshal(converted)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid permissions format"})
	}

	var rolemanagement models.RoleManagement
	result := rolemanageDB.Where("role_id = ?", roleIDUint).Find(&rolemanagement)
	if result.Error != nil {
		return c.Status(500).JSON(fiber.Map{"error": result.Error.Error()})
	}

	var oldPerms interface{}
	if result.RowsAffected > 0 && len(rolemanagement.RoleManagementPermissions) > 0 {
		_ = json.Unmarshal(rolemanagement.RoleManagementPermissions, &oldPerms)
	}

	if result.RowsAffected == 0 {
		rolemanagement = models.RoleManagement{
			RoleID:                    uint(roleIDUint),
			RoleManagementPermissions: permsBytes,
		}

		var anyMenu models.Menu
		menuResult := rolemanageDB.Select("id").Where("is_active = true").Order("id").Limit(1).Find(&anyMenu)
		if menuResult.Error != nil {
			return c.Status(500).JSON(fiber.Map{"error": menuResult.Error.Error()})
		}
		if menuResult.RowsAffected == 0 {
			return c.Status(500).JSON(fiber.Map{"error": "no menus found; create at least one menu before adding role permissions"})
		}

		rolemanagement.MenuID = anyMenu.ID

		if err := rolemanageDB.Create(&rolemanagement).Error; err != nil {
			return c.Status(500).JSON(fiber.Map{"error": err.Error()})
		}
	} else {
		if err := rolemanageDB.Model(&rolemanagement).Update("role_management_permissions", permsBytes).Error; err != nil {
			return c.Status(500).JSON(fiber.Map{"error": err.Error()})
		}
	}

	auditlog.RecordUpdate(rolemanageDB, c, "role_permissions", roleID, oldPerms, converted)

	return c.JSON(fiber.Map{
		"message":     "Permissions updated successfully",
		"role_id":     roleIDUint,
		"permissions": converted,
	})
}

func GetRoleMenuTreeWithPermissions(c *fiber.Ctx) error {
	roleID := c.Params("id")

	roleIDUint, err := strconv.ParseUint(roleID, 10, 32)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid role ID"})
	}

	var rolemanagement models.RoleManagement
	var permissions map[string]interface{}
	result := rolemanageDB.Where("role_id = ?", roleIDUint).Find(&rolemanagement)
	if result.Error != nil {
		return c.Status(500).JSON(fiber.Map{"error": result.Error.Error()})
	}
	if result.RowsAffected == 0 {
		permissions = make(map[string]interface{})
	} else {
		if len(rolemanagement.RoleManagementPermissions) > 0 {
			if err := json.Unmarshal(rolemanagement.RoleManagementPermissions, &permissions); err != nil {
				permissions = make(map[string]interface{})
			}
		} else {
			permissions = make(map[string]interface{})
		}
	}

	var flatMenus []models.Menu
	if err := rolemanageDB.
		Where("is_active = true").
		Order("sort_order, menu_name").
		Find(&flatMenus).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	menuByID := make(map[uint]*models.Menu, len(flatMenus))
	for i := range flatMenus {
		flatMenus[i].Parent = nil
		flatMenus[i].Children = nil
		menuByID[flatMenus[i].ID] = &flatMenus[i]
	}

	childIDs := make(map[uint][]uint)
	rootIDs := make([]uint, 0)
	for i := range flatMenus {
		menu := &flatMenus[i]
		if menu.ParentID != nil {
			if _, ok := menuByID[*menu.ParentID]; ok {
				childIDs[*menu.ParentID] = append(childIDs[*menu.ParentID], menu.ID)
				continue
			}
		}
		rootIDs = append(rootIDs, menu.ID)
	}

	var materialize func(uint, map[uint]bool) models.Menu
	materialize = func(id uint, ancestors map[uint]bool) models.Menu {
		menu := *menuByID[id]
		if ancestors[id] {
			return menu
		}
		nextAncestors := make(map[uint]bool, len(ancestors)+1)
		for ancestorID := range ancestors {
			nextAncestors[ancestorID] = true
		}
		nextAncestors[id] = true
		for _, childID := range childIDs[id] {
			if !nextAncestors[childID] {
				menu.Children = append(menu.Children, materialize(childID, nextAncestors))
			}
		}
		return menu
	}

	menus := make([]models.Menu, 0, len(rootIDs))
	for _, rootID := range rootIDs {
		menus = append(menus, materialize(rootID, map[uint]bool{}))
	}

	defaultPerms := map[string]bool{
		"can_view":   false,
		"can_create": false,
		"can_update": false,
		"can_delete": false,
		"can_all":    false,
	}

	var build func(m models.Menu) (map[string]interface{}, error)
	build = func(m models.Menu) (map[string]interface{}, error) {
		b, _ := json.Marshal(m)
		var mm map[string]interface{}
		if err := json.Unmarshal(b, &mm); err != nil {
			mm = make(map[string]interface{})
		}

		menuIDStr := strconv.FormatUint(uint64(m.ID), 10)
		var perm interface{}
		if p, ok := permissions[menuIDStr]; ok {
			perm = p
		} else {
			if nameVal, ok := mm["menu_name"].(string); ok {
				if p, ok := permissions[nameVal]; ok {
					perm = p
				}
			}
			if perm == nil {
				if nameVal, ok := mm["name"].(string); ok {
					if p, ok := permissions[nameVal]; ok {
						perm = p
					}
				}
			}
		}
		if perm == nil {
			perm = defaultPerms
		}
		mm["permissions"] = perm

		if len(m.Children) > 0 {
			children := make([]map[string]interface{}, 0, len(m.Children))
			for _, ch := range m.Children {
				cm, err := build(ch)
				if err != nil {
					childMap := map[string]interface{}{"id": ch.ID, "permissions": defaultPerms}
					children = append(children, childMap)
					continue
				}
				children = append(children, cm)
			}
			mm["children"] = children
		}

		return mm, nil
	}

	var resultMenus []map[string]interface{}
	for _, menu := range menus {
		mmap, err := build(menu)
		if err != nil {
			mmap = map[string]interface{}{"id": menu.ID, "permissions": defaultPerms}
		}
		resultMenus = append(resultMenus, mmap)
	}

	return c.JSON(resultMenus)
}

func ResetRolePermissions(c *fiber.Ctx) error {
	roleID := c.Params("id")

	roleIDUint, err := strconv.ParseUint(roleID, 10, 32)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid role ID"})
	}

	var rolemanagement models.RoleManagement
	result := rolemanageDB.Where("role_id = ?", roleIDUint).Find(&rolemanagement)
	if result.Error != nil {
		return c.Status(500).JSON(fiber.Map{"error": result.Error.Error()})
	}
	if result.RowsAffected == 0 {
		return c.Status(404).JSON(fiber.Map{"error": "Role permissions not found"})
	}

	var oldPerms interface{}
	if len(rolemanagement.RoleManagementPermissions) > 0 {
		_ = json.Unmarshal(rolemanagement.RoleManagementPermissions, &oldPerms)
	}

	emptyPerms := make(map[string]interface{})
	permsBytes, _ := json.Marshal(emptyPerms)

	if err := rolemanageDB.Model(&rolemanagement).Update("role_management_permissions", permsBytes).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	auditlog.RecordCustom(rolemanageDB, c, "reset", "role_permissions", roleID, oldPerms, emptyPerms)

	return c.JSON(fiber.Map{"message": "Permissions reset successfully"})
}
