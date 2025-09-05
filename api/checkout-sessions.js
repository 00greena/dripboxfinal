// Based on official Vercel/Stripe example
import Stripe from 'stripe';

// Initialize Stripe with proper API version
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

// CORS configuration
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).setHeaders(corsHeaders).end();
    return;
  }

  // Only allow POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  // Apply CORS headers
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  // Verify Stripe secret key exists
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('STRIPE_SECRET_KEY is not configured in environment variables');
    return res.status(500).json({ 
      error: 'Payment system is not configured properly' 
    });
  }

  try {
    // Extract and validate request body
    const body = req.body || {};
    const { items = [], customerInfo = {} } = body;

    console.log('Checkout request received:', {
      itemCount: items.length,
      hasCustomerInfo: !!customerInfo.email,
      origin: req.headers.origin || req.headers.referer
    });

    // Validate items
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        error: 'Your cart is empty' 
      });
    }

    // Build line items for Stripe
    const line_items = [];
    
    for (const item of items) {
      // Validate item data
      if (!item.name || !item.price) {
        console.error('Invalid item data:', item);
        return res.status(400).json({ 
          error: `Invalid item data for: ${item.name || 'unknown'}` 
        });
      }

      // Ensure price is a valid number
      const price = parseFloat(item.price);
      if (isNaN(price) || price <= 0) {
        return res.status(400).json({ 
          error: `Invalid price for ${item.name}` 
        });
      }

      // Convert price to smallest currency unit (pence for GBP)
      const unit_amount = Math.round(price * 100);
      
      // Ensure quantity is valid
      const quantity = parseInt(item.qty || item.quantity || 1);
      if (isNaN(quantity) || quantity < 1) {
        return res.status(400).json({ 
          error: `Invalid quantity for ${item.name}` 
        });
      }

      line_items.push({
        price_data: {
          currency: 'gbp',
          product_data: {
            name: `STASHBOX - ${item.name}`,
            description: item.textureId 
              ? `Custom 3D-printed storage box lid with ${item.textureId} texture`
              : 'Custom 3D-printed storage box lid',
            images: item.preview && item.preview.startsWith('http') 
              ? [item.preview] 
              : [],
          },
          unit_amount: unit_amount,
        },
        quantity: quantity,
      });
    }

    // Determine the origin URL for redirects
    const origin = req.headers.origin || 
                   req.headers.referer?.replace(/\/$/, '') ||
                   'https://05aug.vercel.app';

    console.log('Creating Stripe session with origin:', origin);

    // Create Stripe Checkout Session
    const sessionParams = {
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: line_items,
      billing_address_collection: 'auto',
      shipping_address_collection: {
        allowed_countries: ['GB', 'US', 'CA', 'AU', 'DE', 'FR', 'ES', 'IT', 'NL'],
      },
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cart`,
      allow_promotion_codes: true,
    };

    // Add customer email if provided
    if (customerInfo.email && customerInfo.email.includes('@')) {
      sessionParams.customer_email = customerInfo.email;
    }

    // Add metadata if provided
    if (customerInfo.name || customerInfo.address) {
      sessionParams.metadata = {
        customer_name: customerInfo.name || '',
        customer_address: customerInfo.address || '',
      };
    }

    // Create the session
    const session = await stripe.checkout.sessions.create(sessionParams);

    console.log('Stripe session created successfully:', session.id);

    // Return the checkout URL (recommended approach)
    return res.status(200).json({ 
      url: session.url,
      sessionId: session.id // Include for backwards compatibility
    });

  } catch (error) {
    // Log detailed error information for debugging
    console.error('Stripe checkout session error:', {
      message: error.message,
      type: error.type,
      code: error.code,
      statusCode: error.statusCode,
      requestId: error.requestId,
      // Check if it's a Stripe-specific error
      isStripeError: error.raw ? true : false,
    });

    // Handle specific Stripe errors
    if (error.type === 'StripeAuthenticationError') {
      return res.status(500).json({ 
        error: 'Payment configuration error. Please contact support.' 
      });
    }

    if (error.type === 'StripeInvalidRequestError') {
      return res.status(400).json({ 
        error: 'Invalid payment request. Please check your cart and try again.' 
      });
    }

    // Generic error response
    return res.status(500).json({ 
      error: 'Unable to process payment. Please try again later.' 
    });
  }
}