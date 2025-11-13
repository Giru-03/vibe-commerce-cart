import { useEffect, useState } from 'react';
import axios from 'axios';
import { MiniSpinner, InlineLoader } from './MiniSpinner';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL
});

// Helper to change user for testing/multi-user flows
function setUserId(id) {
  if (id) api.defaults.headers.common['x-user-id'] = id;
  else delete api.defaults.headers.common['x-user-id'];
}

export default function UserSwitcher() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);

  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('vibe_user');
    // Set the initial header immediately if user is stored
    if (storedUser) {
      api.defaults.headers.common['x-user-id'] = storedUser;
    }
    return storedUser || '';
  });

  useEffect(() => {
    api.get('/users')
      .then(res => {
        const data = res.data;
        if (Array.isArray(data)) {
          setUsers(data);
        } else if (data && Array.isArray(data.users)) {
          setUsers(data.users);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const handleUserChange = async (newUser) => {
      setSwitching(true);
      
      setUserId(newUser);
      localStorage.setItem('vibe_user', newUser);
      window.dispatchEvent(new CustomEvent('vibe:userChanged', { detail: { user: newUser } }));
      
      // Quick feedback, then hide
      setTimeout(() => {
        setSwitching(false);
      }, 300);
    };

    if (user) {
      handleUserChange(user);
    }
  }, [user]);

  return (
    <div className="flex items-center gap-3">
      <label htmlFor="user-switcher" className="text-sm font-semibold text-gray-700">User:</label>
      
      <div className="relative">
        <select 
          id="user-switcher" 
          value={user} 
          onChange={e => setUser(e.target.value)} 
          disabled={loading || switching} 
          className="px-4 py-2 pr-10 border-2 border-gray-200 rounded-xl bg-white text-sm font-medium text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none cursor-pointer hover:border-gray-300 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <option>Loading users...</option>
          ) : (
            users.map(u => <option key={u.email} value={u.email}>{u.name}</option>)
          )}
        </select>
        
        {/* Loading indicator when switching users */}
        {switching && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
            <MiniSpinner size="sm" className="text-blue-600" />
          </div>
        )}
      </div>
      
      {/* Show loading text when initially loading users */}
      {loading && (
        <InlineLoader text="Loading users..." size="xs" />
      )}
    </div>
  );
}