# Vercel CLI Quick Reference

## Setup Commands
```bash
# Login to Vercel
vercel login

# Link local project to Vercel project
vercel link

# Initialize new project (if not linked)
vercel
```

## Deployment Commands
```bash
# Deploy to preview (development)
vercel

# Deploy to production
vercel --prod

# Deploy specific directory
vercel --cwd ./path/to/project --prod
```

## Environment Variables
```bash
# Add environment variable
vercel env add STRIPE_SECRET_KEY

# List environment variables
vercel env list

# Pull environment variables to local .env file
vercel env pull .env
```

## Project Management
```bash
# List your projects
vercel list

# Get project info
vercel inspect

# View deployment logs
vercel logs [deployment-url]

# Remove deployment
vercel remove [deployment-id]
```

## Domain Management
```bash
# Add custom domain
vercel domains add yourdomain.com

# List domains
vercel domains list

# Remove domain
vercel domains remove yourdomain.com
```

## Useful Flags
- `--prod` - Deploy to production
- `--force` - Force deployment even with warnings
- `--debug` - Show debug information
- `--yes` - Skip confirmation prompts
- `--local-config` - Use local vercel.json

## Environment Variables Setup
After linking your project, add your API keys:

```bash
vercel env add STRIPE_SECRET_KEY production
vercel env add OPENAI_API_KEY production
vercel env add VITE_STRIPE_PUBLISHABLE_KEY production
```

## Quick Deploy Workflow
1. Make changes to your code
2. Test locally: `npm run build`
3. Deploy to preview: `vercel`
4. Deploy to production: `vercel --prod`

## Troubleshooting
- Use `vercel --debug` for detailed error information
- Use `vercel inspect` to see deployment settings
- Use `vercel logs` to view runtime logs