import React, { useState, useEffect } from "react";
import axios from "axios";
import BookingForm from "./BookingForm";
import RecentBookings from "../RecentBookings";
import BusPanel from "./BusPanel";
import CreateBusForm from "./CreateBusForm";
import SeatMap from "./SeatMap";
import "./BusBooking.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const BusBooking = () => {
  const [Loading, setLoading] = useState(true);
  const [buses, setBuses] = useState([]);
  const [selectedBus, setSelectedBus] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [busInfo, setBusInfo] = useState({
    busName: "",
    totalSeats: 0,
    remaining: 0,
    seatLayout: [],
  });
  const [busBookings, setBusBookings] = useState([]);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    selectedSeats: [], 
  });
  console.log(formData);
  console.log(formData.selectedSeats);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    axios.get("http://localhost:8085/api/bus").then((res) => {
      setBuses(res.data.buses || []);
      setSelectedBus(null);
    });
  }, []);

  useEffect(() => {
    if (!selectedBus) return;

    const fetchBusData = async () => {
      try {
        setLoading(true);
        const [busRes, seatsRes, bookingsRes] = await Promise.all([
          axios.get(`http://localhost:8085/api/bus/${selectedBus.ID}`),
          axios.get(`http://localhost:8085/api/bus/${selectedBus.ID}/seats`),
          axios.get(`http://localhost:8085/api/bus/${selectedBus.ID}/bookings`)
        ]);

        const bus = busRes.data.bus;
        setBusInfo({
          busName: bus.name || "",
          totalSeats: bus.totalSeats || 0,
          remaining: bus.remainingSeats || 0,
          seatLayout: seatsRes.data.seats || [],
        });

        setBusBookings(
          Array.isArray(bookingsRes.data.bookings)
            ? bookingsRes.data.bookings
            : []
        );
      } catch (err) {
        console.error("Error fetching bus data:", err);
        toast.error("Failed to load bus data");
      } finally {
        setLoading(false);
      }
    };

    fetchBusData();
  }, [selectedBus]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = "First Name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last Name is required";
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "A valid Email is required";
    }
    if (formData.selectedSeats.length === 0) {
      newErrors.seats = "Please select at least one seat";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSeatSelect = (seatNumber) => {
    setFormData(prev => ({
      ...prev,
      selectedSeats: prev.selectedSeats.includes(seatNumber)
        ? prev.selectedSeats.filter(s => s !== seatNumber)
        : [...prev.selectedSeats, seatNumber]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      await axios.post(
        `http://localhost:8085/api/bus/${selectedBus.ID}/book`,
        {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          selectedSeats: formData.selectedSeats,
        }
      );
      console.log("", formData.selectedSeats);

      toast.success(`Successfully booked ${formData.selectedSeats.length} seat(s)`);
      
      // Reset form
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        selectedSeats: [],
      });

      // Refresh data
      const [busRes, seatsRes, bookingsRes] = await Promise.all([
        axios.get(`http://localhost:8085/api/bus/${selectedBus.ID}`),
        axios.get(`http://localhost:8085/api/bus/${selectedBus.ID}/seats`),
        axios.get(`http://localhost:8085/api/bus/${selectedBus.ID}/bookings`)
      ]);

      const bus = busRes.data.bus;
      setBusInfo({
        busName: bus.name || "",
        totalSeats: bus.totalSeats || 0,
        remaining: bus.remainingSeats || 0,
        seatLayout: seatsRes.data.seats || [],
      });

      setBusBookings(bookingsRes.data.bookings || []);

    } catch (error) {
      const errorMessage = error.response?.data?.error || 
                         "An unexpected error occurred. Please try again.";
      toast.error(errorMessage);
      console.error("Booking error:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <>
      <ToastContainer />
      {!showCreateForm && (
        <button
          className="create-bus-btn"
          onClick={() => setShowCreateForm(true)}
          style={{ marginBottom: "1rem" }}
        >
          + Create New Bus Trip
        </button>
      )}
      
      {showCreateForm ? (
        <CreateBusForm
          onBusCreated={(bus) => {
            setBuses(prev => [...prev, bus]);
            setShowCreateForm(false);
          }}
          onCancel={() => setShowCreateForm(false)}
        />
      ) : !selectedBus ? (
        <BusPanel
          buses={buses}
          selectedBus={selectedBus}
          setSelectedBus={setSelectedBus}
        />
      ) : (
        <>
          <button
            className="back-btn"
            onClick={() => setSelectedBus(null)}
            style={{ marginBottom: "1rem" }}
          >
            ← Back to Buses
          </button>
          
          <h1 className="header">Book Seats for {busInfo.busName}</h1>
          <p className="remaining-tickets">
            Total Seats: {busInfo.totalSeats} | Remaining Seats: {busInfo.remaining}
          </p>

          <div className="seat-selection-container">
            <h3>Select Your Seats</h3>
            <SeatMap
              seats={busInfo.seatLayout}
              selectedSeats={formData.selectedSeats}
              onSeatSelect={handleSeatSelect}
            />
            {errors.seats && <p className="error-message">{errors.seats}</p>}
          </div>

          <BookingForm
            formData={formData}
            errors={errors}
            handleChange={handleChange}
            handleSubmit={handleSubmit}
            selectedSeatsCount={formData.selectedSeats.length}
          />

          {busBookings.length > 0 ? (
            <RecentBookings bookings={busBookings} />
          ) : (
            <p>No recent bookings for this bus.</p>
          )}
        </>
      )}
    </>
  );
};

export default BusBooking;