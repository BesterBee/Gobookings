import React from "react";

function ConferencePanel({ conferences, selectedConference, setSelectedConference }) {

  return (
    <div>
      <h1 className="conference-panel-header">Select a conference to proceed:</h1>
      {(!conferences || conferences.length === 0) ? (
        <div>No conferences available.</div>
      ) : (
        <div>
          {conferences.filter(Boolean).map((conference) => (
            <button
              key={conference.ID}
              onClick={() => setSelectedConference(conference)}
              style={{
                margin: "0.5rem",
                background: selectedConference?.ID === conference.ID ? "#007bff" : "#eee",
                color: selectedConference?.ID === conference.ID ? "#fff" : "#000",
              }}
            >
              {conference.title} ({conference.startDate} → {conference.endDate})
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default ConferencePanel;