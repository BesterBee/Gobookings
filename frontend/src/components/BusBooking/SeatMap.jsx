import React from 'react';
import './SeatMap.css';

const SeatMap = ({ seats = [], selectedSeats = [], onSeatSelect }) => {
    // Ensure seats is always an array
    const safeSeats = Array.isArray(seats) ? seats : [];
    
    // Group seats into rows (4 seats per row)
    const rows = [];
    for (let i = 0; i < safeSeats.length; i += 4) {
        rows.push(safeSeats.slice(i, i + 4));
    }

    return (
        <div className="seat-map">
            <div className="bus-front">Front of Bus</div>
            {rows.length > 0 ? (
                rows.map((row, rowIndex) => (
                    <div key={rowIndex} className="seat-row">
                        {row.map(seat => (
                            <button
                                key={seat.seatNumber}
                                className={`seat ${seat.status} ${
                                    selectedSeats.includes(seat.seatNumber) ? 'selected' : ''
                                }`}
                                onClick={() => onSeatSelect(seat.seatNumber)}
                                disabled={seat.status !== 'available'}
                                title={`Seat ${seat.seatNumber}`}
                            >
                                {seat.seatNumber}
                            </button>
                        ))}
                    </div>
                ))
            ) : (
                <p>No seats available</p>
            )}
            <div className="seat-legend">
                <div><span className="legend available"></span> Available</div>
                <div><span className="legend booked"></span> Booked</div>
                <div><span className="legend selected"></span> Selected</div>
            </div>
        </div>
    );
};

export default SeatMap;