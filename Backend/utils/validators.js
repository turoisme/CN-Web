// Email validation
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Username validation
const isValidUsername = (username) => {
  const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
  return usernameRegex.test(username);
};

// MongoDB ObjectId validation
const isValidObjectId = (id) => {
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  return objectIdRegex.test(id);
};

// URL validation
const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
};

// Year validation
const isValidYear = (year) => {
  const currentYear = new Date().getFullYear();
  return year >= 1800 && year <= currentYear + 5;
};

// Rating validation (1-10 scale)
const isValidRating = (rating) => {
  return Number.isInteger(rating) && rating >= 1 && rating <= 10;
};

// Sanitize string (remove HTML tags)
const sanitizeString = (str) => {
  return str.replace(/<[^>]*>/g, '');
};

// Truncate string
const truncateString = (str, maxLength) => {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength) + '...';
};

// Validate pagination params
const validatePaginationParams = (page, limit) => {
  const validPage = Math.max(1, parseInt(page) || 1);
  const validLimit = Math.min(100, Math.max(1, parseInt(limit) || 20));
  
  return { page: validPage, limit: validLimit };
};

// Slug generator
const generateSlug = (text) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

module.exports = {
  isValidEmail,
  isValidUsername,
  isValidObjectId,
  isValidUrl,
  isValidYear,
  isValidRating,
  sanitizeString,
  truncateString,
  validatePaginationParams,
  generateSlug
};