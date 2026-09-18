package handler

import (
	"errors"
	"strconv"
	"strings"
	"time"

	"health-fix-api/models"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

var transactionDB *gorm.DB

func SetTransactionDB(db *gorm.DB) {
	transactionDB = db
}

func getUserID(c *fiber.Ctx) (uint, bool) {
	v := c.Locals("user_id")
	if v == nil {
		return 0, false
	}
	switch id := v.(type) {
	case float64:
		return uint(id), true
	case int:
		return uint(id), true
	case uint:
		return id, true
	case string:
		n, err := strconv.ParseUint(id, 10, 64)
		if err != nil {
			return 0, false
		}
		return uint(n), true
	default:
		return 0, false
	}
}

func parseDateOnly(s string) (time.Time, error) {
	s = strings.TrimSpace(s)
	if s == "" {
		return time.Time{}, errors.New("date is required")
	}
	if len(s) > 10 {
		s = s[:10]
	}
	return time.Parse("2006-01-02", s)
}

func dateOnly(t time.Time) time.Time {
	y, m, d := t.Date()
	return time.Date(y, m, d, 0, 0, 0, 0, time.UTC)
}

func yesterdayOf(entryDate time.Time) time.Time {
	return dateOnly(entryDate).AddDate(0, 0, -1)
}

func isSunday(d time.Time) bool {
	return d.Weekday() == time.Sunday
}

func userHasDCRForDate(userID uint, d time.Time) bool {
	var count int64
	transactionDB.Model(&models.DailyCallReport{}).
		Where("user_id = ? AND entry_date = ?", userID, dateOnly(d)).
		Count(&count)
	return count > 0
}

func userHasLeaveOrHolidayForDate(userID uint, d time.Time) bool {
	var count int64
	transactionDB.Model(&models.DailyCallReport{}).
		Where("user_id = ? AND entry_date = ? AND entry_type IN ?", userID, dateOnly(d),
			[]string{models.DCREntryTypeLeave, models.DCREntryTypeHoliday}).
		Count(&count)
	return count > 0
}

func checkYesterdayRequirement(userID uint, entryDate time.Time) (allowed bool, message string) {
	yesterday := yesterdayOf(entryDate)
	if userHasDCRForDate(userID, yesterday) {
		return true, ""
	}
	if isSunday(yesterday) {
		return true, ""
	}
	if userHasLeaveOrHolidayForDate(userID, yesterday) {
		return true, ""
	}
	return false, "Cannot submit: no daily call report, leave, or holiday for yesterday (" + yesterday.Format("2006-01-02") + "). Sundays are exempt."
}

type dcrPromotionLineInput struct {
	PromotionItemID uint    `json:"promotion_item_id"`
	Quantity        float64 `json:"quantity"`
	Value           float64 `json:"value"`
}

type dcrOrderLineInput struct {
	ProductID uint    `json:"product_id"`
	Quantity  float64 `json:"quantity"`
}

type createDCRRequest struct {
	EntryType      string                  `json:"entry_type"`
	EntryDate      string                  `json:"entry_date"`
	AreaID         *uint                   `json:"area_id"`
	VisitType      string                  `json:"visit_type"`
	DoctorID       *uint                   `json:"doctor_id"`
	ChemistID      *uint                   `json:"chemist_id"`
	Remarks        string                  `json:"remarks"`
	PromotionLines []dcrPromotionLineInput `json:"promotion_lines"`
	OrderLines     []dcrOrderLineInput     `json:"order_lines"`
}

// CheckDCRYesterdayRequirement validates whether user can submit a report entry.
func CheckDCRYesterdayRequirement(c *fiber.Ctx) error {
	userID, ok := getUserID(c)
	if !ok {
		return c.Status(401).JSON(fiber.Map{"error": "Unauthorized"})
	}
	entryDateStr := c.Query("entry_date")
	if entryDateStr == "" {
		entryDateStr = time.Now().UTC().Format("2006-01-02")
	}
	entryDate, err := parseDateOnly(entryDateStr)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid entry_date"})
	}
	allowed, message := checkYesterdayRequirement(userID, entryDate)
	return c.JSON(fiber.Map{
		"allowed": allowed,
		"message": message,
	})
}

func CreateDailyCallReport(c *fiber.Ctx) error {
	userID, ok := getUserID(c)
	if !ok {
		return c.Status(401).JSON(fiber.Map{"error": "Unauthorized"})
	}

	var req createDCRRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
	}

	entryType := strings.ToLower(strings.TrimSpace(req.EntryType))
	if entryType != models.DCREntryTypeReport &&
		entryType != models.DCREntryTypeLeave &&
		entryType != models.DCREntryTypeHoliday {
		return c.Status(400).JSON(fiber.Map{"error": "entry_type must be report, leave, or holiday"})
	}

	entryDate, err := parseDateOnly(req.EntryDate)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid entry_date"})
	}
	entryDate = dateOnly(entryDate)

	if entryType == models.DCREntryTypeReport {
		allowed, message := checkYesterdayRequirement(userID, entryDate)
		if !allowed {
			return c.Status(422).JSON(fiber.Map{"error": message})
		}
	}

	report := models.DailyCallReport{
		UserID:    userID,
		EntryType: entryType,
		EntryDate: entryDate,
		Remarks:   strings.TrimSpace(req.Remarks),
	}

	if entryType == models.DCREntryTypeReport {
		visitType := strings.ToLower(strings.TrimSpace(req.VisitType))
		if visitType != models.DCRVisitTypeDoctor && visitType != models.DCRVisitTypeChemist {
			return c.Status(400).JSON(fiber.Map{"error": "visit_type must be doctor or chemist"})
		}
		if req.AreaID == nil || *req.AreaID == 0 {
			return c.Status(400).JSON(fiber.Map{"error": "area is required for report"})
		}
		var area models.AreaMaster
		if err := transactionDB.First(&area, *req.AreaID).Error; err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "Invalid area"})
		}
		report.AreaID = req.AreaID
		report.VisitType = visitType

		if visitType == models.DCRVisitTypeDoctor {
			if req.DoctorID == nil || *req.DoctorID == 0 {
				return c.Status(400).JSON(fiber.Map{"error": "doctor is required"})
			}
			var doc models.DoctorMaster
			if err := transactionDB.First(&doc, *req.DoctorID).Error; err != nil {
				return c.Status(400).JSON(fiber.Map{"error": "Invalid doctor"})
			}
			if doc.AreaID == nil || *doc.AreaID != *req.AreaID {
				return c.Status(400).JSON(fiber.Map{"error": "Doctor does not belong to selected area"})
			}
			report.DoctorID = req.DoctorID
		} else {
			if req.ChemistID == nil || *req.ChemistID == 0 {
				return c.Status(400).JSON(fiber.Map{"error": "chemist is required"})
			}
			var ch models.ChemistMaster
			if err := transactionDB.First(&ch, *req.ChemistID).Error; err != nil {
				return c.Status(400).JSON(fiber.Map{"error": "Invalid chemist"})
			}
			if ch.AreaID != nil && *ch.AreaID != *req.AreaID {
				return c.Status(400).JSON(fiber.Map{"error": "Chemist does not belong to selected area"})
			}
			report.ChemistID = req.ChemistID
		}
	}

	err = transactionDB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&report).Error; err != nil {
			return err
		}

		if entryType != models.DCREntryTypeReport {
			return nil
		}

		for _, line := range req.PromotionLines {
			if line.PromotionItemID == 0 {
				continue
			}
			qty := line.Quantity
			val := line.Value
			promo := models.DailyCallReportPromotion{
				DailyCallReportID: report.ID,
				PromotionItemID:   line.PromotionItemID,
				Quantity:          qty,
				Value:             val,
			}
			if err := tx.Create(&promo).Error; err != nil {
				return err
			}
			deduct := models.PromotionStockEntry{
				PromotionItemID: line.PromotionItemID,
				EntryType:       models.PromotionStockEntryDeduct,
				Quantity:        qty,
				Value:           val,
				EntryDate:       entryDate,
				Remarks:         "Daily call report #" + strconv.FormatUint(uint64(report.ID), 10),
			}
			if err := tx.Create(&deduct).Error; err != nil {
				return err
			}
		}

		if len(req.OrderLines) > 0 {
			order := models.Order{
				DailyCallReportID: report.ID,
				UserID:            userID,
				OrderDate:         entryDate,
				AreaID:            req.AreaID,
				DoctorID:          req.DoctorID,
				ChemistID:         req.ChemistID,
				Remarks:           report.Remarks,
			}
			if err := tx.Create(&order).Error; err != nil {
				return err
			}
			for _, ol := range req.OrderLines {
				if ol.ProductID == 0 {
					continue
				}
				qty := ol.Quantity
				if qty <= 0 {
					qty = 1
				}
				line := models.OrderLine{
					OrderID:   order.ID,
					ProductID: ol.ProductID,
					Quantity:  qty,
				}
				if err := tx.Create(&line).Error; err != nil {
					return err
				}
			}
		}

		return nil
	})
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	var loaded models.DailyCallReport
	transactionDB.
		Preload("Area").
		Preload("Doctor").
		Preload("Chemist").
		Preload("PromotionLines.PromotionItem").
		Preload("Order.Lines.Product").
		First(&loaded, report.ID)

	return c.Status(201).JSON(loaded)
}
