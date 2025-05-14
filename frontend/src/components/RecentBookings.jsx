function RecentBookings({ bookings }) {
  return (
    <div>
      <h2 className="recent-bookings-header">Recent Bookings</h2>
      <ul className="recent-bookings-list">
        {bookings.map((booking, index) => (
          <li className="booking-item" key={index}>
            {booking.firstName} {booking.lastName} - {booking.tickets} tickets
          </li>
        ))}
      </ul>
    </div>
  );
}

export default RecentBookings;