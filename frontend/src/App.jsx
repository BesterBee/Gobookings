import {  useState } from 'react';
import './App.css';
import BusBooking from './components/BusBooking/BusBooking';
import ConferenceBooking from './components/ConferenceBooking/ConferenceBooking';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard/Dashboard';
import RecentBookings from './components/RecentBookings';
function App() {
  const [activeSection, setActiveSection] = useState('dashboard');

 

  return (
    <div style={{ display: "flex" }}>
      <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} />
      <div className="app-main-content">
        {activeSection === "dashboard" && <Dashboard />}
        {activeSection === "bus" && <BusBooking />}
        {activeSection === "conference" && <ConferenceBooking />}
        {activeSection === "recent" && <RecentBookings />}
      </div>
    </div>
  );
}

export default App;
