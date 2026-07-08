import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function Register({ onRegister }) {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  function update(field) {
    return (e) => setForm({ ...form, [field]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('/auth/register', form);
      localStorage.setItem('token', res.data.token);
      onRegister();
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  }

  return (
    <div className="auth-form">
      <h1>Create an account</h1>
      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="Name" value={form.name} onChange={update('name')} required />
        <input type="email" placeholder="Email" value={form.email} onChange={update('email')} required />
        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={update('password')}
          required
        />
        <button type="submit">Register</button>
      </form>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
