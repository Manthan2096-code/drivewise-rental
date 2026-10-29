export default function ProductCard({ vehicle, quantity, onAddToCart, onBook }) {
  return (
    <article className="vehicle-card">
      <div className="vehicle-image-wrap">
        <img className="vehicle-image" src={vehicle.image} alt={vehicle.imageAlt} />
        <span className="category-badge">{vehicle.category}</span>
        {!vehicle.inStock && <span className="stock-badge">Currently unavailable</span>}
      </div>
      <div className="vehicle-details">
        <div className="rating"><span aria-hidden="true">★</span> {vehicle.rating.toFixed(1)} <span className="rating-label">rider rating</span></div>
        <h3>{vehicle.name}</h3>
        <p className="vehicle-meta">{vehicle.transmission} <span>·</span> {vehicle.seats} seats</p>
        <div className="card-footer">
          <p className="price">₹{vehicle.price.toLocaleString('en-IN')}<span> / day</span></p>
          {vehicle.inStock ? <button className="book-button" onClick={() => onBook(vehicle)}>Book now</button> : <span className="unavailable-label">Out of stock</span>}
        </div>
        {vehicle.inStock && <button className="add-button" onClick={() => onAddToCart(vehicle)}>{quantity ? `Added · ${quantity}` : 'Add to Cart'} <span aria-hidden="true">＋</span></button>}
      </div>
    </article>
  );
}
