package handler

import (
	"errors"
	"math"
	"strconv"
	"strings"

	"health-fix-api/auditlog"
	"health-fix-api/models"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

var masterDB *gorm.DB

func SetMasterDB(db *gorm.DB) {
	masterDB = db
}

func listMaster(c *fiber.Ctx, model interface{}, orderBy string, filterCols ...string) error {
	var total int64
	page := c.QueryInt("page", 1)
	limit := c.QueryInt("limit", 10)
	filter := c.Query("filter")
	offset := (page - 1) * limit

	if orderBy == "" {
		orderBy = "id ASC"
	}

	query := masterDB.Model(model)
	if filter != "" && len(filterCols) > 0 {
		clause := filterCols[0] + " ILIKE ?"
		args := []interface{}{"%" + filter + "%"}
		for i := 1; i < len(filterCols); i++ {
			clause += " OR " + filterCols[i] + " ILIKE ?"
			args = append(args, "%"+filter+"%")
		}
		query = query.Where(clause, args...)
	}

	query.Count(&total)
	if err := query.Limit(limit).Offset(offset).Order(orderBy).Find(model).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{
		"data":  model,
		"page":  page,
		"limit": limit,
		"total": total,
	})
}

func normalizeProductCode(code string) string {
	return strings.TrimSpace(code)
}

func productCodeTaken(code string, excludeID uint) bool {
	code = normalizeProductCode(code)
	if code == "" {
		return false
	}
	var count int64
	q := masterDB.Model(&models.ProductMaster{}).Where("LOWER(product_code) = LOWER(?)", code)
	if excludeID > 0 {
		q = q.Where("id <> ?", excludeID)
	}
	q.Count(&count)
	return count > 0
}

func productDuplicateError(err error) (string, bool) {
	if err == nil {
		return "", false
	}
	if errors.Is(err, gorm.ErrDuplicatedKey) {
		return "Product code already exists", true
	}
	msg := strings.ToLower(err.Error())
	if strings.Contains(msg, "duplicate") || strings.Contains(msg, "unique") {
		return "Product code already exists", true
	}
	return "", false
}

// Product Master
func GetProductMasters(c *fiber.Ctx) error {
	var items []models.ProductMaster
	return listMaster(c, &items, "name ASC", "product_code", "name", "description", "category")
}

func GetProductMasterByID(c *fiber.Ctx) error {
	var item models.ProductMaster
	if err := masterDB.First(&item, c.Params("id")).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Not found"})
	}
	return c.JSON(item)
}

func CreateProductMaster(c *fiber.Ctx) error {
	var item models.ProductMaster
	if err := c.BodyParser(&item); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
	}
	item.ProductCode = normalizeProductCode(item.ProductCode)
	if item.ProductCode == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Product code is required"})
	}
	if item.Name == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Product name is required"})
	}
	if productCodeTaken(item.ProductCode, 0) {
		return c.Status(409).JSON(fiber.Map{"error": "Product code already exists"})
	}
	if item.Status == "" {
		item.Status = "active"
	}
	if err := masterDB.Create(&item).Error; err != nil {
		if msg, ok := productDuplicateError(err); ok {
			return c.Status(409).JSON(fiber.Map{"error": msg})
		}
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	auditlog.RecordCreate(masterDB, c, "product_master", strconv.FormatUint(uint64(item.ID), 10), item)
	return c.Status(201).JSON(item)
}

func UpdateProductMaster(c *fiber.Ctx) error {
	var item models.ProductMaster
	if err := masterDB.First(&item, c.Params("id")).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Not found"})
	}
	oldCopy := item
	var update models.ProductMaster
	if err := c.BodyParser(&update); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
	}
	update.ProductCode = normalizeProductCode(update.ProductCode)
	if update.ProductCode == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Product code is required"})
	}
	if productCodeTaken(update.ProductCode, item.ID) {
		return c.Status(409).JSON(fiber.Map{"error": "Product code already exists"})
	}
	if err := masterDB.Model(&item).Updates(update).Error; err != nil {
		if msg, ok := productDuplicateError(err); ok {
			return c.Status(409).JSON(fiber.Map{"error": msg})
		}
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	if err := masterDB.First(&item, c.Params("id")).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Not found"})
	}
	auditlog.RecordUpdate(masterDB, c, "product_master", c.Params("id"), oldCopy, item)
	return c.JSON(item)
}

func DeleteProductMaster(c *fiber.Ctx) error {
	var item models.ProductMaster
	if err := masterDB.First(&item, c.Params("id")).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Not found"})
	}
	if err := masterDB.Delete(&item).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	auditlog.RecordDelete(masterDB, c, "product_master", c.Params("id"), item)
	return c.JSON(fiber.Map{"message": "Deleted"})
}

func reloadDoctorWithArea(id uint) (models.DoctorMaster, error) {
	var item models.DoctorMaster
	err := masterDB.Preload("Area").First(&item, id).Error
	return item, err
}

func validateDoctorAreaID(areaID *uint) string {
	if areaID == nil || *areaID == 0 {
		return "Head Quarter is required"
	}
	var area models.AreaMaster
	if err := masterDB.First(&area, *areaID).Error; err != nil {
		return "Invalid head quarter selected"
	}
	return ""
}

// Doctor Master
func GetDoctorMasters(c *fiber.Ctx) error {
	var items []models.DoctorMaster
	var total int64
	page := c.QueryInt("page", 1)
	limit := c.QueryInt("limit", 10)
	filter := c.Query("filter")
	offset := (page - 1) * limit

	query := masterDB.Model(&models.DoctorMaster{}).Preload("Area")
	areaFilter := c.QueryInt("area_id", 0)
	if areaFilter > 0 {
		query = query.Where("doctor_masters.area_id = ?", areaFilter)
	}
	if status := strings.TrimSpace(c.Query("status")); status != "" {
		query = query.Where("doctor_masters.status = ?", status)
	} else if areaFilter == 0 {
		query = query.Where("doctor_masters.status = ? OR doctor_masters.status = '' OR doctor_masters.status IS NULL", "active")
	}
	if filter != "" {
		like := "%" + filter + "%"
		query = query.Joins("LEFT JOIN area_masters ON area_masters.id = doctor_masters.area_id").
			Where(
				"doctor_masters.search_doctor ILIKE ? OR doctor_masters.full_name ILIKE ? OR doctor_masters.mobile ILIKE ? OR doctor_masters.hospital_number ILIKE ? OR doctor_masters.city ILIKE ? OR doctor_masters.state ILIKE ? OR doctor_masters.postal_code ILIKE ? OR doctor_masters.degree ILIKE ? OR doctor_masters.department ILIKE ? OR area_masters.name ILIKE ?",
				like, like, like, like, like, like, like, like, like, like,
			)
	}

	query.Count(&total)
	if err := query.Limit(limit).Offset(offset).Order("full_name ASC").Find(&items).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{
		"data":  items,
		"page":  page,
		"limit": limit,
		"total": total,
	})
}

func GetDoctorMasterByID(c *fiber.Ctx) error {
	var item models.DoctorMaster
	if err := masterDB.Preload("Area").First(&item, c.Params("id")).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Not found"})
	}
	return c.JSON(item)
}

func CreateDoctorMaster(c *fiber.Ctx) error {
	var item models.DoctorMaster
	if err := c.BodyParser(&item); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
	}
	if item.FullName == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Doctor name is required"})
	}
	if msg := validateDoctorAreaID(item.AreaID); msg != "" {
		return c.Status(400).JSON(fiber.Map{"error": msg})
	}
	if item.Status == "" {
		item.Status = "active"
	}
	normalizeDoctorFields(&item)
	if err := masterDB.Create(&item).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	auditlog.RecordCreate(masterDB, c, "doctor_master", strconv.FormatUint(uint64(item.ID), 10), item)
	if loaded, err := reloadDoctorWithArea(item.ID); err == nil {
		return c.Status(201).JSON(loaded)
	}
	return c.Status(201).JSON(item)
}

func UpdateDoctorMaster(c *fiber.Ctx) error {
	var item models.DoctorMaster
	if err := masterDB.First(&item, c.Params("id")).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Not found"})
	}
	oldCopy := item
	var update models.DoctorMaster
	if err := c.BodyParser(&update); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
	}
	areaID := update.AreaID
	if areaID == nil {
		areaID = item.AreaID
	}
	if msg := validateDoctorAreaID(areaID); msg != "" {
		return c.Status(400).JSON(fiber.Map{"error": msg})
	}
	normalizeDoctorFields(&update)
	if err := masterDB.Model(&item).Updates(update).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	item, reloadErr := reloadDoctorWithArea(item.ID)
	if reloadErr != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Not found"})
	}
	auditlog.RecordUpdate(masterDB, c, "doctor_master", c.Params("id"), oldCopy, item)
	return c.JSON(item)
}

func DeleteDoctorMaster(c *fiber.Ctx) error {
	var item models.DoctorMaster
	if err := masterDB.First(&item, c.Params("id")).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Not found"})
	}
	if err := masterDB.Delete(&item).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	auditlog.RecordDelete(masterDB, c, "doctor_master", c.Params("id"), item)
	return c.JSON(fiber.Map{"message": "Deleted"})
}

// Chemist Master
func GetChemistMasters(c *fiber.Ctx) error {
	var items []models.ChemistMaster
	var total int64
	page := c.QueryInt("page", 1)
	limit := c.QueryInt("limit", 10)
	filter := c.Query("filter")
	offset := (page - 1) * limit

	query := masterDB.Model(&models.ChemistMaster{}).Preload("Area")
	areaFilter := c.QueryInt("area_id", 0)
	if areaFilter > 0 {
		query = query.Where("chemist_masters.area_id = ?", areaFilter)
	}
	if status := strings.TrimSpace(c.Query("status")); status != "" {
		query = query.Where("chemist_masters.status = ?", status)
	} else if areaFilter == 0 {
		query = query.Where("chemist_masters.status = ? OR chemist_masters.status = '' OR chemist_masters.status IS NULL", "active")
	}
	if filter != "" {
		like := "%" + filter + "%"
		query = query.Where(
			"chemist_masters.name ILIKE ? OR chemist_masters.owner_name ILIKE ? OR chemist_masters.search_place ILIKE ? OR chemist_masters.mobile ILIKE ?",
			like, like, like, like,
		)
	}
	query.Count(&total)
	if err := query.Limit(limit).Offset(offset).Order("name ASC").Find(&items).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{
		"data":  items,
		"page":  page,
		"limit": limit,
		"total": total,
	})
}

func GetChemistMasterByID(c *fiber.Ctx) error {
	var item models.ChemistMaster
	if err := masterDB.Preload("Area").First(&item, c.Params("id")).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Not found"})
	}
	return c.JSON(item)
}

func CreateChemistMaster(c *fiber.Ctx) error {
	var item models.ChemistMaster
	if err := c.BodyParser(&item); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
	}
	if item.Name == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Chemist name is required"})
	}
	if item.Status == "" {
		item.Status = "active"
	}
	if err := masterDB.Create(&item).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	auditlog.RecordCreate(masterDB, c, "chemist_master", strconv.FormatUint(uint64(item.ID), 10), item)
	return c.Status(201).JSON(item)
}

func UpdateChemistMaster(c *fiber.Ctx) error {
	var item models.ChemistMaster
	if err := masterDB.First(&item, c.Params("id")).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Not found"})
	}
	oldCopy := item
	var update models.ChemistMaster
	if err := c.BodyParser(&update); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
	}
	if err := masterDB.Model(&item).Updates(update).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	auditlog.RecordUpdate(masterDB, c, "chemist_master", c.Params("id"), oldCopy, item)
	return c.JSON(item)
}

func DeleteChemistMaster(c *fiber.Ctx) error {
	var item models.ChemistMaster
	if err := masterDB.First(&item, c.Params("id")).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Not found"})
	}
	if err := masterDB.Delete(&item).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	auditlog.RecordDelete(masterDB, c, "chemist_master", c.Params("id"), item)
	return c.JSON(fiber.Map{"message": "Deleted"})
}

// Designation Master
func GetDesignationMasters(c *fiber.Ctx) error {
	var items []models.DesignationMaster
	return listMaster(c, &items, "name ASC", "name", "code", "description")
}

func GetDesignationMasterByID(c *fiber.Ctx) error {
	var item models.DesignationMaster
	if err := masterDB.First(&item, c.Params("id")).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Not found"})
	}
	return c.JSON(item)
}

func CreateDesignationMaster(c *fiber.Ctx) error {
	var item models.DesignationMaster
	if err := c.BodyParser(&item); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
	}
	if item.Name == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Designation name is required"})
	}
	if item.Status == "" {
		item.Status = "active"
	}
	if err := masterDB.Create(&item).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	auditlog.RecordCreate(masterDB, c, "designation_master", strconv.FormatUint(uint64(item.ID), 10), item)
	return c.Status(201).JSON(item)
}

func UpdateDesignationMaster(c *fiber.Ctx) error {
	var item models.DesignationMaster
	if err := masterDB.First(&item, c.Params("id")).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Not found"})
	}
	oldCopy := item
	var update models.DesignationMaster
	if err := c.BodyParser(&update); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
	}
	if err := masterDB.Model(&item).Updates(update).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	auditlog.RecordUpdate(masterDB, c, "designation_master", c.Params("id"), oldCopy, item)
	return c.JSON(item)
}

func DeleteDesignationMaster(c *fiber.Ctx) error {
	var item models.DesignationMaster
	if err := masterDB.First(&item, c.Params("id")).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Not found"})
	}
	if err := masterDB.Delete(&item).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	auditlog.RecordDelete(masterDB, c, "designation_master", c.Params("id"), item)
	return c.JSON(fiber.Map{"message": "Deleted"})
}

// Representative Master
func GetRepresentativeMasterOptions(c *fiber.Ctx) error {
	var items []models.RepresentativeMaster
	if err := masterDB.Where("status = ?", "active").Order("name ASC").Find(&items).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"data": items})
}

func GetRepresentativeMasters(c *fiber.Ctx) error {
	var items []models.RepresentativeMaster
	return listMaster(c, &items, "name ASC", "name", "code", "mobile", "email", "territory")
}

func GetRepresentativeMasterByID(c *fiber.Ctx) error {
	var item models.RepresentativeMaster
	if err := masterDB.First(&item, c.Params("id")).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Not found"})
	}
	return c.JSON(item)
}

func CreateRepresentativeMaster(c *fiber.Ctx) error {
	var item models.RepresentativeMaster
	if err := c.BodyParser(&item); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
	}
	if item.Name == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Representative name is required"})
	}
	if item.Status == "" {
		item.Status = "active"
	}
	if err := masterDB.Create(&item).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	auditlog.RecordCreate(masterDB, c, "representative_master", strconv.FormatUint(uint64(item.ID), 10), item)
	return c.Status(201).JSON(item)
}

func UpdateRepresentativeMaster(c *fiber.Ctx) error {
	var item models.RepresentativeMaster
	if err := masterDB.First(&item, c.Params("id")).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Not found"})
	}
	oldCopy := item
	var update models.RepresentativeMaster
	if err := c.BodyParser(&update); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
	}
	if err := masterDB.Model(&item).Updates(update).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	auditlog.RecordUpdate(masterDB, c, "representative_master", c.Params("id"), oldCopy, item)
	return c.JSON(item)
}

func DeleteRepresentativeMaster(c *fiber.Ctx) error {
	var item models.RepresentativeMaster
	if err := masterDB.First(&item, c.Params("id")).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Not found"})
	}
	var inUse int64
	masterDB.Model(&models.User{}).Where("representative_id = ?", item.ID).Count(&inUse)
	if inUse > 0 {
		return c.Status(409).JSON(fiber.Map{"error": "Representative is assigned to one or more users"})
	}
	if err := masterDB.Delete(&item).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	auditlog.RecordDelete(masterDB, c, "representative_master", c.Params("id"), item)
	return c.JSON(fiber.Map{"message": "Deleted"})
}

func normalizeAreaName(name string) string {
	return strings.TrimSpace(name)
}

func areaNameTaken(name string, excludeID uint) bool {
	name = normalizeAreaName(name)
	if name == "" {
		return false
	}
	var count int64
	q := masterDB.Model(&models.AreaMaster{}).Where("LOWER(name) = LOWER(?)", name)
	if excludeID > 0 {
		q = q.Where("id <> ?", excludeID)
	}
	q.Count(&count)
	return count > 0
}

// Area Master
func GetAreaMasterOptions(c *fiber.Ctx) error {
	var items []models.AreaMaster
	if err := masterDB.Order("name ASC").Find(&items).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"data": items})
}

func GetAreaMasters(c *fiber.Ctx) error {
	var items []models.AreaMaster
	return listMaster(c, &items, "name ASC", "name")
}

func GetAreaMasterByID(c *fiber.Ctx) error {
	var item models.AreaMaster
	if err := masterDB.First(&item, c.Params("id")).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Not found"})
	}
	return c.JSON(item)
}

func CreateAreaMaster(c *fiber.Ctx) error {
	var item models.AreaMaster
	if err := c.BodyParser(&item); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
	}
	item.Name = normalizeAreaName(item.Name)
	if item.Name == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Head Quarter name is required"})
	}
	if areaNameTaken(item.Name, 0) {
		return c.Status(409).JSON(fiber.Map{"error": "Head Quarter name already exists"})
	}
	if item.Status == "" {
		item.Status = "active"
	}
	if err := masterDB.Create(&item).Error; err != nil {
		if _, ok := productDuplicateError(err); ok {
			return c.Status(409).JSON(fiber.Map{"error": "Head Quarter name already exists"})
		}
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	auditlog.RecordCreate(masterDB, c, "area_master", strconv.FormatUint(uint64(item.ID), 10), item)
	return c.Status(201).JSON(item)
}

func UpdateAreaMaster(c *fiber.Ctx) error {
	var item models.AreaMaster
	if err := masterDB.First(&item, c.Params("id")).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Not found"})
	}
	oldCopy := item
	var update models.AreaMaster
	if err := c.BodyParser(&update); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
	}
	update.Name = normalizeAreaName(update.Name)
	if update.Name == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Head Quarter name is required"})
	}
	if areaNameTaken(update.Name, item.ID) {
		return c.Status(409).JSON(fiber.Map{"error": "Head Quarter name already exists"})
	}
	if err := masterDB.Model(&item).Updates(update).Error; err != nil {
		if _, ok := productDuplicateError(err); ok {
			return c.Status(409).JSON(fiber.Map{"error": "Head Quarter name already exists"})
		}
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	if err := masterDB.First(&item, c.Params("id")).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Not found"})
	}
	auditlog.RecordUpdate(masterDB, c, "area_master", c.Params("id"), oldCopy, item)
	return c.JSON(item)
}

func DeleteAreaMaster(c *fiber.Ctx) error {
	var item models.AreaMaster
	if err := masterDB.First(&item, c.Params("id")).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Not found"})
	}
	var inUse int64
	masterDB.Model(&models.DoctorMaster{}).Where("area_id = ?", item.ID).Count(&inUse)
	if inUse > 0 {
		return c.Status(409).JSON(fiber.Map{"error": "Head Quarter is assigned to one or more doctors"})
	}
	masterDB.Model(&models.ChemistMaster{}).Where("area_id = ?", item.ID).Count(&inUse)
	if inUse > 0 {
		return c.Status(409).JSON(fiber.Map{"error": "Head Quarter is assigned to one or more chemists"})
	}
	masterDB.Model(&models.StockistMaster{}).Where("area_id = ?", item.ID).Count(&inUse)
	if inUse > 0 {
		return c.Status(409).JSON(fiber.Map{"error": "Head Quarter is assigned to one or more stockists"})
	}
	if err := masterDB.Delete(&item).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	auditlog.RecordDelete(masterDB, c, "area_master", c.Params("id"), item)
	return c.JSON(fiber.Map{"message": "Deleted"})
}

func normalizeMobile10(mobile string) string {
	digits := make([]rune, 0, len(mobile))
	for _, r := range mobile {
		if r >= '0' && r <= '9' {
			digits = append(digits, r)
		}
	}
	if len(digits) > 10 {
		digits = digits[len(digits)-10:]
	}
	return string(digits)
}

func normalizeDoctorFields(item *models.DoctorMaster) {
	item.Mobile = normalizeMobile10(item.Mobile)
	if item.NumberOfVisits < 0 {
		item.NumberOfVisits = 0
	}
}

// Stockist Master
func GetStockistMasters(c *fiber.Ctx) error {
	var items []models.StockistMaster
	var total int64
	page := c.QueryInt("page", 1)
	limit := c.QueryInt("limit", 10)
	filter := c.Query("filter")
	offset := (page - 1) * limit

	query := masterDB.Model(&models.StockistMaster{}).Preload("Area")
	areaFilter := c.QueryInt("area_id", 0)
	if areaFilter > 0 {
		query = query.Where("stockist_masters.area_id = ?", areaFilter)
	}
	if status := strings.TrimSpace(c.Query("status")); status != "" {
		query = query.Where("stockist_masters.status = ?", status)
	} else if areaFilter == 0 {
		query = query.Where("stockist_masters.status = ? OR stockist_masters.status = '' OR stockist_masters.status IS NULL", "active")
	}
	if filter != "" {
		like := "%" + filter + "%"
		query = query.Joins("LEFT JOIN area_masters ON area_masters.id = stockist_masters.area_id").
			Where(
				"stockist_masters.name ILIKE ? OR stockist_masters.place ILIKE ? OR stockist_masters.email ILIKE ? OR area_masters.name ILIKE ?",
				like, like, like, like,
			)
	}
	query.Count(&total)
	if err := query.Limit(limit).Offset(offset).Order("name ASC").Find(&items).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{
		"data":  items,
		"page":  page,
		"limit": limit,
		"total": total,
	})
}

func GetStockistMasterByID(c *fiber.Ctx) error {
	var item models.StockistMaster
	if err := masterDB.Preload("Area").First(&item, c.Params("id")).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Not found"})
	}
	return c.JSON(item)
}

func CreateStockistMaster(c *fiber.Ctx) error {
	var item models.StockistMaster
	if err := c.BodyParser(&item); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
	}
	if strings.TrimSpace(item.Name) == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Stockist name is required"})
	}
	if msg := validateDoctorAreaID(item.AreaID); msg != "" {
		return c.Status(400).JSON(fiber.Map{"error": msg})
	}
	if item.Status == "" {
		item.Status = "active"
	}
	item.Email = strings.TrimSpace(item.Email)
	if err := masterDB.Create(&item).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	auditlog.RecordCreate(masterDB, c, "stockist_master", strconv.FormatUint(uint64(item.ID), 10), item)
	_ = masterDB.Preload("Area").First(&item, item.ID)
	return c.Status(201).JSON(item)
}

func UpdateStockistMaster(c *fiber.Ctx) error {
	var item models.StockistMaster
	if err := masterDB.First(&item, c.Params("id")).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Not found"})
	}
	oldCopy := item
	var update models.StockistMaster
	if err := c.BodyParser(&update); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
	}
	areaID := update.AreaID
	if areaID == nil {
		areaID = item.AreaID
	}
	if msg := validateDoctorAreaID(areaID); msg != "" {
		return c.Status(400).JSON(fiber.Map{"error": msg})
	}
	if strings.TrimSpace(update.Name) == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Stockist name is required"})
	}
	update.Email = strings.TrimSpace(update.Email)
	if err := masterDB.Model(&item).Updates(update).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	_ = masterDB.Preload("Area").First(&item, item.ID)
	auditlog.RecordUpdate(masterDB, c, "stockist_master", c.Params("id"), oldCopy, item)
	return c.JSON(item)
}

func DeleteStockistMaster(c *fiber.Ctx) error {
	var item models.StockistMaster
	if err := masterDB.First(&item, c.Params("id")).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Not found"})
	}
	if err := masterDB.Delete(&item).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	auditlog.RecordDelete(masterDB, c, "stockist_master", c.Params("id"), item)
	return c.JSON(fiber.Map{"message": "Deleted"})
}

func normalizePromotionItemName(name string) string {
	return strings.TrimSpace(name)
}

func promotionItemNameTaken(name string, excludeID uint) bool {
	name = normalizePromotionItemName(name)
	if name == "" {
		return false
	}
	var count int64
	q := masterDB.Model(&models.PromotionItemMaster{}).Where("LOWER(item_name) = LOWER(?)", name)
	if excludeID > 0 {
		q = q.Where("id <> ?", excludeID)
	}
	q.Count(&count)
	return count > 0
}

func promotionItemBalance(itemID uint, excludeEntryID uint) (qty float64, val float64, err error) {
	var entries []models.PromotionStockEntry
	q := masterDB.Where("promotion_item_id = ?", itemID)
	if excludeEntryID > 0 {
		q = q.Where("id <> ?", excludeEntryID)
	}
	if err = q.Find(&entries).Error; err != nil {
		return 0, 0, err
	}
	for _, e := range entries {
		sign := 1.0
		if e.EntryType == models.PromotionStockEntryDeduct {
			sign = -1.0
		}
		qty += sign * e.Quantity
		val += sign * e.Value
	}
	return qty, val, nil
}

func validatePromotionStockEntry(entry *models.PromotionStockEntry, excludeEntryID uint) string {
	if entry.PromotionItemID == 0 {
		return "Promotion item is required"
	}
	var item models.PromotionItemMaster
	if err := masterDB.First(&item, entry.PromotionItemID).Error; err != nil {
		return "Invalid promotion item selected"
	}
	entryType := strings.ToLower(strings.TrimSpace(entry.EntryType))
	if entryType != models.PromotionStockEntryAdd && entryType != models.PromotionStockEntryDeduct {
		return "Entry type must be add or deduct"
	}
	entry.EntryType = entryType
	if entry.Quantity <= 0 {
		return "Quantity must be greater than zero"
	}
	if entry.Value < 0 {
		return "Value cannot be negative"
	}
	if entry.EntryDate.IsZero() {
		return "Date is required"
	}
	if entryType == models.PromotionStockEntryDeduct {
		balQty, balVal, err := promotionItemBalance(entry.PromotionItemID, excludeEntryID)
		if err != nil {
			return "Failed to verify stock balance"
		}
		if entry.Quantity > balQty+1e-9 {
			return "Deduction quantity exceeds available stock"
		}
		if entry.Value > balVal+1e-9 {
			return "Deduction value exceeds available stock value"
		}
	}
	return ""
}

// Promotion Item Master
func GetPromotionItemOptions(c *fiber.Ctx) error {
	var items []models.PromotionItemMaster
	if err := masterDB.Where("status = ?", "active").Order("item_name ASC").Find(&items).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"data": items})
}

func GetPromotionItems(c *fiber.Ctx) error {
	var items []models.PromotionItemMaster
	return listMaster(c, &items, "item_name ASC", "item_name")
}

func GetPromotionItemByID(c *fiber.Ctx) error {
	var item models.PromotionItemMaster
	if err := masterDB.First(&item, c.Params("id")).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Not found"})
	}
	return c.JSON(item)
}

func CreatePromotionItem(c *fiber.Ctx) error {
	var item models.PromotionItemMaster
	if err := c.BodyParser(&item); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
	}
	item.ItemName = normalizePromotionItemName(item.ItemName)
	if item.ItemName == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Item name is required"})
	}
	if promotionItemNameTaken(item.ItemName, 0) {
		return c.Status(409).JSON(fiber.Map{"error": "Item name already exists"})
	}
	if item.Status == "" {
		item.Status = "active"
	}
	if err := masterDB.Create(&item).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	auditlog.RecordCreate(masterDB, c, "promotion_item_master", strconv.FormatUint(uint64(item.ID), 10), item)
	return c.Status(201).JSON(item)
}

func UpdatePromotionItem(c *fiber.Ctx) error {
	var item models.PromotionItemMaster
	if err := masterDB.First(&item, c.Params("id")).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Not found"})
	}
	oldCopy := item
	var update models.PromotionItemMaster
	if err := c.BodyParser(&update); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
	}
	update.ItemName = normalizePromotionItemName(update.ItemName)
	if update.ItemName == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Item name is required"})
	}
	if promotionItemNameTaken(update.ItemName, item.ID) {
		return c.Status(409).JSON(fiber.Map{"error": "Item name already exists"})
	}
	if err := masterDB.Model(&item).Updates(update).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	if err := masterDB.First(&item, c.Params("id")).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Not found"})
	}
	auditlog.RecordUpdate(masterDB, c, "promotion_item_master", c.Params("id"), oldCopy, item)
	return c.JSON(item)
}

func DeletePromotionItem(c *fiber.Ctx) error {
	var item models.PromotionItemMaster
	if err := masterDB.First(&item, c.Params("id")).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Not found"})
	}
	var stockCount int64
	masterDB.Model(&models.PromotionStockEntry{}).Where("promotion_item_id = ?", item.ID).Count(&stockCount)
	if stockCount > 0 {
		return c.Status(409).JSON(fiber.Map{"error": "Cannot delete item with stock entries"})
	}
	if err := masterDB.Delete(&item).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	auditlog.RecordDelete(masterDB, c, "promotion_item_master", c.Params("id"), item)
	return c.JSON(fiber.Map{"message": "Deleted"})
}

// Promotion Stock (summary list + entry CRUD)
func GetPromotionStockSummaries(c *fiber.Ctx) error {
	var total int64
	page := c.QueryInt("page", 1)
	limit := c.QueryInt("limit", 10)
	filter := c.Query("filter")
	offset := (page - 1) * limit

	query := masterDB.Model(&models.PromotionItemMaster{})
	if filter != "" {
		query = query.Where("item_name ILIKE ?", "%"+filter+"%")
	}
	query.Count(&total)

	var items []models.PromotionItemMaster
	if err := query.Order("item_name ASC").Limit(limit).Offset(offset).Find(&items).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	summaries := make([]models.PromotionStockSummary, 0, len(items))
	for _, item := range items {
		qty, val, err := promotionItemBalance(item.ID, 0)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": err.Error()})
		}
		summaries = append(summaries, models.PromotionStockSummary{
			PromotionItemID: item.ID,
			ItemName:        item.ItemName,
			BalanceQuantity: math.Max(0, qty),
			BalanceValue:    math.Max(0, val),
		})
	}

	return c.JSON(fiber.Map{
		"data":  summaries,
		"page":  page,
		"limit": limit,
		"total": total,
	})
}

func GetPromotionStockEntries(c *fiber.Ctx) error {
	var items []models.PromotionStockEntry
	var total int64
	page := c.QueryInt("page", 1)
	limit := c.QueryInt("limit", 10)
	filter := c.Query("filter")
	itemID := c.QueryInt("promotion_item_id", 0)
	offset := (page - 1) * limit

	query := masterDB.Model(&models.PromotionStockEntry{}).Preload("PromotionItem")
	if itemID > 0 {
		query = query.Where("promotion_item_id = ?", itemID)
	}
	if filter != "" {
		like := "%" + filter + "%"
		query = query.Joins("JOIN promotion_item_masters ON promotion_item_masters.id = promotion_stock_entries.promotion_item_id").
			Where("promotion_item_masters.item_name ILIKE ? OR promotion_stock_entries.entry_type ILIKE ? OR promotion_stock_entries.remarks ILIKE ?", like, like, like)
	}
	query.Count(&total)
	if err := query.Limit(limit).Offset(offset).Order("entry_date DESC, id DESC").Find(&items).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{
		"data":  items,
		"page":  page,
		"limit": limit,
		"total": total,
	})
}

func GetPromotionStockEntryByID(c *fiber.Ctx) error {
	var item models.PromotionStockEntry
	if err := masterDB.Preload("PromotionItem").First(&item, c.Params("id")).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Not found"})
	}
	return c.JSON(item)
}

func CreatePromotionStockEntry(c *fiber.Ctx) error {
	var item models.PromotionStockEntry
	if err := c.BodyParser(&item); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
	}
	if msg := validatePromotionStockEntry(&item, 0); msg != "" {
		return c.Status(400).JSON(fiber.Map{"error": msg})
	}
	if err := masterDB.Create(&item).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	auditlog.RecordCreate(masterDB, c, "promotion_stock_entry", strconv.FormatUint(uint64(item.ID), 10), item)
	if err := masterDB.Preload("PromotionItem").First(&item, item.ID).Error; err == nil {
		return c.Status(201).JSON(item)
	}
	return c.Status(201).JSON(item)
}

func UpdatePromotionStockEntry(c *fiber.Ctx) error {
	var item models.PromotionStockEntry
	if err := masterDB.First(&item, c.Params("id")).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Not found"})
	}
	oldCopy := item
	var update models.PromotionStockEntry
	if err := c.BodyParser(&update); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
	}
	if update.PromotionItemID == 0 {
		update.PromotionItemID = item.PromotionItemID
	}
	if update.EntryDate.IsZero() {
		update.EntryDate = item.EntryDate
	}
	if msg := validatePromotionStockEntry(&update, item.ID); msg != "" {
		return c.Status(400).JSON(fiber.Map{"error": msg})
	}
	if err := masterDB.Model(&item).Updates(update).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	if err := masterDB.Preload("PromotionItem").First(&item, c.Params("id")).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Not found"})
	}
	auditlog.RecordUpdate(masterDB, c, "promotion_stock_entry", c.Params("id"), oldCopy, item)
	return c.JSON(item)
}

func DeletePromotionStockEntry(c *fiber.Ctx) error {
	var item models.PromotionStockEntry
	if err := masterDB.First(&item, c.Params("id")).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Not found"})
	}
	if err := masterDB.Delete(&item).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	auditlog.RecordDelete(masterDB, c, "promotion_stock_entry", c.Params("id"), item)
	return c.JSON(fiber.Map{"message": "Deleted"})
}

