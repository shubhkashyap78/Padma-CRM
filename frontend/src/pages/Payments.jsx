import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import { inr, dateIN, errMsg, downloadCsv, inputCls } from '../utils/format.js';
import ErrorBanner from '../components/ErrorBanner.jsx';

const emptyForm = { booking: '', amount: '', mode: 'UPI', referenceNumber: '', remarks: '' };

const Payments = () => {
  const { isAdmin } = useAuth();
  const location = useLocation();
  const [payments, setPayments] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      const [pRes, bRes] = await Promise.all([api.get('/payments'), api.get('/bookings')]);
      setPayments(pRes.data);
      setBookings(bRes.data);
    } catch (err) {
      setError(errMsg(err, 'Could not load payments'));
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // arriving from a booking's "+ Payment" button
  useEffect(() => {
    if (location.state?.bookingId) {
      setForm((f) => ({ ...f, booking: location.state.bookingId }));
      setShowForm(true);
      window.history.replaceState({}, '');
    }
  }, [location.state]);

  const payable = bookings.filter((b) => b.status !== 'Cancelled' && b.totalAmount - b.amountPaid > 0);
  const selected = bookings.find((b) => b._id === form.booking);
  const selectedDue = selected ? selected.totalAmount - selected.amountPaid : null;

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/payments', form);
      setForm(emptyForm);
      setShowForm(false);
      fetchData();
    } catch (err) {
      setError(errMsg(err, 'Could not save payment'));
    }
  };

  const deletePayment = async (p) => {
    if (!confirm(`Delete payment of ${inr(p.amount)}? The booking balance will be restored.`)) return;
    setError('');
    try {
      await api.delete(`/payments/${p._id}`);
      fetchData();
    } catch (err) {
      setError(errMsg(err));
    }
  };

  const exportCsv = () =>
    downloadCsv('payments.csv', payments.map((p) => ({
      Booking: p.booking?.bookingCode || '', Customer: p.booking?.customerName || '', Amount: p.amount,
      Mode: p.mode, Reference: p.referenceNumber || '', Date: dateIN(p.paidOn), RecordedBy: p.recordedBy?.name || '',
    })));

  return (
    <div>
      <div className="flex flex-wrap gap-2 justify-between items-center mb-5">
        <h2 className="text-xl font-bold text-navy">Payments</h2>
        <div className="flex gap-2">
          {isAdmin && (
            <button onClick={exportCsv} className="border border-navy text-navy text-sm px-4 py-2 rounded-lg hover:bg-navy/5">Export CSV</button>
          )}
          <button onClick={() => setShowForm(!showForm)} className="bg-navy text-white text-sm px-4 py-2 rounded-lg hover:bg-navy/90">
            {showForm ? 'Cancel' : '+ Record Payment'}
          </button>
        </div>
      </div>

      <ErrorBanner message={error} onClose={() => setError('')} />

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl shadow-sm border p-5 mb-6 grid md:grid-cols-2 gap-4">
          <select required className={`${inputCls} md:col-span-2`} value={form.booking} onChange={(e) => setForm({ ...form, booking: e.target.value })}>
            <option value="">Select Booking (only bookings with balance due)</option>
            {payable.map((b) => (
              <option key={b._id} value={b._id}>
                {b.bookingCode} - {b.customerName} (Due {inr(b.totalAmount - b.amountPaid)})
              </option>
            ))}
          </select>
          <div>
            <input type="number" required min="1" max={selectedDue ?? undefined} placeholder="Amount (₹)" className={inputCls} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            {selectedDue !== null && (
              <button type="button" onClick={() => setForm({ ...form, amount: selectedDue })} className="text-xs text-navy underline mt-1">
                Pay full balance ({inr(selectedDue)})
              </button>
            )}
          </div>
          <select className={inputCls} value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })}>
            {['UPI', 'Bank Transfer', 'Cash', 'Card', 'Other'].map((m) => <option key={m}>{m}</option>)}
          </select>
          <input placeholder="Reference Number" className={inputCls} value={form.referenceNumber} onChange={(e) => setForm({ ...form, referenceNumber: e.target.value })} />
          <input placeholder="Remarks" className={inputCls} value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} />
          <button type="submit" className="md:col-span-2 bg-gold text-navy font-semibold rounded-lg py-2 text-sm">Save Payment</button>
        </form>
      )}

      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Booking</th>
              <th className="text-left px-4 py-3">Amount</th>
              <th className="text-left px-4 py-3">Mode</th>
              <th className="text-left px-4 py-3">Reference</th>
              <th className="text-left px-4 py-3">Date</th>
              <th className="text-left px-4 py-3">Recorded By</th>
              {isAdmin && <th className="text-left px-4 py-3"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {payments.map((p) => (
              <tr key={p._id} className="hover:bg-gray-50">
                <td className="px-4 py-3">{p.booking?.bookingCode} - {p.booking?.customerName}</td>
                <td className="px-4 py-3 font-semibold text-navy">{inr(p.amount)}</td>
                <td className="px-4 py-3">{p.mode}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{p.referenceNumber || '-'}</td>
                <td className="px-4 py-3 text-xs">{dateIN(p.paidOn)}</td>
                <td className="px-4 py-3 text-xs">{p.recordedBy?.name || '-'}</td>
                {isAdmin && (
                  <td className="px-4 py-3"><button onClick={() => deletePayment(p)} className="text-xs text-red-600 underline">Delete</button></td>
                )}
              </tr>
            ))}
            {payments.length === 0 && (
              <tr><td colSpan={7} className="text-center text-gray-400 py-6">No payments recorded yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Payments;
