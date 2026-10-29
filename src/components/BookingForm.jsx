import { useState } from 'react';
import { useBookings } from '../context/BookingContext.jsx';

const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const blankForm = { name: '', email: '', phone: '', pickupLocation: '', pickupDate: '', returnDate: '', pickupTime: '', notes: '' };

export default function BookingForm({ vehicle, onClose }) {
  const { addBooking } = useBookings();
  const [formData, setFormData] = useState(blankForm);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');
    const nextErrors = {};
    if (!formData.name.trim()) nextErrors.name = 'Enter your full name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) nextErrors.email = 'Enter a valid email address.';
    if (!/^[0-9+() -]{7,20}$/.test(formData.phone)) nextErrors.phone = 'Enter a valid phone number.';
    if (!formData.pickupLocation.trim()) nextErrors.pickupLocation = 'Enter a pick-up location.';
    if (!formData.pickupDate || formData.pickupDate < today) nextErrors.pickupDate = 'Choose today or a future date.';
    if (!formData.returnDate || formData.returnDate <= formData.pickupDate) nextErrors.returnDate = 'Return date must be after pick-up.';
    if (!formData.pickupTime) nextErrors.pickupTime = 'Choose a pick-up time.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    const booking = { ...formData, name: formData.name.trim(), pickupLocation: formData.pickupLocation.trim(), vehicle: vehicle.name };
    setSaving(true);
    try {
      await addBooking(booking);
      window.alert('Booking successful');
      onClose();
    } catch (error) {
      setMessage(error.message || 'Booking could not be saved. Start the DriveWise server and try again.');
    } finally {
      setSaving(false);
    }
  }

  function fieldError(name) {
    return errors[name] ? <span className="field-error" id={`${name}-error`}>{errors[name]}</span> : null;
  }

  function fieldProps(name) {
    return {
      name,
      value: formData[name],
      onChange: handleChange,
      'aria-invalid': Boolean(errors[name]),
      'aria-describedby': errors[name] ? `${name}-error` : undefined,
    };
  }

  return (
    <div className="booking-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="booking-dialog" role="dialog" aria-modal="true" aria-labelledby="booking-title">
        <button className="close-dialog" onClick={onClose} aria-label="Close booking form">×</button>
        <p className="eyebrow">REQUEST A RIDE</p>
        <h2 id="booking-title">Book {vehicle.name}</h2>
        <p className="booking-price">₹{vehicle.price.toLocaleString('en-IN')} / day · No payment required</p>
        <form className="booking-form" onSubmit={handleSubmit} noValidate>
          <label>Full name<input {...fieldProps('name')} autoComplete="name" required placeholder="Your name" />{fieldError('name')}</label>
          <label>Email address<input {...fieldProps('email')} type="email" autoComplete="email" required placeholder="you@example.com" />{fieldError('email')}</label>
          <label>Phone number<input {...fieldProps('phone')} type="tel" autoComplete="tel" required placeholder="+91 98765 43210" />{fieldError('phone')}</label>
          <label>Pick-up location<input {...fieldProps('pickupLocation')} required placeholder="City or address" />{fieldError('pickupLocation')}</label>
          <label>Pick-up date<input {...fieldProps('pickupDate')} type="date" min={today} required />{fieldError('pickupDate')}</label>
          <label>Return date<input {...fieldProps('returnDate')} type="date" min={formData.pickupDate || today} required />{fieldError('returnDate')}</label>
          <label>Pick-up time<input {...fieldProps('pickupTime')} type="time" required />{fieldError('pickupTime')}</label>
          <label className="notes-field">Anything else? <span>(optional)</span><textarea {...fieldProps('notes')} rows="3" placeholder="Special requests or questions" /></label>
          {message && <p className="booking-error" role="alert">{message}</p>}
          <button className="submit-booking" type="submit" disabled={saving}>{saving ? 'Saving request…' : 'Confirm booking'}</button>
        </form>
      </section>
    </div>
  );
}
