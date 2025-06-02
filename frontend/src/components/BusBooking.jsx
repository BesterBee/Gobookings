import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BookingForm from './BookingForm';
import RecentBookings from './RecentBookings';
import BusPanel from './BusPanel';
import CreateBusForm from './CreateBusForm';

const BusBooking = () => {
  const [buses, setBuses] = useState([]);
  const [selectedBus, setSelectedBus] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [busInfo, setBusInfo] = useState({ busName: '', totalSeats: 0, remaining: 0 });
  const [busBookings, setBusBookings] = useState([]);
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', seats: '', tickets: '' });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    axios.get('http://localhost:8085/api/bus').then(res => {
      setBuses(res.data.buses || []);
      setSelectedBus(null);
    });
  }, []);

  useEffect(() => {
    if (!selectedBus) return;
    axios.get(`http://localhost:8085/api/bus/${selectedBus.ID}`).then(res => {
      const bus = res.data.bus;
      setBusInfo({
        busName: bus.name || '',
        totalSeats: bus.totalSeats || '',
        remaining: bus.remainingSeats || '',
      });
    });
    axios.get(`http://localhost:8085/api/bus/${selectedBus.ID}/bookings`).then(res => {
      setBusBookings(Array.isArray(res.data.bookings) ? res.data.bookings : []);
    });
  }, [selectedBus]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'First Name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last Name is required';
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'A valid Email is required';
    if (formData.seats <= 0) newErrors.seats = 'At least 1 seat must be booked';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      const payload = { ...formData, seats: Number(formData.seats), busId: selectedBus.ID };
      const response = await axios.post(`http://localhost:8085/api/bus/${selectedBus.ID}/book`, payload);
      alert(response.data.message);
      setFormData({ firstName: '', lastName: '', email: '', seats: '', tickets: '' });
      setBusInfo(prev => ({ ...prev, remaining: response.data.remaining }));
      const bookingsRes = await axios.get(`http://localhost:8085/api/bus/${selectedBus.ID}/bookings`);
      setBusBookings(Array.isArray(bookingsRes.data.bookings) ? bookingsRes.data.bookings : []);
    } catch (error) {
      if (error.response && error.response.data) {
        setErrors(error.response.data.details || {});
        alert(error.response.data.error);
      } else {
        alert('An unexpected error occurred. Please try again.');
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  return (
    <>
      {!showCreateForm && (
        <button
          className="create-conference-btn"
          onClick={() => setShowCreateForm(true)}
          style={{ marginBottom: "1rem" }}
        >
          + Create New Bus Trip
        </button>
      )}
      {showCreateForm ? (
        <CreateBusForm
          onBusCreated={bus => {
            setBuses(prev => [...prev, bus]);
            setShowCreateForm(false);
          }}
          onCancel={() => setShowCreateForm(false)}
        />
      ) : !selectedBus ? (
        <BusPanel buses={buses} selectedBus={selectedBus} setSelectedBus={setSelectedBus} />
      ) : (
        <>
          <button onClick={() => setSelectedBus(null)} style={{ marginBottom: "1rem" }}>
            ← Back to Buses
          </button>
          <h1 className="header">Book Seats for {busInfo.busName}</h1>
          <p className="remaining-tickets">
            Total Seats: {busInfo.totalSeats} | Remaining Seats: {busInfo.remaining}
          </p>
          <BookingForm
            formData={formData}
            errors={errors}
            handleChange={handleChange}
            handleSubmit={handleSubmit}
          />
          <h2 className="recent-bookings-header">Recent Bookings</h2>
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
