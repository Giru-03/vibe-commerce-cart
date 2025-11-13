import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNotification } from './NotificationContext';
import { MiniSpinner } from './MiniSpinner';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL
});

// Set user header from localStorage (set by UserSwitcher)
const storedUser = localStorage.getItem('vibe_user');
if (storedUser) {
  api.defaults.headers.common['x-user-id'] = storedUser;
}

export default function CheckoutForm({ cart, onCheckout, user }) {
  const [form, setForm] = useState({ name: '', email: '' });
  const [loading, setLoading] = useState(false);
  const { notify } = useNotification();

  useEffect(() => {
    if (user?.name && user?.email) setForm({ name: user.name, email: user.email });
  }, [user]);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const receipt = await api.post('/checkout', {
        name: form.name,
        email: form.email,
        cartItems: cart.items.map(i => ({
          productId: i.productId._id,
          quantity: i.quantity,
        })),
      });
      notify('Order placed successfully', 'success');
      onCheckout(receipt.data);
    } catch (err) {
      const message = err.response?.data?.error || err.message || 'Checkout failed.';
      notify(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="name" className="block text-sm font-semibold text-gray-700">Full Name</label>
        <input
          id="name"
          type="text"
          placeholder="John Doe"
          required
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none bg-white hover:border-gray-300"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-semibold text-gray-700">Email Address</label>
        <input
          id="email"
          type="email"
          placeholder="john.doe@example.com"
          required
          value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none bg-white hover:border-gray-300"
        />
      </div>

      <button
        type="submit"
        disabled={loading || cart.items.length === 0}
        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-xl font-bold text-lg hover:from-green-600 hover:to-emerald-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 disabled:transform-none"
      >
        {loading ? (
          <>
            <MiniSpinner size="md" className="text-white mr-3" />
            <span>Processing Order...</span>
          </>
        ) : (
          <span>Complete Checkout</span>
        )}
      </button>
    </form>
  );
}