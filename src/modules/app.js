const express = require('express');
const cors = require('cors');
const emailRouter = require('./email/email.route');
const errorHandler = require('../middleware/errorHandler');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Static files (Vercel compatible — place assets in the 'public' folder)
app.use(express.static('public'));

// Routes
app.use('/api', emailRouter);

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Server is running',
        environment: process.env.NODE_ENV || 'development',
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'Zone 5 Shop Email API',
        endpoints: {
            health: '/api/health',
            sendContactEmail: '/api/send-contact-email (POST)',
            sendOrderEmail: '/api/send-order-confirmation (POST)',
            subscribeNewsletter: '/api/subscribe-newsletter (POST)',
        },
    });
});

// Global error handler (must be last)
app.use(errorHandler);

module.exports = app;
