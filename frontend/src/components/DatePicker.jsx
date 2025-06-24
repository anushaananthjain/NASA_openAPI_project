import React from 'react';


const DatePicker = ({ selectedDate, handleDateChange }) => (
  <section className="date-picker-section">
    <label htmlFor="apod-date" className="date-picker-label">
      Select Date:
    </label>
    <input
      type="date"
      id="apod-date"
      value={selectedDate}
      onChange={handleDateChange}
      max={new Date().toISOString().split('T')[0]}
      className="date-picker-input"
    />
  </section>
);

export default DatePicker;