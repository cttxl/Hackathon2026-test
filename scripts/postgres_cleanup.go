package main

import (
	"bufio"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

func main() {
	fmt.Print("Are you sure you want to delete the database? (y/n): ")
	reader := bufio.NewReader(os.Stdin)
	ans, _ := reader.ReadString('\n')
	ans = strings.TrimSpace(ans)

	if strings.ToLower(ans) == "y" {
		target := filepath.Join("out", "pgdata")
		err := os.RemoveAll(target)
		if err != nil {
			fmt.Printf("Failed to delete %s: %v\n", target, err)
		} else {
			fmt.Println("Database deleted successfully.")
		}
	} else {
		fmt.Println("Database not deleted.")
	}
}
