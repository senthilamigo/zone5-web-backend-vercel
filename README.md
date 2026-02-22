# zone5-web-backend
# Zone 5 Shop — Email API

A Node.js + Express backend that handles transactional emails for Zone 5 Shop using Nodemailer.

---

## Features

- **Contact form** — forwards customer messages to the seller
- **Newsletter subscription** — notifies the seller and sends a welcome email to the subscriber
- **Order confirmation** — sends a branded order-confirmation email to the customer

---

## Folder Structure

```
├── server.js                        # Entry point (Vercel-compatible)
├── src/
│   ├── app.js                       # Express app setup (middleware, routes)
│   ├── config/
│   │   └── index.js                 # Environment config (dotenv, constants)
│   ├── middleware/
│   │   └── errorHandler.js          # Global error-handling middleware
│   ├── modules/
│   │   └── email/
│   │       ├── email.controller.js  # Request / response handling
│   │       ├── email.model.js       # Validation helpers
│   │       ├── email.route.js       # Express router
│   │       └── email.service.js     # Nodemailer logic
│   └── utils/
│       └── emailTemplates.js        # HTML email template generators
├── public/                          # Static assets (served by Express)
└── .env                             # Environment variables (not committed)
```

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- A Gmail account (or another SMTP provider)

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
PORT=3000
NODE_ENV=development
```

> **Gmail note:** Use an [App Password](https://support.google.com/accounts/answer/185833) if 2FA is enabled.

### Running Locally

```bash
node server.js
```

---

## API Endpoints

| Method | Endpoint                     | Description                          |
|--------|------------------------------|--------------------------------------|
| GET    | `/api/health`                | Health check                         |
| POST   | `/api/send-contact-email`    | Send contact form notification       |
| POST   | `/api/subscribe-newsletter`  | Newsletter subscription              |
| POST   | `/api/send-order-confirmation` | Send order confirmation email      |

### POST `/api/send-contact-email`

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "9876543210",
  "subject": "order",
  "message": "Where is my order?",
  "submittedAt": "22 February 2026, 10:30 AM"
}
```

### POST `/api/subscribe-newsletter`

```json
{
  "email": "jane@example.com"
}
```

### POST `/api/send-order-confirmation`

```json
{
  "orderId": "ORD-12345",
  "email": "jane@example.com",
  "date": "22 February 2026",
  "items": [
    {
      "name": "Silk Kurta",
      "productcode": "SKU-001",
      "image": "https://example.com/img.jpg",
      "price": 1299,
      "quantity": 2
    }
  ],
  "subtotal": 2598,
  "shipping": 0,
  "total": 2598
}
```

---

## Deployment (Vercel)

The app exports `module.exports = app` from `server.js`, making it compatible with Vercel serverless functions out of the box. Add the environment variables in your Vercel project settings.

---

## License

MIT

