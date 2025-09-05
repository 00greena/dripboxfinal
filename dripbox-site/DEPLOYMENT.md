# DRIPBOX - Vercel Deployment Guide

## 🚀 Quick Deploy to Vercel

### Method 1: Vercel CLI (Recommended)

1. **Login to Vercel**
   ```bash
   vercel login
   ```
   Choose your preferred authentication method (GitHub recommended)

2. **Deploy to Production**
   ```bash
   vercel --prod
   ```
   
3. **Follow the prompts:**
   - Set up and deploy: **Yes**
   - Which scope: Select your account
   - Link to existing project: **No** (for first deployment)
   - What's your project's name: **dripbox** (or your preferred name)
   - In which directory is your code located: **./** (current directory)

### Method 2: Vercel Dashboard

1. **Go to [vercel.com](https://vercel.com)**
2. **Sign in** with GitHub/Google
3. **Click "New Project"**
4. **Import from Git** or **Upload folder**
   - If uploading folder, zip the `dripbox-site` directory and upload
5. **Configure:**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

### Method 3: GitHub Integration

1. **Push code to GitHub repository**
2. **Connect GitHub to Vercel**
3. **Import repository** from Vercel dashboard
4. **Auto-deploy** on every push to main branch

## ⚙️ Environment Variables

After deployment, add these environment variables in Vercel dashboard:

1. Go to **Project Settings > Environment Variables**
2. Add:
   - `VITE_STRIPE_PUBLISHABLE_KEY`: Your Stripe publishable key
   - Any other API keys needed

## 🌐 Custom Domain (Optional)

1. Go to **Project Settings > Domains**
2. **Add your custom domain**
3. **Configure DNS** as instructed by Vercel

## 📁 Project Structure

```
dripbox-site/
├── dist/           # Production build (ready to deploy)
├── src/            # Source code
├── public/         # Static assets
├── vercel.json     # Vercel configuration
├── package.json    # Dependencies and scripts
└── vite.config.ts  # Vite configuration
```

## 🔧 Build Information

- **Framework**: Vite (React + TypeScript)
- **Build Size**: ~171KB JS, ~20KB CSS
- **Build Time**: ~1.3 seconds
- **Node Version**: 18+ recommended

## 🛠️ Troubleshooting

### Build Failures
- Ensure all dependencies are in `package.json`
- Check TypeScript errors with `npm run build`
- Verify environment variables are set

### Assets Not Loading
- Check public folder structure
- Verify image paths start with `/`
- Ensure all assets are in `public/` directory

### API Errors
- Verify environment variables are set in Vercel
- Check API endpoint URLs
- Ensure CORS is configured for your domain

## ✅ Post-Deployment Checklist

- [ ] Site loads correctly
- [ ] All images display properly
- [ ] Logo appears (left-aligned above hero)
- [ ] Lid designer functionality works
- [ ] File upload works
- [ ] Canvas rendering works
- [ ] Responsive design works on mobile
- [ ] Environment variables are set
- [ ] Custom domain configured (if applicable)

## 🎯 Performance Tips

- Images are optimized and compressed
- Unused code has been removed
- Gzip compression enabled by default on Vercel
- CDN distribution worldwide
- Automatic HTTPS

Your DRIPBOX application is now ready for the world! 🚀