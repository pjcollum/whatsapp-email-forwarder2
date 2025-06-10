# WhatsApp Email Forwarder

This Node.js application monitors a specific email address and forwards new emails to WhatsApp.

## Prerequisites

- Node.js (v14 or higher)
- A Gmail account
- WhatsApp account
- A Railway.app account (free tier)

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password
SENDER_TO_WATCH=email-to-monitor@example.com
WHATSAPP_RECIPIENT=whatsapp-number@c.us
```

Note: For Gmail, you'll need to use an App Password. To generate one:
1. Enable 2-Step Verification in your Google Account
2. Go to Security → App Passwords
3. Generate a new app password for "Mail"

## Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

## Running Locally

```bash
npm start
```

## Deploying to Railway.app (Free Tier)

1. Create a Railway account at https://railway.app/
2. Install Railway CLI:
```bash
npm i -g @railway/cli
```

3. Login to Railway:
```bash
railway login
```

4. Initialize your project:
```bash
railway init
```

5. Set up environment variables in Railway dashboard:
   - Go to your project in Railway
   - Click on "Variables"
   - Add all the environment variables from your `.env` file

6. Deploy your application:
```bash
railway up
```

7. Monitor your application:
   - Go to Railway dashboard
   - Click on your project
   - View logs and status

## Features

- Monitors Gmail inbox for new emails
- Forwards matching emails to WhatsApp
- Runs daily at 12 PM
- Marks processed emails as read
- Filters out Google system emails

## Troubleshooting

- If the WhatsApp QR code doesn't appear, check the Railway logs
- For Gmail connection issues, verify your App Password
- Check the Railway logs for any error messages
- If the app stops, check your Railway credit usage in the dashboard

## Railway Free Tier Benefits

- $5 monthly credit
- Automatic deployments
- Built-in monitoring
- Easy environment variable management
- Persistent storage
- No credit card required 