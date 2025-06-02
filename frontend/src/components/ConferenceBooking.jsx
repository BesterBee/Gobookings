import React, { useState, useEffect } from 'react';
import axios from 'axios';
import RecentBookings from './RecentBookings';
import ConferencePanel from './ConferencePanel';
import CreateConferenceForm from './CreateConferenceForm';

const ConferenceBooking = () => {
  const [conferences, setConferences] = useState([]);
  const [selectedConference, setSelectedConference] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [conferenceInfo, setConferenceInfo] = useState({ title: '', totalTickets: 0, remaining: 0 });
  const [conferenceBookings, setConferenceBookings] = useState([]);
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', seats: '', tickets: '' });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    axios.get('http://localhost:8085/api/conferences').then(res => {
      setConferences(res.data.conferences || []);
      setSelectedConference(null);
    });
  }, []);

  useEffect(() => {
    if (!selectedConference) return;
    axios.get(`http://localhost:8085/api/conference/${selectedConference.ID}`).then(res => {
      const conf = res.data.conference;
      setConferenceInfo({
        title: conf.title || '',
        totalTickets: conf.totalTickets || '',
        remaining: conf.remainingTickets || '',
      });
    });
    axios.get(`http://localhost:8085/api/conference/${selectedConference.ID}/bookings`).then(res => {
      setConferenceBookings(Array.isArray(res.data.bookings) ? res.data.bookings : []);
    });
  }, [selectedConference]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'First Name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last Name is required';
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'A valid Email is required';
    if (formData.tickets <= 0) newErrors.tickets = 'At least 1 ticket must be booked';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      const payload = { ...formData, tickets: Number(formData.tickets), conferenceId: selectedConference.ID };
      const response = await axios.post(`http://localhost:8085/api/conference/${selectedConference.ID}/book`, payload);
      alert(response.data.message);
      setFormData({ firstName: '', lastName: '', email: '', seats: '', tickets: '' });
      setConferenceInfo(prev => ({ ...prev, remaining: response.data.remaining }));
      const bookingsRes = await axios.get(`http://localhost:8085/api/conference/${selectedConference.ID}/bookings`);
      setConferenceBookings(Array.isArray(bookingsRes.data.bookings) ? bookingsRes.data.bookings : []);
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
          + Create New Conference
        </button>
      )}
      {showCreateForm ? (
        <CreateConferenceForm
          onConferenceCreated={conf => {
            setConferences(prev => [...prev, conf]);
            setShowCreateForm(false);
          }}
          onCancel={() => setShowCreateForm(false)}
        />
      ) : !selectedConference ? (
        <ConferencePanel conferences={conferences} setSelectedConference={setSelectedConference} />
      ) : (
        <>
          <button onClick={() => setSelectedConference(null)} style={{ marginBottom: "1rem" }}>
            ← Back to Conferences
          </button>
          <h1 className="header">Book Tickets for {conferenceInfo.title}</h1>
          <p className="remaining-tickets">
            Total Tickets: {conferenceInfo.totalTickets} | Remaining Tickets: {conferenceInfo.remaining}
          </p>
          <form className="booking-form" onSubmit={handleSubmit}>
            <input
              name="firstName"
              placeholder="First Name"
              value={formData.firstName}
              onChange={handleChange}
              required
            />
            {errors.firstName && <div className="error">{errors.firstName}</div>}
            <input
              name="lastName"
              placeholder="Last Name"
              value={formData.lastName}
              onChange={handleChange}
              required
            />
            {errors.lastName && <div className="error">{errors.lastName}</div>}
            <input
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
            />
            {errors.email && <div className="error">{errors.email}</div>}
            <input
              name="tickets"
              type="number"
              placeholder="Number of Tickets"
              value={formData.tickets}
              onChange={handleChange}
              required
            />
            {errors.tickets && <div className="error">{errors.tickets}</div>}
            <button className="form-button" type="submit">Book Now</button>
          </form>
          <h2 className="recent-bookings-header">Recent Bookings</h2>
          {conferenceBookings.length > 0 ? (
            <RecentBookings bookings={conferenceBookings.map(b => ({ ...b, seats: b.tickets }))} />
          ) : (
            <p>No recent bookings for this conference.</p>
          )}
        </>
      )}
    </>
  );
};

export default ConferenceBooking;
