const {
    validateContactForm,
    validateNewsletterSubscription,
    validateOrderConfirmation,
} = require('./email.model');
const {
    sendContactEmail,
    sendNewsletterEmails,
    sendOrderConfirmationEmail,
} = require('./email.service');

/**
 * POST /api/send-contact-email
 */
async function handleContactEmail(req, res) {
    try {
        const { name, email, phone, subject, message, submittedAt } = req.body;

        const validation = validateContactForm({ name, email, subject, message });
        if (!validation.valid) {
            return res.status(400).json({ success: false, message: validation.message });
        }

        await sendContactEmail({ name, email, phone, subject, message, submittedAt });

        res.json({
            success: true,
            message: 'Your message has been sent successfully. We will get back to you soon!',
        });
    } catch (error) {
        console.error('Error sending contact form email:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send message. Please try again later.',
            error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
        });
    }
}

/**
 * POST /api/subscribe-newsletter
 */
async function handleNewsletterSubscription(req, res) {
    try {
        const { email } = req.body;

        const validation = validateNewsletterSubscription({ email });
        if (!validation.valid) {
            return res.status(400).json({ success: false, message: validation.message });
        }

        const subscribedAt = new Date().toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });

        await sendNewsletterEmails({ email, subscribedAt });

        res.json({ success: true, message: 'Successfully subscribed to newsletter!' });
    } catch (error) {
        console.error('Error processing newsletter subscription:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to subscribe. Please try again later.',
            error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
        });
    }
}

/**
 * POST /api/send-order-confirmation
 */
async function handleOrderConfirmation(req, res) {
    try {
        const { orderId, email, date, items, subtotal, shipping, total } = req.body;

        const validation = validateOrderConfirmation({ orderId, email, items });
        if (!validation.valid) {
            return res.status(400).json({ success: false, message: validation.message });
        }

        await sendOrderConfirmationEmail({ orderId, email, date, items, subtotal, shipping, total });

        res.json({
            success: true,
            message: 'Order confirmation email sent successfully',
            orderId,
        });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send confirmation email',
            error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
        });
    }
}

module.exports = {
    handleContactEmail,
    handleNewsletterSubscription,
    handleOrderConfirmation,
};
