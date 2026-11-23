import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    amount: { type: Number, required: true },
    mode: {
      type: String,
      enum: ['UPI', 'Bank Transfer', 'Cash', 'Card', 'Other'],
      default: 'UPI',
    },
    referenceNumber: { type: String, trim: true },
    paidOn: { type: Date, default: Date.now },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    remarks: { type: String, trim: true },
  },
  { timestamps: true }
);

export default mongoose.model('Payment', paymentSchema);
