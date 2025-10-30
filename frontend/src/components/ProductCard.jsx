import { FiShoppingCart, FiPlus, FiMinus, FiTrash2 } from 'react-icons/fi';
import api from '../api';
import { useNotification } from './NotificationContext';
import axios from 'axios';
import { useEffect, useState, useCallback } from 'react';

export default function ProductCard({ product, onAdd }) {
  const { notify } = useNotification();
  const [qty, setQty] = useState(0);
  const [cartItemId, setCartItemId] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

const fetchQuantity = useCallback((signal) => {
  (async () => {
    try {
      const res = await api.get('/cart', { signal });
      const items = res.data.items || [];
      const found = items.find(i => 
        (i.productId && (i.productId._id === product._id || i.productId === product._id))
      );
      
      if (found) {
        setQty(found.quantity);
        setCartItemId(found._id);
      } else {
        setQty(0);
        setCartItemId(null);
      }
    } catch (err) {
      if (axios.isCancel(err) || err.name === 'AbortError') {
        return; 
      }
      console.error("Failed to fetch product quantity", err);
    }
  })();
}, [product._id]); 

  useEffect(() => {

    const controller = new AbortController();
    fetchQuantity(controller.signal);

    return () => { controller.abort(); };
  }, [fetchQuantity]); 

  useEffect(() => {
    const controller = new AbortController();
    const handleUserChange = () => {
      fetchQuantity(controller.signal);
    };

    window.addEventListener('vibe:userChanged', handleUserChange);

    return () => {
      controller.abort();
      window.removeEventListener('vibe:userChanged', handleUserChange);
    };
  }, [fetchQuantity]); 


  const addOne = async () => {
    setIsUpdating(true);
    try {
      const res = await api.post('/cart', { productId: product._id, qty: 1 });
      notify('Added to cart', 'success');
      const item = res.data.items.find(i => (i.productId && (i.productId._id === product._id || i.productId === product._id)));
      if (item) {
        setQty(item.quantity);
        setCartItemId(item._id);
      }
      onAdd?.();
    } catch (err) {
      const message = err.response?.data?.error || err.message || 'Error adding to cart';
      notify(message, 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const setQuantity = async (newQty) => {
    setIsUpdating(true);
    try {
      if (newQty <= 0) {
        await api.delete(`/cart/${cartItemId}`);
      } else {
        await api.put(`/cart/${cartItemId}`, { quantity: newQty });
      }
      if (newQty <= 0) {
        setQty(0);
        setCartItemId(null);
  } else {
        setQty(newQty);
      }
      onAdd?.();
    } catch (err) {
      const message = err.response?.data?.error || err.message || 'Error updating cart';
      notify(message, 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col h-[90%] border border-gray-100">
      <div className="relative w-full aspect-square overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 group flex justify-center items-center">
        <img
          src={product.image}
          alt={product.name}
          className="w-[65%] object-cover transform group-hover:scale-110 transition-transform duration-700 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>

      
      <div className="p-5 flex flex-col grow">
        <h3 className="font-bold text-sm sm:text-lg text-gray-900 mb-2 line-clamp-2 min-h-14">{product.name}</h3>
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-md sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            ₹{product.price.toFixed(2)}
          </span>
        </div>

        <div className="mt-auto">
          {qty > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-2 sm:p-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQuantity(Math.max(0, qty - 1))}
                    className="w-5 sm:w-9 h-5 sm:h-9 flex items-center justify-center bg-white rounded-full shadow-md hover:shadow-lg hover:scale-110 disabled:opacity-40 disabled:hover:scale-100 transition-all duration-200 text-gray-700"
                    aria-label="Decrease quantity"
                    disabled={isUpdating}
                  >
                    <FiMinus className="w-2 sm:w-4 h-2 sm:h-4" />
                  </button>
                  <div className="px-2 sm:px-4 py-1 font-bold text-md sm:text-xl text-gray-900 min-w-4 sm:min-w-12 text-center">{qty}</div>
               <button
                    onClick={() => setQuantity(qty + 1)}
                    className="w-5 sm:w-9 h-5 sm:h-9 flex items-center justify-center bg-white rounded-full shadow-md hover:shadow-lg hover:scale-110 disabled:opacity-40 disabled:hover:scale-100 transition-all duration-200 text-gray-700"
                    aria-label="Increase quantity"
                    disabled={isUpdating}
                  >
                    <FiPlus className="w-2 sm:w-4 h-2 sm:h-4" />
                  </button>
                </div>
                <button
                  onClick={() => setQuantity(0)}
                  className="text-red-500 hover:text-red-700 hover:scale-110 disabled:opacity-40 disabled:hover:scale-100 transition-all duration-200"
                  aria-label="Remove item"
                  disabled={isUpdating}
                >
                  <FiTrash2 className="w-4 sm:w-5 h-4 sm:h-5" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={addOne}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 active:scale-95 transition-all duration-200 shadow-md hover:shadow-xl disabled:opacity-50 disabled:hover:scale-100"
              disabled={isUpdating}
            >
              <FiShoppingCart className="w-3 sm:w-5 h-3 sm:h-5" />
              <span>Add to Cart</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}