const BookingForm = ({ formData, errors, handleChange, handleSubmit, selectedSeatsCount }) => {
  return (
    <form onSubmit={handleSubmit} className="booking-form">
      <div className="form-group">
        <label>First Name</label>
        <input
          type="text"
          name="firstName"
          value={formData.firstName}
          onChange={handleChange}
        />
        {errors.firstName && <p className="error-message">{errors.firstName}</p>}
      </div>
      
      <div className="form-group">
        <label>Last Name</label>
        <input
          type="text"
          name="lastName"
          value={formData.lastName}
          onChange={handleChange}
        />
        {errors.lastName && <p className="error-message">{errors.lastName}</p>}
      </div>
      
      <div className="form-group">
        <label>Email</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
        />
        {errors.email && <p className="error-message">{errors.email}</p>}
      </div>
      
      <div className="selected-seats-info">
        <p>Selected Seats: {selectedSeatsCount}</p>
      </div>
      
      <button type="submit" className="submit-btn">
        Book Selected Seats
      </button>
    </form>
  );
} 
export default BookingForm;
