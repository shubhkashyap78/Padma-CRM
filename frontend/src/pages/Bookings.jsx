import { useEffect, useState } from 'react';
import api from '../api/axios.js';

const STATUS_COLORS = {
  Confirmed: 'bg-blue-100 text-blue-700',
  'In Progress': 'bg-yellow-100 text-yellow-700',
  Completed: 'bg-green-100 text-green-700',
  Cancelled: 'bg-red-100 text-red-700',
};

const emptyForm = {
  customerName: '',
  phone: '',
  email: '',
  packageName: '',
  destination: '',
  startDate: '',
  endDate: '',
  pax: 1,
  totalAmount: '',
};

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [transportForm, setTransportForm] = useState({ vehicle: '', driverName: '', driverPhone: '', fromDate: '', toDate: '', route: '', cost: '' });

  const fetchBookings = async () => {
    const res = await api.get('/bookings', { params: search ? { search } : {} });
    setBookings(res.data);
  };

  const fetchVehicles = async () => {
    const res = await api.get('/vehicles');
    setVehicles(res.data);
  };

  useEffect(() => {
    fetchBookings();
    fetchVehicles();
    // eslint-disable-next-line
  }, [search]);

  const handleCreate = async (e) => {
    e.preventDefault();
    await api.post('/bookings', form);
    setForm(emptyForm);
    setShowForm(false);
    fetchBookings();
  };

  const updateStatus = async (id, status) => {
    await api.put(`/bookings/${id}`, { status });
    fetchBookings();
  };

  const openDetail = async (booking) => {
    const res = await api.get(`/bookings/${booking._id}`);
    setSelectedBooking(res.data);
  };

  const handleVehicleSelect = (vehicleId) => {
    const v = vehicles.find((x) => x._id === vehicleId);
    setTransportForm({
      ...transportForm,
      vehicle: vehicleId,
      driverName: v?.driverName || '',
      driverPhone: v?.driverPhone || '',
    });
  };

  const addTransportLeg = async (e) => {
    e.preventDefault();
    await api.post(`/bookings/${selectedBooking._id}/transport`, transportForm);
    setTransportForm({ vehicle: '', driverName: '', driverPhone: '', fromDate: '', toDate: '', route: '', cost: '' });
    const res = await api.get(`/bookings/${selectedBooking._id}`);
    setSelectedBooking(res.data);
  };

  const removeTransportLeg = async (legId) => {
    await api.delete(`/bookings/${selectedBooking._id}/transport/${legId}`);
    const res = await api.get(`/bookings/${selectedBooking._id}`);
    setSelectedBooking(res.data);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <h2 className="font-display text-3xl font-semibold text-navy">Bookings</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-navy text-white text-sm font-medium px-5 py-2.5 rounded-full hover:bg-maroon transition-colors shadow-sm"
        >
          {showForm ? 'Cancel' : '+ New Booking'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-2xl shadow-sm border border-navy/10 p-6 mb-6 grid grid-cols-2 gap-4">
          <input required placeholder="Customer Name" className="border rounded-lg px-3 py-2 text-sm" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} />
          <input required placeholder="Phone" className="border rounded-lg px-3 py-2 text-sm" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <input placeholder="Email" className="border rounded-lg px-3 py-2 text-sm" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input required placeholder="Package Name" className="border rounded-lg px-3 py-2 text-sm" value={form.packageName} onChange={(e) => setForm({ ...form, packageName: e.target.value })} />
          <input placeholder="Destination" className="border rounded-lg px-3 py-2 text-sm" value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} />
          <input type="number" min="1" placeholder="Pax" className="border rounded-lg px-3 py-2 text-sm" value={form.pax} onChange={(e) => setForm({ ...form, pax: e.target.value })} />
          <div>
            <label className="text-xs text-gray-500">Start Date</label>
            <input type="date" required className="border rounded-lg px-3 py-2 text-sm w-full" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-gray-500">End Date</label>
            <input type="date" className="border rounded-lg px-3 py-2 text-sm w-full" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
          </div>
          <input type="number" required placeholder="Total Amount (₹)" className="border rounded-lg px-3 py-2 text-sm" value={form.totalAmount} onChange={(e) => setForm({ ...form, totalAmount: e.target.value })} />
          <button type="submit" className="col-span-2 bg-gold text-navy font-semibold rounded-lg py-2 text-sm">
            Save Booking
          </button>
        </form>
      )}

      <input
        placeholder="Search by name, phone, or booking code..."
        className="border rounded-lg px-3 py-2 text-sm w-full mb-4"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="bg-white rounded-2xl shadow-sm border border-navy/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-navy/5 text-navy/60 text-xs uppercase tracking-wider font-semibold">
            <tr>
              <th className="text-left px-4 py-3">Code</th>
              <th className="text-left px-4 py-3">Customer</th>
              <th className="text-left px-4 py-3">Package</th>
              <th className="text-left px-4 py-3">Dates</th>
              <th className="text-left px-4 py-3">Total / Paid / Due</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Transport</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {bookings.map((b) => (
              <tr key={b._id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs text-navy">{b.bookingCode}</td>
                <td className="px-4 py-3 font-medium">{b.customerName}<br /><span className="text-xs text-gray-400">{b.phone}</span></td>
                <td className="px-4 py-3">{b.packageName}</td>
                <td className="px-4 py-3 text-xs">
                  {new Date(b.startDate).toLocaleDateString('en-IN')}
                  {b.endDate && ` - ${new Date(b.endDate).toLocaleDateString('en-IN')}`}
                </td>
                <td className="px-4 py-3 text-xs">
                  ₹{b.totalAmount.toLocaleString('en-IN')} / ₹{b.amountPaid.toLocaleString('en-IN')} /{' '}
                  <span className={b.totalAmount - b.amountPaid > 0 ? 'text-red-600 font-semibold' : 'text-green-600'}>
                    ₹{(b.totalAmount - b.amountPaid).toLocaleString('en-IN')}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={b.status}
                    onChange={(e) => updateStatus(b._id, e.target.value)}
                    className={`text-xs font-medium rounded-full px-2 py-1 border-0 ${STATUS_COLORS[b.status]}`}
                  >
                    {Object.keys(STATUS_COLORS).map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => openDetail(b)} className="text-xs text-navy underline">
                    {b.transport?.length ? `${b.transport.length} assigned` : 'Assign vehicle'}
                  </button>
                </td>
              </tr>
            ))}
            {bookings.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center text-gray-400 py-6">No bookings found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedBooking && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setSelectedBooking(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-display text-xl font-semibold text-navy">{selectedBooking.customerName}</h3>
                <p className="text-xs text-gray-500 font-mono">{selectedBooking.bookingCode} · {selectedBooking.packageName}</p>
              </div>
              <button onClick={() => setSelectedBooking(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <h4 className="text-xs font-semibold text-navy/60 uppercase tracking-wider mb-2">Transport Assignments</h4>
            <div className="space-y-2 mb-4">
              {selectedBooking.transport?.length === 0 && <p className="text-sm text-gray-400">No vehicle assigned yet.</p>}
              {selectedBooking.transport?.map((t) => (
                <div key={t._id} className="bg-navy/5 rounded-lg p-3 text-sm flex justify-between items-start">
                  <div>
                    <p className="font-medium text-navy">
                      {t.vehicle?.vehicleType} · {t.vehicle?.vehicleNumber}
                    </p>
                    <p className="text-xs text-gray-500">
                      {t.driverName} {t.driverPhone && `(${t.driverPhone})`}
                    </p>
                    {t.route && <p className="text-xs text-gray-500">Route: {t.route}</p>}
                    <p className="text-xs text-gray-400">
                      {t.fromDate && new Date(t.fromDate).toLocaleDateString('en-IN')}
                      {t.toDate && ` - ${new Date(t.toDate).toLocaleDateString('en-IN')}`}
                      {t.cost ? ` · ₹${t.cost.toLocaleString('en-IN')}` : ''}
                    </p>
                  </div>
                  <button onClick={() => removeTransportLeg(t._id)} className="text-xs text-red-600">Remove</button>
                </div>
              ))}
            </div>

            <form onSubmit={addTransportLeg} className="border-t pt-4 space-y-2">
              <label className="text-xs font-semibold text-navy/60 uppercase tracking-wider">Assign a Vehicle</label>
              <select required className="border rounded-lg px-3 py-2 text-sm w-full" value={transportForm.vehicle} onChange={(e) => handleVehicleSelect(e.target.value)}>
                <option value="">Select Vehicle</option>
                {vehicles.map((v) => (
                  <option key={v._id} value={v._id}>
                    {v.vehicleType} - {v.vehicleNumber} ({v.status})
                  </option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <input placeholder="Driver Name" className="border rounded-lg px-3 py-2 text-sm" value={transportForm.driverName} onChange={(e) => setTransportForm({ ...transportForm, driverName: e.target.value })} />
                <input placeholder="Driver Phone" className="border rounded-lg px-3 py-2 text-sm" value={transportForm.driverPhone} onChange={(e) => setTransportForm({ ...transportForm, driverPhone: e.target.value })} />
              </div>
              <input placeholder="Route (e.g. Airport - Puri - Konark - Puri)" className="border rounded-lg px-3 py-2 text-sm w-full" value={transportForm.route} onChange={(e) => setTransportForm({ ...transportForm, route: e.target.value })} />
              <div className="grid grid-cols-3 gap-2">
                <input type="date" className="border rounded-lg px-3 py-2 text-sm" value={transportForm.fromDate} onChange={(e) => setTransportForm({ ...transportForm, fromDate: e.target.value })} />
                <input type="date" className="border rounded-lg px-3 py-2 text-sm" value={transportForm.toDate} onChange={(e) => setTransportForm({ ...transportForm, toDate: e.target.value })} />
                <input type="number" placeholder="Cost (₹)" className="border rounded-lg px-3 py-2 text-sm" value={transportForm.cost} onChange={(e) => setTransportForm({ ...transportForm, cost: e.target.value })} />
              </div>
              <button type="submit" className="w-full bg-gold text-navy font-semibold rounded-lg py-2 text-sm">
                Assign Vehicle
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bookings;
