import { FiCheckCircle, FiX } from 'react-icons/fi';

export default function ReceiptModal({ receipt, onClose }) {
  const total = typeof receipt.total === 'string' ? parseFloat(receipt.total) : receipt.total;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-3xl p-8 max-w-lg w-full relative shadow-2xl transform animate-scale-in h-[90vh] overflow-y-auto">
        <button 
          onClick={onClose} 
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-all duration-200"
          aria-label="Close modal"
        >
          <FiX className="w-6 h-6" />
        </button>

        <div className="flex flex-col items-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
            <FiCheckCircle className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h2>
          <p className="text-sm text-gray-500 font-mono bg-gray-100 px-4 py-2 rounded-full">
            #{receipt.orderId}
          </p>
        </div>
        
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-5 rounded-2xl mb-6 border border-blue-100">
          <p className="font-bold text-lg text-gray-900">{receipt.customer.name}</p>
          <p className="text-sm text-gray-600 mt-1">{receipt.customer.email}</p>
        </div>

        <div className="space-y-3 mb-6">
          <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide mb-3">Order Items</h3>
          {receipt.items.map((item, i) => (
            <div key={i} className="flex justify-between items-center text-gray-700 py-2 border-b border-gray-100 last:border-0">
              <span className="font-medium">
                {item.name} <span className="text-gray-500">× {item.quantity}</span>
              </span>
              <span className="font-bold">₹{(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-5 py-4 rounded-2xl mb-6">
          <div className="flex justify-between items-center">
            <span className="text-xl font-bold text-gray-900">Total</span>
            <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              ₹{total.toFixed(2)}
            </span>
          </div>
        </div>

        <p className="text-xs text-gray-500 text-center mb-6 font-medium">
          {new Date(receipt.timestamp).toLocaleString('en-US', { 
            dateStyle: 'medium', 
            timeStyle: 'short' 
          })}
        </p>

        <button
          onClick={onClose}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 active:scale-95 transition-all duration-200 shadow-lg"
        >
          Continue
        </button>
      </div>

      <style jsx="true">{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scale-in {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}