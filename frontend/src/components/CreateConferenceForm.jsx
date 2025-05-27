import { useState } from "react";

function CreateConferenceForm({ onConferenceCreated, onCancel }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    location: "",
    totalTickets: "",
  });
  const [error, setError] = useState("");

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError("");
    try {
      const payload = {
        ...form,
        totalTickets: Number(form.totalTickets),
      };
      const res = await fetch("http://localhost:8085/api/conferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create conference");
      onConferenceCreated(data.conference);
      setForm({
        title: "",
        description: "",
        startDate: "",
        endDate: "",
        location: "",
        totalTickets: "",
      });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="create-conference-form">
      <h2>Create New Conference</h2>
      <input name="title" placeholder="Title" value={form.title} onChange={handleChange} required />
      <input name="description" placeholder="Description" value={form.description} onChange={handleChange} />
      <input name="startDate" placeholder="Start Date" value={form.startDate} onChange={handleChange} />
      <input name="endDate" placeholder="End Date" value={form.endDate} onChange={handleChange} />
      <input name="location" placeholder="Location" value={form.location} onChange={handleChange} />
      <input name="totalTickets" placeholder="Total Tickets" type="number" value={form.totalTickets} onChange={handleChange} required />
      <div style={{ marginTop: "1rem" }}>
        <button type="submit" className="form-button">Create Conference</button>
        <button type="button" className="form-button" style={{ marginLeft: "1rem", background: "#ccc", color: "#333" }} onClick={onCancel}>Cancel</button>
      </div>
      {error && <div style={{ color: "red", marginTop: "0.5rem" }}>{error}</div>}
    </form>
  );
}

export default CreateConferenceForm;