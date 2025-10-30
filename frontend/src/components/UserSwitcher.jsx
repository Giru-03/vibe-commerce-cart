import { useEffect, useState } from 'react';
import { setUserId } from '../api';
import api from '../api';


export default function UserSwitcher() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [user, setUser] = useState(() => localStorage.getItem('vibe_user') || 'guest@example.com');

  useEffect(() => {
    api.get('/users').then(res => setUsers(res.data)).catch(() => setUsers([{ name: 'Guest', email: 'guest@example.com' }])).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setUserId(user);
    localStorage.setItem('vibe_user', user);
    window.dispatchEvent(new CustomEvent('vibe:userChanged', { detail: { user } }));
  }, [user]);

  return (
    <div className="flex items-center gap-3">
      <label htmlFor="user-switcher" className="text-sm font-semibold text-gray-700">User:</label>
      <select id="user-switcher" value={user} onChange={e => setUser(e.target.value)} disabled={loading} className="px-4 py-2 border-2 border-gray-200 rounded-xl bg-white text-sm font-medium text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none cursor-pointer hover:border-gray-300 transition shadow-sm">
        {loading ? <option>Loading...</option> : users.map(u => <option key={u.email} value={u.email}>{u.name}</option>)}
      </select>
    </div>
  );
}