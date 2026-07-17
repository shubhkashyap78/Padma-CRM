import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import logo from '../assets/padma-logo.png';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy relative overflow-hidden">
      {/* ambient radial glow, quiet not flashy */}
      <div className="pointer-events-none absolute -top-40 -left-40 w-96 h-96 rounded-full bg-gold/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-maroon/20 blur-3xl" />

      <div className="relative bg-cream rounded-2xl shadow-2xl w-full max-w-sm p-8 border border-white/10">
        <div className="text-center mb-6">
          <img src={logo} alt="Padma Tourism" className="w-24 h-24 object-contain mx-auto mb-2" />
          <h1 className="font-display text-2xl font-semibold text-navy tracking-wide">Padma Tourism</h1>
          <p className="text-xs text-maroon uppercase tracking-[0.25em] mt-1">CRM Access</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm rounded-lg px-3 py-2 mb-4 border border-red-100">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-navy/70 uppercase tracking-wide">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full border border-navy/15 bg-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent transition"
              placeholder="you@padmatourism.com"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-navy/70 uppercase tracking-wide">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full border border-navy/15 bg-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent transition"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-navy text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-navy/90 disabled:opacity-50 transition-colors mt-2"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="text-center text-[11px] text-navy/40 mt-6 tracking-wide">Puri · Divine Destination</p>
      </div>
    </div>
  );
};

export default Login;
