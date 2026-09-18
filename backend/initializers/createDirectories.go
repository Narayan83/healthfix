package initializers

import "os"

func CreateRequiredDirectories() {
	dirs := []string{"uploads"}
	for _, dir := range dirs {
		if err := os.MkdirAll(dir, 0755); err != nil {
			panic("Failed to create directory " + dir + ": " + err.Error())
		}
	}
}
