import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import { inr, dateIN, isOverdue, errMsg } from '../utils/format.js';
import ErrorBanner from '../components/ErrorBanner.jsx';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#0b2545', '#c9a227', '#3b82f6', '#ef4444', '#10b981', '#8b5cf6'];

const StatCard = ({ label, value, money = false }) => (
  <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
    <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
    <p className="text-2xl font-bold text-navy mt-1">{money ? inr(value) : Number(value || 0).toLocaleString('en-IN')}</p>
  </div>
);

const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/dashboard/stats').then((res) => setStats(res.data)).catch((e) => setError(errMsg(e, 'Could not load dashboard')));
  }, []);

  if (error) return <ErrorBanner message={error} />;
  if (!stats) return <p className="text-gray-500">Loading dashboard...</p>;

  const f = stats.financials;

  return (
    <div>
      <h2 className="text-xl font-bold text-navy mb-1">Dashboard</h2>
      <p className="text-sm text-gray-500 mb-5">
        {isAdmin ? 'Company overview' : `Hello ${user?.name}, here is your work`}
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label={isAdmin ? 'Total Leads' : 'My Leads'} value={stats.totalLeads} />
        <StatCard label="New Leads" value={stats.newLeads} />
        <StatCard label={isAdmin ? 'Total Bookings' : 'My Bookings'} value={stats.totalBookings} />
        <StatCard label="Active Bookings" value={stats.activeBookings} />
        {f && (
          <>
            <StatCard label="Total Revenue" value={f.totalRevenue} money />
            <StatCard label="Collected" value={f.totalCollected} money />
            <StatCard label="Due" value={f.totalDue} money />
          </>
        )}
        <StatCard label="Converted" value={stats.convertedLeads} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <h3 className="font-semibold text-navy mb-3">Follow-ups Due</h3>
          {stats.followUps.length === 0 ? (
            <p className="text-sm text-gray-400">Nothing due today. 🎉</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {stats.followUps.map((l) => (
                <li key={l._id} className="py-2 flex justify-between text-sm">
                  <span>
                    <Link to="/leads" className="font-medium text-navy hover:underline">{l.customerName}</Link>
                    <span className="text-xs text-gray-400 ml-2">{l.phone}</span>
                    {isAdmin && l.assignedTo?.name && <span className="text-xs text-gray-400 ml-2">· {l.assignedTo.name}</span>}
                  </span>
                  <span className={`text-xs font-medium ${isOverdue(l.nextFollowUp) ? 'text-red-600' : 'text-orange-600'}`}>
                    {isOverdue(l.nextFollowUp) ? 'Overdue · ' : 'Today · '}{dateIN(l.nextFollowUp)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <h3 className="font-semibold text-navy mb-3">Leads by Status</h3>
          {stats.leadsByStatus.length === 0 ? (
            <p className="text-sm text-gray-400">No leads yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={stats.leadsByStatus} dataKey="count" nameKey="_id" cx="50%" cy="50%" outerRadius={80} label>
                  {stats.leadsByStatus.map((entry, i) => (
                    <Cell key={entry._id} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {isAdmin && (
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 md:col-span-2">
            <h3 className="font-semibold text-navy mb-3">Recent Payments</h3>
            <ul className="divide-y divide-gray-100">
              {stats.recentPayments.length === 0 && <p className="text-sm text-gray-400">No payments recorded yet.</p>}
              {stats.recentPayments.map((p) => (
                <li key={p._id} className="py-2 flex justify-between text-sm">
                  <span>{p.booking?.customerName} ({p.booking?.bookingCode})</span>
                  <span className="font-semibold text-navy">{inr(p.amount)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
