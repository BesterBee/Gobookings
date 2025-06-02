import React from "react";

function Sidebar({ activeSection, setActiveSection }) {
  return (
    <div className="sidebar">
      <button
        className={activeSection === "dashboard" ? "active" : ""}
        onClick={() => setActiveSection("dashboard")}
      >
        Dashboard
      </button>
      <button
        className={activeSection === "bus" ? "active" : ""}
        onClick={() => setActiveSection("bus")}
      >
        Bus Booking
      </button>
      <button
        className={activeSection === "conference" ? "active" : ""}
        onClick={() => setActiveSection("conference")}
      >
        Conference Booking
      </button>
      <button
        className={activeSection === "recent" ? "active" : ""}
        onClick={() => setActiveSection("recent")}
      >
        Recent Bookings
      </button>
    </div>
  );
}

export default Sidebar;