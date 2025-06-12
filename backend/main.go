package main

import (
	"database/sql"
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
	Name           string `json:"name" validate:"required,min=3,max=50"`
	Origin         string `json:"origin" validate:"required,min=3,max=50"`
	Destination    string `json:"destination" validate:"required,min=3,max=50"`
	Date           string `json:"tripDate" validate:"required,date"`
	DepartureTime  string `json:"departureTime" validate:"required,time"`
	ArrivalTime    string `json:"arrivalTime" validate:"required,time"`
	TotalSeats     int    `json:"totalSeats" validate:"required,min=1"`
	RemainingSeats int    `json:"remainingSeats" `
}

type BusSeat struct {
	gorm.Model
	BusID      uint   `json:"busId" validate:"required"`
	SeatNumber int    `json:"seatNumber" validate:"required,min=1"`
	SeatStatus string `json:"seatStatus" gorm:"default:available"`
	BookingID  uint   `json:"bookingId"`
}

type BookingRequest struct {
	FirstName     string `json:"firstName"`
	LastName      string `json:"lastName"`
	Email         string `json:"email"`
	SelectedSeats []int  `json:"selectedSeats"`
}

type BusBooking struct {
	gorm.Model
	FirstName   string `json:"firstName" validate:"required,min=3,max=50"`
	LastName    string `json:"lastName" validate:"required,min=3,max=50"`
	Email       string `json:"email" validate:"required,email"`
	SeatNumber  int    `json:"seatNumber" validate:"required,min=1"`
	BusID       uint   `json:"busId" validate:"required"`
	BusName     string `json:"busName" `
	BookingDate string `json:"bookingDate"`
	BookingTime string `json:"bookingTime"`
	Status      string `json:"status" gorm:"default:confirmed"`
}

type Conference struct {
	gorm.Model
	Title            string `json:"title" validate:"required,min=3,max=50"`
	Description      string `json:"description" validate:"required,min=3,max=500"`
	StartDate        string `json:"startDate" validate:"required,date"`
	EndDate          string `json:"endDate" validate:"required,date"`
	Location         string `json:"location" validate:"required,min=3,max=50"`
	TotalTickets     int    `json:"totalTickets" validate:"required,min=1"`
	RemainingTickets int    `json:"remainingTickets" `
}

type ConferenceBooking struct {
	gorm.Model
	FirstName      string `json:"firstName" validate:"required,min=3,max=50"`
	LastName       string `json:"lastName" validate:"required,min=3,max=50"`
	Email          string `json:"email" validate:"required,email"`
	Tickets        int    `json:"tickets" validate:"required,min=1"`
	ConferenceID   uint   `json:"conferenceId" validate:"required"`
	ConferenceName string `json:"conferenceName" `
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
	err = db.AutoMigrate(&BusBooking{}, &Bus{}, &BusSeat{}, &Conference{}, &ConferenceBooking{})
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

		// Create seats for this bus
		var seats []BusSeat
		for i := 1; i <= bus.TotalSeats; i++ {
			seats = append(seats, BusSeat{
				BusID:      bus.ID,
				SeatNumber: i,
				SeatStatus: "available",
			})
		}

		if err := db.Create(&seats).Error; err != nil {
			log.Fatal("Failed to create seats:", err)
		}

		fmt.Println("A new bus with seats has been created")
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
	r.GET("/api/bus/:id/seats", getBusSeats)
	r.GET("/api/bus/:id/seats/available", getAvailableSeats)
	// r.GET("/api/bus/:id/seats/all", getAllSeats)

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

	// Create the bus
	if err := db.Create(&bus).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create bus"})
		return
	}

	// Create seats for this bus
	var seats []BusSeat
	for i := 1; i <= bus.TotalSeats; i++ {
		seats = append(seats, BusSeat{
			BusID:      bus.ID,
			SeatNumber: i,
			SeatStatus: "available",
		})
	}

	if err := db.Create(&seats).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create seats"})
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

// Handler to get bus seats

// Handler function
func getBusSeats(c *gin.Context) {
	id := c.Param("id")

	// Verify bus exists
	var bus Bus
	if err := db.First(&bus, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Bus not found"})
		return
	}

	// Get all seats for this bus
	var seats []BusSeat
	if err := db.Where("bus_id = ?", id).Find(&seats).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch seats"})
		return
	}

	// Format response
	var seatList []map[string]interface{}
	for _, seat := range seats {
		seatList = append(seatList, map[string]interface{}{
			"seatNumber": seat.SeatNumber,
			"status":     seat.SeatStatus,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"bus":   bus,
		"seats": seatList,
	})
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

	var bookingRequest BookingRequest

	// Use ShouldBindJSON to properly parse the request body
	if err := c.ShouldBindJSON(&bookingRequest); err != nil {
		log.Printf("Error binding JSON: %v", err)
		log.Printf("Request body: %v", c.Request.Body)
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request body",
			"details": err.Error(),
		})
		return
	}

	log.Printf("Booking request received: %+v", bookingRequest)

	if len(bookingRequest.SelectedSeats) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No seat selected"})
		return
	}

	busIDParam := c.Param("id")
	var busID uint
	if _, err := fmt.Sscanf(busIDParam, "%d", &busID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid bus ID in URL"})
		return
	}

	if !ValidateUserInput(bookingRequest.FirstName, bookingRequest.LastName, bookingRequest.Email, 1) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	tx := db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Get bus info once
	var bus Bus
	if err := tx.First(&bus, busID).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusBadRequest, gin.H{"error": "Bus not found"})
		return
	}

	if len(bookingRequest.SelectedSeats) > bus.RemainingSeats {
		tx.Rollback()
		c.JSON(http.StatusBadRequest, gin.H{"error": "Not enough seats available"})
		return
	}

	// Create a slice to store all created bookings
	var bookings []BusBooking

	// Loop through selected seats and process each one
	for _, seatNum := range bookingRequest.SelectedSeats {
		var seat BusSeat
		if err := tx.Set("gorm:query_option", "FOR UPDATE").
			Where("bus_id = ? AND seat_number = ?", busID, seatNum).
			First(&seat).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Seat %d not found", seatNum)})
			return
		}

		if seat.SeatStatus != "available" {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Seat %d already booked", seatNum)})
			return
		}

		booking := BusBooking{
			FirstName:   bookingRequest.FirstName,
			LastName:    bookingRequest.LastName,
			Email:       bookingRequest.Email,
			SeatNumber:  seatNum,
			BusID:       busID,
			BusName:     bus.Name,
			BookingDate: time.Now().Format("2006-01-02"),
			BookingTime: time.Now().Format("15:04:05"),
		}

		if err := tx.Create(&booking).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create booking"})
			return
		}

		if err := tx.Model(&seat).Updates(map[string]interface{}{
			"seat_status": "booked",
			"booking_id":  booking.ID,
		}).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update seat status"})
			return
		}

		bookings = append(bookings, booking)
	}

	// Update bus remaining seats in bulk
	if err := tx.Model(&bus).Update("remaining_seats", gorm.Expr("remaining_seats - ?", len(bookingRequest.SelectedSeats))).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update bus seats"})
		return
	}

	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction"})
		return
	}

	// Send tickets asynchronously
	waitgroup.Add(1)
	go func() {
		defer waitgroup.Done()
		for _, booking := range bookings {
			sendTicket(1, booking.FirstName, booking.LastName, booking.Email)
		}
	}()

	c.JSON(http.StatusOK, gin.H{
		"message":     "Seats booked successfully!",
		"remaining":   bus.RemainingSeats - len(bookingRequest.SelectedSeats),
		"seatNumbers": bookingRequest.SelectedSeats,
	})
}

// Handler to get available seats for a bus
func getAvailableSeats(c *gin.Context) {
	busID := c.Param("id")
	var seats []BusSeat

	if err := db.Where("bus_id = ? AND seat_status = ?", busID, "available").Find(&seats).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch available seats"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"available_seats": seats})
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
			"seats":     booking.SeatNumber,
			"busname":   bus.Name, // Add bus name
			"CreatedAt": booking.CreatedAt,
			"Status":    booking.Status,
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
func sendTicket(count int, firstName, lastName, email string) {
	defer waitgroup.Done()

	time.Sleep(10 * time.Second)
	ticket := fmt.Sprintf("%d tickets for %s %s", count, firstName, lastName)
	log.Printf("Sending %d ticket(s) to %s %s at %s\n", count, firstName, lastName, email)

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
	var totalBusSeats, totalConferenceTickets sql.NullInt64
	var totalBusSeatsBooked, totalConferenceTicketsBooked int64

	db.Model(&Bus{}).Count(&busCount)
	db.Model(&Conference{}).Count(&conferenceCount)
	db.Model(&BusBooking{}).Count(&busBookingCount)
	db.Model(&ConferenceBooking{}).Count(&conferenceBookingCount)
	db.Model(&Bus{}).Select("SUM(total_seats)").Scan(&totalBusSeats)
	db.Model(&Conference{}).Select("SUM(total_tickets)").Scan(&totalConferenceTickets)
	db.Model(&BusBooking{}).Select("SUM(tickets)").Scan(&totalBusSeatsBooked)
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
