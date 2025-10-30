import { FiTrash2, FiPlus, FiMinus } from 'react-icons/fi';
import api from '../api';
import { useNotification } from './NotificationContext';
import { useState } from 'react';

export default function CartItem({ item, onUpdate }) {
  const { notify } = useNotification();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleRemove = async () => {
    setIsUpdating(true);
    try {
      await api.delete(`/cart/${item._id}`);
      onUpdate();
    } catch (err) {
      const message = err.response?.data?.error || err.message || 'Error removing item';
      notify(message, 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const setQuantity = async (newQty) => {
    setIsUpdating(true);
    try {
      if (newQty <= 0) await api.delete(`/cart/${item._id}`);
      else await api.put(`/cart/${item._id}`, { quantity: newQty });
      onUpdate();
    } catch (err) {
      const message = err.response?.data?.error || err.message || 'Error updating quantity';
      notify(message, 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="group flex items-start justify-between flex-col gap-2 py-6 border-b border-gray-100 last:border-0 hover:bg-gray-50 px-4 -mx-4 rounded-xl transition-all duration-300">
      <div className="flex justify-start items-start gap-5 flex-1 min-w-0">
        <div className="relative flex justify-center items-center shrink-0 w-24 h-24 rounded-xl overflow-hidden shadow-md group-hover:shadow-xl transition-shadow duration-300">
          <img
            src={item.productId.image}
            alt={item.productId.name}
            className="w-[75%] h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
          />
        </div>
        <div className="min-w-0">
          <h4 className="font-bold text-lg text-gray-900 mb-1">{item.productId.name}</h4>
          <p className="text-sm text-gray-500 font-medium">
            ${item.productId.price.toFixed(2)} each
          </p>
        </div>
      </div>

      <div className="flex justify-center sm:justify-end items-center gap-4 sm:gap-6 shrink-0 w-full">
        <div className="text-right">
          <p className="font-bold text-lg sm:text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            ₹{(item.productId.price * item.quantity).toFixed(2)}
          </p>
        </div>

        <div className="flex items-center gap-2 bg-gradient-to-r from-gray-50 to-gray-100 rounded-full px-2 py-1 sm:px-3 sm:py-2 shadow-sm">
          <button
            onClick={() => setQuantity(Math.max(0, item.quantity - 1))}
            className="w-4 h-4 sm:w-8 sm:h-8 flex items-center justify-center bg-white rounded-full shadow hover:shadow-md hover:scale-110 disabled:opacity-40 disabled:hover:scale-100 transition-all duration-200"
            disabled={isUpdating}
            aria-label="Decrease quantity"
          >
            <FiMinus className="w-4 h-4 text-gray-700" />
          </button>
          <div className="px-3 font-bold text-md sm:text-lg text-gray-900 min-w-10 text-center">{item.quantity}</div>
          <button
            onClick={() => setQuantity(item.quantity + 1)}
            className="w-4 h-4 sm:w-8 sm:h-8 flex items-center justify-center bg-white rounded-full shadow hover:shadow-md hover:scale-110 disabled:opacity-40 disabled:hover:scale-100 transition-all duration-200"
            disabled={isUpdating}
            aria-label="Increase quantity"
          >
            <FiPlus className="w-4 h-4 text-gray-700" />
          </button>
        </div>

        <button
          onClick={handleRemove}
          className="p-2.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full disabled:text-gray-300 transition-all duration-200 hover:scale-110"
          disabled={isUpdating}
          aria-label="Remove item"
        >
          <FiTrash2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}