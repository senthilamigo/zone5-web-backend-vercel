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

// API endpoint to send order confirmation email
app.post('/api/send-order-confirmation', async (req, res) => {
    try {
        const { orderId, email, date, items, subtotal, shipping, total, recipient, sellerEmail } = req.body;

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

        // Determine recipient type
        const isSellerEmail = recipient === 'seller';
        const recipientEmail = isSellerEmail ? sellerEmail : email;

        // Generate appropriate HTML email content
        const emailHTML = isSellerEmail 
            ? generateSellerNotificationHTML({ orderId, email, date, items, subtotal, shipping, total })
            : generateOrderEmailHTML({ orderId, email, date, items, subtotal, shipping, total });

        // Email options
        const mailOptions = {
            from: `"Zone 5 Shop" <${process.env.EMAIL_USER}>`,
            to: recipientEmail,
            subject: isSellerEmail 
                ? `New Order Received - ${orderId}` 
                : `Order Confirmation - ${orderId}`,
            html: emailHTML
        };

        // Send email
        const info = await transporter.sendMail(mailOptions);

        console.log('Email sent successfully:', info.messageId);
        console.log('Order ID:', orderId);
        console.log('Recipient Type:', isSellerEmail ? 'Seller' : 'Customer');
        console.log('Recipient Email:', recipientEmail);

        res.json({ 
            success: true, 
            message: `${isSellerEmail ? 'Seller notification' : 'Order confirmation email'} sent successfully`,
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
            sendEmail: '/api/send-order-confirmation (POST)'
        }
    });
});

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

// Function to generate seller notification email HTML
function generateSellerNotificationHTML(orderData) {
    const { orderId, email, date, items, subtotal, shipping, total } = orderData;

    const itemsHTML = items.map(item => `
        <tr>
            <td style="padding: 15px; border-bottom: 1px solid #eee;">
                <div style="display: flex; align-items: center;">
                    <img src="${item.image}" alt="${item.name}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px; margin-right: 15px;">
                    <div>
                        <h3 style="margin: 0 0 5px 0; font-size: 16px; color: #333;">${item.name}</h3>
                        <p style="margin: 0; font-size: 14px; color: #666;">Code: ${item.productcode}</p>
                        <p style="margin: 5px 0 0 0; font-size: 14px; color: #666;">Category: ${item.category || 'N/A'} / ${item.subcategory || 'N/A'}</p>
                        <p style="margin: 5px 0 0 0; font-size: 14px; font-weight: bold; color: #333;">Quantity: ${item.quantity}</p>
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
        <title>New Order Notification</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #1f2937 0%, #374151 100%); padding: 40px 20px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Zone 5 Shop</h1>
                <p style="color: #D1D5DB; margin: 10px 0 0 0; font-style: italic;">Seller Dashboard</p>
            </div>

            <!-- Alert Message -->
            <div style="padding: 40px 30px; text-align: center; background-color: #FEF3C7; border-bottom: 3px solid #D97706;">
                <div style="width: 60px; height: 60px; background-color: #D97706; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                    <span style="color: white; font-size: 30px;">🛍️</span>
                </div>
                <h2 style="color: #92400E; margin: 0 0 10px 0; font-size: 24px;">New Order Received!</h2>
                <p style="color: #78350F; margin: 0; font-size: 16px;">A customer has placed an order</p>
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
                        <tr>
                            <td style="padding: 8px 0; color: #6B7280; font-size: 14px;">Customer Email:</td>
                            <td style="padding: 8px 0; color: #111827; text-align: right; font-size: 14px;">${email}</td>
                        </tr>
                    </table>
                </div>

                <!-- Order Items -->
                <h3 style="margin: 0 0 20px 0; color: #111827; font-size: 18px;">Order Items</h3>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                    ${itemsHTML}
                </table>

                <!-- Order Summary -->
                <div style="background-color: #DBEAFE; padding: 20px; border-radius: 8px; border-left: 4px solid #2563EB;">
                    <h3 style="margin: 0 0 15px 0; color: #1E3A8A; font-size: 18px;">Order Summary</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 8px 0; color: #1E40AF; font-size: 14px;">Subtotal:</td>
                            <td style="padding: 8px 0; color: #1E40AF; text-align: right; font-size: 14px;">₹${subtotal.toLocaleString('en-IN')}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #1E40AF; font-size: 14px;">Shipping:</td>
                            <td style="padding: 8px 0; text-align: right; font-size: 14px; color: ${shipping === 0 ? '#10B981' : '#1E40AF'}; font-weight: ${shipping === 0 ? 'bold' : 'normal'};">
                                ${shipping === 0 ? 'FREE' : '₹' + shipping.toLocaleString('en-IN')}
                            </td>
                        </tr>
                        <tr style="border-top: 2px solid #2563EB;">
                            <td style="padding: 15px 0 0 0; color: #1E3A8A; font-size: 18px; font-weight: bold;">Total:</td>
                            <td style="padding: 15px 0 0 0; color: #2563EB; text-align: right; font-size: 20px; font-weight: bold;">₹${total.toLocaleString('en-IN')}</td>
                        </tr>
                    </table>
                </div>

                <!-- Action Required -->
                <div style="margin-top: 30px; padding: 20px; background-color: #FEF2F2; border-radius: 8px; border-left: 4px solid #DC2626;">
                    <h3 style="margin: 0 0 15px 0; color: #991B1B; font-size: 16px;">⚡ Action Required</h3>
                    <ul style="margin: 0; padding-left: 20px; color: #7F1D1D;">
                        <li style="margin-bottom: 10px;">Process this order in your inventory system</li>
                        <li style="margin-bottom: 10px;">Prepare items for packaging and shipping</li>
                        <li style="margin-bottom: 10px;">Send shipping confirmation to customer: ${email}</li>
                        <li>Update order status in your dashboard</li>
                    </ul>
                </div>

                <!-- Quick Stats -->
                <div style="margin-top: 30px; padding: 20px; background-color: #F0FDF4; border-radius: 8px;">
                    <h3 style="margin: 0 0 15px 0; color: #065F46; font-size: 16px;">📊 Quick Stats</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 5px 0; color: #047857; font-size: 14px;">Total Items:</td>
                            <td style="padding: 5px 0; color: #065F46; text-align: right; font-weight: bold; font-size: 14px;">${items.reduce((sum, item) => sum + item.quantity, 0)} units</td>
                        </tr>
                        <tr>
                            <td style="padding: 5px 0; color: #047857; font-size: 14px;">Order Value:</td>
                            <td style="padding: 5px 0; color: #065F46; text-align: right; font-weight: bold; font-size: 14px;">₹${total.toLocaleString('en-IN')}</td>
                        </tr>
                    </table>
                </div>
            </div>

            <!-- Footer -->
            <div style="background-color: #1F2937; padding: 30px; text-align: center;">
                <p style="color: #9CA3AF; margin: 0 0 10px 0; font-size: 14px;">Zone 5 Shop - Seller Notification</p>
                <p style="color: #6B7280; margin: 0; font-size: 12px;">This is an automated notification. Please do not reply to this email.</p>
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
        console.log(`API endpoint: http://localhost:${PORT}/api/send-order-confirmation`);
    });
}
