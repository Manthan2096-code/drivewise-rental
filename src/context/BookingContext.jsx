import { createContext, useContext, useState } from 'react';

const BookingContext = createContext(null);

export function BookingProvider({ children }) {
  const [bookings, setBookings] = useState([]);
  const [activeBooking, setActiveBooking] = useState(null);

  async function addBooking(booking) {
    const response = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(booking),
    });
    const result = await response.json();
    if (!response.ok || !result.id) throw new Error(result.error || 'Booking could not be saved.');
    const savedBooking = { ...booking, id: result.id };
    setBookings((current) => [savedBooking, ...current]);
    setActiveBooking(savedBooking);
    return savedBooking;
  }

  return <BookingContext.Provider value={{ bookings, activeBooking, addBooking }}>{children}</BookingContext.Provider>;
}

export function useBookings() {
  const context = useContext(BookingContext);
  if (!context) throw new Error('useBookings must be used within BookingProvider.');
  return context;
}
