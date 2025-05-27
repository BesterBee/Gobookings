import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import BookingForm from './components/BookingForm';
import RecentBookings from './components/RecentBookings';
import ConferencePanel from './components/ConferencePanel';
import CreateConferenceForm from './components/CreateConferenceForm';

function App() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    tickets: '',
  });

  const [errors, setErrors] = useState({});
  const [bookings, setBookings] = useState([]);
  const [conferences, setConferences] = useState([]);
  const [selectedConference, setSelectedConference] = useState(null);
  const [conferenceInfo, setConferenceInfo] = useState({
    conferenceName: '',
    totalTickets: 0,
    remaining: 0,
  });
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    const fetchConferences = async () => {
      const res = await axios.get('http://localhost:8085/api/conferences');
      setConferences(res.data.conferences);
      if (res.data.conferences.length > 0) {
        setSelectedConference(null);
      }
    };
    fetchConferences();
  }, []);

  // Fetch conference info on component mount
  useEffect(() => {
    const fetchConferenceInfo = async () => {
      try {
        const response = await axios.get('http://localhost:8085/api/conference');
        const conf = response.data.Conference;
        setConferenceInfo({
          conferenceName: conf.title || '',
          totalTickets: conf.totalTickets || '',
          remaining: conf.remainingTickets || '',
        });
      } catch (error) {
        console.error('Error fetching conference info:', error);
      }
    };
    
    const fetchBookings = async () => {
      try {
        const response = await axios.get('http://localhost:8085/api/conference/${selectedConference.id}/bookings');
        setBookings(Array.isArray(response.data["These are the bookings"]) ? response.data["These are the bookings"] : []);
      } catch (error) {
        console.error('Error fetching bookings:', error);
      }
    };

    fetchConferenceInfo();
    fetchBookings();
  }, []);

  useEffect(() => {
    if (!selectedConference) return;
    const fetchConferenceInfo = async () => {
      const response = await axios.get(`http://localhost:8085/api/conference/${selectedConference.ID}`);
      const conf = response.data.conference;
      setConferenceInfo({
        conferenceName: conf.title || '',
        totalTickets: conf.totalTickets || '',
        remaining: conf.remainingTickets || '',
      });
    };
    const fetchBookings = async () => {
      try {
        const response = await axios.get(`http://localhost:8085/api/conference/${selectedConference.ID}/bookings`);
        setBookings(Array.isArray(response.data.bookings) ? response.data.bookings : []);
      } catch (error) {
        console.error('Error fetching bookings:', error);
      }
    };
    fetchConferenceInfo();
    fetchBookings();
  }, [selectedConference]);

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
        const payload = { ...formData, tickets: Number(formData.tickets), conferenceId: selectedConference.ID };
        const response = await axios.post('http://localhost:8085/api/book', payload);
        alert(response.data.message);
        setFormData({ firstName: '', lastName: '', email: '', tickets: '' });
        setConferenceInfo((prev) => ({
          ...prev,
          remaining: response.data.remaining,
        }));
        // Fetch latest bookings for the selected conference
        const bookingsRes = await axios.get(`http://localhost:8085/api/conference/${selectedConference.ID}/bookings`);
        setBookings(Array.isArray(bookingsRes.data.bookings) ? bookingsRes.data.bookings : []);
      } catch (error) {
        if (error.response && error.response.data) {
          const backendErrors = error.response.data.details || {};
          setErrors(backendErrors);
          alert(error.response.data.error);
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
      <div>
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
              setShowCreateForm(false); // Close form after creation
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
              Book Tickets for {conferenceInfo.conferenceName}
            </h1>
            <p className="remaining-tickets">
              Total Tickets: {conferenceInfo.totalTickets} | Remaining Tickets: {conferenceInfo.remaining}
            </p>
            <BookingForm
              formData={formData}
              errors={errors}
              handleChange={handleChange}
              handleSubmit={handleSubmit}
            />
            <h2 className="recent-bookings-header">Recent Bookings</h2>
              {bookings.length > 0 ? (
                <RecentBookings bookings={bookings} />
              ) : (
                <p>No recent bookings for this conference.</p>
              )}
          </>
        )}
      </div>
    </div>
  );
}

export default App;
