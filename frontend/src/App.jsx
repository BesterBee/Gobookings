
import './App.css'

function App() {

  return (
    <div>
      <h1 className="header">Book Tickets for The Conf</h1>
      <p className="remaining-tickets">Remaining tickets: 50</p>
      
      <form className="booking-form">
        <label className="form-label">First Name</label>
        <input 
          className="form-input" 
          placeholder="First Name" 
        />
        <label className="form-label">Last Name</label>
        <input 
          className="form-input" 
          placeholder="Last Name" 
        />
        <label className="form-label">Email</label>
        <input 
          className="form-input" 
          placeholder="Email" 
        />
        <label className="form-label">Number of Tickets</label>
        <input 
          className="form-input" 
          type="number" 
          min="1" 
        />
        <button className="form-button" type="submit">Book Now</button>
      </form>

      <h2 className="recent-bookings-header">Recent Bookings</h2>
      <ul className="recent-bookings-list">
         
      </ul>
    </div>
  )
}

export default App
