import React, { useEffect, useState } from 'react';

function RecentBookings() {
  const [busBookings, setBusData] = useState([]);

 const [conferenceData, setConferenceData] = useState([]);
  useEffect(() => {
    fetch('http://localhost:8085/api/bus_bookings')
        .then(res => res.json())
        .then(data => setBusData(Array.isArray(data.bookings) ? data.bookings : []));
    fetch('http://localhost:8085/api/conference_bookings')
        .then(res => res.json())
        .then(data => setConferenceData(Array.isArray(data.bookings) ? data.bookings : []));
}, []);

  return (
    <div>
      <h1 className="header">Recent Bookings</h1>
      
      <h2>Recent Bus Bookings</h2>
      <table border="1" cellPadding="8" style={{ width: "100%", marginBottom: "2rem" }}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Seat No.</th>
            <th>Bus ID</th>
            <th>Booking Date</th>
          </tr>
        </thead>
        <tbody>
      {busBookings.length === 0 ? (
        <tr><td colSpan="6">No bus bookings found.</td></tr>
    ) : (
        busBookings.map(b => (
            <tr key={b.ID}>
                <td>{b.firstName} {b.lastName}</td>
                <td>{b.email}</td>
                <td>{b.seats}</td>
                <td>{b.busname || '-'}</td>
                <td>{b.CreatedAt ? new Date(b.CreatedAt).toLocaleDateString() : '-'} {b.CreatedAt ? new Date(b.CreatedAt).toLocaleTimeString() : '-'}</td>
            </tr>
        ))
    )}
        </tbody>
      </table>

      <h2>Recent Conference Bookings</h2>
      <table border="1" cellPadding="8" style={{ width: "100%" }}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Tickets</th>
            <th>Conference ID</th>
            <th>Start Date</th>
            <th>End Date</th>
          </tr>
        </thead>
        <tbody>
          {conferenceData.length === 0 ? (
            <tr><td colSpan="6">No conference bookings found.</td></tr>
          ) : (
            conferenceData.map(b => (
              <tr key={b.ID}>
                <td>{b.firstName} {b.lastName}</td>
                <td>{b.email}</td>
                <td>{b.tickets}</td>
                <td>{b.conferenceId}</td>
                <td>{b.startDate || '-'}</td>
                <td>{b.endDate || '-'}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default RecentBookings;