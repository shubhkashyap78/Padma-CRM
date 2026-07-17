import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema(
  {
    vehicleType: {
      type: String,
      enum: ['Sedan', 'SUV', 'Innova/Crysta', 'Tempo Traveller', 'Mini Bus', 'Bus', 'Other'],
      required: true,
    },
    vehicleNumber: { type: String, required: true, trim: true }, // registration number
    capacity: { type: Number, required: true }, // seating capacity
    driverName: { type: String, trim: true },
    driverPhone: { type: String, trim: true },
    ownership: {
      type: String,
      enum: ['Own Fleet', 'Vendor'],
      default: 'Vendor',
    },
    vendorName: { type: String, trim: true }, // if Vendor - the transport contractor name
    vendorPhone: { type: String, trim: true },
    ratePerDay: { type: Number },
    ratePerKm: { type: Number },
    status: {
      type: String,
      enum: ['Available', 'On Trip', 'Maintenance', 'Inactive'],
      default: 'Available',
    },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

export default mongoose.model('Vehicle', vehicleSchema);
