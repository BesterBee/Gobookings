import FormInput from '../FormInput';

function BookingForm({ formData, errors, handleChange, handleSubmit }) {
  return (
    <form className="booking-form" onSubmit={handleSubmit}>
      <FormInput
        label="First Name"
        name="firstName"
        value={formData.firstName}
        onChange={handleChange}
        error={errors.firstName}
      />
      <FormInput
        label="Last Name"
        name="lastName"
        value={formData.lastName}
        onChange={handleChange}
        error={errors.lastName}
      />
      <FormInput
        label="Email"
        name="email"
        value={formData.email}
        onChange={handleChange}
        error={errors.email}
      />
      <FormInput
        label="Number of Seats"
        name="seats"
        type="number"
        value={formData.seats}
        onChange={handleChange}
        error={errors.seats}
      />
      <button className="form-button" type="submit">Book Now</button>
    </form>
  );
}

export default BookingForm;