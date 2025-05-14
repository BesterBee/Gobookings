package main

import (
	"fmt"
	"strings"
	"sync"
	"time"
)

var conferenceName = "The Conf"

const conferenceTickets int = 50

var remainingTickets uint = 50
//bookings is a slice of strings
var bookings = make([]UserData, 0)

type UserData struct {
	firstName string
	lastName  string
	email     string
	userTickets uint
}

var waitgroup = sync.WaitGroup{}

func main() {

	//Welcome message
	greetUsers()


		firstName, lastName, email, userTickets := getUserInfo()
		//validate user input
		isValidName, isValidEmail, isValidTicketNumber := ValidateUserInput(firstName, lastName, email, userTickets)

		if isValidName && isValidEmail && isValidTicketNumber {

			bookTicket(userTickets, firstName, lastName, email)

		}

		waitgroup.Add(1)
		//send ticket
		go sendTicket(userTickets, firstName, lastName, email)

		//print first names
		firstNames := getFirstNames()
		fmt.Printf("Bookings list using first names: %v\n", firstNames)

		if remainingTickets == 0 {
			fmt.Println("Oops! All tickets are sold out!")
		

		} else {
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
	
		waitgroup.Wait()
}

func greetUsers() {
	fmt.Printf("Welcome to %v booking application!\n", conferenceName)
	fmt.Printf("We have a total of %v tickets and %v are still available.\n", conferenceTickets, remainingTickets)
	fmt.Println("Start here to grab your ticket.")

}

func getFirstNames() []string {
	firstNames := []string{}
	for _, booking := range bookings {
		var names = strings.Fields(booking.firstName)
		var firstName = names[0]
		firstNames = append(firstNames, firstName)
	}
	return firstNames
}

func getUserInfo() (string, string, string, uint) {
	var firstName string
	var lastName string
	var email string
	var userTickets uint

	fmt.Println("Hie, what is your First name?")
	fmt.Scan(&firstName)
	fmt.Println("What is your Last name?")
	fmt.Scan(&lastName)
	fmt.Println("What is your email?")
	fmt.Scan(&email)
	fmt.Println("How many tickets do you want to buy?")
	fmt.Scan(&userTickets)

	return firstName, lastName, email, userTickets
}

func bookTicket(userTickets uint, firstName string, lastName string, email string) {
	remainingTickets = remainingTickets - userTickets

	//map for user data
	var userData = UserData{
		firstName:   firstName,
		lastName:    lastName,
		email:       email,
		userTickets: userTickets,
	}
	
	bookings = append(bookings, userData)
	fmt.Printf("List of bookings: %v\n", bookings)

	fmt.Printf("You have booked %v tickets for %v %v\n", userTickets, firstName, lastName)
	fmt.Printf("A confirmation email will be sent to %v\n", email)
	fmt.Println("Thank you for booking your tickets!")

	fmt.Printf(" %v tickets are still available.\n", remainingTickets)

	fmt.Printf("The first booking is from: %v\n", bookings[0])
	// fmt.Printf("Slice type: %T and slice length: %v\n", bookings, len(bookings))
}

func sendTicket (userTickets uint, firstName string, lastName string, email string) {
	time.Sleep(10 * time.Second)
	var ticket = fmt.Sprintf("%v tickets for %v %v wil be sent to %v\n", userTickets, firstName, lastName, email)
	fmt.Println("#########################")
	fmt.Printf("Sending %v to  %v\n", ticket, email)
	fmt.Println("#########################")
	waitgroup.Done()
	fmt.Println("Ticket sent successfully!")
}