export default function BookingHistory({ bookings, activeBooking }) {
  if (!bookings.length) return null;

  return (
    <section className="booking-history" aria-labelledby="booking-history-title">
      <div className="results-heading"><h2 id="booking-history-title">Your bookings this session</h2><span>{bookings.length} saved</span></div>
      {activeBooking && (
        <article className="booking-confirmation" aria-live="polite">
          <p className="eyebrow">BOOKING CONFIRMED · {activeBooking.id.slice(0, 8)}</p>
          <h3>{activeBooking.vehicle}</h3>
          <p>{activeBooking.name} · {activeBooking.pickupLocation}</p>
          <p>{activeBooking.pickupDate} to {activeBooking.returnDate} at {activeBooking.pickupTime}</p>
        </article>
      )}
      <div className="booking-table-wrap">
        <table className="booking-table">
          <thead><tr><th scope="col">Customer</th><th scope="col">Vehicle</th><th scope="col">Pick-up</th><th scope="col">Return</th></tr></thead>
          <tbody>{bookings.map((booking) => <tr key={booking.id}><td>{booking.name}</td><td>{booking.vehicle}</td><td>{booking.pickupDate}</td><td>{booking.returnDate}</td></tr>)}</tbody>
        </table>
      </div>
    </section>
  );
}
