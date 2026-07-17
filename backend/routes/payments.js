import express from 'express';
import Payment from '../models/Payment.js';
import Booking from '../models/Booking.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

// GET all payments (optionally filter by booking)
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.booking) filter.booking = req.query.booking;
    const payments = await Payment.find(filter)
      .populate('booking', 'bookingCode customerName totalAmount amountPaid')
      .populate('recordedBy', 'name')
      .sort({ paidOn: -1 });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST record a new payment against a booking
router.post('/', async (req, res) => {
  try {
    const { booking: bookingId, amount, mode, referenceNumber, remarks, paidOn } = req.body;
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const payment = await Payment.create({
      booking: bookingId,
      amount,
      mode,
      referenceNumber,
      remarks,
      paidOn: paidOn || Date.now(),
      recordedBy: req.user._id,
    });

    booking.amountPaid += Number(amount);
    await booking.save();

    res.status(201).json({ payment, booking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE a payment (reverses amountPaid on booking)
router.delete('/:id', async (req, res) => {
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
    res.status(500).json({ message: err.message });
  }
});

export default router;
