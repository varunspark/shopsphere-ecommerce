import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import ProductList from './pages/ProductList.jsx';
import Cart from './pages/Cart.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';

export default function App() {
  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem('token'));
  const navigate = useNavigate();

  useEffect(() => {
    setLoggedIn(!!localStorage.getItem('token'));
  }, []);

  function handleLogout() {
    localStorage.removeItem('token');
    setLoggedIn(false);
    navigate('/');
  }

  return (
    <div className="app">
      <nav className="navbar">
        <Link to="/" className="brand">ShopSphere</Link>
        <div className="nav-links">
          <Link to="/">Products</Link>
          <Link to="/cart">Cart</Link>
          {loggedIn ? (
            <button onClick={handleLogout}>Logout</button>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </>
          )}
        </div>
      </nav>

      <main className="content">
        <Routes>
          <Route path="/" element={<ProductList />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/login" element={<Login onLogin={() => setLoggedIn(true)} />} />
          <Route path="/register" element={<Register onRegister={() => setLoggedIn(true)} />} />
        </Routes>
      </main>
    </div>
  );
}
