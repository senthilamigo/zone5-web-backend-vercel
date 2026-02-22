// Email validation schema / model helpers

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SUBJECT_LABELS = {
    general: 'General Inquiry',
    order: 'Order Related',
    product: 'Product Information',
    shipping: 'Shipping & Delivery',
    returns: 'Returns & Exchanges',
    feedback: 'Feedback & Suggestions',
    other: 'Other',
};

/**
 * Validates a contact form payload.
 * Returns { valid: true } or { valid: false, message: string }
 */
function validateContactForm({ name, email, subject, message }) {
    if (!name || !email || !subject || !message) {
        return { valid: false, message: 'Missing required fields (name, email, subject, message)' };
    }
    if (!EMAIL_REGEX.test(email)) {
        return { valid: false, message: 'Invalid email format' };
    }
    return { valid: true };
}

/**
 * Validates a newsletter subscription payload.
 */
function validateNewsletterSubscription({ email }) {
    if (!email) {
        return { valid: false, message: 'Email is required' };
    }
    if (!EMAIL_REGEX.test(email)) {
        return { valid: false, message: 'Invalid email format' };
    }
    return { valid: true };
}

/**
 * Validates an order confirmation payload.
 */
function validateOrderConfirmation({ orderId, email, items }) {
    if (!orderId || !email || !items || items.length === 0) {
        return { valid: false, message: 'Missing required order information' };
    }
    return { valid: true };
}

module.exports = {
    EMAIL_REGEX,
    SUBJECT_LABELS,
    validateContactForm,
    validateNewsletterSubscription,
    validateOrderConfirmation,
};
