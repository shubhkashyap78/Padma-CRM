import express from 'express';
import Lead from '../models/Lead.js';
import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import { protect } from '../middleware/auth.js';
import { isAdmin, leadScope, bookingScope } from '../middleware/access.js';
import { andFilters, sendError } from '../utils/helpers.js';

const router = express.Router();
router.use(protect);

router.get('/stats', async (req, res) => {
  try {
    const admin = isAdmin(req.user);
    const lScope = leadScope(req.user);
    const bScope = bookingScope(req.user);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const [
      totalLeads, newLeads, convertedLeads, totalBookings, activeBookings, leadsByStatus, followUps,
    ] = await Promise.all([
      Lead.countDocuments(lScope),
      Lead.countDocuments(andFilters(lScope, { status: 'New' })),
      Lead.countDocuments(andFilters(lScope, { status: 'Converted' })),
      Booking.countDocuments(bScope),
      Booking.countDocuments(andFilters(bScope, { status: { $in: ['Confirmed', 'In Progress'] } })),
      Lead.aggregate([{ $match: lScope }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      Lead.find(
        andFilters(lScope, {
          nextFollowUp: { $lte: endOfToday },
          status: { $nin: ['Converted', 'Lost'] },
        })
      )
        .select('customerName phone status nextFollowUp assignedTo')
        .populate('assignedTo', 'name')
        .sort({ nextFollowUp: 1 })
        .limit(10),
    ]);

    const result = {
      totalLeads,
      newLeads,
      convertedLeads,
      totalBookings,
      activeBookings,
      leadsByStatus,
      followUps,
      financials: null,
      recentPayments: [],
    };

    // money figures are admin-only
    if (admin) {
      const [live] = await Booking.aggregate([
        { $match: { status: { $ne: 'Cancelled' } } },
        { $group: { _id: null, revenue: { $sum: '$totalAmount' }, paid: { $sum: '$amountPaid' } } },
      ]);
      const [all] = await Booking.aggregate([{ $group: { _id: null, paid: { $sum: '$amountPaid' } } }]);
      const revenue = live?.revenue || 0;
      result.financials = {
        totalRevenue: revenue,
        totalCollected: all?.paid || 0,
        totalDue: revenue - (live?.paid || 0),
      };
      result.recentPayments = await Payment.find()
        .populate('booking', 'bookingCode customerName')
        .sort({ paidOn: -1 })
        .limit(5);
    }

    res.json(result);
  } catch (err) {
    sendError(res, err);
  }
});

export default router;
