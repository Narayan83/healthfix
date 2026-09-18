package main

import (
	"log"

	"health-fix-api/initializers"
	"health-fix-api/seeds"
)

func init() {
	initializers.LoadEnviromentVariables()
	initializers.ConnectToDb()
}

func main() {
	if err := seeds.SeedDoctorMastersFromCSV(); err != nil {
		log.Fatalf("seed doctor masters: %v", err)
	}
	log.Println("Doctor master seed completed successfully")
}
