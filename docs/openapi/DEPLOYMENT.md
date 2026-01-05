# API Reference Deployment Guide

This guide explains how to deploy the Vybit API reference documentation to `developer.vybit.net/api-reference`.

## Files Overview

- **`scalar.html`** - Modern Scalar-based API reference (recommended)
- **`index.html`** - Classic Swagger UI-based API reference (fallback)
- **`developer-api.yaml`** - Developer API OpenAPI specification
- **`oauth2.yaml`** - OAuth2 API OpenAPI specification

## Deployment Options

### Option 1: Google Cloud Storage (Recommended)

**Cost**: ~$0-2/month (free tier covers most traffic)

#### Setup Steps:

1. **Create GCS Bucket**
```bash
# Create bucket (must be globally unique name)
gsutil mb -p YOUR_PROJECT_ID -c STANDARD -l US gs://vybit-api-docs

# Make bucket publicly readable
gsutil iam ch allUsers:objectViewer gs://vybit-api-docs

# Enable website configuration
gsutil web set -m scalar.html -e 404.html gs://vybit-api-docs
```

2. **Upload Documentation Files**
```bash
cd docs/openapi

# Upload all files
gsutil -m cp -r *.html *.yaml gs://vybit-api-docs/

# Set cache control (1 hour for HTML, 1 week for specs)
gsutil -m setmeta -h "Cache-Control:public, max-age=3600" gs://vybit-api-docs/*.html
gsutil -m setmeta -h "Cache-Control:public, max-age=604800" gs://vybit-api-docs/*.yaml

# Set CORS for OpenAPI specs
cat > cors.json <<EOF
[
  {
    "origin": ["https://developer.vybit.net"],
    "method": ["GET"],
    "responseHeader": ["Content-Type"],
    "maxAgeSeconds": 3600
  }
]
EOF
gsutil cors set cors.json gs://vybit-api-docs
```

3. **Configure Load Balancer & DNS**
```bash
# Create backend bucket
gcloud compute backend-buckets create vybit-api-docs-backend \
    --gcs-bucket-name=vybit-api-docs

# Add URL map rule for /api-reference path
gcloud compute url-maps add-path-matcher YOUR_URL_MAP \
    --path-matcher-name=api-reference \
    --default-service=YOUR_DEFAULT_BACKEND \
    --backend-bucket-path-rules="/api-reference/*=vybit-api-docs-backend"
```

4. **DNS Configuration**
- Point `developer.vybit.net` to your load balancer IP
- SSL automatically handled by Google Cloud Load Balancer

### Option 2: Cloudflare Pages (Alternative)

**Cost**: Free forever

#### Setup Steps:

1. **Create Cloudflare Pages Project**
   - Go to Cloudflare dashboard → Pages
   - Connect to GitLab repository `flatirontek/vybit-sdk`
   - Set build directory: `docs/openapi`
   - No build command needed (static files)

2. **Configure Custom Domain**
   - Add custom domain: `developer.vybit.net`
   - Cloudflare automatically provisions SSL

3. **Auto-Deploy**
   - Every push to `main` branch auto-deploys
   - Preview URLs for branches

### Option 3: Netlify (Alternative)

**Cost**: Free tier (100GB bandwidth/month)

#### Setup Steps:

1. **Deploy via CLI**
```bash
cd docs/openapi

# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --dir=. --prod

# Add custom domain in Netlify dashboard
# Point developer.vybit.net to Netlify
```

2. **Auto-Deploy from Git**
   - Connect GitLab repository
   - Set publish directory: `docs/openapi`
   - Auto-deploy on push

## Quick Update Workflow

After making changes to OpenAPI specs:

```bash
cd docs/openapi

# Option 1: GCS
gsutil -m cp -r *.yaml gs://vybit-api-docs/

# Option 2: Cloudflare/Netlify (git-based)
git add .
git commit -m "Update API specs"
git push origin main
# Auto-deploys in ~1 minute
```

## Testing Locally

```bash
cd docs/openapi

# Option 1: Python
python3 -m http.server 8080

# Option 2: Node.js
npx http-server -p 8080

# Open: http://localhost:8080/scalar.html
```

## Switching Between UIs

Both Scalar and Swagger UI are available:

- **Scalar**: `https://developer.vybit.net/api-reference/scalar.html` (modern)
- **Swagger UI**: `https://developer.vybit.net/api-reference/index.html` (classic)

Set the default by configuring your web server to serve the preferred HTML file.

## Monitoring & Analytics

### Google Analytics (Optional)

Add to `scalar.html` before `</head>`:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### Cloudflare Analytics

If using Cloudflare, analytics are built-in and free.

## Security Headers

Add these headers via your CDN/load balancer:

```
Content-Security-Policy: default-src 'self' https://cdn.jsdelivr.net; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net;
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
```

## Cost Comparison

| Option | Cost/Month | Bandwidth | SSL | Auto-Deploy |
|--------|------------|-----------|-----|-------------|
| GCS + Cloud CDN | $0-2 | Pay per GB | Included | Manual |
| Cloudflare Pages | $0 | Unlimited | Included | Auto |
| Netlify | $0 | 100GB free | Included | Auto |

## Recommended: Cloudflare Pages

For your use case, **Cloudflare Pages** is recommended because:
1. **Free forever** with unlimited bandwidth
2. **Auto-deploy** from GitLab on every push
3. **Free SSL** with automatic renewal
4. **Fast global CDN** built-in
5. **Preview deployments** for testing
6. **Zero maintenance** - just push to git

---

**Current Status**: Ready to deploy
**Primary File**: `scalar.html`
**Fallback File**: `index.html`
