import { useEffect, useState } from 'react';
import api from '../api';

export default function Cart() {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    fetchCart();
  }, []);

  async function fetchCart() {
    try {
      setStatus('loading');
      const res = await api.get('/cart');
      setItems(res.data);
      setStatus('idle');
    } catch (err) {
      setStatus('unauthenticated');
    }
  }

  async function handleRemove(productId) {
    await api.delete(`/cart/${productId}`);
    fetchCart();
  }

  const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  if (status === 'unauthenticated') {
    return <p>Please log in to view your cart.</p>;
  }

  return (
    <div>
      <h1>Your Cart</h1>
      {status === 'loading' && <p>Loading cart...</p>}
      {status === 'idle' && items.length === 0 && <p>Your cart is empty.</p>}

      <ul className="cart-list">
        {items.map((item) => (
          <li key={item.product._id} className="cart-item">
            <span>{item.product.name}</span>
            <span>Qty: {item.quantity}</span>
            <span>₹{(item.product.price * item.quantity).toLocaleString('en-IN')}</span>
            <button onClick={() => handleRemove(item.product._id)}>Remove</button>
          </li>
        ))}
      </ul>

      {items.length > 0 && <h2>Total: ₹{total.toLocaleString('en-IN')}</h2>}
    </div>
  );
}
