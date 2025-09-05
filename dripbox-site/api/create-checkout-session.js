import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
    return;
  }

  try {
    const { items, customerInfo } = req.body;

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
      success_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/cart`,
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
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
}