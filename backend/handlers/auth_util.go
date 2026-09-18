package handler

import (
	"encoding/json"
	"errors"
	"fmt"
	"strings"

	"health-fix-api/models"
	"golang.org/x/crypto/bcrypt"
)

func parseLocalUserID(userIDVal interface{}) (uint, error) {
	if userIDVal == nil {
		return 0, errors.New("unauthorized")
	}
	switch id := userIDVal.(type) {
	case float64:
		return uint(id), nil
	case int:
		return uint(id), nil
	case int64:
		return uint(id), nil
	case uint:
		return id, nil
	case uint64:
		return uint(id), nil
	case json.Number:
		n, err := id.Int64()
		if err != nil {
			return 0, err
		}
		return uint(n), nil
	default:
		return 0, fmt.Errorf("invalid user id type %T", userIDVal)
	}
}

func verifyUserPassword(user *models.User, password string) bool {
	password = strings.TrimSpace(password)
	if password == "" {
		return false
	}
	stored := strings.TrimSpace(user.Password)
	if stored != "" {
		if err := bcrypt.CompareHashAndPassword([]byte(stored), []byte(password)); err == nil {
			return true
		}
		if stored == password {
			return true
		}
	}
	if pp := strings.TrimSpace(user.PlainPassword); pp != "" && pp == password {
		return true
	}
	return false
}
