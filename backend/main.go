package main

import "fmt"

func main() {
	fmt.Println("Hello, World!")

	name := "Go Developer"
	fmt.Printf("Welcome, %s!\n", name)

	sum := add(5, 7)
	fmt.Println("5 + 7 =", sum)
}

func add(a, b int) int {
	return a + b
}
