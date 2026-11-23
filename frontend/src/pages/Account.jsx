import { useState } from 'react';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import { errMsg, inputCls } from '../utils/format.js';

const Account = () => {
  const { user } = useAuth();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });
    if (form.newPassword !== form.confirm) return setMsg({ type: 'error', text: 'New passwords do not match' });
    if (form.newPassword.length < 8) return setMsg({ type: 'error', text: 'New password must be at least 8 characters' });
    setLoading(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setForm({ currentPassword: '', newPassword: '', confirm: '' });
      setMsg({ type: 'ok', text: 'Password updated successfully.' });
    } catch (err) {
      setMsg({ type: 'error', text: errMsg(err, 'Could not update password') });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md">
      <h2 className="text-xl font-bold text-navy mb-5">My Account</h2>
      <div className="bg-white rounded-xl shadow-sm border p-5 mb-6 text-sm">
        <p className="font-semibold text-navy">{user?.name}</p>
        <p className="text-gray-500">{user?.email}</p>
        <p className="text-xs text-gray-400 capitalize mt-1">Role: {user?.role}</p>
      </div>

      <form onSubmit={submit} className="bg-white rounded-xl shadow-sm border p-5 space-y-3">
        <h3 className="font-semibold text-navy">Change Password</h3>
        {msg.text && (
          <p className={`text-sm rounded-lg px-3 py-2 ${msg.type === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
            {msg.text}
          </p>
        )}
        <input type="password" required placeholder="Current password" className={inputCls} value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} />
        <input type="password" required placeholder="New password (min 8 chars)" className={inputCls} value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} />
        <input type="password" required placeholder="Confirm new password" className={inputCls} value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} />
        <button disabled={loading} className="w-full bg-navy text-white rounded-lg py-2 text-sm font-semibold disabled:opacity-50">
          {loading ? 'Saving...' : 'Update Password'}
        </button>
      </form>
    </div>
  );
};

export default Account;
