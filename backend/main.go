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
	waitgroup sync.WaitGroup
	db        *gorm.DB
	busName   = "Bee Tours"
)

type Bus struct {
	gorm.Model
	Name           string `json:"name"`
	Origin         string `json:"origin"`
	Destination    string `json:"destination"`
	Date           string `json:"tripDate"`
	DepartureTime  string `json:"departureTime"`
	ArrivalTime    string `json:"arrivalTime"`
	TotalSeats     int    `json:"totalSeats"`
	RemainingSeats int    `json:"remainingSeats"`
}

type BusBooking struct {
	gorm.Model
	FirstName   string `json:"firstName"`
	LastName    string `json:"lastName"`
	Email       string `json:"email"`
	Seats       int    `json:"seats"`
	BusID       uint   `json:"busId"`
	BusName     string `json:"busName"`
	BookingDate string `json:"bookingDate"`
	BookingTime string `json:"bookingTime"`
}

type Conference struct {
	gorm.Model
	Title            string `json:"title"`
	Description      string `json:"description"`
	StartDate        string `json:"startDate"`
	EndDate          string `json:"endDate"`
	Location         string `json:"location"`
	TotalTickets     int    `json:"totalTickets"`
	RemainingTickets int    `json:"remainingTickets"`
}

type ConferenceBooking struct {
	gorm.Model
	FirstName      string `json:"firstName"`
	LastName       string `json:"lastName"`
	Email          string `json:"email"`
	Tickets        int    `json:"tickets"`
	ConferenceID   uint   `json:"conferenceId"`
	ConferenceName string `json:"conferenceName"`
	BookingDate    string `json:"bookingDate"`
	BookingTime    string `json:"bookingTime"`
}

func main() {

	initDB()
	defer waitgroup.Wait() // Wait for all goroutines to finish

	// Create Gin router
	r := gin.Default()
	r.Use(CORSMiddleware())

	// Set up routes
	setupRoutes(r)

	log.Println("Server running on :8085")
	if err := r.Run(":8085"); err != nil {
		log.Fatal(err)

	}
}

// function to initialize the database connection MySQL database
func initDB() {
	var err error

	db, err = gorm.Open(mysql.Open("ticket_user:password123@tcp(localhost:3306)/tickets_db?parseTime=true"), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to the database:", err)
	}

	fmt.Println("Connected to the database")

	// Migrate the schema
	err = db.AutoMigrate(&BusBooking{}, &Bus{}, &Conference{}, &ConferenceBooking{})
	if err != nil {
		log.Fatal("Failed to migrate the database:", err)
	}
	fmt.Println("Database migrated")

	setupInitialBus()
}

// Function to set up the initial bus if it doesn't exist
func setupInitialBus() {
	var bus Bus
	result := db.Where("name = ?", busName).First(&bus)
	if result.Error != nil && errors.Is(result.Error, gorm.ErrRecordNotFound) {
		// Create a new bus
		bus = Bus{
			Name:           busName,
			Origin:         "City A",
			Destination:    "City B",
			DepartureTime:  "2023-10-01 10:00:00",
			ArrivalTime:    "2023-10-01 11:00:00",
			TotalSeats:     50,
			RemainingSeats: 50,
		}
		if err := db.Create(&bus).Error; err != nil {
			log.Fatal("Failed to create bus:", err)
		}
		fmt.Println("A new bus has been created")
	}
}

// Function to set up the routes for the API endpoints that handle bus and conference bookings from the frontend
func setupRoutes(r *gin.Engine) {
	// Bus endpoints
	r.GET("/api/bus", getAllBuses)
	r.POST("/api/bus", createBus)
	r.GET("/api/bus/:id", getBusInfoByID)
	r.GET("/api/bus/:id/bookings", getBusBookings)
	r.POST("/api/bus/:id/book", bookBusTicketHandler)

	// Conference endpoints
	r.GET("/api/conferences", getAllConferences)
	r.POST("/api/conferences", createConference)
	r.GET("/api/conference/:id", getConferenceInfoByID)
	r.GET("/api/conference/:id/bookings", getConferenceBookings)
	r.POST("/api/conference/:id/book", bookConferenceTicketHandler)

	// Dashboard endpoint
	r.GET("/api/dashboard_summary", getDashboardSummary)
	r.GET("/api/bus_bookings", getAllBusBookings)
	r.GET("/api/conference_bookings", getAllConferenceBookings)
}

// Function to handle CORS requests
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

// Handler to book a conference ticket
func bookConferenceTicketHandler(c *gin.Context) {
	var booking ConferenceBooking
	if err := c.ShouldBindJSON(&booking); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	if !ValidateUserInput(booking.FirstName, booking.LastName, booking.Email, booking.Tickets) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	// Find the conference by ID from the URL parameter
	conferenceID := c.Param("id")
	var conference Conference
	if err := db.First(&conference, conferenceID).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Conference not found"})
		return
	}

	// Check if there are enough tickets available
	if booking.Tickets > conference.RemainingTickets {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Not enough tickets left", "remaining": conference.RemainingTickets})
		return
	}

	// Set the ConferenceID in the booking
	booking.ConferenceID = conference.ID

	// Start a transaction
	tx := db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Update the conference remaining tickets
	if err := tx.Model(&conference).Where("id = ?", conference.ID).Update("remaining_tickets",
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

// Handler to get all conferences
func getAllConferences(c *gin.Context) {
	var conferences []Conference
	if err := db.Find(&conferences).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch conferences"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"conferences": conferences})
}

// Handler to create a new conference
func createConference(c *gin.Context) {
	var conference Conference
	if err := c.ShouldBindJSON(&conference); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}
	if conference.Title == "" || conference.TotalTickets <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Title and TotalTickets are required"})
		return
	}
	conference.RemainingTickets = conference.TotalTickets
	if err := db.Create(&conference).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create conference"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"conference": conference})
}

// Function to create a new bus
func createBus(c *gin.Context) {
	var bus Bus
	if err := c.ShouldBindJSON(&bus); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}
	if bus.Name == "" || bus.TotalSeats <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Name and TotalSeats are required"})
		return
	}
	bus.RemainingSeats = bus.TotalSeats
	if err := db.Create(&bus).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create bus"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"bus": bus})
}

// Handler to get all buses
func getAllBuses(c *gin.Context) {
	var buses []Bus
	if err := db.Find(&buses).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch buses"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"buses": buses})
}

// Handler to get conference info by ID
func getConferenceInfoByID(c *gin.Context) {
	id := c.Param("id")
	var conference Conference
	if err := db.First(&conference, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Conference not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"conference": conference})
}

// Handler to get all bookings for a specific conference
func getConferenceBookings(c *gin.Context) {
	var bookings []ConferenceBooking
	conferenceID := c.Param("id")

	if err := db.Where("conference_id = ?", conferenceID).Find(&bookings).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch bookings for the conference"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"bookings": bookings})
}

// GetBusInfoByID returns a bus by its ID
func getBusInfoByID(c *gin.Context) {
	id := c.Param("id")
	var bus Bus
	if err := db.First(&bus, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Bus not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"bus": bus})
}

// Handler to get bookings for a specific bus
func getBusBookings(c *gin.Context) {
	var bookings []BusBooking
	busID := c.Param("id")

	if err := db.Where("bus_id = ?", busID).Find(&bookings).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch bookings for the bus"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"bookings": bookings})
}

// Handler to book a bus ticket
func bookBusTicketHandler(c *gin.Context) {
	var booking BusBooking
	if err := c.ShouldBindJSON(&booking); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	if !ValidateUserInput(booking.FirstName, booking.LastName, booking.Email, booking.Seats) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	// Find the bus by ID from the booking
	var bus Bus
	if err := db.First(&bus, booking.BusID).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Bus not found"})
		return
	}

	// Check if there are enough seats available
	if booking.Seats > bus.RemainingSeats {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Not enough seats left", "remaining": bus.RemainingSeats})
		return
	}

	// start a transaction
	tx := db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Update the bus remaining seats
	if err := tx.Model(&bus).Where("id = ?", bus.ID).Update("remaining_seats",
		gorm.Expr("remaining_seats - ?", booking.Seats)).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update bus seats"})
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
	go sendTicket(booking.Seats, booking.FirstName, booking.LastName, booking.Email)

	c.JSON(http.StatusOK, gin.H{
		"message":   "Booking successful!",
		"remaining": bus.RemainingSeats - booking.Seats,
	})
}

// Handler to get all bus bookings with bus name
func getAllBusBookings(c *gin.Context) {
	var bookings []BusBooking
	if err := db.Find(&bookings).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch bus bookings"})
		return
	}

	var result []map[string]interface{}
	for _, booking := range bookings {
		var bus Bus
		db.First(&bus, booking.BusID)
		m := map[string]interface{}{
			"ID":        booking.ID,
			"firstName": booking.FirstName,
			"lastName":  booking.LastName,
			"email":     booking.Email,
			"seats":     booking.Seats,
			"busname":   bus.Name, // Add bus name
			"CreatedAt": booking.CreatedAt,
		}
		result = append(result, m)
	}
	c.JSON(http.StatusOK, gin.H{"bookings": result})
}

// Handler to get all conference bookings with conference name
func getAllConferenceBookings(c *gin.Context) {
	var bookings []ConferenceBooking
	if err := db.Find(&bookings).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch conference bookings"})
		return
	}

	var result []map[string]interface{}
	for _, booking := range bookings {
		var conf Conference
		db.First(&conf, booking.ConferenceID)
		m := map[string]interface{}{
			"ID":             booking.ID,
			"firstName":      booking.FirstName,
			"lastName":       booking.LastName,
			"email":          booking.Email,
			"tickets":        booking.Tickets,
			"conferenceName": conf.Title, // Add conference name
			"CreatedAt":      booking.CreatedAt,
		}
		result = append(result, m)
	}
	c.JSON(http.StatusOK, gin.H{"bookings": result})
}

// Function to send a ticket  asynchronously
func sendTicket(tickets int, firstName, lastName, email string) {
	defer waitgroup.Done()

	time.Sleep(10 * time.Second)
	ticket := fmt.Sprintf("%d tickets for %s %s", tickets, firstName, lastName)

	log.Printf("Sending ticket to %s: %s\n", email, ticket)
}

// ValidateUserInput checks if the user input is valid
func ValidateUserInput(firstName, lastName, email string, tickets int) bool {
	isValidName := len(firstName) > 1 && len(lastName) > 1
	isValidEmail := len(email) > 3 && strings.Contains(email, "@")
	isValidTicketNumber := tickets > 0

	return isValidName && isValidEmail && isValidTicketNumber
}

// Handler to get the dashboard summary
func getDashboardSummary(c *gin.Context) {
	var busCount, conferenceCount, busBookingCount, conferenceBookingCount int64
	var totalBusSeats, totalConferenceTickets, totalBusSeatsBooked, totalConferenceTicketsBooked int64

	db.Model(&Bus{}).Count(&busCount)
	db.Model(&Conference{}).Count(&conferenceCount)
	db.Model(&BusBooking{}).Count(&busBookingCount)
	db.Model(&ConferenceBooking{}).Count(&conferenceBookingCount)
	db.Model(&Bus{}).Select("SUM(total_seats)").Scan(&totalBusSeats)
	db.Model(&Conference{}).Select("SUM(total_tickets)").Scan(&totalConferenceTickets)
	db.Model(&BusBooking{}).Select("SUM(seats)").Scan(&totalBusSeatsBooked)
	db.Model(&ConferenceBooking{}).Select("SUM(tickets)").Scan(&totalConferenceTicketsBooked)

	c.JSON(200, gin.H{
		"busCount":                     busCount,
		"conferenceCount":              conferenceCount,
		"busBookingCount":              busBookingCount,
		"conferenceBookingCount":       conferenceBookingCount,
		"totalBusSeats":                totalBusSeats,
		"totalConferenceTickets":       totalConferenceTickets,
		"totalBusSeatsBooked":          totalBusSeatsBooked,
		"totalConferenceTicketsBooked": totalConferenceTicketsBooked,
	})
}
