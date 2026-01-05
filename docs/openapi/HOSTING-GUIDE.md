# Hosting Vybit API Reference Documentation

This guide explains how to host the Scalar API reference documentation securely.

## Architecture

**Dev**: `dev.developer.vybit.net/api-reference` → `dev.api.vybit.net/v1`
**Prod**: `developer.vybit.net/api-reference` → `api.vybit.net/v1`

## Setup Steps

### 1. Deploy Static Files

You need to serve these files from the developer subdomain:
- `scalar.html` (renamed to `index.html` in the api-reference directory)
- `developer-api.yaml`
- `oauth2.yaml` (optional)

### 2. Google Cloud Storage Setup (Recommended)

```bash
# Create bucket for developer docs
gsutil mb -p YOUR_PROJECT_ID -c STANDARD -l US gs://vybit-developer-docs

# Make publicly readable
gsutil iam ch allUsers:objectViewer gs://vybit-developer-docs

# Upload files
cd docs/openapi
gsutil -m cp scalar.html gs://vybit-developer-docs/api-reference/index.html
gsutil -m cp *.yaml gs://vybit-developer-docs/api-reference/

# Set cache control
gsutil -m setmeta -h "Cache-Control:public, max-age=3600" \
  gs://vybit-developer-docs/api-reference/index.html
gsutil -m setmeta -h "Cache-Control:public, max-age=604800" \
  gs://vybit-developer-docs/api-reference/*.yaml

# Set CORS for YAML files
cat > cors.json <<EOF
[
  {
    "origin": ["https://developer.vybit.net", "https://dev.developer.vybit.net"],
    "method": ["GET"],
    "responseHeader": ["Content-Type"],
    "maxAgeSeconds": 3600
  }
]
EOF
gsutil cors set cors.json gs://vybit-developer-docs

# Create backend bucket
gcloud compute backend-buckets create vybit-developer-docs-backend \
    --gcs-bucket-name=vybit-developer-docs \
    --enable-cdn

# Add to load balancer (you'll need to configure this in Cloud Console or via gcloud)
```

### 3. DNS Configuration

**For dev.developer.vybit.net:**
- Point to your load balancer IP
- Or use Cloudflare/Netlify for simpler setup

**For developer.vybit.net:**
- Point to your load balancer IP
- SSL will be handled by Google Cloud Load Balancer or Cloudflare

### 4. Alternative: Cloudflare Pages (Simpler)

If you want easier setup without managing GCS buckets:

1. **Push docs to GitLab**:
   ```bash
   cd .
   git add docs/openapi/
   git commit -m "Add API reference docs"
   git push
   ```

2. **Create Cloudflare Pages Project**:
   - Go to Cloudflare dashboard → Pages
   - Connect GitLab repository
   - Build directory: `docs/openapi`
   - No build command needed

3. **Add Custom Domains**:
   - `developer.vybit.net` (production)
   - `dev.developer.vybit.net` (development)

4. **Done!** Free SSL, global CDN, auto-deploy on git push

### 5. Alternative: Simple Static Server

For quick testing, you can serve directly from your API server:

```javascript
// In your Hapi server (server.js)
server.route({
    method: 'GET',
    path: '/api-reference/{param*}',
    handler: {
        directory: {
            path: __dirname + '/../vybit-sdk/docs/openapi',
            redirectToSlash: true,
            index: ['scalar.html']
        }
    }
});
```

Then access at: `https://dev.api.vybit.net/api-reference`

## Security Notes

### CORS Configuration (Already Done ✓)

The API server (`server.js`) has been configured with:

```javascript
routes: {
    cors: {
        origin: [
            'https://developer.vybit.net',
            'https://dev.developer.vybit.net'
        ],
        credentials: false,
        additionalHeaders: ['X-API-Key']
    }
}
```

**What this does:**
- ✅ Only allows requests from your official docs domains
- ✅ Blocks all other origins (prevents malicious sites from making API calls)
- ✅ `credentials: false` prevents credential theft
- ✅ Allows `X-API-Key` header for authentication

### API Key Security Best Practices

**For users of the interactive docs:**
1. Remind them to **never share API keys**
2. API keys should be **rotated regularly**
3. Use **different keys for dev/testing vs production**
4. Add warning in the docs UI about key security

## Testing

1. **Local testing**:
   ```bash
   cd docs/openapi
   python3 -m http.server 8081
   # Open http://localhost:8081/scalar.html
   ```

2. **Dev server testing**:
   - Deploy to `dev.developer.vybit.net/api-reference`
   - Test with dev API key
   - Verify CORS headers in browser DevTools

3. **Production testing**:
   - Deploy to `developer.vybit.net/api-reference`
   - Test all endpoints with production API key
   - Monitor for any CORS issues

## Updating Documentation

When you update the OpenAPI spec:

```bash
cd docs/openapi

# Update files in GCS
gsutil -m cp *.yaml gs://vybit-developer-docs/api-reference/

# Or if using Cloudflare Pages
git add developer-api.yaml
git commit -m "Update API documentation"
git push  # Auto-deploys!
```

## Recommended: Cloudflare Pages

For your use case, I recommend **Cloudflare Pages** because:
- ✅ Free forever with unlimited bandwidth
- ✅ Auto-deploys from GitLab
- ✅ Free SSL certificates
- ✅ Global CDN
- ✅ Preview deployments for testing
- ✅ Zero maintenance

Setup time: ~5 minutes
