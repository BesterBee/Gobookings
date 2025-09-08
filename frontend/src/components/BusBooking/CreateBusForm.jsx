import { useState } from "react";

function CreateBusForm({ onBusCreated, onCancel }) {
  const [form, setForm] = useState({
    name: "",
    origin: "",
    destination: "",
    date: "",
    departureTime: "",
    arrivalTime: "",
    totalSeats: "",
  });
  const [error, setError] = useState("");

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const today = new Date().toISOString().split("T")[0];
  const now = new Date();
  const currentTime = now.toTimeString().slice(0, 5); // "HH:MM"

  const handleSubmit = async e => {
    e.preventDefault();
    setError("");
    // Date validation
    const selectedDate = new Date(form.date || form.startDate);
    const now = new Date();

    if (selectedDate < now.setHours(0, 0, 0, 0)) {
      setError("Date cannot be in the past.");
      return;
    }
    if (form.date === today && form.departureTime && form.departureTime < currentTime) {
      setError("Time cannot be in the past.");
      return;
    }

    try {
      const payload = {
        ...form,
        totalSeats: Number(form.totalSeats),
      };
      const res = await fetch("http://localhost:8085/api/bus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Failed to create bus");
      onBusCreated(data.bus);
      setForm({
        name: "",
        origin: "",
        destination: "",
        date: "",
        departureTime: "",
        arrivalTime: "",
        totalSeats: "",
      });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="create-conference-form">
      <h2>Create New Bus Trip</h2>
      <input name="name" placeholder="Bus Name" value={form.name} onChange={handleChange} required />
      <input name="origin" placeholder="Origin" value={form.origin} onChange={handleChange} required />
      <input name="destination" placeholder="Destination" value={form.destination} onChange={handleChange} required />
      <input
        name="date"
        type="date"
        min={today}
        placeholder="Trip Date"
        value={form.date}
        onChange={handleChange}
        required
      />
      <input
        name="departureTime"
        type="time"
        min={form.date === today ? currentTime : undefined}
        placeholder="Departure Time"
        value={form.departureTime}
        onChange={handleChange}
        required
      />
      <input
        name="arrivalTime"
        type="time"
        placeholder="Arrival Time"
        value={form.arrivalTime}
        onChange={handleChange}
        required
      />
      <input name="totalSeats" placeholder="Total Seats" type="number" value={form.totalSeats} onChange={handleChange} required />
      <div style={{ marginTop: "1rem" }}>
        <button type="submit" className="form-button">Create Bus</button>
        <button type="button" className="form-button" style={{ marginLeft: "1rem", background: "#ccc", color: "#333" }} onClick={onCancel}>Cancel</button>
      </div>
      {error && <div style={{ color: "red", marginTop: "0.5rem" }}>{error}</div>}
    </form>
  );
}

export default CreateBusForm;