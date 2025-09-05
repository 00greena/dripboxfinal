// Stripe Webhook Handler for Vercel
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

// Helper function to get raw body for webhook verification
async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
    });
    req.on('end', () => {
      resolve(Buffer.from(data));
    });
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  let buf;
  try {
    // Get raw body for webhook signature verification
    buf = await getRawBody(req);
  } catch (error) {
    console.error('Error reading request body:', error);
    return res.status(400).json({ error: 'Invalid request body' });
  }

  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    // Verify webhook signature (only if secret is provided)
    if (endpointSecret) {
      event = stripe.webhooks.constructEvent(buf, sig, endpointSecret);
    } else {
      // For local development without webhook secret
      event = JSON.parse(buf.toString());
      console.log('⚠️  Webhook signature verification disabled for local development');
    }
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook signature verification failed: ${err.message}` });
  }

  console.log('✅ Received webhook event:', event.type);

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        console.log('💰 Payment successful for session:', session.id);
        console.log('Customer email:', session.customer_email);
        console.log('Amount total:', session.amount_total);
        
        // Here you would typically:
        // - Update your database
        // - Send confirmation emails
        // - Fulfill the order
        
        break;

      case 'checkout.session.async_payment_succeeded':
        console.log('✅ Async payment succeeded:', event.data.object.id);
        break;

      case 'checkout.session.async_payment_failed':
        console.log('❌ Async payment failed:', event.data.object.id);
        break;

      case 'payment_intent.succeeded':
        console.log('💳 Payment intent succeeded:', event.data.object.id);
        break;

      case 'payment_intent.payment_failed':
        console.log('💥 Payment intent failed:', event.data.object.id);
        break;

      default:
        console.log('🤷 Unhandled event type:', event.type);
    }

    // Return a 200 response to acknowledge receipt of the event
    res.status(200).json({ received: true, type: event.type });
  } catch (error) {
    console.error('Error handling webhook:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
}