import { useState } from 'react';
import './App.css';
import BookingForm from './components/BookingForm';
import RecentBookings from './components/RecentBookings';

function App() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    tickets: 1,
  });

  const [errors, setErrors] = useState({});
  const [bookings, setBookings] = useState([]);

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
    if (formData.tickets < 1) {
      newErrors.tickets = 'At least 1 ticket must be booked';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0; // Return true if no errors
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      alert('Form submitted successfully!');
      setBookings([...bookings, formData]); // Add booking to the list
      setFormData({ firstName: '', lastName: '', email: '', tickets: 1 }); // Reset form
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  return (
    <div>
      <h1 className="header">Book Tickets for The Conf</h1>
      <p className="remaining-tickets">Remaining tickets: 50</p>
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
