const { Router } = require('express');
const {
    handleContactEmail,
    handleNewsletterSubscription,
    handleOrderConfirmation,
} = require('./email.controller');

const router = Router();

router.post('/send-contact-email', handleContactEmail);
router.post('/subscribe-newsletter', handleNewsletterSubscription);
router.post('/send-order-confirmation', handleOrderConfirmation);

module.exports = router;
