package main

import (
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

var (
	conferenceName         = "The Conf"
	conferenceTickets      = 50
	remainingTickets  uint = 50
	waitgroup         sync.WaitGroup
	bookings          []Booking // In-memory storage for bookings
)

type Booking struct {
	FirstName string `json:"firstName"`
	LastName  string `json:"lastName"`
	Email     string `json:"email"`
	Tickets   uint   `json:"tickets"`
}

func main() {
	// Create Gin router
	r := gin.Default()
	r.Use(CORSMiddleware())

	// Routes
	r.GET("/api/conference", getConferenceInfo)
	r.GET("/api/bookings", getBookings)
	r.POST("/api/book", bookTicketHandler)

	// Start server
	log.Println("Server running on :8080")
	if err := r.Run(":8081"); err != nil {
		log.Fatal(err)
	}
}

func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		c.Next()
	}
}

func getConferenceInfo(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"conferenceName": conferenceName,
		"totalTickets":   conferenceTickets,
		"remaining":      remainingTickets,
	})
}

func getBookings(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"bookings": bookings})
}

func bookTicketHandler(c *gin.Context) {
	var booking Booking
	if err := c.ShouldBindJSON(&booking); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// Validate input
	isValidName, isValidEmail, isValidTicketNumber := ValidateUserInput(
		booking.FirstName,
		booking.LastName,
		booking.Email,
		booking.Tickets,
	)

	if !isValidName || !isValidEmail || !isValidTicketNumber {
		errorMessages := make(map[string]string)

		if !isValidName {
			errorMessages["name"] = "First name and last name must be at least 2 characters long"
		}
		if !isValidEmail {
			errorMessages["email"] = "Email must contain @ symbol"
		}
		if !isValidTicketNumber {
			errorMessages["tickets"] = "Ticket number must be between 1 and remaining tickets"
		}

		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Validation failed",
			"details": errorMessages,
		})
		return
	}

	// Save to in-memory storage
	bookings = append(bookings, booking)

	// Update remaining tickets
	remainingTickets -= booking.Tickets

	// Async send ticket
	waitgroup.Add(1)
	go sendTicket(booking.Tickets, booking.FirstName, booking.LastName, booking.Email)

	c.JSON(http.StatusOK, gin.H{
		"message":   "Booking successful!",
		"remaining": remainingTickets,
	})
}

func sendTicket(tickets uint, firstName, lastName, email string) {
	defer waitgroup.Done()

	time.Sleep(10 * time.Second) // Simulate email sending delay
	ticket := fmt.Sprintf("%d tickets for %s %s", tickets, firstName, lastName)

	log.Printf("Sending ticket to %s: %s\n", email, ticket)
	// In production, integrate with real email service here
}



// func contains(s, substr string) bool {
// 	return len(s) >= len(substr) && len(substr) > 0 && len(s) > 0 && len(s) >= len(substr)
// }
