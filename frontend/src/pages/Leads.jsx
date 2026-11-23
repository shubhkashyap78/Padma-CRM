import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import { dateIN, dateInput, errMsg, isOverdue, downloadCsv, inr, inputCls } from '../utils/format.js';
import ErrorBanner from '../components/ErrorBanner.jsx';

const STATUS_COLORS = {
  New: 'bg-blue-100 text-blue-700',
  Contacted: 'bg-yellow-100 text-yellow-700',
  Quoted: 'bg-purple-100 text-purple-700',
  'Follow-up': 'bg-orange-100 text-orange-700',
  Converted: 'bg-green-100 text-green-700',
  Lost: 'bg-red-100 text-red-700',
};

const SOURCES = ['Website', 'WhatsApp', 'Phone Call', 'Walk-in', 'Referral', 'Social Media', 'Other'];

const emptyForm = {
  customerName: '', phone: '', email: '', source: 'Website', packageInterest: '',
  destination: '', travelDate: '', pax: 1, budget: '', nextFollowUp: '', assignedTo: '',
};

const Leads = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [staff, setStaff] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedLead, setSelectedLead] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [error, setError] = useState('');

  const fetchLeads = async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/leads', { params });
      setLeads(res.data);
    } catch (err) {
      setError(errMsg(err, 'Could not load leads'));
    }
  };

  useEffect(() => {
    fetchLeads();
    // eslint-disable-next-line
  }, [search, statusFilter]);

  useEffect(() => {
    if (isAdmin) api.get('/staff').then((r) => setStaff(r.data.filter((u) => u.isActive))).catch(() => {});
  }, [isAdmin]);

  const reloadSelected = async (id) => {
    const res = await api.get(`/leads/${id}`);
    setSelectedLead(res.data);
  };

  const wrap = async (fn) => {
    setError('');
    try {
      await fn();
    } catch (err) {
      setError(errMsg(err));
    }
  };

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (lead) => {
    setEditingId(lead._id);
    setForm({
      customerName: lead.customerName || '', phone: lead.phone || '', email: lead.email || '',
      source: lead.source || 'Other', packageInterest: lead.packageInterest || '',
      destination: lead.destination || '', travelDate: dateInput(lead.travelDate),
      pax: lead.pax || 1, budget: lead.budget ?? '', nextFollowUp: dateInput(lead.nextFollowUp),
      assignedTo: lead.assignedTo?._id || '',
    });
    setSelectedLead(null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = (e) => {
    e.preventDefault();
    wrap(async () => {
      if (editingId) await api.put(`/leads/${editingId}`, form);
      else await api.post('/leads', form);
      setForm(emptyForm);
      setEditingId(null);
      setShowForm(false);
      fetchLeads();
    });
  };

  const updateLead = (id, patch) =>
    wrap(async () => {
      await api.put(`/leads/${id}`, patch);
      fetchLeads();
      if (selectedLead?._id === id) await reloadSelected(id);
    });

  const changeStatus = (lead, status) => {
    if (status === 'Lost') {
      const reason = prompt('Why was this lead lost? (optional)');
      if (reason === null) return;
      return updateLead(lead._id, { status, lostReason: reason });
    }
    updateLead(lead._id, { status });
  };

  const addNote = () => {
    if (!noteText.trim()) return;
    wrap(async () => {
      await api.post(`/leads/${selectedLead._id}/notes`, { text: noteText });
      setNoteText('');
      await reloadSelected(selectedLead._id);
    });
  };

  const deleteLead = (lead) => {
    if (!confirm(`Delete lead "${lead.customerName}"? This cannot be undone.`)) return;
    wrap(async () => {
      await api.delete(`/leads/${lead._id}`);
      setSelectedLead(null);
      fetchLeads();
    });
  };

  const exportCsv = () =>
    downloadCsv('leads.csv', leads.map((l) => ({
      Name: l.customerName, Phone: l.phone, Email: l.email || '', Source: l.source,
      Package: l.packageInterest || '', Destination: l.destination || '',
      TravelDate: dateIN(l.travelDate), Pax: l.pax, Budget: l.budget ?? '', Status: l.status,
      NextFollowUp: l.nextFollowUp ? dateIN(l.nextFollowUp) : '', AssignedTo: l.assignedTo?.name || '',
    })));

  return (
    <div>
      <div className="flex flex-wrap gap-2 justify-between items-center mb-5">
        <h2 className="text-xl font-bold text-navy">Leads</h2>
        <div className="flex gap-2">
          {isAdmin && (
            <button onClick={exportCsv} className="border border-navy text-navy text-sm px-4 py-2 rounded-lg hover:bg-navy/5">
              Export CSV
            </button>
          )}
          <button
            onClick={() => (showForm ? (setShowForm(false), setEditingId(null)) : openNew())}
            className="bg-navy text-white text-sm px-4 py-2 rounded-lg hover:bg-navy/90"
          >
            {showForm ? 'Cancel' : '+ New Lead'}
          </button>
        </div>
      </div>

      <ErrorBanner message={error} onClose={() => setError('')} />

      {showForm && (
        <form onSubmit={handleSave} className="bg-white rounded-xl shadow-sm border p-5 mb-6 grid md:grid-cols-2 gap-4">
          <h3 className="md:col-span-2 font-semibold text-navy">{editingId ? 'Edit Lead' : 'New Lead'}</h3>
          <input required placeholder="Customer Name" className={inputCls} value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} />
          <input required placeholder="Phone" className={inputCls} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <input placeholder="Email" className={inputCls} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <select className={inputCls} value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
            {SOURCES.map((s) => <option key={s}>{s}</option>)}
          </select>
          <input placeholder="Package Interest (e.g. Odisha Pilgrimage)" className={inputCls} value={form.packageInterest} onChange={(e) => setForm({ ...form, packageInterest: e.target.value })} />
          <input placeholder="Destination" className={inputCls} value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} />
          <div>
            <label className="text-xs text-gray-500">Travel Date</label>
            <input type="date" className={inputCls} value={form.travelDate} onChange={(e) => setForm({ ...form, travelDate: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-gray-500">Next Follow-up</label>
            <input type="date" className={inputCls} value={form.nextFollowUp} onChange={(e) => setForm({ ...form, nextFollowUp: e.target.value })} />
          </div>
          <input type="number" min="1" placeholder="Pax" className={inputCls} value={form.pax} onChange={(e) => setForm({ ...form, pax: e.target.value })} />
          <input type="number" min="0" placeholder="Budget (₹)" className={inputCls} value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} />
          {isAdmin && (
            <select className={`${inputCls} md:col-span-2`} value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}>
              <option value="">Assign to: me</option>
              {staff.map((u) => <option key={u._id} value={u._id}>{u.name} ({u.role})</option>)}
            </select>
          )}
          <button type="submit" className="md:col-span-2 bg-gold text-navy font-semibold rounded-lg py-2 text-sm">
            {editingId ? 'Update Lead' : 'Save Lead'}
          </button>
        </form>
      )}

      <div className="flex gap-3 mb-4">
        <input placeholder="Search by name or phone..." className={`${inputCls} flex-1`} value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="border rounded-lg px-3 py-2 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          {Object.keys(STATUS_COLORS).map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Customer</th>
              <th className="text-left px-4 py-3">Package</th>
              <th className="text-left px-4 py-3">Source</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Follow-up</th>
              <th className="text-left px-4 py-3">Assigned</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {leads.map((lead) => (
              <tr key={lead._id} className="hover:bg-gray-50 cursor-pointer" onClick={() => wrap(() => reloadSelected(lead._id))}>
                <td className="px-4 py-3 font-medium text-navy">{lead.customerName}<br /><span className="text-xs text-gray-400">{lead.phone}</span></td>
                <td className="px-4 py-3">{lead.packageInterest || '-'}</td>
                <td className="px-4 py-3">{lead.source}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[lead.status]}`}>{lead.status}</span>
                </td>
                <td className={`px-4 py-3 text-xs ${isOverdue(lead.nextFollowUp) && !['Converted', 'Lost'].includes(lead.status) ? 'text-red-600 font-semibold' : ''}`}>
                  {lead.nextFollowUp ? dateIN(lead.nextFollowUp) : '-'}
                </td>
                <td className="px-4 py-3">{lead.assignedTo?.name || '-'}</td>
              </tr>
            ))}
            {leads.length === 0 && (
              <tr><td colSpan={6} className="text-center text-gray-400 py-6">No leads found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedLead && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-3" onClick={() => setSelectedLead(null)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[88vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
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
              <p><span className="text-gray-500">Travel:</span> {dateIN(selectedLead.travelDate)}</p>
              <p><span className="text-gray-500">Pax:</span> {selectedLead.pax}</p>
              <p><span className="text-gray-500">Budget:</span> {selectedLead.budget ? inr(selectedLead.budget) : '-'}</p>
              <p><span className="text-gray-500">Source:</span> {selectedLead.source}</p>
              {selectedLead.status === 'Lost' && selectedLead.lostReason && (
                <p className="col-span-2"><span className="text-gray-500">Lost reason:</span> {selectedLead.lostReason}</p>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              <button onClick={() => openEdit(selectedLead)} className="text-xs border border-navy text-navy rounded-lg px-3 py-1.5">✏️ Edit</button>
              <button onClick={() => navigate('/quotations', { state: { leadId: selectedLead._id } })} className="text-xs border border-navy text-navy rounded-lg px-3 py-1.5">📄 Create Quotation</button>
              <button onClick={() => navigate('/bookings', { state: { lead: selectedLead } })} className="text-xs border border-navy text-navy rounded-lg px-3 py-1.5">🧳 Create Booking</button>
              {isAdmin && (
                <button onClick={() => deleteLead(selectedLead)} className="text-xs border border-red-300 text-red-600 rounded-lg px-3 py-1.5">🗑 Delete</button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Next Follow-up</label>
                <input
                  type="date"
                  className={`${inputCls} mt-1`}
                  value={dateInput(selectedLead.nextFollowUp)}
                  onChange={(e) => updateLead(selectedLead._id, { nextFollowUp: e.target.value })}
                />
              </div>
              {isAdmin && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Assigned To</label>
                  <select
                    className={`${inputCls} mt-1`}
                    value={selectedLead.assignedTo?._id || ''}
                    onChange={(e) => e.target.value && updateLead(selectedLead._id, { assignedTo: e.target.value })}
                  >
                    {!selectedLead.assignedTo && <option value="">Unassigned</option>}
                    {staff.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
                  </select>
                </div>
              )}
            </div>

            <div className="mb-4">
              <label className="text-xs font-medium text-gray-500 uppercase">Update Status</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {Object.keys(STATUS_COLORS).map((s) => (
                  <button
                    key={s}
                    onClick={() => changeStatus(selectedLead, s)}
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
                  className={`${inputCls} flex-1`}
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
