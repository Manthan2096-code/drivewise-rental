import { useEffect, useMemo, useState } from 'react';
import Header from './components/Header.jsx';
import FilterBar from './components/FilterBar.jsx';
import ProductGrid from './components/ProductGrid.jsx';
import BookingForm from './components/BookingForm.jsx';
import BookingHistory from './components/BookingHistory.jsx';
import { useBookings } from './context/BookingContext.jsx';
import { currentUser, initialVehicles } from './data/mockData.js';
import './App.css';

export default function App() {
  const { bookings, activeBooking } = useBookings();
  const [vehicles, setVehicles] = useState([]);
  const [loadMessage, setLoadMessage] = useState('Loading the DriveWise fleet…');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [cart, setCart] = useState({});
  const [bookingVehicle, setBookingVehicle] = useState(null);
  useEffect(() => {
    fetch('/api/vehicles')
      .then((response) => { if (!response.ok) throw new Error('Could not load vehicles from the DriveWise API.'); return response.json(); })
      .then((records) => {
        setVehicles(records.map((record) => {
          const sample = initialVehicles.find((vehicle) => vehicle.id === record.id || vehicle.name === record.model);
          const categoryImage = initialVehicles.find((vehicle) => vehicle.category === record.category);
          return {
            ...sample,
            ...record,
            name: record.model,
            price: record.pricePerDay,
            rating: sample?.rating ?? 4.8,
            inStock: sample?.inStock ?? true,
            image: sample?.image ?? categoryImage?.image,
            imageAlt: sample?.imageAlt ?? `${record.category} available from DriveWise`,
          };
        }));
        setLoadMessage('');
      })
      .catch(() => setLoadMessage('Could not load vehicles. Start the DriveWise server, then refresh this page.'));
  }, []);
  const categories = useMemo(() => ['All', ...new Set(vehicles.map((vehicle) => vehicle.category))], [vehicles]);
  const filteredVehicles = vehicles.filter((vehicle) =>
    vehicle.name.toLowerCase().includes(query.trim().toLowerCase()) &&
    (category === 'All' || vehicle.category === category) &&
    (!inStockOnly || vehicle.inStock),
  );
  const cartCount = Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);
  const cartTotal = vehicles.reduce((sum, vehicle) => sum + vehicle.price * (cart[vehicle.id] || 0), 0);
  const addToCart = (vehicle) => setCart((current) => ({ ...current, [vehicle.id]: (current[vehicle.id] || 0) + 1 }));

  return (
    <div className="app-shell" id="home">
      <Header user={currentUser} cartCount={cartCount} cartTotal={cartTotal} />
      <main className="catalog-main">
        <section className="catalog-heading">
          <div><p className="eyebrow">THE DRIVEWISE FLEET</p><h1>Choose your <em>next ride.</em></h1></div>
          <p>Browse cars, motorcycles and scooters for your next trip.</p>
        </section>
        <FilterBar query={query} category={category} inStockOnly={inStockOnly} categories={categories} onQueryChange={setQuery} onCategoryChange={setCategory} onStockChange={setInStockOnly} />
        <div className="results-heading"><h2>Vehicle catalog</h2><span>{filteredVehicles.length} {filteredVehicles.length === 1 ? 'ride' : 'rides'}</span></div>
        {loadMessage ? <p className="empty-state" role="status">{loadMessage}</p> : <ProductGrid vehicles={filteredVehicles} cart={cart} onAddToCart={addToCart} onBook={setBookingVehicle} />}
        <BookingHistory bookings={bookings} activeBooking={activeBooking} />
        <p className="demo-note">Experiments 3–4 · React components, Context state, and validated booking forms.</p>
      </main>
      {bookingVehicle && <BookingForm vehicle={bookingVehicle} onClose={() => setBookingVehicle(null)} />}
    </div>
  );
}
