import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import { inr, dateIN, dateInput, errMsg, downloadCsv, inputCls } from '../utils/format.js';
import ErrorBanner from '../components/ErrorBanner.jsx';

const STATUS_COLORS = {
  Confirmed: 'bg-blue-100 text-blue-700',
  'In Progress': 'bg-yellow-100 text-yellow-700',
  Completed: 'bg-green-100 text-green-700',
  Cancelled: 'bg-red-100 text-red-700',
};

const emptyForm = {
  lead: '', customerName: '', phone: '', email: '', packageName: '', destination: '',
  startDate: '', endDate: '', pax: 1, totalAmount: '',
};

const Bookings = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [bookings, setBookings] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const fetchBookings = async () => {
    try {
      const res = await api.get('/bookings', { params: search ? { search } : {} });
      setBookings(res.data);
    } catch (err) {
      setError(errMsg(err, 'Could not load bookings'));
    }
  };

  useEffect(() => {
    fetchBookings();
    // eslint-disable-next-line
  }, [search]);

  // arriving from a lead -> open the form pre-filled
  useEffect(() => {
    const lead = location.state?.lead;
    if (lead) {
      setForm({
        ...emptyForm,
        lead: lead._id,
        customerName: lead.customerName,
        phone: lead.phone,
        email: lead.email || '',
        packageName: lead.packageInterest || '',
        destination: lead.destination || '',
        pax: lead.pax || 1,
        startDate: dateInput(lead.travelDate),
      });
      setShowForm(true);
      window.history.replaceState({}, '');
    }
  }, [location.state]);

  const wrap = async (fn) => {
    setError('');
    try {
      await fn();
    } catch (err) {
      setError(errMsg(err));
    }
  };

  const openEdit = (b) => {
    setEditingId(b._id);
    setForm({
      lead: b.lead || '', customerName: b.customerName, phone: b.phone, email: b.email || '',
      packageName: b.packageName, destination: b.destination || '', startDate: dateInput(b.startDate),
      endDate: dateInput(b.endDate), pax: b.pax, totalAmount: b.totalAmount,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = (e) => {
    e.preventDefault();
    wrap(async () => {
      if (editingId) await api.put(`/bookings/${editingId}`, form);
      else await api.post('/bookings', form);
      setForm(emptyForm);
      setEditingId(null);
      setShowForm(false);
      fetchBookings();
    });
  };

  const updateStatus = (id, status) => wrap(async () => { await api.put(`/bookings/${id}`, { status }); fetchBookings(); });

  const deleteBooking = (b) => {
    if (!confirm(`Delete booking ${b.bookingCode}? All its payments will be deleted too.`)) return;
    wrap(async () => { await api.delete(`/bookings/${b._id}`); fetchBookings(); });
  };

  const exportCsv = () =>
    downloadCsv('bookings.csv', bookings.map((b) => ({
      Code: b.bookingCode, Customer: b.customerName, Phone: b.phone, Package: b.packageName,
      Destination: b.destination || '', Start: dateIN(b.startDate), End: dateIN(b.endDate), Pax: b.pax,
      Total: b.totalAmount, Paid: b.amountPaid, Due: b.totalAmount - b.amountPaid, Status: b.status,
    })));

  return (
    <div>
      <div className="flex flex-wrap gap-2 justify-between items-center mb-5">
        <h2 className="text-xl font-bold text-navy">Bookings</h2>
        <div className="flex gap-2">
          {isAdmin && (
            <button onClick={exportCsv} className="border border-navy text-navy text-sm px-4 py-2 rounded-lg hover:bg-navy/5">Export CSV</button>
          )}
          <button
            onClick={() => { if (showForm) { setShowForm(false); setEditingId(null); setForm(emptyForm); } else setShowForm(true); }}
            className="bg-navy text-white text-sm px-4 py-2 rounded-lg hover:bg-navy/90"
          >
            {showForm ? 'Cancel' : '+ New Booking'}
          </button>
        </div>
      </div>

      <ErrorBanner message={error} onClose={() => setError('')} />

      {showForm && (
        <form onSubmit={handleSave} className="bg-white rounded-xl shadow-sm border p-5 mb-6 grid md:grid-cols-2 gap-4">
          <h3 className="md:col-span-2 font-semibold text-navy">{editingId ? 'Edit Booking' : 'New Booking'}</h3>
          <input required placeholder="Customer Name" className={inputCls} value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} />
          <input required placeholder="Phone" className={inputCls} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <input placeholder="Email" className={inputCls} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input required placeholder="Package Name" className={inputCls} value={form.packageName} onChange={(e) => setForm({ ...form, packageName: e.target.value })} />
          <input placeholder="Destination" className={inputCls} value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} />
          <input type="number" min="1" placeholder="Pax" className={inputCls} value={form.pax} onChange={(e) => setForm({ ...form, pax: e.target.value })} />
          <div>
            <label className="text-xs text-gray-500">Start Date</label>
            <input type="date" required className={inputCls} value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-gray-500">End Date</label>
            <input type="date" className={inputCls} value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
          </div>
          <input type="number" min="0" required placeholder="Total Amount (₹)" className={`${inputCls} md:col-span-2`} value={form.totalAmount} onChange={(e) => setForm({ ...form, totalAmount: e.target.value })} />
          <button type="submit" className="md:col-span-2 bg-gold text-navy font-semibold rounded-lg py-2 text-sm">
            {editingId ? 'Update Booking' : 'Save Booking'}
          </button>
        </form>
      )}

      <input placeholder="Search by name, phone, or booking code..." className={`${inputCls} mb-4`} value={search} onChange={(e) => setSearch(e.target.value)} />

      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Code</th>
              <th className="text-left px-4 py-3">Customer</th>
              <th className="text-left px-4 py-3">Package</th>
              <th className="text-left px-4 py-3">Dates</th>
              <th className="text-left px-4 py-3">Total / Paid / Due</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {bookings.map((b) => {
              const due = b.totalAmount - b.amountPaid;
              return (
                <tr key={b._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-navy">{b.bookingCode}</td>
                  <td className="px-4 py-3 font-medium">{b.customerName}<br /><span className="text-xs text-gray-400">{b.phone}</span></td>
                  <td className="px-4 py-3">{b.packageName}</td>
                  <td className="px-4 py-3 text-xs whitespace-nowrap">{dateIN(b.startDate)}{b.endDate && ` - ${dateIN(b.endDate)}`}</td>
                  <td className="px-4 py-3 text-xs whitespace-nowrap">
                    {inr(b.totalAmount)} / {inr(b.amountPaid)} /{' '}
                    <span className={due > 0 ? 'text-red-600 font-semibold' : 'text-green-600'}>{inr(due)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <select value={b.status} onChange={(e) => updateStatus(b._id, e.target.value)} className={`text-xs font-medium rounded-full px-2 py-1 border-0 ${STATUS_COLORS[b.status]}`}>
                      {Object.keys(STATUS_COLORS).map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 space-x-3 whitespace-nowrap">
                    <button onClick={() => openEdit(b)} className="text-xs text-navy underline">Edit</button>
                    {due > 0 && b.status !== 'Cancelled' && (
                      <button onClick={() => navigate('/payments', { state: { bookingId: b._id } })} className="text-xs text-green-700 underline">+ Payment</button>
                    )}
                    {isAdmin && <button onClick={() => deleteBooking(b)} className="text-xs text-red-600 underline">Delete</button>}
                  </td>
                </tr>
              );
            })}
            {bookings.length === 0 && (
              <tr><td colSpan={7} className="text-center text-gray-400 py-6">No bookings found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Bookings;
