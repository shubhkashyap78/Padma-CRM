import { useEffect, useState } from 'react';
import api from '../api/axios.js';

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ booking: '', amount: '', mode: 'UPI', referenceNumber: '', remarks: '' });

  const fetchData = async () => {
    const [pRes, bRes] = await Promise.all([api.get('/payments'), api.get('/bookings')]);
    setPayments(pRes.data);
    setBookings(bRes.data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    await api.post('/payments', form);
    setForm({ booking: '', amount: '', mode: 'UPI', referenceNumber: '', remarks: '' });
    setShowForm(false);
    fetchData();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <h2 className="font-display text-3xl font-semibold text-navy">Payments</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-navy text-white text-sm font-medium px-5 py-2.5 rounded-full hover:bg-maroon transition-colors shadow-sm"
        >
          {showForm ? 'Cancel' : '+ Record Payment'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-2xl shadow-sm border border-navy/10 p-6 mb-6 grid grid-cols-2 gap-4">
          <select required className="border rounded-lg px-3 py-2 text-sm col-span-2" value={form.booking} onChange={(e) => setForm({ ...form, booking: e.target.value })}>
            <option value="">Select Booking</option>
            {bookings.map((b) => (
              <option key={b._id} value={b._id}>
                {b.bookingCode} - {b.customerName} (Due ₹{(b.totalAmount - b.amountPaid).toLocaleString('en-IN')})
              </option>
            ))}
          </select>
          <input type="number" required placeholder="Amount (₹)" className="border rounded-lg px-3 py-2 text-sm" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          <select className="border rounded-lg px-3 py-2 text-sm" value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })}>
            {['UPI', 'Bank Transfer', 'Cash', 'Card', 'Other'].map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
          <input placeholder="Reference Number" className="border rounded-lg px-3 py-2 text-sm" value={form.referenceNumber} onChange={(e) => setForm({ ...form, referenceNumber: e.target.value })} />
          <input placeholder="Remarks" className="border rounded-lg px-3 py-2 text-sm" value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} />
          <button type="submit" className="col-span-2 bg-gold text-navy font-semibold rounded-lg py-2 text-sm">
            Save Payment
          </button>
        </form>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-navy/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-navy/5 text-navy/60 text-xs uppercase tracking-wider font-semibold">
            <tr>
              <th className="text-left px-4 py-3">Booking</th>
              <th className="text-left px-4 py-3">Amount</th>
              <th className="text-left px-4 py-3">Mode</th>
              <th className="text-left px-4 py-3">Reference</th>
              <th className="text-left px-4 py-3">Date</th>
              <th className="text-left px-4 py-3">Recorded By</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {payments.map((p) => (
              <tr key={p._id} className="hover:bg-gray-50">
                <td className="px-4 py-3">{p.booking?.bookingCode} - {p.booking?.customerName}</td>
                <td className="px-4 py-3 font-semibold text-navy">₹{p.amount.toLocaleString('en-IN')}</td>
                <td className="px-4 py-3">{p.mode}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{p.referenceNumber || '-'}</td>
                <td className="px-4 py-3 text-xs">{new Date(p.paidOn).toLocaleDateString('en-IN')}</td>
                <td className="px-4 py-3 text-xs">{p.recordedBy?.name || '-'}</td>
              </tr>
            ))}
            {payments.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-gray-400 py-6">No payments recorded yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Payments;
