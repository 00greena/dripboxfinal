import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  // Check if Stripe secret key is available
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('STRIPE_SECRET_KEY environment variable is not set');
    res.status(500).json({ error: 'Stripe configuration error' });
    return;
  }

  try {
    const { items = [], customerInfo = {} } = req.body || {};
    
    // Validate input
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'No items provided' });
    }

    // Create line items for Stripe - ensure proper format
    const line_items = items.map(item => {
      // Ensure unit_amount is integer (in pence for GBP)
      const unitAmount = Math.round(Number(item.price) * 100);
      if (!Number.isInteger(unitAmount) || unitAmount <= 0) {
        throw new Error(`Invalid price for item ${item.name}: ${item.price}`);
      }

      return {
        price_data: {
          currency: 'gbp',
          product_data: {
            name: `STASHBOX - ${item.name}`,
            description: `Custom 3D-printed storage box lid with ${item.textureId || 'custom'} texture`,
            images: item.preview ? [item.preview] : [],
          },
          unit_amount: unitAmount,
        },
        quantity: Math.max(1, Math.round(Number(item.qty) || 1)),
      };
    });

    const origin = req.headers.origin || 'https://05aug.vercel.app';

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items,
      customer_email: customerInfo.email || undefined,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      shipping_address_collection: {
        allowed_countries: ['GB', 'US', 'CA', 'AU', 'DE', 'FR', 'ES', 'IT', 'NL'],
      },
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cart`,
      metadata: {
        customer_name: customerInfo.name || '',
        customer_address: customerInfo.address || '',
      },
    });

    // Return the session URL (not sessionId)
    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('create-checkout-session error', {
      message: error?.message,
      type: error?.type,
      code: error?.code,
      hasKey: Boolean(process.env.STRIPE_SECRET_KEY),
      keyPrefix: process.env.STRIPE_SECRET_KEY?.substring(0, 8) + '...'
    });
    res.status(500).json({ 
      error: 'Failed to create checkout session'
    });
  }
}