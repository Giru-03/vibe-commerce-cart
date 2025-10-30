import { useState, useEffect, useRef } from 'react';
import ProductCard from '../components/ProductCard';
import api from '../api';
import { Link } from 'react-router-dom';
import UserSwitcher from '../components/UserSwitcher';
import LoadingSpinner from '../components/LoadingSpinner';
import { FiShoppingCart } from 'react-icons/fi';

function LazyProductCard({ product, onAdd }) {
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' } 
    );

    if (cardRef.current) observer.observe(cardRef.current);

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={cardRef} className="h-full">
      {isVisible ? (
        <ProductCard product={product} onAdd={onAdd} />
      ) : (
        <div className="bg-gray-100 border border-gray-200 rounded-xl animate-pulse h-80" />
      )}
    </div>
  );
}

export default function Home() {
  const [products, setProducts] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products');
      setProducts(res.data);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  };

  const fetchCartCount = async () => {
    try {
      const res = await api.get('/cart');
      setCartCount(res.data.items.length);
    } catch (err) {
      console.error('Failed to fetch cart count:', err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchProducts(), fetchCartCount()]);
      setIsLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    const handler = () => fetchCartCount();
    window.addEventListener('vibe:userChanged', handler);
    return () => window.removeEventListener('vibe:userChanged', handler);
  }, []);

  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
    return () => {
      document.documentElement.style.scrollBehavior = '';
    };
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-blue-50 to-purple-50">

      <header className="bg-white/80 backdrop-blur-md shadow-lg sticky top-0 z-10 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1.5 flex justify-between items-center">
          {/* Logo */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 128 128"
            width="64"
            height="64"
            role="img"
            aria-label="Vibe Commerce icon"
          >
            <title>Vibe Commerce icon</title>
            <defs>
              <linearGradient id="gi" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#6EE7B7" />
                <stop offset="1" stopColor="#3B82F6" />
              </linearGradient>
            </defs>

            <circle cx="64" cy="64" r="62" fill="white" />
            <rect x="6" y="6" width="116" height="116" rx="26" fill="url(#gi)" opacity="0.08" />

            <path
              d="M26 68c12-22 26-26 36-18 13 10 26 18 46 6"
              fill="none"
              stroke="url(#gi)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            <g transform="translate(20,44) scale(0.45)">
              <path
                d="M100 14 H44 L34 0 H8"
                fill="none"
                stroke="#0F172A"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M20 20 H92 L80 66 H32z"
                fill="none"
                stroke="#0F172A"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="40" cy="86" r="8" fill="#0F172A" />
              <circle cx="76" cy="86" r="8" fill="#0F172A" />
            </g>
          </svg>

          <div className="flex items-center gap-6">
            <UserSwitcher />
            <Link
              to="/cart"
              className="relative p-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 group"
            >
              <FiShoppingCart className="w-7 h-7" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-linear-to-r from-red-500 to-pink-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg animate-bounce">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-2 sm:p-3 lg:p-4">
        <div className="mb-5">
          <h2 className="text-4xl font-bold mb-1 text-gray-900">Discover Products</h2>
          <p className="text-gray-600 text-lg">Find everything you need in one place</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((product) => (
            <LazyProductCard key={product._id} product={product} onAdd={fetchCartCount} />
          ))}
        </div>
      </main>
    </div>
  );
}