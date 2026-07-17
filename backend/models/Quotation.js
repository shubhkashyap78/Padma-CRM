import mongoose from 'mongoose';

const itineraryDaySchema = new mongoose.Schema(
  {
    day: { type: Number, required: true },
    title: { type: String, required: true },
    description: { type: String },
    meals: { type: String }, // e.g. "Breakfast, Dinner"
    stay: { type: String }, // e.g. "Hotel Swosti Premium, Puri"
    transport: { type: String }, // e.g. "AC Innova - Airport pickup & Puri sightseeing"
  },
  { _id: false }
);

const pricingRowSchema = new mongoose.Schema(
  {
    label: { type: String, required: true }, // e.g. "Accommodation (4N/5D)"
    amount: { type: Number, required: true },
  },
  { _id: false }
);

const quotationSchema = new mongoose.Schema(
  {
    quotationNumber: { type: String, unique: true }, // PTQ-2026-0001
    lead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
    customerName: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, lowercase: true },
    packageName: { type: String, required: true },
    destination: { type: String },
    pax: { type: Number, default: 1 },
    travelDate: { type: Date },
    validTill: { type: Date },
    itinerary: [itineraryDaySchema],
    inclusions: [{ type: String }],
    exclusions: [{ type: String }],
    pricing: [pricingRowSchema],
    totalAmount: { type: Number, default: 0 },
    termsAndConditions: { type: String },
    status: {
      type: String,
      enum: ['Draft', 'Sent', 'Accepted', 'Rejected'],
      default: 'Draft',
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// keep totalAmount in sync with pricing rows before save
quotationSchema.pre('save', function (next) {
  if (this.pricing && this.pricing.length) {
    this.totalAmount = this.pricing.reduce((sum, row) => sum + (row.amount || 0), 0);
  }
  next();
});

export default mongoose.model('Quotation', quotationSchema);
