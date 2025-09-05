import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(express.json({ limit: '50mb' })); // Increase payload limit for image data
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Create Stripe checkout session
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { items, customerInfo } = req.body;

    console.log('Creating checkout session for:', { items, customerInfo });

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

    console.log('Line items:', lineItems);

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `http://localhost:5174/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `http://localhost:5174/`,
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

    console.log('Session created:', session.id);

    res.json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate AI image using DALL-E
app.post('/api/generate-image', async (req, res) => {
  try {
    const { prompt, size = "1024x1024", quality = "standard" } = req.body;

    // Input validation
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Valid prompt is required' });
    }

    if (prompt.trim().length < 3) {
      return res.status(400).json({ error: 'Prompt must be at least 3 characters long' });
    }

    if (prompt.length > 1000) {
      return res.status(400).json({ error: 'Prompt must be less than 1000 characters' });
    }

    // Validate size parameter
    const validSizes = ["1024x1024", "1024x1792", "1792x1024"];
    if (!validSizes.includes(size)) {
      return res.status(400).json({ error: 'Invalid size. Must be 1024x1024, 1024x1792, or 1792x1024' });
    }

    // Validate quality parameter
    const validQualities = ["standard", "hd"];
    if (!validQualities.includes(quality)) {
      return res.status(400).json({ error: 'Invalid quality. Must be "standard" or "hd"' });
    }

    console.log('Generating image for prompt:', prompt.substring(0, 100) + (prompt.length > 100 ? '...' : ''));

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: `A high-quality, detailed image of: ${prompt.trim()}. Make it suitable for a custom box lid design. Professional, clean, and visually appealing.`,
      size: size,
      quality: quality,
      n: 1,
    });

    if (!response.data || response.data.length === 0) {
      throw new Error('No image data received from OpenAI');
    }

    const imageUrl = response.data[0].url;
    const revisedPrompt = response.data[0].revised_prompt;

    console.log('Image generated successfully:', imageUrl);
    
    // Return both the image URL and the revised prompt
    res.json({ 
      imageUrl,
      revisedPrompt,
      originalPrompt: prompt.trim(),
      size,
      quality,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating image:', error);
    
    // Handle specific OpenAI errors
    if (error.code === 'content_policy_violation') {
      return res.status(400).json({ 
        error: 'Content policy violation. Please modify your prompt and try again.',
        type: 'content_policy'
      });
    }
    
    if (error.code === 'rate_limit_exceeded') {
      return res.status(429).json({ 
        error: 'Rate limit exceeded. Please wait a moment before generating another image.',
        type: 'rate_limit'
      });
    }
    
    if (error.code === 'invalid_api_key') {
      return res.status(401).json({ 
        error: 'Invalid API configuration. Please check server settings.',
        type: 'auth_error'
      });
    }
    
    res.status(500).json({ 
      error: error.message || 'Failed to generate image',
      type: 'server_error'
    });
  }
});

// Get generated image details (for retrieval/history)\napp.get('/api/images/:id', async (req, res) => {\n  try {\n    // For now, just return a simple response\n    // In a full implementation, you'd store image metadata in a database\n    res.json({ \n      message: 'Image retrieval endpoint - implement database storage for full functionality',\n      id: req.params.id\n    });\n  } catch (error) {\n    console.error('Error retrieving image:', error);\n    res.status(500).json({ error: error.message });\n  }\n});\n\n// List recent images (placeholder for history functionality)\napp.get('/api/images', async (req, res) => {\n  try {\n    // For now, just return empty array\n    // In a full implementation, you'd query database for user's recent images\n    res.json({ \n      images: [],\n      message: 'Image history endpoint - implement database storage for full functionality'\n    });\n  } catch (error) {\n    console.error('Error listing images:', error);\n    res.status(500).json({ error: error.message });\n  }\n});\n\n// Health check"
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'STASHBOX Payment Server is running' });
});

const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, () => {
  console.log(`💳 STASHBOX Payment Server running on port ${PORT}`);
  console.log(`🔗 API endpoint: http://localhost:${PORT}/api/create-checkout-session`);
});

// Keep server alive
server.on('error', (error) => {
  console.error('Server error:', error);
});

// Handle process termination gracefully
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server gracefully...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down server gracefully...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});