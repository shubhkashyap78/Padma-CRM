import express from 'express';
import Payment from '../models/Payment.js';
import Booking from '../models/Booking.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { bookingScope } from '../middleware/access.js';
import { andFilters, validateId, sendError } from '../utils/helpers.js';

const router = express.Router();
router.use(protect);
router.param('id', validateId);

// GET payments (staff: only for bookings they can access)
router.get('/', async (req, res) => {
  try {
    const bookingIds = await Booking.find(bookingScope(req.user)).distinct('_id');
    const filter = { booking: { $in: bookingIds } };
    if (req.query.booking) {
      if (!bookingIds.some((id) => id.toString() === req.query.booking)) return res.json([]);
      filter.booking = req.query.booking;
    }
    const payments = await Payment.find(filter)
      .populate('booking', 'bookingCode customerName totalAmount amountPaid')
      .populate('recordedBy', 'name')
      .sort({ paidOn: -1 });
    res.json(payments);
  } catch (err) {
    sendError(res, err);
  }
});

// POST record a payment against a booking
router.post('/', async (req, res) => {
  try {
    const { booking: bookingId, mode, referenceNumber, remarks, paidOn } = req.body;
    const amount = Number(req.body.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than 0' });
    }

    const booking = await Booking.findOne(andFilters({ _id: bookingId }, bookingScope(req.user)));
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.status === 'Cancelled') {
      return res.status(400).json({ message: 'Cannot record payment on a cancelled booking' });
    }

    // atomic: only succeeds if it does not push amountPaid above totalAmount
    const updated = await Booking.findOneAndUpdate(
      { _id: booking._id, $expr: { $lte: [{ $add: ['$amountPaid', amount] }, '$totalAmount'] } },
      { $inc: { amountPaid: amount } },
      { new: true }
    );
    if (!updated) {
      return res.status(400).json({
        message: `Amount exceeds balance due (₹${booking.totalAmount - booking.amountPaid})`,
      });
    }

    let payment;
    try {
      payment = await Payment.create({
        booking: booking._id,
        amount,
        mode,
        referenceNumber,
        remarks,
        paidOn: paidOn || Date.now(),
        recordedBy: req.user._id,
      });
    } catch (err) {
      await Booking.findByIdAndUpdate(booking._id, { $inc: { amountPaid: -amount } }); // roll back
      throw err;
    }

    res.status(201).json({ payment, booking: updated });
  } catch (err) {
    sendError(res, err);
  }
});

// DELETE a payment (admin only) - reverses amountPaid on the booking
router.delete('/:id', adminOnly, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    const booking = await Booking.findById(payment.booking);
    if (booking) {
      booking.amountPaid = Math.max(0, booking.amountPaid - payment.amount);
      await booking.save();
    }
    await payment.deleteOne();
    res.json({ message: 'Payment removed and booking balance updated' });
  } catch (err) {
    sendError(res, err);
  }
});

export default router;
