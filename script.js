const bookingForm = document.querySelector('#booking-form');
const message = document.querySelector('#booking-message');
const today = new Date().toISOString().slice(0, 10);

document.querySelectorAll('input[type="date"]').forEach((input) => { input.min = today; });

document.querySelector('#search-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const type = data.get('type');
  document.querySelectorAll('.vehicle-card').forEach((card) => {
    card.hidden = type !== 'All' && card.dataset.category !== type;
  });
  document.querySelector('#vehicles').scrollIntoView({ behavior: 'smooth' });
});

document.querySelectorAll('.book-link').forEach((link) => link.addEventListener('click', () => {
  bookingForm.elements.vehicle.value = link.dataset.vehicle;
}));

document.querySelector('.menu-toggle').addEventListener('click', (event) => {
  const button = event.currentTarget;
  const open = button.getAttribute('aria-expanded') !== 'true';
  button.setAttribute('aria-expanded', String(open));
  button.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  document.querySelector('#nav-links').classList.toggle('open', open);
});
document.querySelectorAll('#nav-links a').forEach((link) => link.addEventListener('click', () => {
  document.querySelector('.menu-toggle').setAttribute('aria-expanded', 'false');
  document.querySelector('#nav-links').classList.remove('open');
}));

bookingForm.elements.pickupDate.addEventListener('change', () => {
  bookingForm.elements.returnDate.min = bookingForm.elements.pickupDate.value || today;
});
bookingForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  message.textContent = '';
  message.classList.remove('success');
  const pickup = bookingForm.elements.pickupDate.value;
  const returning = bookingForm.elements.returnDate.value;
  if (returning <= pickup) {
    message.textContent = 'Return date must be after the pick-up date.';
    bookingForm.elements.returnDate.focus();
    return;
  }
  const booking = Object.fromEntries(new FormData(bookingForm));
  try {
    const response = await fetch('/api/bookings', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(booking)
    });
    const body = await response.text();
    let result;
    try { result = body ? JSON.parse(body) : null; } catch { result = null; }
    if (!response.ok || !result?.id) {
      throw new Error(result?.error || 'Booking could not be saved. Start the site with npm start and try again.');
    }
    message.textContent = 'Booking successful';
    message.classList.add('success');
    window.alert('Booking successful');
    bookingForm.reset();
    bookingForm.elements.returnDate.min = today;
  } catch (error) {
    message.textContent = error instanceof TypeError
      ? 'Cannot reach the booking server. Run npm start and open http://localhost:3000.'
      : error.message || 'Could not save your booking. Please try again.';
  }
});
