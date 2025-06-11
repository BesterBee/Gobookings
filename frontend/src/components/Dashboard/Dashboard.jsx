import React, { useEffect, useState } from 'react';
import './Dashboard.css';

function Dashboard() {
    const [dashboard, setDashboard] = useState(null);
    const [busBookings, setBusBookings] = useState([]);
    const [conferenceBookings, setConferenceBookings] = useState([]);

    useEffect(() => {
        fetch('http://localhost:8085/api/dashboard_summary')
            .then(res => res.json())
            .then(setDashboard)
            .catch(() => setDashboard(null));

        fetch('http://localhost:8085/api/bus_bookings')
            .then(res => res.json())
            .then(data => setBusBookings(Array.isArray(data.bookings) ? data.bookings : []));

        fetch('http://localhost:8085/api/conference_bookings')
            .then(res => res.json())
            .then(data => setConferenceBookings(Array.isArray(data.bookings) ? data.bookings : []));
    }, []);

    return (
        <div >
            <h1 className="header">Book Bus & Conference Tickets Here!</h1>
            {dashboard ? (
                <div className="dashboard-cards">
                    <div className="">
                        <h3>Buses</h3>
                        <p>Total Buses: {dashboard.busCount}</p>
                        <p>Total Seats: {dashboard.totalBusSeats}</p>
                        <p>Seats Booked: {dashboard.totalBusSeatsBooked}</p>
                    </div>
                    <div className="">
                        <h3>Conferences</h3>
                        <p>Total Conferences: {dashboard.conferenceCount}</p>
                        <p>Total Tickets: {dashboard.totalConferenceTickets}</p>
                        <p>Tickets Booked: {dashboard.totalConferenceTicketsBooked}</p>
                    </div>
                    <div className="">
                        <h3>Bookings</h3>
                        <p>Bus Bookings: {dashboard.busBookingCount}</p>
                        <p>Conference Bookings: {dashboard.conferenceBookingCount}</p>
                    </div>
                </div>
            ) : (
                <p>Loading dashboard data...</p>
            )}

            <h2 style={{ marginTop: "2rem" }}>Bus Bookings</h2>
            <table className="dashboard-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Seats</th>
                        <th>Bus Name</th>
                        <th>Booking Date</th>
                        <th>Booking Time</th>
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
<td>{b.CreatedAt ? new Date(b.CreatedAt).toLocaleDateString() : '-'}</td>
<td>{b.CreatedAt ? new Date(b.CreatedAt).toLocaleTimeString() : '-'}</td>                            </tr>
                        ))
                    )}
                </tbody>
            </table>

            <h2>Conference Bookings</h2>
            <table className="dashboard-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Tickets</th>
                        <th>Conference Name</th>
                        <th>Booking Date</th>
                        <th>Booking Time</th>
                    </tr>
                </thead>
                <tbody>
                    {conferenceBookings.length === 0 ? (
                        <tr><td colSpan="6">No conference bookings found.</td></tr>
                    ) : (
                        conferenceBookings.map(b => (
                            <tr key={b.ID}>
                                <td>{b.firstName} {b.lastName}</td>
                                <td>{b.email}</td>
                                <td>{b.tickets}</td>
                                <td>{b.conferenceName}</td>
                                <td>{b.CreatedAt ? new Date(b.CreatedAt).toLocaleDateString() : '-'}</td>
                                <td>{b.CreatedAt ? new Date(b.CreatedAt).toLocaleTimeString() : '-'}</td>
                                </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}

export default Dashboard;