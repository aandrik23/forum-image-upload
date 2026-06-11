package internal

import (
	"forum/internal/database"
	"forum/internal/logger"
	"os"
	"strings"
)

func CheckArguments() {
	args := os.Args[1:]
	if len(args) == 0 {
		return // no flag passed
	}
	for _, flag := range args {
		flag = strings.TrimSpace(flag)
		switch flag {
		case "--debug", "-d":
			logger.Debug = true
			logger.Log("Debug messages are turned on", logger.InfoLevel)
		case "--seed", "-s":
			database.Seed = true
		case "--logs", "-l":
			logger.Enable = true
		}
	}
}
