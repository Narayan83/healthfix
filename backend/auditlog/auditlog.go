package auditlog

import (
	"encoding/json"
	"log"
	"os"
	"strings"

	"health-fix-api/models"

	"github.com/gofiber/fiber/v2"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

const headerAuditMenu = "X-Audit-Menu"

type Params struct {
	Action     string
	EntityType string
	EntityID   string
	Old        interface{}
	New        interface{}
}

func Enabled() bool {
	v := strings.TrimSpace(strings.ToLower(os.Getenv("AUDIT_LOG_ENABLED")))
	if v == "" {
		return true
	}
	switch v {
	case "0", "false", "no", "off":
		return false
	default:
		return true
	}
}

func Record(db *gorm.DB, c *fiber.Ctx, p Params) {
	if !Enabled() || db == nil {
		return
	}

	menu := strings.TrimSpace(c.Get(headerAuditMenu))
	if menu == "" {
		menu = strings.TrimSpace(c.Path())
	}

	var userID *uint
	if v := c.Locals("user_id"); v != nil {
		if f, ok := v.(float64); ok {
			u := uint(f)
			userID = &u
		}
	}

	userEmail := ""
	if v := c.Locals("email"); v != nil {
		if s, ok := v.(string); ok {
			userEmail = s
		}
	}

	oldBytes, errOld := json.Marshal(p.Old)
	if p.Old == nil {
		oldBytes = []byte("null")
	} else if errOld != nil {
		oldBytes, _ = json.Marshal(fiber.Map{"_marshal_error": errOld.Error()})
	}

	newBytes, errNew := json.Marshal(p.New)
	if p.New == nil {
		newBytes = []byte("null")
	} else if errNew != nil {
		newBytes, _ = json.Marshal(fiber.Map{"_marshal_error": errNew.Error()})
	}

	row := models.AuditLog{
		MenuLabel:  menu,
		Action:     strings.ToLower(strings.TrimSpace(p.Action)),
		EntityType: p.EntityType,
		EntityID:   p.EntityID,
		UserID:     userID,
		UserEmail:  userEmail,
		ClientIP:   c.IP(),
		OldValue:   datatypes.JSON(oldBytes),
		NewValue:   datatypes.JSON(newBytes),
	}

	if err := db.Create(&row).Error; err != nil {
		log.Printf("auditlog: insert failed: %v", err)
	}
}

func RecordCreate(db *gorm.DB, c *fiber.Ctx, entityType, entityID string, newVal interface{}) {
	Record(db, c, Params{Action: "create", EntityType: entityType, EntityID: entityID, Old: nil, New: newVal})
}

func RecordUpdate(db *gorm.DB, c *fiber.Ctx, entityType, entityID string, oldVal, newVal interface{}) {
	Record(db, c, Params{Action: "update", EntityType: entityType, EntityID: entityID, Old: oldVal, New: newVal})
}

func RecordDelete(db *gorm.DB, c *fiber.Ctx, entityType, entityID string, oldVal interface{}) {
	Record(db, c, Params{Action: "delete", EntityType: entityType, EntityID: entityID, Old: oldVal, New: nil})
}

func RecordCustom(db *gorm.DB, c *fiber.Ctx, action, entityType, entityID string, oldVal, newVal interface{}) {
	Record(db, c, Params{Action: action, EntityType: entityType, EntityID: entityID, Old: oldVal, New: newVal})
}
