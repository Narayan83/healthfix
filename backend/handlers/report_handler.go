package handler

import (
	"strings"
	"time"

	"health-fix-api/models"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type repSummaryRow struct {
	UserID              uint     `json:"user_id"`
	RepresentativeName  string   `json:"representative_name"`
	UserName            string   `json:"user_name"`
	SubmissionCount     int64    `json:"submission_count"`
	EntryTypes          []string `json:"entry_types"`
}

type orderProductRow struct {
	RepresentativeName string  `json:"representative_name"`
	UserName           string  `json:"user_name"`
	ProductCode        string  `json:"product_code"`
	ProductName        string  `json:"product_name"`
	Quantity           float64 `json:"quantity"`
	OrderDate          string  `json:"order_date"`
}

type doctorVisitRow struct {
	RepresentativeName string `json:"representative_name"`
	UserName           string `json:"user_name"`
	DoctorName         string `json:"doctor_name"`
	AreaName           string `json:"area_name"`
	EntryDate          string `json:"entry_date"`
	Remarks            string `json:"remarks"`
}

func reportDateFromQuery(c *fiber.Ctx) (time.Time, error) {
	d := strings.TrimSpace(c.Query("date"))
	if d == "" {
		d = time.Now().UTC().AddDate(0, 0, -1).Format("2006-01-02")
	}
	return parseDateOnly(d)
}

func loadUserWithRep(db *gorm.DB, userID uint) (models.User, string, string) {
	var u models.User
	_ = db.Preload("Representative").First(&u, userID).Error
	repName := ""
	if u.Representative != nil {
		repName = u.Representative.Name
	}
	userName := strings.TrimSpace(u.Firstname + " " + u.Lastname)
	if repName == "" {
		repName = userName
	}
	if userName == "" {
		userName = u.Email
	}
	return u, repName, userName
}

func userIDsForRepresentative(repID uint) ([]uint, error) {
	var ids []uint
	err := transactionDB.Model(&models.User{}).
		Where("representative_id = ?", repID).
		Pluck("id", &ids).Error
	return ids, err
}

// GetDailyCallRepresentatives — reps/users who submitted on a date.
func GetDailyCallRepresentatives(c *fiber.Ctx) error {
	entryDate, err := reportDateFromQuery(c)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid date"})
	}

	type agg struct {
		UserID uint  `gorm:"column:user_id"`
		Count  int64 `gorm:"column:count"`
	}
	var aggs []agg
	if err := transactionDB.Model(&models.DailyCallReport{}).
		Select("user_id, COUNT(*) as count").
		Where("entry_date = ?", dateOnly(entryDate)).
		Group("user_id").
		Scan(&aggs).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	rows := make([]repSummaryRow, 0, len(aggs))
	for _, a := range aggs {
		_, repName, userName := loadUserWithRep(transactionDB, a.UserID)
		var types []string
		transactionDB.Model(&models.DailyCallReport{}).
			Distinct("entry_type").
			Where("user_id = ? AND entry_date = ?", a.UserID, dateOnly(entryDate)).
			Pluck("entry_type", &types)
		rows = append(rows, repSummaryRow{
			UserID:             a.UserID,
			RepresentativeName: repName,
			UserName:           userName,
			SubmissionCount:    a.Count,
			EntryTypes:         types,
		})
	}

	return c.JSON(fiber.Map{
		"date": entryDate.Format("2006-01-02"),
		"data": rows,
	})
}

// GetDailyCallDetails — all submissions for one user on a date.
func GetDailyCallDetails(c *fiber.Ctx) error {
	entryDate, err := reportDateFromQuery(c)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid date"})
	}
	userID := c.QueryInt("user_id", 0)
	if userID <= 0 {
		return c.Status(400).JSON(fiber.Map{"error": "user_id is required"})
	}

	var reports []models.DailyCallReport
	err = transactionDB.
		Where("entry_date = ? AND user_id = ?", dateOnly(entryDate), userID).
		Preload("Area").
		Preload("Doctor").
		Preload("Chemist").
		Preload("PromotionLines.PromotionItem").
		Preload("Order.Lines.Product").
		Order("id ASC").
		Find(&reports).Error
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	_, repName, userName := loadUserWithRep(transactionDB, uint(userID))
	return c.JSON(fiber.Map{
		"date":                entryDate.Format("2006-01-02"),
		"user_id":             userID,
		"representative_name": repName,
		"user_name":           userName,
		"data":                reports,
	})
}

// GetOrderProductsReport — order lines with rep and product for a date.
func GetOrderProductsReport(c *fiber.Ctx) error {
	entryDate, err := reportDateFromQuery(c)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid date"})
	}

	var orders []models.Order
	err = transactionDB.
		Where("order_date = ?", dateOnly(entryDate)).
		Preload("Lines.Product").
		Order("user_id ASC, id ASC").
		Find(&orders).Error
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	rows := make([]orderProductRow, 0)
	userCache := map[uint]struct{ rep, user string }{}
	for _, ord := range orders {
		cache, ok := userCache[ord.UserID]
		if !ok {
			_, rep, uname := loadUserWithRep(transactionDB, ord.UserID)
			cache = struct{ rep, user string }{rep, uname}
			userCache[ord.UserID] = cache
		}
		for _, line := range ord.Lines {
			code, name := "", ""
			if line.Product != nil {
				code = line.Product.ProductCode
				name = line.Product.Name
			}
			rows = append(rows, orderProductRow{
				RepresentativeName: cache.rep,
				UserName:           cache.user,
				ProductCode:        code,
				ProductName:        name,
				Quantity:           line.Quantity,
				OrderDate:          ord.OrderDate.Format("2006-01-02"),
			})
		}
	}

	return c.JSON(fiber.Map{
		"date": entryDate.Format("2006-01-02"),
		"data": rows,
	})
}

// GetDoctorVisitsReport — doctor visits on a date, optional representative filter.
func GetDoctorVisitsReport(c *fiber.Ctx) error {
	entryDate, err := reportDateFromQuery(c)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid date"})
	}

	query := transactionDB.Model(&models.DailyCallReport{}).
		Where("entry_date = ? AND entry_type = ? AND visit_type = ? AND doctor_id IS NOT NULL",
			dateOnly(entryDate), models.DCREntryTypeReport, models.DCRVisitTypeDoctor)

	if repID := c.QueryInt("representative_id", 0); repID > 0 {
		userIDs, err := userIDsForRepresentative(uint(repID))
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": err.Error()})
		}
		if len(userIDs) == 0 {
			return c.JSON(fiber.Map{"date": entryDate.Format("2006-01-02"), "data": []doctorVisitRow{}})
		}
		query = query.Where("user_id IN ?", userIDs)
	}

	var reports []models.DailyCallReport
	if err := query.Preload("Doctor").Preload("Area").Order("user_id ASC, id ASC").Find(&reports).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	rows := make([]doctorVisitRow, 0, len(reports))
	for _, r := range reports {
		_, repName, userName := loadUserWithRep(transactionDB, r.UserID)
		docName := ""
		if r.Doctor != nil {
			docName = r.Doctor.FullName
		}
		areaName := ""
		if r.Area != nil {
			areaName = r.Area.Name
		}
		rows = append(rows, doctorVisitRow{
			RepresentativeName: repName,
			UserName:           userName,
			DoctorName:         docName,
			AreaName:           areaName,
			EntryDate:          r.EntryDate.Format("2006-01-02"),
			Remarks:            r.Remarks,
		})
	}

	return c.JSON(fiber.Map{
		"date": entryDate.Format("2006-01-02"),
		"data": rows,
	})
}

// GetPromotionStockReport — stock balance per promotion item (report view).
func GetPromotionStockReport(c *fiber.Ctx) error {
	filter := c.Query("filter")
	query := masterDB.Model(&models.PromotionItemMaster{})
	if filter != "" {
		query = query.Where("item_name ILIKE ?", "%"+filter+"%")
	}
	var items []models.PromotionItemMaster
	if err := query.Order("item_name ASC").Find(&items).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	summaries := make([]models.PromotionStockSummary, 0, len(items))
	for _, item := range items {
		qty, val, err := promotionItemBalance(item.ID, 0)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": err.Error()})
		}
		summaries = append(summaries, models.PromotionStockSummary{
			PromotionItemID:  item.ID,
			ItemName:         item.ItemName,
			BalanceQuantity:  qty,
			BalanceValue:     val,
		})
	}
	return c.JSON(fiber.Map{"data": summaries})
}
