package main

import (
	"fmt"
	"strings"
)

func main() {
	conferenceName := "The Conf"
	// fmt.Println("",conferenceName)
	const conferenceTickets int = 50
	var remainingTickets uint = 50
	var firstName string
	var lastName string
	var email string
	var userTickets uint
	bookings := []string{}

	fmt.Printf("Welcome to %v booking application!\n", conferenceName)
	fmt.Printf("We have a total of %v tickets and %v are still available.\n", conferenceTickets, remainingTickets)
	fmt.Println("Start here to grab your ticket.")

	for  { 

		fmt.Println("Hie, what is your First name?")
		fmt.Scan(&firstName)
		fmt.Println("What is your Last name?")
		fmt.Scan(&lastName)
		fmt.Println("What is your email?")
		fmt.Scan(&email)
		fmt.Println("How many tickets do you want to buy?")
		fmt.Scan(&userTickets)

		isValidName :=len (firstName) >= 2 && len(lastName) >= 2
		isValidEmail := strings.Contains(email, "@")
		isValidTicketNumber := userTickets > 0 && userTickets <= remainingTickets

		if isValidName && isValidEmail && isValidTicketNumber {
					
		remainingTickets = remainingTickets - userTickets
		bookings = append(bookings, firstName+" "+lastName)

		fmt.Printf("You have booked %v tickets for %v %v\n", userTickets, firstName, lastName)
		fmt.Printf("A confirmation email will be sent to %v\n", email)
		fmt.Println("Thank you for booking your tickets!")
		fmt.Printf(" %v tickets are still available.\n", remainingTickets)

		firstNames := []string{}
		for _, booking := range bookings {
			var names = strings.Fields(booking)
			var firstName = names[0]
			firstNames = append(firstNames, firstName)
		}
		fmt.Printf("These are all our bookings using first names: %v\n", firstNames)
		fmt.Printf("The first booking is from: %v\n", bookings[0])
		fmt.Printf("Slice type: %T and slice length: %v\n", bookings, len(bookings))

		}
		
		if remainingTickets == 0 {
			fmt.Println("Oops! All tickets are sold out!")
			break
		
		}else
		{
			if !isValidName {
				fmt.Println("Invalid First name or Last name input. Please try again.")
			}
			if !isValidEmail {
				fmt.Println("Invalid email input, email should contain @ symbol. Please try again.")
			}
			if !isValidTicketNumber {
				fmt.Println("Invalid ticket number. Please try again.")
			}
			

		}
	}

}
