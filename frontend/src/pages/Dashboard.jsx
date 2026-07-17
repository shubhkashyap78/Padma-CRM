import { useEffect, useState } from 'react';
import api from '../api/axios.js';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#0b2545', '#c9a227', '#3b82f6', '#ef4444', '#10b981', '#8b5cf6'];

const StatCard = ({ label, value, prefix = '' }) => (
  <div className="bg-white rounded-2xl shadow-sm p-5 border border-navy/10 hover:shadow-md transition-shadow">
    <p className="text-xs text-navy/50 uppercase tracking-wider font-semibold">{label}</p>
    <p className="font-display text-3xl font-semibold text-navy mt-1.5">
      {prefix}
      {value?.toLocaleString?.('en-IN') ?? value}
    </p>
  </div>
);

const Dashboard = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/dashboard/stats').then((res) => setStats(res.data));
  }, []);

  if (!stats) return <p className="text-gray-500">Loading dashboard...</p>;

  return (
    <div>
      <h2 className="font-display text-3xl font-semibold text-navy mb-6">Dashboard</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Leads" value={stats.totalLeads} />
        <StatCard label="New Leads" value={stats.newLeads} />
        <StatCard label="Total Bookings" value={stats.totalBookings} />
        <StatCard label="Active Bookings" value={stats.activeBookings} />
        <StatCard label="Total Revenue" value={stats.totalRevenue} prefix="₹" />
        <StatCard label="Collected" value={stats.totalCollected} prefix="₹" />
        <StatCard label="Due" value={stats.totalDue} prefix="₹" />
        <StatCard label="Converted" value={stats.convertedLeads} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm p-5 border border-navy/10">
          <h3 className="font-semibold text-navy mb-3">Leads by Status</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={stats.leadsByStatus}
                dataKey="count"
                nameKey="_id"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {stats.leadsByStatus.map((entry, i) => (
                  <Cell key={entry._id} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-5 border border-navy/10">
          <h3 className="font-semibold text-navy mb-3">Recent Payments</h3>
          <ul className="divide-y divide-gray-100">
            {stats.recentPayments.length === 0 && (
              <p className="text-sm text-gray-400">No payments recorded yet.</p>
            )}
            {stats.recentPayments.map((p) => (
              <li key={p._id} className="py-2 flex justify-between text-sm">
                <span>
                  {p.booking?.customerName} ({p.booking?.bookingCode})
                </span>
                <span className="font-semibold text-navy">₹{p.amount.toLocaleString('en-IN')}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
