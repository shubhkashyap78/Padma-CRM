import { useEffect, useState } from 'react';
import api from '../api/axios.js';

const STATUS_COLORS = {
  New: 'bg-blue-100 text-blue-700',
  Contacted: 'bg-yellow-100 text-yellow-700',
  Quoted: 'bg-purple-100 text-purple-700',
  'Follow-up': 'bg-orange-100 text-orange-700',
  Converted: 'bg-green-100 text-green-700',
  Lost: 'bg-red-100 text-red-700',
};

const emptyForm = {
  customerName: '',
  phone: '',
  email: '',
  source: 'Website',
  packageInterest: '',
  destination: '',
  travelDate: '',
  pax: 1,
  budget: '',
};

const Leads = () => {
  const [leads, setLeads] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedLead, setSelectedLead] = useState(null);
  const [noteText, setNoteText] = useState('');

  const fetchLeads = async () => {
    const params = {};
    if (search) params.search = search;
    if (statusFilter) params.status = statusFilter;
    const res = await api.get('/leads', { params });
    setLeads(res.data);
  };

  useEffect(() => {
    fetchLeads();
    // eslint-disable-next-line
  }, [search, statusFilter]);

  const handleCreate = async (e) => {
    e.preventDefault();
    await api.post('/leads', form);
    setForm(emptyForm);
    setShowForm(false);
    fetchLeads();
  };

  const updateStatus = async (id, status) => {
    await api.put(`/leads/${id}`, { status });
    fetchLeads();
    if (selectedLead?._id === id) {
      const res = await api.get(`/leads/${id}`);
      setSelectedLead(res.data);
    }
  };

  const openDetail = async (lead) => {
    const res = await api.get(`/leads/${lead._id}`);
    setSelectedLead(res.data);
  };

  const addNote = async () => {
    if (!noteText.trim()) return;
    await api.post(`/leads/${selectedLead._id}/notes`, { text: noteText });
    setNoteText('');
    const res = await api.get(`/leads/${selectedLead._id}`);
    setSelectedLead(res.data);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <h2 className="font-display text-3xl font-semibold text-navy">Leads</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-navy text-white text-sm font-medium px-5 py-2.5 rounded-full hover:bg-maroon transition-colors shadow-sm"
        >
          {showForm ? 'Cancel' : '+ New Lead'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-2xl shadow-sm border border-navy/10 p-6 mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input required placeholder="Customer Name" className="border rounded-lg px-3 py-2 text-sm" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} />
          <input required placeholder="Phone" className="border rounded-lg px-3 py-2 text-sm" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <input placeholder="Email" className="border rounded-lg px-3 py-2 text-sm" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <select className="border rounded-lg px-3 py-2 text-sm" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
            {['Website', 'WhatsApp', 'Phone Call', 'Walk-in', 'Referral', 'Social Media', 'Other'].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <input placeholder="Package Interest (e.g. Odisha Pilgrimage)" className="border rounded-lg px-3 py-2 text-sm" value={form.packageInterest} onChange={(e) => setForm({ ...form, packageInterest: e.target.value })} />
          <input placeholder="Destination" className="border rounded-lg px-3 py-2 text-sm" value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} />
          <input type="date" className="border rounded-lg px-3 py-2 text-sm" value={form.travelDate} onChange={(e) => setForm({ ...form, travelDate: e.target.value })} />
          <input type="number" min="1" placeholder="Pax" className="border rounded-lg px-3 py-2 text-sm" value={form.pax} onChange={(e) => setForm({ ...form, pax: e.target.value })} />
          <input type="number" placeholder="Budget (₹)" className="border rounded-lg px-3 py-2 text-sm" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} />
          <button type="submit" className="col-span-2 bg-gold text-navy font-semibold rounded-lg py-2 text-sm">
            Save Lead
          </button>
        </form>
      )}

      <div className="flex gap-3 mb-4">
        <input
          placeholder="Search by name or phone..."
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
              <th className="text-left px-4 py-3">Customer</th>
              <th className="text-left px-4 py-3">Package</th>
              <th className="text-left px-4 py-3">Source</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Assigned</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {leads.map((lead) => (
              <tr key={lead._id} className="hover:bg-gray-50 cursor-pointer" onClick={() => openDetail(lead)}>
                <td className="px-4 py-3 font-medium text-navy">{lead.customerName}<br /><span className="text-xs text-gray-400">{lead.phone}</span></td>
                <td className="px-4 py-3">{lead.packageInterest || '-'}</td>
                <td className="px-4 py-3">{lead.source}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[lead.status]}`}>{lead.status}</span>
                </td>
                <td className="px-4 py-3">{lead.assignedTo?.name || '-'}</td>
              </tr>
            ))}
            {leads.length === 0 && (
              <tr><td colSpan={5} className="text-center text-gray-400 py-6">No leads found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {leads.length === 0 && <p className="text-center text-gray-400 py-6">No leads found.</p>}
        {leads.map((lead) => (
          <div key={lead._id} className="bg-white rounded-xl shadow-sm border border-navy/10 p-4 cursor-pointer" onClick={() => openDetail(lead)}>
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-navy">{lead.customerName}</p>
                <p className="text-xs text-gray-400">{lead.phone}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[lead.status]}`}>{lead.status}</span>
            </div>
            <div className="mt-2 text-sm text-gray-600 flex flex-wrap gap-x-4 gap-y-1">
              <span>📦 {lead.packageInterest || '-'}</span>
              <span>📡 {lead.source}</span>
            </div>
          </div>
        ))}
      </div>

      {selectedLead && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setSelectedLead(null)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-navy">{selectedLead.customerName}</h3>
                <p className="text-sm text-gray-500">{selectedLead.phone} {selectedLead.email && `· ${selectedLead.email}`}</p>
              </div>
              <button onClick={() => setSelectedLead(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm mb-4">
              <p><span className="text-gray-500">Package:</span> {selectedLead.packageInterest || '-'}</p>
              <p><span className="text-gray-500">Destination:</span> {selectedLead.destination || '-'}</p>
              <p><span className="text-gray-500">Pax:</span> {selectedLead.pax}</p>
              <p><span className="text-gray-500">Budget:</span> {selectedLead.budget ? `₹${selectedLead.budget}` : '-'}</p>
              <p><span className="text-gray-500">Source:</span> {selectedLead.source}</p>
            </div>

            <div className="mb-4">
              <label className="text-xs font-medium text-gray-500 uppercase">Update Status</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {Object.keys(STATUS_COLORS).map((s) => (
                  <button
                    key={s}
                    onClick={() => updateStatus(selectedLead._id, s)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border ${
                      selectedLead.status === s ? STATUS_COLORS[s] + ' border-transparent' : 'border-gray-200 text-gray-500'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 uppercase">Notes</label>
              <div className="space-y-2 mt-2 max-h-40 overflow-y-auto">
                {selectedLead.notes?.length === 0 && <p className="text-sm text-gray-400">No notes yet.</p>}
                {selectedLead.notes?.map((n) => (
                  <div key={n._id} className="bg-gray-50 rounded-lg p-2 text-sm">
                    <p>{n.text}</p>
                    <p className="text-xs text-gray-400 mt-1">{n.addedBy?.name} · {new Date(n.createdAt).toLocaleString('en-IN')}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <input
                  placeholder="Add a note..."
                  className="border rounded-lg px-3 py-2 text-sm flex-1"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addNote()}
                />
                <button onClick={addNote} className="bg-navy text-white px-3 py-2 rounded-lg text-sm">Add</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leads;
