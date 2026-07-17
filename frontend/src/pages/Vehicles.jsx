import { useEffect, useState } from 'react';
import api from '../api/axios.js';

const STATUS_COLORS = {
  Available: 'bg-green-100 text-green-700',
  'On Trip': 'bg-blue-100 text-blue-700',
  Maintenance: 'bg-yellow-100 text-yellow-700',
  Inactive: 'bg-gray-100 text-gray-500',
};

const emptyForm = {
  vehicleType: 'Sedan',
  vehicleNumber: '',
  capacity: '',
  driverName: '',
  driverPhone: '',
  ownership: 'Vendor',
  vendorName: '',
  vendorPhone: '',
  ratePerDay: '',
  ratePerKm: '',
  notes: '',
};

const Vehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchVehicles = async () => {
    const params = {};
    if (search) params.search = search;
    if (statusFilter) params.status = statusFilter;
    const res = await api.get('/vehicles', { params });
    setVehicles(res.data);
  };

  useEffect(() => {
    fetchVehicles();
    // eslint-disable-next-line
  }, [search, statusFilter]);

  const handleCreate = async (e) => {
    e.preventDefault();
    await api.post('/vehicles', form);
    setForm(emptyForm);
    setShowForm(false);
    fetchVehicles();
  };

  const updateStatus = async (id, status) => {
    await api.put(`/vehicles/${id}`, { status });
    fetchVehicles();
  };

  const removeVehicle = async (id) => {
    if (!confirm('Remove this vehicle from the fleet?')) return;
    await api.delete(`/vehicles/${id}`);
    fetchVehicles();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <h2 className="font-display text-3xl font-semibold text-navy">Vehicles</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-navy text-white text-sm font-medium px-5 py-2.5 rounded-full hover:bg-maroon transition-colors shadow-sm"
        >
          {showForm ? 'Cancel' : '+ Add Vehicle'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-2xl shadow-sm border border-navy/10 p-6 mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <select className="border rounded-lg px-3 py-2 text-sm" value={form.vehicleType} onChange={(e) => setForm({ ...form, vehicleType: e.target.value })}>
            {['Sedan', 'SUV', 'Innova/Crysta', 'Tempo Traveller', 'Mini Bus', 'Bus', 'Other'].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          <input required placeholder="Vehicle Number (e.g. OD 02 AB 1234)" className="border rounded-lg px-3 py-2 text-sm" value={form.vehicleNumber} onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value })} />
          <input required type="number" min="1" placeholder="Seating Capacity" className="border rounded-lg px-3 py-2 text-sm" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
          <select className="border rounded-lg px-3 py-2 text-sm" value={form.ownership} onChange={(e) => setForm({ ...form, ownership: e.target.value })}>
            <option>Own Fleet</option>
            <option>Vendor</option>
          </select>
          <input placeholder="Driver Name" className="border rounded-lg px-3 py-2 text-sm" value={form.driverName} onChange={(e) => setForm({ ...form, driverName: e.target.value })} />
          <input placeholder="Driver Phone" className="border rounded-lg px-3 py-2 text-sm" value={form.driverPhone} onChange={(e) => setForm({ ...form, driverPhone: e.target.value })} />
          {form.ownership === 'Vendor' && (
            <>
              <input placeholder="Vendor / Contractor Name" className="border rounded-lg px-3 py-2 text-sm" value={form.vendorName} onChange={(e) => setForm({ ...form, vendorName: e.target.value })} />
              <input placeholder="Vendor Phone" className="border rounded-lg px-3 py-2 text-sm" value={form.vendorPhone} onChange={(e) => setForm({ ...form, vendorPhone: e.target.value })} />
            </>
          )}
          <input type="number" placeholder="Rate per Day (₹)" className="border rounded-lg px-3 py-2 text-sm" value={form.ratePerDay} onChange={(e) => setForm({ ...form, ratePerDay: e.target.value })} />
          <input type="number" placeholder="Rate per Km (₹)" className="border rounded-lg px-3 py-2 text-sm" value={form.ratePerKm} onChange={(e) => setForm({ ...form, ratePerKm: e.target.value })} />
          <textarea placeholder="Notes" rows={2} className="border rounded-lg px-3 py-2 text-sm col-span-2" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <button type="submit" className="col-span-2 bg-gold text-navy font-semibold rounded-lg py-2 text-sm">
            Save Vehicle
          </button>
        </form>
      )}

      <div className="flex gap-3 mb-4">
        <input
          placeholder="Search by number, driver, or vendor..."
          className="border rounded-lg px-3 py-2 text-sm flex-1"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="border rounded-lg px-3 py-2 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          {Object.keys(STATUS_COLORS).map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-navy/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-navy/5 text-navy/60 text-xs uppercase tracking-wider font-semibold">
            <tr>
              <th className="text-left px-4 py-3">Vehicle</th>
              <th className="text-left px-4 py-3">Driver</th>
              <th className="text-left px-4 py-3">Owner / Vendor</th>
              <th className="text-left px-4 py-3">Rate</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {vehicles.map((v) => (
              <tr key={v._id} className="hover:bg-gray-50">
                <td className="px-4 py-3"><p className="font-medium text-navy">{v.vehicleType}</p><p className="text-xs text-gray-400">{v.vehicleNumber} · {v.capacity} seater</p></td>
                <td className="px-4 py-3">{v.driverName || '-'}{v.driverPhone && <><br /><span className="text-xs text-gray-400">{v.driverPhone}</span></>}</td>
                <td className="px-4 py-3">{v.ownership === 'Own Fleet' ? <span className="text-xs bg-navy/5 text-navy px-2 py-1 rounded-full">Own Fleet</span> : <>{v.vendorName || '-'}{v.vendorPhone && <><br /><span className="text-xs text-gray-400">{v.vendorPhone}</span></>}</>}</td>
                <td className="px-4 py-3 text-xs">{v.ratePerDay ? `₹${v.ratePerDay.toLocaleString('en-IN')}/day` : ''}{v.ratePerDay && v.ratePerKm ? ' · ' : ''}{v.ratePerKm ? `₹${v.ratePerKm}/km` : ''}{!v.ratePerDay && !v.ratePerKm && '-'}</td>
                <td className="px-4 py-3">
                  <select value={v.status} onChange={(e) => updateStatus(v._id, e.target.value)} className={`text-xs font-medium rounded-full px-2 py-1 border-0 ${STATUS_COLORS[v.status]}`}>
                    {Object.keys(STATUS_COLORS).map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3"><button onClick={() => removeVehicle(v._id)} className="text-xs text-red-600 underline">Remove</button></td>
              </tr>
            ))}
            {vehicles.length === 0 && (
              <tr><td colSpan={6} className="text-center text-gray-400 py-6">No vehicles in fleet yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {vehicles.length === 0 && <p className="text-center text-gray-400 py-6">No vehicles in fleet yet.</p>}
        {vehicles.map((v) => (
          <div key={v._id} className="bg-white rounded-xl shadow-sm border border-navy/10 p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-semibold text-navy">{v.vehicleType}</p>
                <p className="text-xs text-gray-400">{v.vehicleNumber} · {v.capacity} seater</p>
              </div>
              <select value={v.status} onChange={(e) => updateStatus(v._id, e.target.value)} className={`text-xs font-medium rounded-full px-2 py-1 border-0 ${STATUS_COLORS[v.status]}`}>
                {Object.keys(STATUS_COLORS).map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="text-xs text-gray-500 flex flex-wrap gap-x-4 gap-y-1 mb-2">
              {v.driverName && <span>👤 {v.driverName} {v.driverPhone && `(${v.driverPhone})`}</span>}
              {v.ownership === 'Own Fleet' ? <span>🏢 Own Fleet</span> : v.vendorName && <span>🤝 {v.vendorName}</span>}
              {(v.ratePerDay || v.ratePerKm) && <span>💰 {v.ratePerDay ? `₹${v.ratePerDay}/day` : ''}{v.ratePerDay && v.ratePerKm ? ' · ' : ''}{v.ratePerKm ? `₹${v.ratePerKm}/km` : ''}</span>}
            </div>
            <button onClick={() => removeVehicle(v._id)} className="text-xs text-red-600 underline">Remove</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Vehicles;
