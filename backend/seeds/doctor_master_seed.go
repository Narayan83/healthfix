package seeds

import (
	"encoding/csv"
	"fmt"
	"io"
	"log"
	"os"
	"path/filepath"
	"strings"

	"health-fix-api/initializers"
	"health-fix-api/models"
	"gorm.io/gorm"
)

func doctorMasterCSVPath() string {
	if p := strings.TrimSpace(os.Getenv("DOCTOR_MASTER_CSV")); p != "" {
		return p
	}
	return filepath.Join("seeds", "data", "DOCTOR_MASTER.csv")
}

func SeedDoctorMastersFromCSV() error {
	path := doctorMasterCSVPath()
	f, err := os.Open(path)
	if err != nil {
		return fmt.Errorf("open doctor master csv %q: %w", path, err)
	}
	defer f.Close()

	rows, err := readDoctorCSV(f)
	if err != nil {
		return err
	}
	if len(rows) == 0 {
		return fmt.Errorf("doctor master csv %q has no data rows", path)
	}

	db := initializers.DB
	return db.Transaction(func(tx *gorm.DB) error {
		areaIDs, err := upsertAreasFromDoctorRows(tx, rows)
		if err != nil {
			return err
		}

		if err := tx.Session(&gorm.Session{AllowGlobalUpdate: true}).Delete(&models.DoctorMaster{}).Error; err != nil {
			return fmt.Errorf("delete doctor masters: %w", err)
		}

		for _, row := range rows {
			areaName := strings.TrimSpace(row["AREA"])
			areaID, ok := areaIDs[strings.ToLower(areaName)]
			if !ok {
				return fmt.Errorf("missing area master for %q", areaName)
			}

			doctor := models.DoctorMaster{
				FullName:           strings.TrimSpace(row["full_name"]),
				Mobile:             strings.TrimSpace(row["mobile"]),
				Degree:             strings.TrimSpace(row["degree"]),
				Department:         strings.TrimSpace(row["department"]),
				AddressLine1:       strings.TrimSpace(row["address_line1"]),
				AddressLine2:       strings.TrimSpace(row["address_line2"]),
				City:               strings.TrimSpace(row["city"]),
				State:              strings.TrimSpace(row["state"]),
				PostalCode:         strings.TrimSpace(row["postal_code"]),
				HospitalNumber:     strings.TrimSpace(row["hospital_number"]),
				Gender:             strings.TrimSpace(row["gender"]),
				DateOfBirth:        strings.TrimSpace(row["date_of_birth"]),
				WeddingAnniversary: strings.TrimSpace(row["wedding_anniversary"]),
				Status:             "active",
				AreaID:             &areaID,
			}
			if doctor.FullName == "" {
				return fmt.Errorf("doctor row missing full_name")
			}
			if err := tx.Create(&doctor).Error; err != nil {
				return fmt.Errorf("insert doctor %q: %w", doctor.FullName, err)
			}
		}

		return nil
	})
}

func readDoctorCSV(r io.Reader) ([]map[string]string, error) {
	reader := csv.NewReader(r)
	reader.TrimLeadingSpace = true

	header, err := reader.Read()
	if err != nil {
		return nil, fmt.Errorf("read csv header: %w", err)
	}
	for i, col := range header {
		header[i] = strings.TrimSpace(col)
	}

	var rows []map[string]string
	for {
		record, err := reader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			return nil, fmt.Errorf("read csv row: %w", err)
		}
		if len(record) == 0 || strings.TrimSpace(strings.Join(record, "")) == "" {
			continue
		}

		row := make(map[string]string, len(header))
		for i, col := range header {
			if i < len(record) {
				row[col] = record[i]
			}
		}
		rows = append(rows, row)
	}
	return rows, nil
}

func upsertAreasFromDoctorRows(tx *gorm.DB, rows []map[string]string) (map[string]uint, error) {
	unique := make(map[string]string)
	for _, row := range rows {
		name := strings.TrimSpace(row["AREA"])
		if name == "" {
			return nil, fmt.Errorf("doctor row for %q is missing AREA", strings.TrimSpace(row["full_name"]))
		}
		unique[strings.ToLower(name)] = name
	}

	areaIDs := make(map[string]uint, len(unique))
	for _, name := range unique {
		var area models.AreaMaster
		err := tx.Where("LOWER(name) = LOWER(?)", name).Limit(1).Find(&area).Error
		if err != nil {
			return nil, fmt.Errorf("lookup area %q: %w", name, err)
		}
		if area.ID == 0 {
			area = models.AreaMaster{Name: name, Status: "active"}
			if err := tx.Create(&area).Error; err != nil {
				return nil, fmt.Errorf("create area %q: %w", name, err)
			}
			log.Printf("Created area master: %s (id=%d)", area.Name, area.ID)
		} else {
			log.Printf("Using existing area master: %s (id=%d)", area.Name, area.ID)
		}
		areaIDs[strings.ToLower(name)] = area.ID
	}
	return areaIDs, nil
}
