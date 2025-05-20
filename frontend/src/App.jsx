import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import BookingForm from './components/BookingForm';
import RecentBookings from './components/RecentBookings';

function App() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    tickets: '',
  });

  const [errors, setErrors] = useState({});
  const [bookings, setBookings] = useState([]);
  const [conferenceInfo, setConferenceInfo] = useState({
    conferenceName: '',
    totalTickets: 0,
    remaining: 0,
  });

  // Fetch conference info on component mount
  useEffect(() => {
    const fetchConferenceInfo = async () => {
      try {
        const response = await axios.get('http://localhost:8081/api/conference');
        setConferenceInfo(response.data);
      } catch (error) {
        console.error('Error fetching conference info:', error);
      }
    };

    const fetchBookings = async () => {
      try {
        const response = await axios.get('http://localhost:8081/api/bookings');
        setBookings(Array.isArray(response.data.bookings) ? response.data.bookings : []);
      } catch (error) {
        console.error('Error fetching bookings:', error);
      }
    };

    fetchConferenceInfo();
    fetchBookings();
  }, []);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First Name is required';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last Name is required';
    }
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'A valid Email is required';
    }
    if (formData.tickets <= 0) {
      newErrors.tickets = 'At least 1 ticket must be booked';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0; // Return true if no errors
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      try {
        const response = await axios.post('http://localhost:8081/api/book', formData);
        alert(response.data.message); // Show success message from the backend
        setBookings([...bookings, formData]); // Add booking to the list
        setFormData({ firstName: '', lastName: '', email: '', tickets: '' }); // Reset form
        setConferenceInfo((prev) => ({
          ...prev,
          remaining: response.data.remaining,
        })); // Update remaining tickets
      } catch (error) {
        if (error.response && error.response.data) {
          // Handle validation errors from the backend
          const backendErrors = error.response.data.details || {};
          setErrors(backendErrors);
          alert(error.response.data.error); // Show error message from the backend
        } else {
          alert('An unexpected error occurred. Please try again.');
        }
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  return (
    <div>
      <h1 className="header">Book Tickets for {conferenceInfo.conferenceName}</h1>
      <p className="remaining-tickets">
        Total Tickets: {conferenceInfo.totalTickets} | Remaining Tickets: {conferenceInfo.remaining}
      </p>
      <BookingForm
        formData={formData}
        errors={errors}
        handleChange={handleChange}
        handleSubmit={handleSubmit}
      />
      <RecentBookings bookings={bookings} />
    </div>
  );
}

export default App;
