import { useEffect, useState } from 'react';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import { errMsg, inputCls } from '../utils/format.js';
import ErrorBanner from '../components/ErrorBanner.jsx';

const emptyForm = { name: '', email: '', password: '', phone: '', role: 'staff' };

// what each role can do — mirrors the rules enforced in the backend
const ACCESS = [
  ['Dashboard', 'Company-wide counts, revenue, collected & due, recent payments', 'Only own leads/bookings counts + own follow-ups. No revenue figures'],
  ['Leads', 'See all, create, edit, assign to staff, delete, export CSV', 'See only leads assigned to / created by them. Create, edit, change status, add notes, set follow-up. Cannot delete or reassign'],
  ['Quotations', 'See all, create, edit, PDF/WhatsApp, convert to booking, delete', 'Own quotations only: create, edit, PDF, WhatsApp, convert to booking. Cannot delete'],
  ['Bookings', 'See all, create, edit, change status, delete, export CSV', 'Own bookings only: create, edit, change status. Cannot delete'],
  ['Payments', 'See all, record, delete (reverses balance), export CSV', 'Record payments on own bookings and view them. Cannot delete'],
  ['Staff & logins', 'Create / deactivate / remove users, reset passwords, change roles', 'No access'],
];

const Staff = () => {
  const { user } = useAuth();
  const [staff, setStaff] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const fetchStaff = async () => {
    try {
      const res = await api.get('/staff');
      setStaff(res.data);
    } catch (err) {
      setError(errMsg(err, 'Could not load staff'));
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const run = async (fn, okMsg) => {
    setError('');
    setNotice('');
    try {
      await fn();
      if (okMsg) setNotice(okMsg);
      fetchStaff();
    } catch (err) {
      setError(errMsg(err));
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    await run(async () => {
      await api.post('/staff', form);
      setNotice(`Created. Share these with ${form.name}:  ID: ${form.email}   Password: ${form.password}`);
      setForm(emptyForm);
      setShowForm(false);
    });
  };

  const resetPassword = (m) => {
    const pw = prompt(`New password for ${m.name} (min 8 characters):`);
    if (!pw) return;
    run(() => api.put(`/staff/${m._id}/password`, { password: pw }), `Password for ${m.email} changed to: ${pw}`);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-xl font-bold text-navy">Staff Management</h2>
        <button onClick={() => setShowForm(!showForm)} className="bg-navy text-white text-sm px-4 py-2 rounded-lg hover:bg-navy/90">
          {showForm ? 'Cancel' : '+ Add Staff'}
        </button>
      </div>

      <ErrorBanner message={error} onClose={() => setError('')} />
      {notice && (
        <div className="bg-green-50 text-green-800 text-sm rounded-lg px-3 py-2 mb-4 break-all">{notice}</div>
      )}

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl shadow-sm border p-5 mb-6 grid md:grid-cols-2 gap-4">
          <input required placeholder="Full Name" className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input required type="email" placeholder="Login ID (email)" className={inputCls} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input required type="text" minLength={8} placeholder="Password (min 8 chars)" className={inputCls} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <input placeholder="Phone" className={inputCls} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <select className={`${inputCls} md:col-span-2`} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="staff">Staff (limited access)</option>
            <option value="admin">Admin (full access)</option>
          </select>
          <button type="submit" className="md:col-span-2 bg-gold text-navy font-semibold rounded-lg py-2 text-sm">Create User</button>
        </form>
      )}

      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto mb-8">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-left px-4 py-3">Login ID</th>
              <th className="text-left px-4 py-3">Role</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {staff.map((s) => {
              const isSelf = s._id === user?._id;
              return (
                <tr key={s._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{s.name}{isSelf && <span className="text-xs text-gray-400"> (you)</span>}</td>
                  <td className="px-4 py-3">{s.email}</td>
                  <td className="px-4 py-3">
                    <select
                      disabled={isSelf}
                      value={s.role}
                      onChange={(e) => run(() => api.put(`/staff/${s._id}`, { role: e.target.value }))}
                      className="text-xs border rounded-md px-2 py-1 capitalize disabled:opacity-60"
                    >
                      <option value="staff">staff</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${s.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {s.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 space-x-3 whitespace-nowrap">
                    <button onClick={() => resetPassword(s)} className="text-xs text-navy underline">Reset password</button>
                    {!isSelf && (
                      <>
                        <button onClick={() => run(() => api.put(`/staff/${s._id}`, { isActive: !s.isActive }))} className="text-xs text-navy underline">
                          {s.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => confirm(`Remove ${s.name}? Their leads stay in the system.`) && run(() => api.delete(`/staff/${s._id}`))}
                          className="text-xs text-red-600 underline"
                        >
                          Remove
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <h3 className="font-semibold text-navy mb-2">What each role can access</h3>
      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Module</th>
              <th className="text-left px-4 py-3">Admin</th>
              <th className="text-left px-4 py-3">Staff</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {ACCESS.map(([mod, admin, st]) => (
              <tr key={mod}>
                <td className="px-4 py-3 font-medium text-navy whitespace-nowrap">{mod}</td>
                <td className="px-4 py-3 text-gray-600">{admin}</td>
                <td className="px-4 py-3 text-gray-600">{st}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Staff;
