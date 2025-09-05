# Production Webhook Setup for Vercel

## 🚀 Your webhook endpoint is now deployed at:
**https://05aug.vercel.app/api/webhooks**

## Step 1: Configure Webhook in Stripe Dashboard

### 1.1 Go to Stripe Dashboard
Visit: https://dashboard.stripe.com/webhooks

### 1.2 Add Endpoint
1. Click **"Add endpoint"**
2. **Endpoint URL**: `https://05aug.vercel.app/api/webhooks`
3. **Description**: `STASHBOX Production Webhooks`

### 1.3 Select Events to Listen For
Check these events:
- ✅ `checkout.session.completed`
- ✅ `checkout.session.async_payment_succeeded` 
- ✅ `checkout.session.async_payment_failed`
- ✅ `payment_intent.succeeded`
- ✅ `payment_intent.payment_failed`

### 1.4 Save and Get Signing Secret
1. Click **"Add endpoint"**
2. Click on your new endpoint
3. Copy the **"Signing secret"** (starts with `whsec_`)

## Step 2: Add Webhook Secret to Vercel

### 2.1 Method 1 - Using Vercel CLI:
```bash
vercel --token oRA2dMpWYJ7c8rsBB2AnMHYG env add STRIPE_WEBHOOK_SECRET
# Paste your webhook signing secret when prompted
# Set for: Production, Preview, Development
```

### 2.2 Method 2 - Using Vercel Dashboard:
1. Go to: https://vercel.com/yanek-vanharens-projects/05aug
2. Click: Settings → Environment Variables
3. Add new variable:
   - **Name**: `STRIPE_WEBHOOK_SECRET`
   - **Value**: `whsec_YOUR_SIGNING_SECRET_HERE`
   - **Environments**: Production, Preview, Development

### 2.3 Redeploy After Adding Secret:
```bash
vercel --token oRA2dMpWYJ7c8rsBB2AnMHYG --prod
```

## Step 3: Test Your Production Webhook

### 3.1 Make a Test Payment
1. Visit: https://05aug.vercel.app
2. Add items to cart
3. Go through checkout
4. Complete payment

### 3.2 Check Webhook Delivery
1. Go to Stripe Dashboard → Webhooks
2. Click on your endpoint
3. Check **"Recent deliveries"** 
4. Should see successful deliveries (status 200)

### 3.3 Check Vercel Logs
1. Go to: https://vercel.com/yanek-vanharens-projects/05aug
2. Click: Functions tab
3. Find `/api/webhooks` function
4. Check logs for webhook events

## Step 4: Monitor Webhook Events

### What You'll See in Logs:
```
✅ Received webhook event: checkout.session.completed
💰 Payment successful for session: cs_test_xxxxx
Customer email: customer@example.com
Amount total: 2999
```

### Common Issues:

**❌ Webhook returning 500 error:**
- Check STRIPE_WEBHOOK_SECRET is set correctly
- Verify webhook endpoint URL is correct
- Check Vercel function logs for errors

**❌ Webhook signature verification failed:**
- Wrong webhook secret
- Make sure you're using the production signing secret
- Redeploy after adding environment variables

**❌ Webhook not receiving events:**
- Check webhook endpoint URL in Stripe dashboard
- Verify selected events include the ones you're testing
- Check Stripe dashboard webhook delivery status

## 🎯 Production URLs Summary

- **Website**: https://05aug.vercel.app
- **Checkout API**: https://05aug.vercel.app/api/checkout-sessions
- **Webhooks**: https://05aug.vercel.app/api/webhooks
- **AI Images**: https://05aug.vercel.app/api/generate-image

## 📊 Monitoring Your Integration

### Stripe Dashboard:
- **Payments**: https://dashboard.stripe.com/payments
- **Webhooks**: https://dashboard.stripe.com/webhooks  
- **Logs**: https://dashboard.stripe.com/logs

### Vercel Dashboard:
- **Functions**: https://vercel.com/yanek-vanharens-projects/05aug
- **Environment Variables**: Settings → Environment Variables
- **Function Logs**: Functions tab → Select function

## 🔔 What Happens When Customer Pays:

1. **Customer completes payment** on Stripe Checkout
2. **Stripe sends webhook** to your endpoint
3. **Your webhook handler** logs the event:
   - ✅ Payment successful
   - 📧 Customer email captured  
   - 💰 Amount recorded
4. **You can extend** the webhook to:
   - Update your database
   - Send confirmation emails
   - Fulfill orders
   - Update inventory

## Next Steps:

1. **Add the webhook secret to Vercel**
2. **Test with a real payment**
3. **Monitor the logs**
4. **Celebrate! 🎉**

Your Stripe integration is now production-ready with webhook support!