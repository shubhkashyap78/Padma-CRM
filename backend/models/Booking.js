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

const transportLegSchema = new mongoose.Schema(
  {
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
    driverName: { type: String, trim: true },
    driverPhone: { type: String, trim: true },
    fromDate: { type: Date },
    toDate: { type: Date },
    route: { type: String, trim: true }, // e.g. "Bhubaneswar Airport - Puri - Konark - Puri"
    cost: { type: Number, default: 0 },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

const bookingSchema = new mongoose.Schema(
  {
    bookingCode: { type: String, unique: true }, // e.g. PT-2026-0001
    lead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
    customerName: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, lowercase: true },
    packageName: { type: String, required: true },
    destination: { type: String },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    pax: { type: Number, default: 1 },
    travelers: [travelerSchema],
    transport: [transportLegSchema],
    totalAmount: { type: Number, required: true },
    amountPaid: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['Confirmed', 'In Progress', 'Completed', 'Cancelled'],
      default: 'Confirmed',
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
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
