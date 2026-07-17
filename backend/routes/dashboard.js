import express from 'express';
import Lead from '../models/Lead.js';
import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

router.get('/stats', async (req, res) => {
  try {
    const [totalLeads, newLeads, convertedLeads, totalBookings, activeBookings] = await Promise.all([
      Lead.countDocuments(),
      Lead.countDocuments({ status: 'New' }),
      Lead.countDocuments({ status: 'Converted' }),
      Booking.countDocuments(),
      Booking.countDocuments({ status: { $in: ['Confirmed', 'In Progress'] } }),
    ]);

    const bookings = await Booking.find();
    const totalRevenue = bookings.reduce((sum, b) => sum + b.totalAmount, 0);
    const totalCollected = bookings.reduce((sum, b) => sum + b.amountPaid, 0);
    const totalDue = totalRevenue - totalCollected;

    const leadsByStatus = await Lead.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const recentPayments = await Payment.find()
      .populate('booking', 'bookingCode customerName')
      .sort({ paidOn: -1 })
      .limit(5);

    res.json({
      totalLeads,
      newLeads,
      convertedLeads,
      totalBookings,
      activeBookings,
      totalRevenue,
      totalCollected,
      totalDue,
      leadsByStatus,
      recentPayments,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
