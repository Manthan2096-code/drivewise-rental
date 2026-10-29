import ProductCard from './ProductCard.jsx';

export default function ProductGrid({ vehicles, cart, onAddToCart, onBook }) {
  if (vehicles.length === 0) return <p className="empty-state">No vehicles match these filters. Try another search.</p>;
  return (
    <div className="vehicle-grid">
      {vehicles.map((vehicle) => (
        <ProductCard key={vehicle.id} vehicle={vehicle} quantity={cart[vehicle.id] || 0} onAddToCart={onAddToCart} onBook={onBook} />
      ))}
    </div>
  );
}
