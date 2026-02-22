require('./src/config'); // loads dotenv
const express = require('express'); // required for Vercel entrypoint detection
const app = require('./src/modules/app');

// Export for Vercel serverless functions
module.exports = app;

// Only listen on port if not in Vercel environment
if (process.env.VERCEL !== '1') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
        console.log(`Contact Form API: http://localhost:${PORT}/api/send-contact-email`);
        console.log(`Order Confirmation API: http://localhost:${PORT}/api/send-order-confirmation`);
        console.log(`Newsletter API: http://localhost:${PORT}/api/subscribe-newsletter`);
    });
}