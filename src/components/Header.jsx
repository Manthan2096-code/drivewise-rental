export default function Header({ user, cartCount, cartTotal }) {
  return (
    <header className="topbar">
      <a className="brand" href="#home" aria-label="DriveWise home">
        <span className="brand-mark">D</span> drivewise<span className="brand-dot">.</span>
      </a>
      <div className="account">
        <div className="account-copy"><strong>{user.name}</strong><span>{user.role}</span></div>
        <span className="avatar" aria-hidden="true">{user.name.split(' ').map((part) => part[0]).join('')}</span>
      </div>
      <div className="cart-summary" aria-live="polite">
        <span className="cart-icon" aria-hidden="true">▱</span>
        <span>Cart <strong>{cartCount}</strong></span>
        <span className="cart-total">₹{cartTotal.toLocaleString('en-IN')}</span>
      </div>
    </header>
  );
}
