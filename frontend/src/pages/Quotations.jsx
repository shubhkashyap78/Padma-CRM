import { useEffect, useState } from 'react';
import api from '../api/axios.js';

const emptyForm = {
  lead: '',
  customerName: '',
  phone: '',
  email: '',
  packageName: '',
  destination: '',
  pax: 1,
  travelDate: '',
  validTill: '',
  itinerary: [{ day: 1, title: '', description: '', meals: '', stay: '', transport: '' }],
  inclusions: [''],
  exclusions: [''],
  pricing: [{ label: '', amount: '' }],
  termsAndConditions:
    '1. 50% advance required to confirm booking, balance before travel.\n2. Cancellation charges as per policy.\n3. Prices subject to change based on availability.\n4. Government ID proof mandatory for all travelers.',
};

const STATUS_COLORS = {
  Draft: 'bg-gray-100 text-gray-600',
  Sent: 'bg-blue-100 text-blue-700',
  Accepted: 'bg-green-100 text-green-700',
  Rejected: 'bg-red-100 text-red-700',
};

const Quotations = () => {
  const [quotations, setQuotations] = useState([]);
  const [leads, setLeads] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [copiedId, setCopiedId] = useState(null);

  const fetchData = async () => {
    const [qRes, lRes] = await Promise.all([api.get('/quotations'), api.get('/leads')]);
    setQuotations(qRes.data);
    setLeads(lRes.data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLeadSelect = (leadId) => {
    const lead = leads.find((l) => l._id === leadId);
    if (!lead) {
      setForm({ ...form, lead: '' });
      return;
    }
    setForm({
      ...form,
      lead: leadId,
      customerName: lead.customerName,
      phone: lead.phone,
      email: lead.email || '',
      packageName: lead.packageInterest || '',
      destination: lead.destination || '',
      pax: lead.pax || 1,
      travelDate: lead.travelDate ? lead.travelDate.slice(0, 10) : '',
    });
  };

  // --- itinerary helpers ---
  const addDay = () =>
    setForm({
      ...form,
      itinerary: [...form.itinerary, { day: form.itinerary.length + 1, title: '', description: '', meals: '', stay: '', transport: '' }],
    });
  const removeDay = (idx) =>
    setForm({ ...form, itinerary: form.itinerary.filter((_, i) => i !== idx).map((d, i) => ({ ...d, day: i + 1 })) });
  const updateDay = (idx, field, value) => {
    const copy = [...form.itinerary];
    copy[idx] = { ...copy[idx], [field]: value };
    setForm({ ...form, itinerary: copy });
  };

  // --- inclusions/exclusions helpers ---
  const updateListItem = (key, idx, value) => {
    const copy = [...form[key]];
    copy[idx] = value;
    setForm({ ...form, [key]: copy });
  };
  const addListItem = (key) => setForm({ ...form, [key]: [...form[key], ''] });
  const removeListItem = (key, idx) => setForm({ ...form, [key]: form[key].filter((_, i) => i !== idx) });

  // --- pricing helpers ---
  const updatePricing = (idx, field, value) => {
    const copy = [...form.pricing];
    copy[idx] = { ...copy[idx], [field]: value };
    setForm({ ...form, pricing: copy });
  };
  const addPricingRow = () => setForm({ ...form, pricing: [...form.pricing, { label: '', amount: '' }] });
  const removePricingRow = (idx) => setForm({ ...form, pricing: form.pricing.filter((_, i) => i !== idx) });

  const total = form.pricing.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const handleCreate = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      inclusions: form.inclusions.filter((i) => i.trim()),
      exclusions: form.exclusions.filter((i) => i.trim()),
      pricing: form.pricing.filter((p) => p.label.trim() && p.amount !== ''),
    };
    await api.post('/quotations', payload);
    setForm(emptyForm);
    setShowForm(false);
    fetchData();
  };

  const downloadPdf = (id, qNumber) => {
    const stored = localStorage.getItem('padmaCrmUser');
    const token = stored ? JSON.parse(stored).token : '';
    // open in new tab with auth via query is not supported by our API, so fetch as blob
    api.get(`/quotations/${id}/pdf`, { responseType: 'blob' }).then((res) => {
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${qNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    });
  };

  const copyWhatsappText = async (id) => {
    const res = await api.get(`/quotations/${id}/whatsapp-text`);
    await navigator.clipboard.writeText(res.data.text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const updateStatus = async (id, status) => {
    await api.put(`/quotations/${id}`, { status });
    fetchData();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <h2 className="font-display text-3xl font-semibold text-navy">Quotations</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-navy text-white text-sm font-medium px-5 py-2.5 rounded-full hover:bg-maroon transition-colors shadow-sm"
        >
          {showForm ? 'Cancel' : '+ New Quotation'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-2xl shadow-sm border border-navy/10 p-6 mb-6 space-y-6">
          {/* Lead + customer info */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">Build From Lead</label>
            <select
              className="border rounded-lg px-3 py-2 text-sm w-full mt-1"
              value={form.lead}
              onChange={(e) => handleLeadSelect(e.target.value)}
            >
              <option value="">-- Select a lead (auto-fills details) --</option>
              {leads.map((l) => (
                <option key={l._id} value={l._id}>
                  {l.customerName} - {l.phone} {l.packageInterest ? `(${l.packageInterest})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <input required placeholder="Customer Name" className="border rounded-lg px-3 py-2 text-sm" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} />
            <input required placeholder="Phone" className="border rounded-lg px-3 py-2 text-sm" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <input placeholder="Email" className="border rounded-lg px-3 py-2 text-sm" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <input required placeholder="Package Name" className="border rounded-lg px-3 py-2 text-sm" value={form.packageName} onChange={(e) => setForm({ ...form, packageName: e.target.value })} />
            <input placeholder="Destination" className="border rounded-lg px-3 py-2 text-sm" value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} />
            <input type="number" min="1" placeholder="Pax" className="border rounded-lg px-3 py-2 text-sm" value={form.pax} onChange={(e) => setForm({ ...form, pax: e.target.value })} />
            <div>
              <label className="text-xs text-gray-500">Travel Date</label>
              <input type="date" className="border rounded-lg px-3 py-2 text-sm w-full" value={form.travelDate} onChange={(e) => setForm({ ...form, travelDate: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-gray-500">Valid Till</label>
              <input type="date" className="border rounded-lg px-3 py-2 text-sm w-full" value={form.validTill} onChange={(e) => setForm({ ...form, validTill: e.target.value })} />
            </div>
          </div>

          {/* Itinerary */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-semibold text-gray-500 uppercase">Itinerary</label>
              <button type="button" onClick={addDay} className="text-xs text-navy underline">+ Add Day</button>
            </div>
            <div className="space-y-3">
              {form.itinerary.map((d, idx) => (
                <div key={idx} className="border rounded-lg p-3 bg-gray-50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-navy">Day {d.day}</span>
                    {form.itinerary.length > 1 && (
                      <button type="button" onClick={() => removeDay(idx)} className="text-xs text-red-600">Remove</button>
                    )}
                  </div>
                  <input placeholder="Title (e.g. Arrival in Puri & Temple Visit)" className="border rounded-lg px-3 py-2 text-sm w-full mb-2" value={d.title} onChange={(e) => updateDay(idx, 'title', e.target.value)} />
                  <textarea placeholder="Description" rows={2} className="border rounded-lg px-3 py-2 text-sm w-full mb-2" value={d.description} onChange={(e) => updateDay(idx, 'description', e.target.value)} />
                  <div className="grid grid-cols-3 gap-2">
                    <input placeholder="Meals (e.g. Breakfast, Dinner)" className="border rounded-lg px-3 py-2 text-sm" value={d.meals} onChange={(e) => updateDay(idx, 'meals', e.target.value)} />
                    <input placeholder="Stay (Hotel name)" className="border rounded-lg px-3 py-2 text-sm" value={d.stay} onChange={(e) => updateDay(idx, 'stay', e.target.value)} />
                    <input placeholder="Vehicle (e.g. AC Innova - sightseeing)" className="border rounded-lg px-3 py-2 text-sm" value={d.transport || ''} onChange={(e) => updateDay(idx, 'transport', e.target.value)} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Inclusions / Exclusions */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold text-gray-500 uppercase">Inclusions</label>
                <button type="button" onClick={() => addListItem('inclusions')} className="text-xs text-navy underline">+ Add</button>
              </div>
              {form.inclusions.map((val, idx) => (
                <div key={idx} className="flex gap-2 mb-2">
                  <input className="border rounded-lg px-3 py-2 text-sm flex-1" value={val} onChange={(e) => updateListItem('inclusions', idx, e.target.value)} placeholder="e.g. Accommodation on double sharing" />
                  {form.inclusions.length > 1 && (
                    <button type="button" onClick={() => removeListItem('inclusions', idx)} className="text-red-600 text-xs">✕</button>
                  )}
                </div>
              ))}
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold text-gray-500 uppercase">Exclusions</label>
                <button type="button" onClick={() => addListItem('exclusions')} className="text-xs text-navy underline">+ Add</button>
              </div>
              {form.exclusions.map((val, idx) => (
                <div key={idx} className="flex gap-2 mb-2">
                  <input className="border rounded-lg px-3 py-2 text-sm flex-1" value={val} onChange={(e) => updateListItem('exclusions', idx, e.target.value)} placeholder="e.g. Airfare / Train fare" />
                  {form.exclusions.length > 1 && (
                    <button type="button" onClick={() => removeListItem('exclusions', idx)} className="text-red-600 text-xs">✕</button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Pricing */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-semibold text-gray-500 uppercase">Price Breakup</label>
              <button type="button" onClick={addPricingRow} className="text-xs text-navy underline">+ Add Row</button>
            </div>
            {form.pricing.map((p, idx) => (
              <div key={idx} className="flex gap-2 mb-2">
                <input className="border rounded-lg px-3 py-2 text-sm flex-1" placeholder="e.g. Accommodation (4N/5D)" value={p.label} onChange={(e) => updatePricing(idx, 'label', e.target.value)} />
                <input type="number" className="border rounded-lg px-3 py-2 text-sm w-32" placeholder="₹ Amount" value={p.amount} onChange={(e) => updatePricing(idx, 'amount', e.target.value)} />
                {form.pricing.length > 1 && (
                  <button type="button" onClick={() => removePricingRow(idx)} className="text-red-600 text-xs">✕</button>
                )}
              </div>
            ))}
            <p className="text-right text-sm font-semibold text-navy mt-2">Total: ₹{total.toLocaleString('en-IN')}</p>
          </div>

          {/* Terms */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">Terms & Conditions</label>
            <textarea rows={4} className="border rounded-lg px-3 py-2 text-sm w-full mt-1" value={form.termsAndConditions} onChange={(e) => setForm({ ...form, termsAndConditions: e.target.value })} />
          </div>

          <button type="submit" className="w-full bg-gold text-navy font-semibold rounded-lg py-2 text-sm">
            Save Quotation
          </button>
        </form>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-navy/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-navy/5 text-navy/60 text-xs uppercase tracking-wider font-semibold">
            <tr>
              <th className="text-left px-4 py-3">Number</th>
              <th className="text-left px-4 py-3">Customer</th>
              <th className="text-left px-4 py-3">Package</th>
              <th className="text-left px-4 py-3">Total</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {quotations.map((q) => (
              <tr key={q._id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs text-navy">{q.quotationNumber}</td>
                <td className="px-4 py-3 font-medium">{q.customerName}<br /><span className="text-xs text-gray-400">{q.phone}</span></td>
                <td className="px-4 py-3">{q.packageName}</td>
                <td className="px-4 py-3">₹{q.totalAmount.toLocaleString('en-IN')}</td>
                <td className="px-4 py-3">
                  <select
                    value={q.status}
                    onChange={(e) => updateStatus(q._id, e.target.value)}
                    className={`text-xs font-medium rounded-full px-2 py-1 border-0 ${STATUS_COLORS[q.status]}`}
                  >
                    {Object.keys(STATUS_COLORS).map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3 space-x-3 whitespace-nowrap">
                  <button onClick={() => downloadPdf(q._id, q.quotationNumber)} className="text-xs text-navy underline">PDF</button>
                  <button onClick={() => copyWhatsappText(q._id)} className="text-xs text-green-700 underline">
                    {copiedId === q._id ? 'Copied!' : 'Copy WhatsApp'}
                  </button>
                </td>
              </tr>
            ))}
            {quotations.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-gray-400 py-6">No quotations yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Quotations;
