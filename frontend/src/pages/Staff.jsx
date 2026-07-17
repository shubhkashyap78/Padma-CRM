import { useEffect, useState } from 'react';
import api from '../api/axios.js';

const Staff = () => {
  const [staff, setStaff] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', role: 'staff' });
  const [error, setError] = useState('');

  const fetchStaff = async () => {
    const res = await api.get('/staff');
    setStaff(res.data);
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/staff', form);
      setForm({ name: '', email: '', password: '', phone: '', role: 'staff' });
      setShowForm(false);
      fetchStaff();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create staff');
    }
  };

  const toggleActive = async (member) => {
    await api.put(`/staff/${member._id}`, { isActive: !member.isActive });
    fetchStaff();
  };

  const removeStaff = async (id) => {
    if (!confirm('Remove this staff member?')) return;
    await api.delete(`/staff/${id}`);
    fetchStaff();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <h2 className="font-display text-3xl font-semibold text-navy">Staff Management</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-navy text-white text-sm font-medium px-5 py-2.5 rounded-full hover:bg-maroon transition-colors shadow-sm"
        >
          {showForm ? 'Cancel' : '+ Add Staff'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-2xl shadow-sm border border-navy/10 p-6 mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {error && <p className="col-span-2 text-red-600 text-sm">{error}</p>}
          <input required placeholder="Full Name" className="border rounded-lg px-3 py-2 text-sm" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input required type="email" placeholder="Email" className="border rounded-lg px-3 py-2 text-sm" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input required type="password" placeholder="Password (min 6 chars)" className="border rounded-lg px-3 py-2 text-sm" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <input placeholder="Phone" className="border rounded-lg px-3 py-2 text-sm" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <select className="border rounded-lg px-3 py-2 text-sm col-span-2" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="staff">Staff</option>
            <option value="admin">Admin</option>
          </select>
          <button type="submit" className="col-span-2 bg-gold text-navy font-semibold rounded-lg py-2 text-sm">
            Create User
          </button>
        </form>
      )}

      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-navy/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-navy/5 text-navy/60 text-xs uppercase tracking-wider font-semibold">
            <tr>
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-left px-4 py-3">Email</th>
              <th className="text-left px-4 py-3">Role</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {staff.map((s) => (
              <tr key={s._id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{s.name}</td>
                <td className="px-4 py-3">{s.email}</td>
                <td className="px-4 py-3 capitalize">{s.role}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs ${s.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {s.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 space-x-2">
                  <button onClick={() => toggleActive(s)} className="text-xs text-navy underline">{s.isActive ? 'Deactivate' : 'Activate'}</button>
                  <button onClick={() => removeStaff(s._id)} className="text-xs text-red-600 underline">Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {staff.map((s) => (
          <div key={s._id} className="bg-white rounded-xl shadow-sm border border-navy/10 p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-navy">{s.name}</p>
                <p className="text-xs text-gray-500">{s.email}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs ${s.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {s.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs capitalize text-gray-500">{s.role}</span>
              <div className="space-x-3">
                <button onClick={() => toggleActive(s)} className="text-xs text-navy underline">{s.isActive ? 'Deactivate' : 'Activate'}</button>
                <button onClick={() => removeStaff(s._id)} className="text-xs text-red-600 underline">Remove</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Staff;
