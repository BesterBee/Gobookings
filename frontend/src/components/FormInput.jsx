function FormInput({ label, name, type = "text", value, onChange, error, placeholder }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <input
        className="form-input"
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
      {error && <p className="error">{error}</p>}
    </div>
  );
}

export default FormInput;