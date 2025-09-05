# Stripe Integration Setup Guide for Vercel

## Environment Variables Required

You MUST set these environment variables in Vercel Dashboard:

### 1. Go to Vercel Dashboard
- Visit: https://vercel.com/dashboard
- Select your project: `05aug`
- Go to: Settings → Environment Variables

### 2. Add These Variables (EXACT NAMES):

```bash
# For Frontend (Client-side) - MUST have NEXT_PUBLIC_ prefix
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_51M0L0oDAvo3wdM2LtW6pq4YzBEIx9yycDloXZ9EqCZLs3fQqJ9ijPDT3jZ7MRXEEP5CfsfnQbOCP2ntApEcx4B5o001kHiSyrl

# For Backend (Server-side) - NO prefix
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE

# Optional: For webhooks (if you add them later)
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET
```

### 3. Important Notes:

- ✅ Set for: **Production**, **Preview**, and **Development**
- ✅ NO trailing spaces or quotes in values
- ✅ Use test keys (sk_test_) for testing
- ✅ Use live keys (sk_live_) for production
- ❌ NEVER commit secret keys to git
- ❌ NEVER use NEXT_PUBLIC_ for secret keys

## API Endpoints

Your Stripe integration has two endpoints:

1. **New (Recommended)**: `/api/checkout-sessions`
2. **Legacy (Backup)**: `/api/create-checkout-session`

Both work, but the new one follows Vercel/Stripe best practices.

## Testing Your Integration

### Local Testing:
```bash
npm run dev
# Visit http://localhost:5173
```

### Production Testing:
1. Visit: https://05aug.vercel.app
2. Add items to cart
3. Click checkout
4. Should redirect to Stripe

## Common Issues & Fixes

### 500 Error?
1. Check environment variables in Vercel dashboard
2. Check function logs: Vercel Dashboard → Functions → Logs
3. Verify Stripe keys are correct (test vs live)

### Not redirecting to Stripe?
1. Check browser console for errors
2. Ensure publishable key is set with VITE_ prefix
3. Check network tab for API response

### "Missing API Key" Error?
- Environment variable not set in Vercel
- Wrong variable name (check exact spelling)
- Not deployed after adding variables

## Architecture Overview

```
Frontend (React)
    ↓
/api/checkout-sessions (Vercel Function)
    ↓
Stripe API
    ↓
Stripe Checkout Page
    ↓
Success/Cancel URLs
```

## Deployment Checklist

- [ ] Environment variables set in Vercel
- [ ] Both VITE_STRIPE_PUBLISHABLE_KEY and STRIPE_SECRET_KEY configured
- [ ] Git push triggers auto-deploy
- [ ] Test with small amount first
- [ ] Check Stripe Dashboard for payments

## Support

- Vercel Logs: https://vercel.com/dashboard → Your Project → Functions
- Stripe Logs: https://dashboard.stripe.com/logs
- Stripe Test Cards: https://stripe.com/docs/testing#cards