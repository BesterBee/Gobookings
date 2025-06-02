import { useState } from 'react';
import './App.css';
import BusBooking from './components/BusBooking';
import ConferenceBooking from './components/ConferenceBooking';
import RecentBookings from './components/RecentBookings';
import Sidebar from './components/Sidebar';

function App() {
  const [activeSection, setActiveSection] = useState('dashboard');

  return (
    <div style={{ display: "flex" }}>
      <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} />
      <div style={{ flex: 1, padding: "2rem" }}>
        <h1 className="header">Welcome to our Booking App</h1>
        {activeSection === "dashboard" && (
          <div>
            <h2>Dashboard</h2>
            <p>Welcome! Use the sidebar to navigate.</p>
          </div>
        )}
        {activeSection === "bus" && <BusBooking />}
        {activeSection === "conference" && <ConferenceBooking />}
        {activeSection === "recent" && (
          <div>
            <h2>Recent Bookings</h2>
            {/* You can aggregate and display recent bookings from both buses and conferences here */}
            {/* Example: <RecentBookings bookings={...} /> */}
            <p>Show recent bookings here.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
