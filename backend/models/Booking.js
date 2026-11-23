import mongoose from 'mongoose';

const travelerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    age: Number,
    idProofType: String,
    idProofNumber: String,
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    bookingCode: { type: String, unique: true }, // e.g. PT-2026-0001
    lead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
    quotation: { type: mongoose.Schema.Types.ObjectId, ref: 'Quotation' },
    customerName: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, lowercase: true },
    packageName: { type: String, required: true },
    destination: { type: String },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    pax: { type: Number, default: 1, min: 1 },
    travelers: [travelerSchema],
    totalAmount: { type: Number, required: true, min: 0 },
    amountPaid: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ['Confirmed', 'In Progress', 'Completed', 'Cancelled'],
      default: 'Confirmed',
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    itineraryNotes: { type: String },
  },
  { timestamps: true }
);

// virtual for balance due
bookingSchema.virtual('balanceDue').get(function () {
  return this.totalAmount - this.amountPaid;
});
bookingSchema.set('toJSON', { virtuals: true });
bookingSchema.set('toObject', { virtuals: true });

export default mongoose.model('Booking', bookingSchema);
