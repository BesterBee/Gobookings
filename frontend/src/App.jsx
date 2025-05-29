import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import BookingForm from './components/BookingForm';
import RecentBookings from './components/RecentBookings';
import BusPanel from './components/BusPanel';
import ConferencePanel from './components/ConferencePanel';
import CreateBusForm from './components/CreateBusForm';
import CreateConferenceForm from './components/CreateConferenceForm';

function App() {
  const [mode, setMode] = useState('bus'); // 'bus' or 'conference'
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Bus state
  const [buses, setBuses] = useState([]);
  const [selectedBus, setSelectedBus] = useState(null);
  const [busInfo, setBusInfo] = useState({ busName: '', totalSeats: 0, remaining: 0 });
  const [busBookings, setBusBookings] = useState([]);

  // Conference state
  const [conferences, setConferences] = useState([]);
  const [selectedConference, setSelectedConference] = useState(null);
  const [conferenceInfo, setConferenceInfo] = useState({ title: '', totalTickets: 0, remaining: 0 });
  const [conferenceBookings, setConferenceBookings] = useState([]);

  // Shared booking form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    seats: '', // for bus
    tickets: '', // for conference
  });
  const [errors, setErrors] = useState({});

  // Fetch buses or conferences on mode change
  useEffect(() => {
    if (mode === 'bus') {
      axios.get('http://localhost:8085/api/bus').then(res => {
        setBuses(res.data.conferences || []);
        setSelectedBus(null);
      });
    } else {
      axios.get('http://localhost:8085/api/conferences').then(res => {
        setConferences(res.data.conferences || []);
        setSelectedConference(null);
      });
    }
    setShowCreateForm(false);
  }, [mode]);

  // Fetch bus info and bookings when selectedBus changes
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

  // Fetch conference info and bookings when selectedConference changes
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

  // Booking form validation
  const validateForm = () => {
    const newErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'First Name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last Name is required';
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'A valid Email is required';
    if (mode === 'bus' && formData.seats <= 0) newErrors.seats = 'At least 1 seat must be booked';
    if (mode === 'conference' && formData.tickets <= 0) newErrors.tickets = 'At least 1 ticket must be booked';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Booking form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      if (mode === 'bus') {
        const payload = { ...formData, seats: Number(formData.seats), busId: selectedBus.ID };
        const response = await axios.post('http://localhost:8085/api/book', payload);
        alert(response.data.message);
        setFormData({ firstName: '', lastName: '', email: '', seats: '', tickets: '' });
        setBusInfo(prev => ({ ...prev, remaining: response.data.remaining }));
        // Refresh bookings
        const bookingsRes = await axios.get(`http://localhost:8085/api/bus/${selectedBus.ID}/bookings`);
        setBusBookings(Array.isArray(bookingsRes.data.bookings) ? bookingsRes.data.bookings : []);
      } else {
        const payload = { ...formData, tickets: Number(formData.tickets), conferenceId: selectedConference.ID };
        const response = await axios.post(`http://localhost:8085/api/conference/${selectedConference.ID}/book`, payload);
        alert(response.data.message);
        setFormData({ firstName: '', lastName: '', email: '', seats: '', tickets: '' });
        setConferenceInfo(prev => ({ ...prev, remaining: response.data.remaining }));
        // Refresh bookings
        const bookingsRes = await axios.get(`http://localhost:8085/api/conference/${selectedConference.ID}/bookings`);
        setConferenceBookings(Array.isArray(bookingsRes.data.bookings) ? bookingsRes.data.bookings : []);
      }
    } catch (error) {
      if (error.response && error.response.data) {
        setErrors(error.response.data.details || {});
        alert(error.response.data.error);
      } else {
        alert('An unexpected error occurred. Please try again.');
      }
    }
  };

  // Shared form change handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Render logic
  return (
    <div>
              <h1 className="header">Welcome to our Booking App</h1>

      <div className='choice-buttons'>
        <button onClick={() => setMode('bus')}>Bus Booking</button>
        <button onClick={() => setMode('conference')}>Conference Booking</button>
      </div>
      {mode === 'bus' && (
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
            <BusPanel
              buses={buses}
              selectedBus={selectedBus}
              setSelectedBus={setSelectedBus}
            />
          ) : (
            <>
              <button
                onClick={() => setSelectedBus(null)}
                style={{ marginBottom: "1rem" }}
              >
                ← Back to Buses
              </button>
              <h1 className="header">
                Book Seats for {busInfo.busName}
              </h1>
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
      )}
      {mode === 'conference' && (
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
            <ConferencePanel
              conferences={conferences}
              selectedConference={selectedConference}
              setSelectedConference={setSelectedConference}
            />
          ) : (
            <>
              <button
                onClick={() => setSelectedConference(null)}
                style={{ marginBottom: "1rem" }}
              >
                ← Back to Conferences
              </button>
              <h1 className="header">
                Book Tickets for {conferenceInfo.title}
              </h1>
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
                <input
                  name="lastName"
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
                <input
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
                <input
                  name="tickets"
                  type="number"
                  placeholder="Number of Tickets"
                  value={formData.tickets}
                  onChange={handleChange}
                  required
                />
                <button className="form-button" type="submit">Book Now</button>
              </form>
              <h2 className="recent-bookings-header">Recent Bookings</h2>
              {conferenceBookings.length > 0 ? (
                <RecentBookings
                  bookings={conferenceBookings.map(b => ({
                    ...b,
                    seats: b.tickets // map tickets to seats for display
                  }))}
                />
              ) : (
                <p>No recent bookings for this conference.</p>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

export default App;
