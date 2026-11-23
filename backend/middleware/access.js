// Row-level access rules.
// Admin  -> sees everything.
// Staff  -> sees only records assigned to them or created by them.
export const isAdmin = (user) => user?.role === 'admin';

export const leadScope = (user) =>
  isAdmin(user) ? {} : { $or: [{ assignedTo: user._id }, { createdBy: user._id }] };

export const bookingScope = (user) =>
  isAdmin(user) ? {} : { $or: [{ assignedTo: user._id }, { createdBy: user._id }] };

export const quotationScope = (user) => (isAdmin(user) ? {} : { createdBy: user._id });
