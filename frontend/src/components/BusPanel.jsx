import React from "react";

function BusPanel({ buses, selectedBus, setSelectedBus }) {
  return (
    <div>
      <h1 className="conference-panel-header">Select a bus trip to proceed:</h1>
      {(!buses || buses.length === 0) ? (
        <div>No buses available.</div>
      ) : (
        <div>
          {buses.filter(Boolean).map((bus) => (
            <button
              key={bus.ID}
              onClick={() => setSelectedBus(bus)}
              style={{
                margin: "0.5rem",
                background: selectedBus?.ID === bus.ID ? "#007bff" : "#eee",
                color: selectedBus?.ID === bus.ID ? "#fff" : "#000",
              }}
            >
              {bus.name} ({bus.origin} → {bus.destination})
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default BusPanel;