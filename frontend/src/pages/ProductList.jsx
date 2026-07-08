import { useEffect, useState } from 'react';
import api from '../api';
import ProductCard from '../components/ProductCard.jsx';

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      setStatus('loading');
      const res = await api.get('/products', { params: search ? { search } : {} });
      setProducts(res.data);
      setStatus('idle');
    } catch (err) {
      setStatus('error');
    }
  }

  async function handleAddToCart(product) {
    try {
      await api.post('/cart', { productId: product._id, quantity: 1 });
      setMessage(`${product.name} added to cart`);
      setTimeout(() => setMessage(''), 2000);
    } catch (err) {
      setMessage('Please log in to add items to your cart');
      setTimeout(() => setMessage(''), 2500);
    }
  }

  return (
    <div>
      <h1>Our Products</h1>
      <form
        className="search-bar"
        onSubmit={(e) => {
          e.preventDefault();
          fetchProducts();
        }}
      >
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button type="submit">Search</button>
      </form>

      {message && <div className="toast">{message}</div>}
      {status === 'loading' && <p>Loading products...</p>}
      {status === 'error' && <p>Could not load products. Is the backend API running?</p>}

      <div className="product-grid">
        {products.map((p) => (
          <ProductCard key={p._id} product={p} onAddToCart={handleAddToCart} />
        ))}
      </div>

      {status === 'idle' && products.length === 0 && (
        <p>No products yet. POST to /api/products to add some.</p>
      )}
    </div>
  );
}
