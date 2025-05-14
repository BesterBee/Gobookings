import FormInput from './FormInput';

function BookingForm({ formData, errors, handleChange, handleSubmit }) {
  return (
    <form className="booking-form" onSubmit={handleSubmit}>
      <FormInput
        label="First Name"
        name="firstName"
        value={formData.firstName}
        onChange={handleChange}
        error={errors.firstName}
        placeholder="First Name"
      />
      <FormInput
        label="Last Name"
        name="lastName"
        value={formData.lastName}
        onChange={handleChange}
        error={errors.lastName}
        placeholder="Last Name"
      />
      <FormInput
        label="Email"
        name="email"
        value={formData.email}
        onChange={handleChange}
        error={errors.email}
        placeholder="Email"
      />
      <FormInput
        label="Number of Tickets"
        name="tickets"
        type="number"
        value={formData.tickets}
        onChange={handleChange}
        error={errors.tickets}
        placeholder="Number of Tickets"
      />
      <button className="form-button" type="submit">Book Now</button>
    </form>
  );
}

export default BookingForm;