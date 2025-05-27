function RecentBookings({ bookings }) {
   const safeBookings = Array.isArray(bookings) ? bookings : [];
  return (
    <div>
      <ul className="recent-bookings-list">
        {safeBookings.map((booking, index) => (
          <li className="booking-item" key={index}>
            {booking.firstName} {booking.lastName} - {booking.tickets} tickets
          </li>
        ))}
      </ul>
    </div>
  );
}

export default RecentBookings;