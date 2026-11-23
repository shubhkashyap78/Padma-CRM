import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
import cors from 'cors';
import morgan from 'morgan';
import connectDB from './config/db.js';

import authRoutes from './routes/auth.js';
import leadRoutes from './routes/leads.js';
import bookingRoutes from './routes/bookings.js';
import paymentRoutes from './routes/payments.js';
import staffRoutes from './routes/staff.js';
import dashboardRoutes from './routes/dashboard.js';
import quotationRoutes from './routes/quotations.js';

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.startsWith('change_this')) {
  console.error('JWT_SECRET is missing or still the default. Set a long random value in .env');
  process.exit(1);
}

connectDB();

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1); // correct client IP behind Render/Railway (used by login rate limit)

// CLIENT_URL can hold several origins separated by commas
const origins = (process.env.CLIENT_URL || '').split(',').map((o) => o.trim()).filter(Boolean);
app.use(cors({ origin: origins.length ? origins : '*' }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/quotations', quotationRoutes);

// 404 handler
app.use((req, res) => res.status(404).json({ message: 'Route not found' }));

// error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Padma CRM backend running on port ${PORT}`));
