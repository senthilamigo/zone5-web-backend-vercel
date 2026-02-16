
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// For Vercel, we need to handle static files differently
// Static files should be in the 'public' folder
app.use(express.static('public'));

// Email transporter configuration
let transporter;

function createTransporter() {
    return nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });
}

// Initialize transporter
try {
    transporter = createTransporter();
    console.log('Email transporter initialized');
} catch (error) {
    console.error('Failed to initialize email transporter:', error);
}

// Verify transporter configuration (only in development)
if (process.env.NODE_ENV !== 'production') {
    transporter.verify((error, success) => {
        if (error) {
            console.error('Email transporter error:', error);
        } else {
            console.log('Email server is ready to send messages');
        }
    });
}

// API endpoint to send contact form email
app.post('/api/send-contact-email', async (req, res) => {
    try {
        const { name, email, phone, subject, message, submittedAt } = req.body;

        // Validate required fields
        if (!name || !email || !subject || !message) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing required fields (name, email, subject, message)' 
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid email format' 
            });
        }

        // Recreate transporter if needed (for serverless environments)
        if (!transporter) {
            transporter = createTransporter();
        }

        // Hardcoded seller email - UPDATE THIS WITH YOUR ACTUAL EMAIL
        //const SELLER_EMAIL = process.env.SELLER_EMAIL || 'support@zone5shop.com';
        const SELLER_EMAIL = 'shopzonefive@gmail.com';

        // Generate HTML email content for seller
        const emailHTML = generateContactEmailHTML({
            name,
            email,
            phone,
            subject,
            message,
            submittedAt
        });

        // Email options for seller notification
        const mailOptions = {
            from: `"Zone 5 Shop Contact Form" <${process.env.EMAIL_USER}>`,
            to: SELLER_EMAIL,
            replyTo: email, // Allow seller to reply directly to customer
            subject: `Contact Form: ${subject}`,
            html: emailHTML
        };

        // Send email to seller
        const info = await transporter.sendMail(mailOptions);

        console.log('Contact form email sent successfully:', info.messageId);
        console.log('Sender:', name, `<${email}>`);
        console.log('Subject:', subject);
        console.log('To:', SELLER_EMAIL);

        res.json({ 
            success: true, 
            message: 'Your message has been sent successfully. We will get back to you soon!',
        });

    } catch (error) {
        console.error('Error sending contact form email:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to send message. Please try again later.',
            error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message 
        });
    }
});

// API endpoint for newsletter subscription
app.post('/api/subscribe-newsletter', async (req, res) => {
    try {
        const { email } = req.body;

        // Validate email
        if (!email) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email is required' 
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid email format' 
            });
        }

        // Recreate transporter if needed
        if (!transporter) {
            transporter = createTransporter();
        }

        // Hardcoded seller email
        const SELLER_EMAIL = 'shopzonefive@gmail.com';
        const subscribedAt = new Date().toLocaleString('en-IN', { 
            timeZone: 'Asia/Kolkata',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        // Email to seller - notification of new subscription
        const sellerEmailHTML = generateSellerSubscriptionEmailHTML({
            email,
            subscribedAt
        });

        const sellerMailOptions = {
            from: `"Zone 5 Shop Newsletter" <${process.env.EMAIL_USER}>`,
            to: SELLER_EMAIL,
            subject: 'New Newsletter Subscription',
            html: sellerEmailHTML
        };

        // Email to customer - thank you note
        const customerEmailHTML = generateCustomerSubscriptionEmailHTML({ email });

        const customerMailOptions = {
            from: `"Zone 5 Shop" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Welcome to Zone 5 Shop Newsletter!',
            html: customerEmailHTML
        };

        // Send both emails
        await Promise.all([
            transporter.sendMail(sellerMailOptions),
            transporter.sendMail(customerMailOptions)
        ]);

        console.log('Newsletter subscription emails sent successfully');
        console.log('Subscriber:', email);
        console.log('Subscribed at:', subscribedAt);

        res.json({ 
            success: true, 
            message: 'Successfully subscribed to newsletter!'
        });

    } catch (error) {
        console.error('Error processing newsletter subscription:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to subscribe. Please try again later.',
            error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message 
        });
    }
});

// API endpoint to send order confirmation email
app.post('/api/send-order-confirmation', async (req, res) => {
    try {
        const { orderId, email, date, items, subtotal, shipping, total } = req.body;

        // Validate required fields
        if (!orderId || !email || !items || items.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing required order information' 
            });
        }

        // Recreate transporter if needed (for serverless environments)
        if (!transporter) {
            transporter = createTransporter();
        }

        // Generate HTML email content
        const emailHTML = generateOrderEmailHTML({
            orderId,
            email,
            date,
            items,
            subtotal,
            shipping,
            total
        });

        // Email options
        const mailOptions = {
            from: `"Zone 5 Shop" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: `Order Confirmation - ${orderId}`,
            html: emailHTML
        };

        // Send email
        const info = await transporter.sendMail(mailOptions);

        console.log('Email sent successfully:', info.messageId);
        console.log('Order ID:', orderId);
        console.log('Recipient:', email);

        res.json({ 
            success: true, 
            message: 'Order confirmation email sent successfully',
            orderId: orderId
        });

    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to send confirmation email',
            error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message 
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Server is running',
        environment: process.env.NODE_ENV || 'development'
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
            subscribeNewsletter: '/api/subscribe-newsletter (POST)'
        }
    });
});

// Function to generate seller notification email for new newsletter subscription
function generateSellerSubscriptionEmailHTML(data) {
    const { email, subscribedAt } = data;

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Newsletter Subscription</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #1f2937 0%, #374151 100%); padding: 40px 20px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Zone 5 Shop</h1>
                <p style="color: #D1D5DB; margin: 10px 0 0 0; font-style: italic;">Boldly Graceful</p>
            </div>

            <!-- Notification -->
            <div style="padding: 40px 30px; text-align: center; background-color: #EFF6FF; border-bottom: 3px solid #3B82F6;">
                <div style="width: 60px; height: 60px; background-color: #3B82F6; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                    <span style="color: white; font-size: 30px;">📧</span>
                </div>
                <h2 style="color: #1E40AF; margin: 0 0 10px 0; font-size: 24px;">New Newsletter Subscription</h2>
                <p style="color: #1E3A8A; margin: 0; font-size: 16px;">You have a new subscriber!</p>
            </div>

            <!-- Subscription Details -->
            <div style="padding: 30px;">
                <div style="background-color: #F9FAFB; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h3 style="margin: 0 0 15px 0; color: #111827; font-size: 18px;">Subscriber Information</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 8px 0; color: #6B7280; font-size: 14px;">Email:</td>
                            <td style="padding: 8px 0; color: #111827; font-weight: bold; text-align: right; font-size: 14px;">${email}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #6B7280; font-size: 14px;">Subscribed At:</td>
                            <td style="padding: 8px 0; color: #111827; text-align: right; font-size: 14px;">${subscribedAt}</td>
                        </tr>
                    </table>
                </div>

                <!-- Action Note -->
                <div style="margin-top: 20px; padding: 20px; background-color: #FEF3C7; border-radius: 8px; border-left: 4px solid #D97706;">
                    <h3 style="margin: 0 0 10px 0; color: #92400E; font-size: 16px;">Next Steps</h3>
                    <p style="margin: 0; color: #78350F; font-size: 14px;">
                        Add this subscriber to your newsletter mailing list. A welcome email has been automatically sent to the subscriber.
                    </p>
                </div>
            </div>

            <!-- Footer -->
            <div style="background-color: #1F2937; padding: 30px; text-align: center;">
                <p style="color: #9CA3AF; margin: 0 0 15px 0; font-size: 14px;">This is an automated notification from your website</p>
                <p style="color: #6B7280; margin: 0; font-size: 12px;">&copy; 2026 Zone 5 Shop. All rights reserved.</p>
                <p style="color: #6B7280; margin: 10px 0 0 0; font-size: 12px; font-style: italic;">Boldly Graceful</p>
            </div>
        </div>
    </body>
    </html>
    `;
}

// Function to generate customer thank you email for newsletter subscription
function generateCustomerSubscriptionEmailHTML(data) {
    const { email } = data;

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Zone 5 Shop Newsletter</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #1f2937 0%, #374151 100%); padding: 40px 20px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Zone 5 Shop</h1>
                <p style="color: #D1D5DB; margin: 10px 0 0 0; font-style: italic;">Boldly Graceful</p>
            </div>

            <!-- Welcome Message -->
            <div style="padding: 40px 30px; text-align: center; background-color: #F0FDF4; border-bottom: 3px solid #10B981;">
                <div style="width: 60px; height: 60px; background-color: #10B981; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                    <span style="color: white; font-size: 30px;">✓</span>
                </div>
                <h2 style="color: #065F46; margin: 0 0 10px 0; font-size: 24px;">Welcome to Our Newsletter!</h2>
                <p style="color: #047857; margin: 0; font-size: 16px;">Thank you for subscribing to Zone 5 Shop</p>
            </div>

            <!-- Content -->
            <div style="padding: 30px;">
                <p style="color: #111827; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                    Dear Valued Customer,
                </p>
                <p style="color: #111827; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                    Thank you for subscribing to the Zone 5 Shop newsletter! We're thrilled to have you as part of our fashion-forward community.
                </p>

                <!-- Benefits -->
                <div style="background-color: #EFF6FF; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h3 style="margin: 0 0 15px 0; color: #1E40AF; font-size: 18px;">What You'll Receive:</h3>
                    <ul style="margin: 0; padding-left: 20px; color: #1E3A8A; line-height: 1.8;">
                        <li>Exclusive early access to new collections</li>
                        <li>Special subscriber-only discounts and offers</li>
                        <li>Style tips and fashion inspiration</li>
                        <li>Updates on seasonal sales and promotions</li>
                        <li>Behind-the-scenes content and stories</li>
                    </ul>
                </div>

                <!-- Call to Action -->
                <div style="text-align: center; margin: 30px 0;">
                    <a href="https://zone5-new-web-vercel.vercel.app/products.html" 
                       style="display: inline-block; background-color: #D97706; color: white; padding: 15px 40px; 
                              text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                        Start Shopping
                    </a>
                </div>

                <!-- Social Media -->
                <div style="background-color: #FEF3C7; padding: 20px; border-radius: 8px; text-align: center;">
                    <h3 style="margin: 0 0 15px 0; color: #92400E; font-size: 16px;">Stay Connected</h3>
                    <p style="margin: 0 0 15px 0; color: #78350F; font-size: 14px;">Follow us on social media for daily inspiration</p>
                    <div style="margin-top: 15px;">
                        <a href="https://www.instagram.com/zone5shop/" style="color: #D97706; text-decoration: none; margin: 0 10px; font-weight: bold;">Instagram</a>
                        <a href="#" style="color: #D97706; text-decoration: none; margin: 0 10px; font-weight: bold;">Facebook</a>
                        <a href="#" style="color: #D97706; text-decoration: none; margin: 0 10px; font-weight: bold;">Pinterest</a>
                    </div>
                </div>

                <p style="color: #6B7280; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0; text-align: center;">
                    If you have any questions, feel free to reach out to us anytime.
                </p>
            </div>

            <!-- Footer -->
            <div style="background-color: #1F2937; padding: 30px; text-align: center;">
                <p style="color: #9CA3AF; margin: 0 0 15px 0; font-size: 14px;">
                    You're receiving this email because you subscribed to Zone 5 Shop newsletter
                </p>
                <p style="color: #6B7280; margin: 0; font-size: 12px;">&copy; 2026 Zone 5 Shop. All rights reserved.</p>
                <p style="color: #6B7280; margin: 10px 0 0 0; font-size: 12px; font-style: italic;">Boldly Graceful</p>
            </div>
        </div>
    </body>
    </html>
    `;
}

// Function to generate contact form email HTML
function generateContactEmailHTML(contactData) {
    const { name, email, phone, subject, message, submittedAt } = contactData;

    // Get subject label
    const subjectLabels = {
        'general': 'General Inquiry',
        'order': 'Order Related',
        'product': 'Product Information',
        'shipping': 'Shipping & Delivery',
        'returns': 'Returns & Exchanges',
        'feedback': 'Feedback & Suggestions',
        'other': 'Other'
    };
    const subjectLabel = subjectLabels[subject] || subject;

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Contact Form Submission</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #1f2937 0%, #374151 100%); padding: 40px 20px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Zone 5 Shop</h1>
                <p style="color: #D1D5DB; margin: 10px 0 0 0; font-style: italic;">Boldly Graceful</p>
            </div>

            <!-- New Message Alert -->
            <div style="padding: 40px 30px; text-align: center; background-color: #EFF6FF; border-bottom: 3px solid #3B82F6;">
                <div style="width: 60px; height: 60px; background-color: #3B82F6; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                    <span style="color: white; font-size: 30px;">✉</span>
                </div>
                <h2 style="color: #1E40AF; margin: 0 0 10px 0; font-size: 24px;">New Contact Form Submission</h2>
                <p style="color: #1E3A8A; margin: 0; font-size: 16px;">You have received a new message from your website</p>
            </div>

            <!-- Contact Details -->
            <div style="padding: 30px;">
                <div style="background-color: #F9FAFB; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                    <h3 style="margin: 0 0 15px 0; color: #111827; font-size: 18px;">Contact Information</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 8px 0; color: #6B7280; font-size: 14px; font-weight: bold;">Name:</td>
                            <td style="padding: 8px 0; color: #111827; text-align: right; font-size: 14px;">${name}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #6B7280; font-size: 14px; font-weight: bold;">Email:</td>
                            <td style="padding: 8px 0; text-align: right; font-size: 14px;">
                                <a href="mailto:${email}" style="color: #3B82F6; text-decoration: none;">${email}</a>
                            </td>
                        </tr>
                        ${phone ? `
                        <tr>
                            <td style="padding: 8px 0; color: #6B7280; font-size: 14px; font-weight: bold;">Phone:</td>
                            <td style="padding: 8px 0; color: #111827; text-align: right; font-size: 14px;">
                                <a href="tel:${phone}" style="color: #3B82F6; text-decoration: none;">${phone}</a>
                            </td>
                        </tr>
                        ` : ''}
                        <tr>
                            <td style="padding: 8px 0; color: #6B7280; font-size: 14px; font-weight: bold;">Subject:</td>
                            <td style="padding: 8px 0; color: #111827; text-align: right; font-size: 14px;">${subjectLabel}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #6B7280; font-size: 14px; font-weight: bold;">Date:</td>
                            <td style="padding: 8px 0; color: #111827; text-align: right; font-size: 14px;">${submittedAt}</td>
                        </tr>
                    </table>
                </div>

                <!-- Message Content -->
                <div style="background-color: #FEF3C7; padding: 20px; border-radius: 8px; border-left: 4px solid #D97706;">
                    <h3 style="margin: 0 0 15px 0; color: #92400E; font-size: 18px;">Message</h3>
                    <div style="color: #78350F; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${message}</div>
                </div>

                <!-- Action Required -->
                <div style="margin-top: 30px; padding: 20px; background-color: #F0FDF4; border-radius: 8px; border-left: 4px solid #10B981;">
                    <h3 style="margin: 0 0 15px 0; color: #065F46; font-size: 16px;">Next Steps</h3>
                    <p style="margin: 0; color: #047857; font-size: 14px;">
                        Please respond to this customer inquiry within 24 hours. You can reply directly to this email to contact the customer.
                    </p>
                </div>

                <!-- Quick Reply Button -->
                <div style="margin-top: 30px; text-align: center;">
                    <a href="mailto:${email}?subject=Re: ${subjectLabel}" 
                       style="display: inline-block; background-color: #D97706; color: white; padding: 15px 40px; 
                              text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                        Reply to Customer
                    </a>
                </div>
            </div>

            <!-- Footer -->
            <div style="background-color: #1F2937; padding: 30px; text-align: center;">
                <p style="color: #9CA3AF; margin: 0 0 15px 0; font-size: 14px;">This is an automated notification from your website contact form</p>
                <p style="color: #6B7280; margin: 0; font-size: 12px;">&copy; 2026 Zone 5 Shop. All rights reserved.</p>
                <p style="color: #6B7280; margin: 10px 0 0 0; font-size: 12px; font-style: italic;">Boldly Graceful</p>
            </div>
        </div>
    </body>
    </html>
    `;
}

// Function to generate order confirmation email HTML
function generateOrderEmailHTML(orderData) {
    const { orderId, date, items, subtotal, shipping, total } = orderData;

    const itemsHTML = items.map(item => `
        <tr>
            <td style="padding: 15px; border-bottom: 1px solid #eee;">
                <div style="display: flex; align-items: center;">
                    <img src="${item.image}" alt="${item.name}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px; margin-right: 15px;">
                    <div>
                        <h3 style="margin: 0 0 5px 0; font-size: 16px; color: #333;">${item.name}</h3>
                        <p style="margin: 0; font-size: 14px; color: #666;">Code: ${item.productcode}</p>
                        <p style="margin: 5px 0 0 0; font-size: 14px; color: #666;">Quantity: ${item.quantity}</p>
                    </div>
                </div>
            </td>
            <td style="padding: 15px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold; color: #D97706;">
                ₹${(item.price * item.quantity).toLocaleString('en-IN')}
            </td>
        </tr>
    `).join('');

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Confirmation</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #1f2937 0%, #374151 100%); padding: 40px 20px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Zone 5 Shop</h1>
                <p style="color: #D1D5DB; margin: 10px 0 0 0; font-style: italic;">Boldly Graceful</p>
            </div>

            <!-- Success Message -->
            <div style="padding: 40px 30px; text-align: center; background-color: #F0FDF4; border-bottom: 3px solid #10B981;">
                <div style="width: 60px; height: 60px; background-color: #10B981; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                    <span style="color: white; font-size: 30px;">✓</span>
                </div>
                <h2 style="color: #065F46; margin: 0 0 10px 0; font-size: 24px;">Order Confirmed!</h2>
                <p style="color: #047857; margin: 0; font-size: 16px;">Thank you for shopping with Zone 5 Shop</p>
            </div>

            <!-- Order Details -->
            <div style="padding: 30px;">
                <div style="background-color: #F9FAFB; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                    <h3 style="margin: 0 0 15px 0; color: #111827; font-size: 18px;">Order Information</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 8px 0; color: #6B7280; font-size: 14px;">Order ID:</td>
                            <td style="padding: 8px 0; color: #111827; font-weight: bold; text-align: right; font-size: 14px;">${orderId}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #6B7280; font-size: 14px;">Order Date:</td>
                            <td style="padding: 8px 0; color: #111827; text-align: right; font-size: 14px;">${date}</td>
                        </tr>
                    </table>
                </div>

                <!-- Order Items -->
                <h3 style="margin: 0 0 20px 0; color: #111827; font-size: 18px;">Order Items</h3>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                    ${itemsHTML}
                </table>

                <!-- Order Summary -->
                <div style="background-color: #FEF3C7; padding: 20px; border-radius: 8px; border-left: 4px solid #D97706;">
                    <h3 style="margin: 0 0 15px 0; color: #92400E; font-size: 18px;">Order Summary</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 8px 0; color: #78350F; font-size: 14px;">Subtotal:</td>
                            <td style="padding: 8px 0; color: #78350F; text-align: right; font-size: 14px;">₹${subtotal.toLocaleString('en-IN')}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #78350F; font-size: 14px;">Shipping:</td>
                            <td style="padding: 8px 0; text-align: right; font-size: 14px; color: ${shipping === 0 ? '#10B981' : '#78350F'}; font-weight: ${shipping === 0 ? 'bold' : 'normal'};">
                                ${shipping === 0 ? 'FREE' : '₹' + shipping.toLocaleString('en-IN')}
                            </td>
                        </tr>
                        <tr style="border-top: 2px solid #D97706;">
                            <td style="padding: 15px 0 0 0; color: #92400E; font-size: 18px; font-weight: bold;">Total:</td>
                            <td style="padding: 15px 0 0 0; color: #D97706; text-align: right; font-size: 20px; font-weight: bold;">₹${total.toLocaleString('en-IN')}</td>
                        </tr>
                    </table>
                </div>

                <!-- What's Next -->
                <div style="margin-top: 30px; padding: 20px; background-color: #EFF6FF; border-radius: 8px;">
                    <h3 style="margin: 0 0 15px 0; color: #1E40AF; font-size: 16px;">What's Next?</h3>
                    <ul style="margin: 0; padding-left: 20px; color: #1E3A8A;">
                        <li style="margin-bottom: 10px;">We'll send you a shipping confirmation email once your order ships</li>
                        <li style="margin-bottom: 10px;">You can track your order status anytime</li>
                        <li>Expected delivery: 5-7 business days</li>
                    </ul>
                </div>

                <!-- Customer Support -->
                <div style="margin-top: 30px; text-align: center; padding: 20px; border-top: 1px solid #E5E7EB;">
                    <p style="margin: 0 0 10px 0; color: #6B7280; font-size: 14px;">Need help with your order?</p>
                    <a href="mailto:support@zone5shop.com" style="color: #D97706; text-decoration: none; font-weight: bold;">Contact Support</a>
                </div>
            </div>

            <!-- Footer -->
            <div style="background-color: #1F2937; padding: 30px; text-align: center;">
                <p style="color: #9CA3AF; margin: 0 0 15px 0; font-size: 14px;">Follow us on social media</p>
                <div style="margin-bottom: 20px;">
                    <a href="https://www.instagram.com/zone5shop/" style="color: #D97706; text-decoration: none; margin: 0 10px;">Instagram</a>
                    <a href="#" style="color: #D97706; text-decoration: none; margin: 0 10px;">Facebook</a>
                    <a href="#" style="color: #D97706; text-decoration: none; margin: 0 10px;">Pinterest</a>
                </div>
                <p style="color: #6B7280; margin: 0; font-size: 12px;">&copy; 2026 Zone 5 Shop. All rights reserved.</p>
                <p style="color: #6B7280; margin: 10px 0 0 0; font-size: 12px; font-style: italic;">Boldly Graceful</p>
            </div>
        </div>
    </body>
    </html>
    `;
}

// Export for Vercel serverless functions
module.exports = app;

// Only listen on port if not in Vercel environment
if (process.env.VERCEL !== '1') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
        console.log(`Contact Form API: http://localhost:${PORT}/api/send-contact-email`);
        console.log(`Order Confirmation API: http://localhost:${PORT}/api/send-order-confirmation`);
    });
}
