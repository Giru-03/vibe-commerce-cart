import { useState, useEffect, useCallback, useRef } from 'react';
import CartItem from '../components/CartItem';
import CheckoutForm from '../components/CheckoutForm';
import ReceiptModal from '../components/ReceiptModal';
import axios from 'axios';
import { Link } from 'react-router-dom';
import UserSwitcher from '../components/UserSwitcher';
import LoadingSpinner from '../components/LoadingSpinner';
import { FiArrowLeft, FiShoppingCart } from 'react-icons/fi';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const DEFAULT_USER_ID = import.meta.env.VITE_DEFAULT_USER_ID || 'guest@example.com';

const api = axios.create({
  baseURL: API_BASE_URL
});

// Set default user header
api.defaults.headers.common['x-user-id'] = DEFAULT_USER_ID;

function LazyCartItem({ item, onUpdate }) {
  const [isVisible, setIsVisible] = useState(false);
  const itemRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' }
    );

    if (itemRef.current) observer.observe(itemRef.current);

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={itemRef} className="mb-4">
      {isVisible ? (
        <CartItem item={item} onUpdate={onUpdate} />
      ) : (
        <div className="bg-gray-100 border border-gray-200 rounded-xl p-4 animate-pulse">
          <div className="flex gap-4">
            <div className="bg-gray-200 rounded-lg w-20 h-20" />
            <div className="flex-1 space-y-3">
              <div className="h-5 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
              <div className="h-8 bg-gray-200 rounded w-32" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CartPage() {
  const [cart, setCart] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // User state
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  // Stable fetchCart
  const fetchCart = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/cart');
      setCart(res.data);
    } catch (err) {
      console.error('Failed to fetch cart:', err);
      setCart({ items: [], total: 0 });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get('/users');
        setUsers(res.data);
      } catch (err) {
        console.error('Failed to fetch users:', err);
        setUsers([{ name: 'Guest', email: 'guest@example.com' }]);
      } finally {
        setUsersLoading(false);
      }
    };
    fetchUsers();
  }, []);

  // Set currentUser from localStorage
  useEffect(() => {
    if (!usersLoading) {
      const savedEmail = localStorage.getItem('vibe_user') || 'guest@example.com';
      const matched = users.find(u => u.email === savedEmail);
      const userObj = matched || { name: 'Guest', email: savedEmail };
      setCurrentUser(userObj);
    }
  }, [users, usersLoading]);

  // Initial cart load
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Listen for user change event
  useEffect(() => {
    const handleUserChange = (event) => {
      const newEmail = event.detail.user;
      // Update api headers for the user
      if (newEmail) {
        api.defaults.headers.common['x-user-id'] = newEmail;
      } else {
        delete api.defaults.headers.common['x-user-id'];
      }
      fetchCart();
      if (newEmail && users.length > 0) {
        const matched = users.find(u => u.email === newEmail);
        const userObj = matched || { name: 'Guest', email: newEmail };
        setCurrentUser(userObj);
      }
    };

    window.addEventListener('vibe:userChanged', handleUserChange);
    return () => window.removeEventListener('vibe:userChanged', handleUserChange);
  }, [fetchCart, users]);

  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
    return () => {
      document.documentElement.style.scrollBehavior = '';
    };
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <header className="bg-white/80 backdrop-blur-md shadow-lg sticky top-0 z-10 border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-5 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <Link
              to="/"
              className="text-blue-600 font-semibold hover:text-blue-700 flex items-center gap-2 transition-colors duration-200 group"
            >
              <FiArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform duration-200" />
            </Link>
            <UserSwitcher />
          </div>
          <h1 className="text-lg md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Your Cart
          </h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
        {isLoading ? (
          <LoadingSpinner />
        ) : !cart || cart.items.length === 0 ? (
          <div className="text-center py-20 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl">
            <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiShoppingCart className="w-16 h-16 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">Your cart is empty</h2>
            <p className="text-gray-500 mb-8">Add some products to get started!</p>
            <Link
              to="/"
              className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl overflow-hidden flex flex-col lg:flex-row">
            {/* CART COLUMN */}
            <div className="flex-1 flex flex-col min-w-0">
              <div className="p-6 lg:p-8 flex-1 overflow-y-auto max-h-[60vh] lg:max-h-none">
                {cart.items.map(item => (
                  <LazyCartItem key={item._id} item={item} onUpdate={fetchCart} />
                ))}
              </div>
            </div>

            {/* CHECKOUT COLUMN */}
            <div className="p-6 lg:p-8 border-t-2 lg:border-t-0 lg:border-l-2 border-gray-200 bg-gradient-to-br from-blue-50 to-purple-50 min-w-[320px]">
              <div className="pb-6 flex justify-between items-center w-full">
                <span className="text-2xl sm:text-3xl font-bold text-gray-800">Total</span>
                <span className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  ₹{cart.total.toFixed(2)}
                </span>
              </div>
              <h3 className="text-2xl font-bold mb-6 text-gray-900">Checkout</h3>
              <CheckoutForm cart={cart} user={currentUser} onCheckout={r => setReceipt(r)} />
            </div>
          </div>
        )}
      </main>

      {/* Receipt Modal */}
      {receipt && (
        <ReceiptModal
          receipt={receipt}
          onClose={() => {
            setReceipt(null);
            fetchCart();
          }}
        />
      )}
    </div>
  );
}