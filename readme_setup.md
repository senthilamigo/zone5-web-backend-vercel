# Zone 5 Shop - Email Server Setup

This Node.js backend server handles sending order confirmation emails for Zone 5 Shop.

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- A Gmail account (or other email service)

## Installation Steps

### 1. Install Dependencies

```bash
npm install
```

This will install:
- `express` - Web framework
- `cors` - Enable cross-origin requests
- `nodemailer` - Email sending library
- `dotenv` - Environment variable management

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit the `.env` file with your email credentials:

```env
PORT=3000
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

### 3. Gmail Setup (Recommended)

If using Gmail, you need to generate an **App Password**:

1. Go to your Google Account: https://myaccount.google.com/
2. Navigate to Security
3. Enable 2-Step Verification (if not already enabled)
4. Go to App Passwords: https://myaccount.google.com/apppasswords
5. Select "Mail" and "Other (Custom name)"
6. Name it "Zone5Shop" and click Generate
7. Copy the 16-character password
8. Use this password in your `.env` file as `EMAIL_PASSWORD`

### 4. Alternative Email Services

#### SendGrid
```env
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=your-api-key
```

#### Outlook/Hotmail
```env
EMAIL_SERVICE=outlook
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-password
```

#### Custom SMTP
```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-username
SMTP_PASS=your-password
```

## Running the Server

### Development Mode (with auto-restart)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:3000`

## Project Structure

```
zone5shop-email-server/
├── server.js           # Main server file
├── package.json        # Dependencies
├── .env               # Environment variables (create this)
├── .env.example       # Environment template
├── README.md          # This file
└── public/            # Static files (HTML, CSS, JS)
    ├── cart.html
    ├── cart.js
    └── images/
```

## API Endpoints

### Send Order Confirmation
```
POST /api/send-order-confirmation
```

**Request Body:**
```json
{
  "orderId": "ORD12345678",
  "email": "customer@example.com",
  "date": "26 Jan, 2026, 10:30 AM",
  "items": [
    {
      "name": "Product Name",
      "productcode": "PROD001",
      "quantity": 2,
      "price": 1500,
      "image": "https://example.com/image.jpg"
    }
  ],
  "subtotal": 3000,
  "shipping": 99,
  "total": 3099
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order confirmation email sent successfully",
  "orderId": "ORD12345678"
}
```

### Health Check
```
GET /api/health
```

**Response:**
```json
{
  "status": "OK",
  "message": "Server is running"
}
```

## Updating Frontend

Update the `sendConfirmationEmail()` function in your `cart.html` or `cart.js`:

```javascript
async function sendConfirmationEmail(orderDetails) {
    try {
        const response = await fetch('http://localhost:3000/api/send-order-confirmation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderDetails)
        });

        const result = await response.json();
        
        if (result.success) {
            console.log('Email sent successfully!');
        } else {
            console.error('Failed to send email:', result.message);
        }
    } catch (error) {
        console.error('Error sending email:', error);
    }
}
```

## Testing

### Test the API with curl:

```bash
curl -X POST http://localhost:3000/api/send-order-confirmation \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "ORD12345678",
    "email": "test@example.com",
    "date": "26 Jan, 2026",
    "items": [
      {
        "name": "Test Product",
        "productcode": "TEST001",
        "quantity": 1,
        "price": 1000,
        "image": "https://via.placeholder.com/150"
      }
    ],
    "subtotal": 1000,
    "shipping": 99,
    "total": 1099
  }'
```

### Test with Postman:
1. Create a new POST request
2. URL: `http://localhost:3000/api/send-order-confirmation`
3. Headers: `Content-Type: application/json`
4. Body: Use the JSON example above

## Troubleshooting

### "Invalid login" error with Gmail
- Make sure you're using an App Password, not your regular Gmail password
- Ensure 2-Step Verification is enabled
- Check that "Less secure app access" is not blocking the app

### CORS errors
- The server uses the `cors` middleware to allow cross-origin requests
- If you need specific origins, modify the CORS configuration in `server.js`

### Port already in use
- Change the PORT in `.env` file
- Or kill the process using the port: `lsof -ti:3000 | xargs kill`

## Deployment

### Deploy to Heroku
```bash
heroku create zone5shop-email-server
git push heroku main
heroku config:set EMAIL_USER=your-email@gmail.com
heroku config:set EMAIL_PASSWORD=your-app-password
```

### Deploy to Vercel
```bash
vercel
```

### Deploy to Railway
```bash
railway init
railway up
```

## Security Notes

- Never commit `.env` file to version control
- Use environment variables for all sensitive data
- Consider implementing rate limiting for production
- Add authentication for the API endpoint in production
- Use HTTPS in production

## Support

For issues or questions, contact: support@zone5shop.com

## License

ISC
