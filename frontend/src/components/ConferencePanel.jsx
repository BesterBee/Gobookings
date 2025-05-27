import React from "react";

function ConferencePanel({ conferences, selectedConference, setSelectedConference }) {
  console.log("Conferences:", conferences);

  return (
    <div>
      <h1 className="conference-panel-header">Welcome! Select a conference:</h1>
      {(!conferences || conferences.length === 0) ? (
        <div key="no-conferences">No conferences available.</div>
      ) : (
        <div key="conferences-list">
          {conferences.filter(Boolean).map((conf) => (
            <button
              key={conf.id}
              onClick={() => setSelectedConference(conf)}
              style={{
                margin: "0.5rem",
                background: selectedConference?.id === conf.id ? "#007bff" : "#eee",
                color: selectedConference?.id === conf.id ? "#fff" : "#000",
              }}
            >
              {conf.title}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default ConferencePanel;