package main

import (
	"strings"
)

func ValidateUserInput(firstName string, lastName string, email string, userTickets int) (bool, bool, bool) {

	isValidName :=len (firstName) >= 2 && len(lastName) >= 2
	isValidEmail := strings.Contains(email, "@")
	isValidTicketNumber := userTickets > 0 && userTickets <= remainingTickets

	return isValidName, isValidEmail, isValidTicketNumber
}
