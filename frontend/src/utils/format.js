export const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

export const dateIN = (d) => (d ? new Date(d).toLocaleDateString('en-IN') : '-');

// value for <input type="date">
export const dateInput = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');

export const errMsg = (err, fallback = 'Something went wrong') =>
  err?.response?.data?.message || fallback;

export const isOverdue = (d) => d && new Date(d) < new Date(new Date().setHours(0, 0, 0, 0));

// rows = array of plain objects; first object's keys become the header
export const downloadCsv = (filename, rows) => {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = [keys.join(','), ...rows.map((r) => keys.map((k) => esc(r[k])).join(','))].join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

export const inputCls = 'border rounded-lg px-3 py-2 text-sm w-full';
