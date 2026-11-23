import mongoose from 'mongoose';

export const escapeRegex = (s = '') => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// copy only the allowed keys from an object
export const pick = (obj = {}, keys = []) =>
  keys.reduce((acc, k) => {
    if (obj[k] !== undefined) acc[k] = obj[k];
    return acc;
  }, {});

// empty strings from forms -> null so Mongoose doesn't choke on Date/Number casts
export const blankToNull = (obj, keys) => {
  keys.forEach((k) => {
    if (obj[k] === '') obj[k] = null;
  });
  return obj;
};

// combine several filters with $and, ignoring empty ones
export const andFilters = (...parts) => {
  const real = parts.filter((p) => p && Object.keys(p).length);
  if (real.length === 0) return {};
  if (real.length === 1) return real[0];
  return { $and: real };
};

// router.param('id', validateId) -> 400 on malformed ids instead of a 500 crash
export const validateId = (req, res, next, id) => {
  if (!isValidId(id)) return res.status(400).json({ message: 'Invalid ID' });
  next();
};

export const sendError = (res, err) => {
  if (res.headersSent) return res.end();
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((e) => e.message).join(', ');
    return res.status(400).json({ message });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ message: `Invalid value for ${err.path}` });
  }
  if (err.code === 11000) {
    return res.status(400).json({ message: 'Duplicate value, record already exists' });
  }
  console.error(err);
  return res.status(500).json({ message: 'Server error' });
};
