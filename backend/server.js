import express from 'express';
import dotenv from 'dotenv';
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
import vehicleRoutes from './routes/vehicles.js';

dotenv.config();
connectDB();

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/vehicles', vehicleRoutes);

// 404 handler
app.use((req, res) => res.status(404).json({ message: 'Route not found' }));

// error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Server error', error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Padma CRM backend running on port ${PORT}`));
