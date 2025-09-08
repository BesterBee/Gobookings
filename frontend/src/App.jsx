import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard/Dashboard';
import BusBooking from './components/BusBooking/BusBooking';
import ConferenceBooking from './components/ConferenceBooking/ConferenceBooking';
import RecentBookings from './components/RecentBookings';
import './App.css';

function App() {
  return (
    <div style={{ display: "flex"}}>
      <Sidebar />
      <div className="app-main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/bus" element={<BusBooking />} />
          <Route path="/conference" element={<ConferenceBooking />} />
          <Route path="/recent" element={<RecentBookings />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
