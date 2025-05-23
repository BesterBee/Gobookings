package main

import (
	"errors"
	"fmt"
	"log"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

var (
	conferenceName = "Endaweni"
	waitgroup      sync.WaitGroup
	db             *gorm.DB
)

type Booking struct {
	gorm.Model
	Id        int
	FirstName string `json:"firstName"`
	LastName  string `json:"lastName"`
	Email     string `json:"email"`
	Tickets   int    `json:"tickets"`
}

type Conference struct {
	gorm.Model
	Id               int
	Title            string `json:"title"`
	Description      string `json:"description"`
	StartDate        string `json:"startDate"`
	EndDate          string `json:"endDate"`
	Location         string `json:"location"`
	TotalTickets     int    `json:"totalTickets"`
	RemainingTickets int    `json:"remainingTickets"`
}

func main() {
	// Initialize the database
	initDB()
	defer waitgroup.Wait() // Wait for all goroutines to finish

	// Create Gin router
	r := gin.Default()
	r.Use(CORSMiddleware())

	// Set up routes
	setupRoutes(r)

	log.Println("Server running on :8081")
	if err := r.Run(":8081"); err != nil {
		log.Fatal(err)

	}
}

func initDB() {
	var err error

	db, err = gorm.Open(mysql.Open("ticket_user:password123@tcp(localhost:3306)/tickets_db?parseTime=true"), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to the database:", err)
	}

	fmt.Println("Connected to the database")

	// Migrate the schema
	err = db.AutoMigrate(&Booking{}, &Conference{})
	if err != nil {
		log.Fatal("Failed to migrate the database:", err)
	}
	fmt.Println("Database migrated")

	setupInitialConference()
}

func setupInitialConference() {
	//check if the conference already exists
	var conference Conference
	result := db.Where("title = ?", conferenceName).First(&conference)
	if result.Error != nil && errors.Is(result.Error, gorm.ErrRecordNotFound) {
		// Create a new conference
		conference = Conference{
			Title:            conferenceName,
			Description:      "A conference about Go programming",
			StartDate:        "2023-10-01",
			EndDate:          "2023-10-02",
			Location:         "Online",
			TotalTickets:     50,
			RemainingTickets: 50,
		}
		if err := db.Create(&conference).Error; err != nil {
			log.Fatal("Failed to create conference:", err)
		}
		fmt.Println("A new conference has been created")
	}
}

func setupRoutes(r *gin.Engine) {
	r.GET("/api/conference", getConferenceInfo)
	r.GET("/api/bookings", getBookings)
	r.POST("/api/book", bookTicketHandler)
}

func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	}
}

func getConferenceInfo(c *gin.Context) {
	var conference Conference
	if err := db.Where("title = ?", conferenceName).First(&conference).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Conference not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"Conference": conference,
	})
}

func getBookings(c *gin.Context) {
	var bookings []Booking
	if err := db.Find(&bookings).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch bookings"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"These are the bookings": bookings})
}

func bookTicketHandler(c *gin.Context) {
	var booking Booking
	if err := c.ShouldBindJSON(&booking); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	if !ValidateUserInput(booking.FirstName, booking.LastName, booking.Email, booking.Tickets) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	// Check if there are enough tickets available
	var conference Conference
	if err := db.Where("title = ?", conferenceName).First(&conference).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Conference not found"})
		return
	}

	// Check if there are enough tickets available
	if booking.Tickets > conference.RemainingTickets {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Not enough tickets left", "remaining": conference.RemainingTickets})
		return
	}

	// start a transaction
	tx := db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Update the conference tickets
	if err := tx.Model(&conference).Where("title = ?", conferenceName).Update("remaining_tickets",
		gorm.Expr("remaining_tickets - ?", booking.Tickets)).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update conference tickets"})
		return
	}
	// Create the booking
	if err := tx.Create(&booking).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create booking"})
		return
	}

	// Commit the transaction
	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction"})
		return
	}

	// Async send ticket
	waitgroup.Add(1)
	go sendTicket(booking.Tickets, booking.FirstName, booking.LastName, booking.Email)

	c.JSON(http.StatusOK, gin.H{
		"message":   "Booking successful!",
		"remaining": conference.RemainingTickets - booking.Tickets,
	})
}

func sendTicket(tickets int, firstName, lastName, email string) {
	defer waitgroup.Done()

	time.Sleep(10 * time.Second)
	ticket := fmt.Sprintf("%d tickets for %s %s", tickets, firstName, lastName)

	log.Printf("Sending ticket to %s: %s\n", email, ticket)
}

func ValidateUserInput(firstName, lastName, email string, tickets int) bool {
	isValidName := len(firstName) > 1 && len(lastName) > 1
	isValidEmail := len(email) > 3 && strings.Contains(email, "@")
	isValidTicketNumber := tickets > 0

	return isValidName && isValidEmail && isValidTicketNumber
}
