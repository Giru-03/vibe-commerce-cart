// frontend/src/App.jsx
import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { NotificationProvider } from './components/NotificationProvider';
import LoadingSpinner from './components/LoadingSpinner';

// Lazy load pages
const Home = lazy(() => import('./pages/Home'));
const CartPage = lazy(() => import('./pages/CartPage'));

function App() {
 return (
 <NotificationProvider>
 <Router>
        {/* Suspense provides a fallback while lazy components load */}
 <Suspense fallback={<LoadingSpinner />}>
 <Routes>
 <Route path="/" element={<Home />} />
 <Route path="/cart" element={<CartPage />} />
 </Routes>
 </Suspense>
 </Router>
 </NotificationProvider>
 );
}

export default App;