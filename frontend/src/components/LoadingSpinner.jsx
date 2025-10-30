import { FiLoader } from 'react-icons/fi';

export default function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
      <p className="mt-6 text-lg font-medium text-gray-600">Loading...</p>
    </div>
  );
}