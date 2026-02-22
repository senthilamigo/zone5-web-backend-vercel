const nodemailer = require('nodemailer');
const {
    generateContactEmailHTML,
    generateSellerSubscriptionEmailHTML,
    generateCustomerSubscriptionEmailHTML,
    generateOrderEmailHTML,
} = require('../../utils/emailTemplates');

let transporter;

function createTransporter() {
    return nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
        },
    });
}

function getTransporter() {
    if (!transporter) {
        transporter = createTransporter();
    }
    return transporter;
}

// Initialize transporter on startup
try {
    transporter = createTransporter();
    console.log('Email transporter initialized');
} catch (error) {
    console.error('Failed to initialize email transporter:', error);
}

// Verify transporter in non-production environments
if (process.env.NODE_ENV !== 'production') {
    transporter.verify((error) => {
        if (error) {
            console.error('Email transporter error:', error);
        } else {
            console.log('Email server is ready to send messages');
        }
    });
}

const SELLER_EMAIL = 'shopzonefive@gmail.com';

/**
 * Sends the contact form notification to the seller.
 */
async function sendContactEmail({ name, email, phone, subject, message, submittedAt }) {
    const emailHTML = generateContactEmailHTML({ name, email, phone, subject, message, submittedAt });

    const mailOptions = {
        from: `"Zone 5 Shop Contact Form" <${process.env.EMAIL_USER}>`,
        to: SELLER_EMAIL,
        replyTo: email,
        subject: `Contact Form: ${subject}`,
        html: emailHTML,
    };

    const info = await getTransporter().sendMail(mailOptions);
    console.log('Contact form email sent successfully:', info.messageId);
    console.log('Sender:', name, `<${email}>`);
    console.log('Subject:', subject);
    console.log('To:', SELLER_EMAIL);
}

/**
 * Sends newsletter subscription emails to both seller and subscriber.
 */
async function sendNewsletterEmails({ email, subscribedAt }) {
    const sellerEmailHTML = generateSellerSubscriptionEmailHTML({ email, subscribedAt });
    const customerEmailHTML = generateCustomerSubscriptionEmailHTML({ email });

    const sellerMailOptions = {
        from: `"Zone 5 Shop Newsletter" <${process.env.EMAIL_USER}>`,
        to: SELLER_EMAIL,
        subject: 'New Newsletter Subscription',
        html: sellerEmailHTML,
    };

    const customerMailOptions = {
        from: `"Zone 5 Shop" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Welcome to Zone 5 Shop Newsletter!',
        html: customerEmailHTML,
    };

    await Promise.all([
        getTransporter().sendMail(sellerMailOptions),
        getTransporter().sendMail(customerMailOptions),
    ]);

    console.log('Newsletter subscription emails sent successfully');
    console.log('Subscriber:', email);
    console.log('Subscribed at:', subscribedAt);
}

/**
 * Sends an order confirmation email to the customer.
 */
async function sendOrderConfirmationEmail({ orderId, email, date, items, subtotal, shipping, total }) {
    const emailHTML = generateOrderEmailHTML({ orderId, email, date, items, subtotal, shipping, total });

    const mailOptions = {
        from: `"Zone 5 Shop" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `Order Confirmation - ${orderId}`,
        html: emailHTML,
    };

    const info = await getTransporter().sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    console.log('Order ID:', orderId);
    console.log('Recipient:', email);
}

module.exports = {
    sendContactEmail,
    sendNewsletterEmails,
    sendOrderConfirmationEmail,
};
