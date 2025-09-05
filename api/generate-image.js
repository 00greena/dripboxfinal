import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
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

  // Check if OpenAI API key is available
  if (!process.env.OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY environment variable is not set');
    res.status(500).json({ error: 'OpenAI configuration error' });
    return;
  }

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
    res.status(200).json({ 
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
}