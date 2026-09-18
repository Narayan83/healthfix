package seeds

import "health-fix-api/models"

// menuSeedHardcodedDefaults matches frontend MenuData.js + Dashboard (HealthFix only).
func menuSeedHardcodedDefaults() []models.Menu {
	return []models.Menu{
		{
			MenuName: "Dashboard", URL: "/home", Icon: "LayoutDashboard",
			SortOrder: 1, MenuType: "main", IsActive: true,
		},
		{
			MenuName: "Transaction", URL: "/transaction", Icon: "ArrowLeftRight",
			SortOrder: 2, MenuType: "main", IsActive: true,
			Children: []models.Menu{
				{MenuName: "Daily Call Report", URL: "/daily-call-report", Icon: "ClipboardList", SortOrder: 1, MenuType: "main", IsActive: true},
			},
		},
		{
			MenuName: "Masters", URL: "/masters", Icon: "Database",
			SortOrder: 3, MenuType: "main", IsActive: true,
			Children: []models.Menu{
				{MenuName: "Product Master", URL: "/Product-master", Icon: "Package", SortOrder: 1, MenuType: "main", IsActive: true},
				{MenuName: "Doctor Master", URL: "/Doctor-master", Icon: "Stethoscope", SortOrder: 2, MenuType: "main", IsActive: true},
				{MenuName: "Chemist Master", URL: "/chemist-master", Icon: "Pill", SortOrder: 3, MenuType: "main", IsActive: true},
				{MenuName: "Stockist Master", URL: "/stockist-master", Icon: "Truck", SortOrder: 4, MenuType: "main", IsActive: true},
				{MenuName: "Designation Master", URL: "/Designation-master", Icon: "Award", SortOrder: 5, MenuType: "main", IsActive: true},
				{MenuName: "Head Quarter Master", URL: "/head-quarter-master", Icon: "MapPin", SortOrder: 6, MenuType: "main", IsActive: true},
				{MenuName: "Promotion Item Master", URL: "/promotion-item-master", Icon: "Gift", SortOrder: 7, MenuType: "main", IsActive: true},
				{MenuName: "Promotion Stock", URL: "/promotion-stock", Icon: "Warehouse", SortOrder: 8, MenuType: "main", IsActive: true},
			},
		},
		{
			MenuName: "Reports", URL: "/reports-group", Icon: "Reports",
			SortOrder: 4, MenuType: "main", IsActive: true,
			Children: []models.Menu{
				{MenuName: "Daily Call Submissions", URL: "/reports/daily-call-submissions", Icon: "ClipboardList", SortOrder: 1, MenuType: "main", IsActive: true},
				{MenuName: "Order Products", URL: "/reports/order-products", Icon: "Package", SortOrder: 2, MenuType: "main", IsActive: true},
				{MenuName: "Doctor Visits", URL: "/reports/doctor-visits", Icon: "Stethoscope", SortOrder: 3, MenuType: "main", IsActive: true},
				{MenuName: "Promotion Stock", URL: "/reports/promotion-stock", Icon: "Warehouse", SortOrder: 4, MenuType: "main", IsActive: true},
			},
		},
		{
			MenuName: "Menu Management", URL: "/menu-management", Icon: "ShieldAlert",
			SortOrder: 5, MenuType: "main", IsActive: true,
			Children: []models.Menu{
				{MenuName: "Role Creation", URL: "/rolecreation", Icon: "ShieldPlus", SortOrder: 1, MenuType: "main", IsActive: true},
				{MenuName: "Role Management", URL: "/rolemanagement", Icon: "Lock", SortOrder: 2, MenuType: "main", IsActive: true},
				{MenuName: "Menu Creation", URL: "/menucreation", Icon: "Menu", SortOrder: 3, MenuType: "main", IsActive: true},
				{MenuName: "Existing Menus", URL: "/existingmenus", Icon: "List", SortOrder: 4, MenuType: "main", IsActive: true},
				{MenuName: "Audit Logs", URL: "/auditlogs", Icon: "FileClock", SortOrder: 5, MenuType: "main", IsActive: true},
			},
		},
		{
			MenuName: "User Management", URL: "/user-management", Icon: "Users",
			SortOrder: 6, MenuType: "main", IsActive: true,
			Children: []models.Menu{
				{MenuName: "User Management", URL: "/usermanagement", Icon: "Link", SortOrder: 1, MenuType: "main", IsActive: true},
				{MenuName: "Add User", URL: "/adduser", Icon: "Users", SortOrder: 2, MenuType: "main", IsActive: true},
				{MenuName: "Representative Master", URL: "/representative-master", Icon: "UserCircle", SortOrder: 3, MenuType: "main", IsActive: true},
				{MenuName: "Password Change", URL: "/change-password", Icon: "KeyRound", SortOrder: 4, MenuType: "main", IsActive: true},
			},
		},
	}
}

// healthFixMenuURLs is the allowlist of route paths used by HealthFix (sidebar + role permissions).
func healthFixMenuURLs() []string {
	urls := make(map[string]struct{})
	var walk func([]models.Menu)
	walk = func(list []models.Menu) {
		for _, m := range list {
			if m.URL != "" {
				urls[m.URL] = struct{}{}
			}
			if len(m.Children) > 0 {
				walk(m.Children)
			}
		}
	}
	walk(menuSeedHardcodedDefaults())
	out := make([]string, 0, len(urls))
	for u := range urls {
		out = append(out, u)
	}
	return out
}
