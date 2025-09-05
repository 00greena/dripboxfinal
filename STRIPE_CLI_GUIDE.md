# Stripe CLI Development Guide

## ✅ Installation Complete!

Stripe CLI has been successfully installed and configured for your STASHBOX project.

- **Version**: 1.21.8 (installed) - Update to 1.30.0 available
- **Account**: Printy (acct_1M0L0oDAvo3wdM2L)
- **Authentication**: Valid for 90 days

## 🔧 Local Development Setup

### 1. Start Your Development Servers

**Terminal 1 - Frontend & API:**
```bash
npm run dev
# Runs on http://localhost:5173
```

**Terminal 2 - Stripe Webhooks:**
```bash
./stripe_cli/stripe.exe listen --forward-to localhost:5173/api/webhooks
```

### 2. Webhook Secret for Local Development

Your current webhook signing secret is:
```
whsec_e95cfae5b81c28dcdf3186b35ed3c83f9bcb6a6949100ecdb744a0ab0323e975
```

Add this to your `.env` file:
```bash
STRIPE_WEBHOOK_SECRET=whsec_e95cfae5b81c28dcdf3186b35ed3c83f9bcb6a6949100ecdb744a0ab0323e975
```

## 🧪 Testing Your Integration

### Test Payment Flow:
1. Visit http://localhost:5173
2. Add items to cart
3. Go through checkout process
4. Watch webhook events in Terminal 2

### Available Webhook Events:
- `checkout.session.completed` - Payment successful
- `checkout.session.async_payment_succeeded` - Async payment completed
- `checkout.session.async_payment_failed` - Async payment failed
- `payment_intent.succeeded` - Direct payment successful
- `payment_intent.payment_failed` - Payment failed

## 📁 Project Structure

```
/api/
├── checkout-sessions.js    # New recommended endpoint
├── create-checkout-session.js  # Legacy backup endpoint
├── generate-image.js       # AI image generation
└── webhooks.js            # Webhook handler (NEW!)
```

## 🎯 Stripe CLI Commands

### Basic Commands:
```bash
# Check version
./stripe_cli/stripe.exe --version

# View account info
./stripe_cli/stripe.exe config --list

# Listen to all events
./stripe_cli/stripe.exe listen --forward-to localhost:5173/api/webhooks

# Listen to specific events only
./stripe_cli/stripe.exe listen --events checkout.session.completed --forward-to localhost:5173/api/webhooks

# Trigger test events
./stripe_cli/stripe.exe trigger checkout.session.completed
```

### Testing Commands:
```bash
# Test a specific webhook event
./stripe_cli/stripe.exe trigger payment_intent.succeeded

# View recent events
./stripe_cli/stripe.exe events list

# Get event details
./stripe_cli/stripe.exe events get evt_xxxxx
```

## 🚀 Production Deployment

When deploying to production, you'll need to:

1. **Create Production Webhook Endpoint:**
   - Go to https://dashboard.stripe.com/webhooks
   - Add endpoint: `https://05aug.vercel.app/api/webhooks`
   - Select events: `checkout.session.completed`, etc.

2. **Add Webhook Secret to Vercel:**
   ```bash
   vercel env add STRIPE_WEBHOOK_SECRET
   # Enter the webhook secret from Stripe dashboard
   ```

3. **Deploy:**
   ```bash
   vercel --prod
   ```

## 🔍 Debugging & Monitoring

### Local Debugging:
- Check Terminal 2 for webhook events
- Check browser console for frontend errors
- Check Terminal 1 for API errors

### Production Monitoring:
- **Vercel Logs**: https://vercel.com/dashboard → Functions → Logs
- **Stripe Logs**: https://dashboard.stripe.com/logs
- **Webhook Deliveries**: https://dashboard.stripe.com/webhooks

## 📝 Event Handling Examples

Your webhook handler in `/api/webhooks.js` currently handles:

```javascript
// When payment is successful
case 'checkout.session.completed':
  // TODO: Update database
  // TODO: Send confirmation email
  // TODO: Fulfill order
  
// When payment fails
case 'payment_intent.payment_failed':
  // TODO: Notify customer
  // TODO: Update order status
```

## ⚠️ Important Notes

1. **Webhook Signature Verification**: 
   - Disabled for local development (no secret required)
   - Required for production (use STRIPE_WEBHOOK_SECRET)

2. **API Versions**: 
   - CLI uses 2022-08-01
   - Your API uses 2024-06-20
   - This is fine - Stripe handles version compatibility

3. **Authentication**: 
   - CLI authentication expires in 90 days
   - Re-run `./stripe_cli/stripe.exe login` when needed

## 🔄 Update Stripe CLI

To update to the latest version (1.30.0):
1. Download latest from https://github.com/stripe/stripe-cli/releases
2. Replace `stripe_cli/stripe.exe`
3. Or re-run installation process

## 🆘 Troubleshooting

### Webhook Not Receiving Events?
- Check if dev server is running on localhost:5173
- Verify webhook endpoint is `/api/webhooks`
- Check firewall/antivirus isn't blocking connections

### Authentication Issues?
```bash
./stripe_cli/stripe.exe login
```

### Permission Errors?
- Run terminal as administrator
- Check file permissions on stripe.exe

---

🎉 **Your Stripe CLI is ready for development!** Test payments locally and see webhook events in real-time.