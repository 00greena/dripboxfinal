import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
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

  // Debug environment variables
  console.log('Environment check:', {
    hasStripeSecret: !!process.env.STRIPE_SECRET_KEY,
    stripeSecretPrefix: process.env.STRIPE_SECRET_KEY?.substring(0, 8) + '...'
  });

  // Check if Stripe secret key is available
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('STRIPE_SECRET_KEY environment variable is not set');
    res.status(500).json({ error: 'Stripe configuration error' });
    return;
  }

  try {
    const { items, customerInfo } = req.body;
    
    // Debug request data
    console.log('Request data:', {
      hasItems: !!items,
      itemsLength: items?.length,
      hasCustomerInfo: !!customerInfo,
      customerInfo: customerInfo,
      origin: req.headers.origin
    });
    
    if (!items || !customerInfo) {
      res.status(400).json({ error: 'Missing items or customer information' });
      return;
    }

    // Create line items for Stripe
    const lineItems = items.map(item => ({
      price_data: {
        currency: 'gbp',
        product_data: {
          name: `STASHBOX - ${item.name}`,
          description: `Custom 3D-printed storage box lid with ${item.textureId} texture`,
          images: item.preview ? [item.preview] : [],
        },
        unit_amount: Math.round(item.price * 100), // Convert to pence
      },
      quantity: item.qty,
    }));

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${req.headers.origin || 'https://05aug.vercel.app'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin || 'https://05aug.vercel.app'}/cart`,
      customer_email: customerInfo.email,
      billing_address_collection: 'required',
      shipping_address_collection: {
        allowed_countries: ['GB', 'US', 'CA', 'AU', 'DE', 'FR', 'ES', 'IT', 'NL'],
      },
      metadata: {
        customer_name: customerInfo.name,
        customer_address: customerInfo.address,
      },
    });

    res.status(200).json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', {
      message: error.message,
      type: error.type,
      code: error.code,
      param: error.param,
      stack: error.stack
    });
    res.status(500).json({ 
      error: 'Failed to create checkout session',
      details: error.message 
    });
  }
}