# Vercel Deployment Guide

This guide walks you through deploying the diagram application to Vercel with Turso database integration.

## 🚀 Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/MarcusNeufeldt/er_diagram_scema_app)

## 📋 Prerequisites

1. **Vercel Account**: [Sign up at vercel.com](https://vercel.com)
2. **GitHub Repository**: Push your code to GitHub
3. **Turso Account**: [Sign up at turso.io](https://turso.io) (optional for local testing)

## 🛠️ Step-by-Step Deployment

### 1. Prepare Your Repository

```bash
# Commit and push all changes
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### 2. Deploy to Vercel

1. **Import Project**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository

2. **Configure Build Settings**
   - Framework Preset: `Other`
   - Build Command: `npm run vercel-build`
   - Output Directory: `client/build`
   - Install Command: `npm install`

### 3. Set Up Turso Database

**Option A: Via Vercel Marketplace (Recommended)**

1. In your Vercel project dashboard:
   - Go to "Storage" tab
   - Click "Add Storage"
   - Select "Turso" from the marketplace
   - Follow the integration steps

This automatically adds:
- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`

**Option B: Manual Setup**

1. Create Turso database:
```bash
# Install Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# Create database
turso db create er-diagram-app

# Get database URL
turso db show er-diagram-app --url

# Create auth token
turso db tokens create er-diagram-app
```

2. Add to Vercel environment variables:
   - `TURSO_DATABASE_URL`: Your database URL
   - `TURSO_AUTH_TOKEN`: Your auth token

### 4. Configure Environment Variables

In Vercel project settings, add these environment variables:

```env
# Database (auto-configured if using Vercel Marketplace)
TURSO_DATABASE_URL=your_turso_database_url
TURSO_AUTH_TOKEN=your_turso_auth_token

# AI Service
OPENROUTER_API_KEY=your_openrouter_api_key
ENABLE_REASONING=true
REASONING_EFFORT=medium
REASONING_EXCLUDE=false

# Client Configuration
REACT_APP_API_URL=https://your-app-name.vercel.app
```

### 5. Initialize Database Schema

After deployment, initialize your database:

1. **Via Vercel CLI**:
```bash
npx vercel env pull .env.local
npx prisma db push
```

2. **Via Local Connection**:
```bash
# Set environment variables locally
export TURSO_DATABASE_URL="your_url"
export TURSO_AUTH_TOKEN="your_token"

# Push schema
npx prisma db push

# Create demo data
node test-persistence-system.js
```

### 6. Deploy and Test

1. **Deploy**: Push changes to trigger deployment
2. **Test**: Visit your Vercel URL
3. **Verify**: Check that the locking system works

## 🏗️ Project Structure for Vercel

```
├── api/                    # Serverless functions
│   ├── diagrams/
│   │   └── [id]/
│   │       ├── index.js    # GET/PUT /api/diagrams/[id]
│   │       ├── lock.js     # POST /api/diagrams/[id]/lock
│   │       └── unlock.js   # POST /api/diagrams/[id]/unlock
│   ├── generate-schema.js  # AI endpoints
│   ├── chat.js
│   ├── modify-schema.js
│   └── health.js
├── client/                 # React application
│   ├── src/
│   ├── public/
│   └── package.json
├── prisma/
│   └── schema.prisma       # Database schema
├── server/                 # Shared AI service
│   └── ai-service.js
├── vercel.json            # Vercel configuration
└── package.json           # Root package.json
```

## 🔧 Configuration Files

### `vercel.json`
```json
{
  "version": 2,
  "builds": [
    {
      "src": "client/package.json",
      "use": "@vercel/static-build",
      "config": { "distDir": "build" }
    }
  ],
  "functions": {
    "api/**/*.js": { "runtime": "nodejs18.x" }
  },
  "routes": [
    { "src": "/api/(.*)", "dest": "/api/$1" },
    { "src": "/(.*)", "dest": "/client/$1" }
  ]
}
```

## 🧪 Testing Deployment

### Health Check
```bash
curl https://your-app.vercel.app/api/health
```

### API Endpoints
```bash
# Test diagram loading
curl https://your-app.vercel.app/api/diagrams/demo-diagram-1

# Test locking (requires user ID)
curl -X POST https://your-app.vercel.app/api/diagrams/demo-diagram-1/lock \
  -H "Content-Type: application/json" \
  -d '{"userId":"test-user-id"}'
```

### Frontend
- Visit `https://your-app.vercel.app`
- Enter your name when prompted
- Verify the demo diagram loads
- Test the locking system with multiple browser tabs

## 🔍 Troubleshooting

### Common Issues

**"Database connection failed"**
- Verify `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`
- Check if database schema is initialized
- Ensure Turso database exists

**"Function timeout"**
- Check serverless function logs in Vercel
- Verify Prisma client initialization
- Consider cold start delays

**"API not found"**
- Verify `vercel.json` routing configuration
- Check API function file names match routes
- Ensure functions export correct format

**"Build failed"**
- Check build logs in Vercel dashboard
- Verify all dependencies are in `package.json`
- Ensure TypeScript compilation succeeds

### Debug Commands

```bash
# View Vercel logs
npx vercel logs

# Test local build
npm run vercel-build

# Check Prisma connection
npx prisma studio

# Validate environment variables
npx vercel env ls
```

## 🎯 Performance Optimization

1. **Database Connection Pooling**: Prisma handles this automatically
2. **Cold Start Optimization**: Keep functions warm with health checks
3. **Static Asset Optimization**: Vercel optimizes React build automatically
4. **Edge Caching**: API responses are cached appropriately

## 🔒 Security Considerations

1. **Environment Variables**: Never commit secrets to git
2. **Database Access**: Turso provides secure connections
3. **CORS**: Configured for your domain only
4. **Input Validation**: All API endpoints validate inputs

## 📈 Monitoring

1. **Vercel Analytics**: Built-in performance monitoring
2. **Function Logs**: Real-time serverless function logs
3. **Database Metrics**: Turso provides query analytics
4. **Custom Monitoring**: Add logging as needed

Your application is now ready for production use with:
- ✅ Serverless architecture
- ✅ Global edge deployment
- ✅ Secure database integration
- ✅ Multi-user collaboration
- ✅ Automatic scaling