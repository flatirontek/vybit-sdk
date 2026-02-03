# Migration Guide: @vybit/n8n-nodes → @vybit/n8n-nodes-vybit

## Overview

The Vybit n8n community node has been renamed from `@vybit/n8n-nodes` to `@vybit/n8n-nodes-vybit` to comply with n8n's Community Nodes naming requirements, which enables installation directly through the n8n UI.

**Old package name:** `@vybit/n8n-nodes`
**New package name:** `@vybit/n8n-nodes-vybit`
**Effective version:** 2.0.0

## Why the Change?

n8n's Community Nodes discovery system requires package names to follow the pattern:
- `n8n-nodes-<name>` OR
- `@<scope>/n8n-nodes-<name>`

Our original name `@vybit/n8n-nodes` didn't include a suffix after `n8n-nodes-`, preventing installation via n8n's Community Nodes UI.

With the new name `@vybit/n8n-nodes-vybit`, users can:
- ✅ Install directly from n8n UI (Settings → Community Nodes)
- ✅ Search and discover the package in n8n's ecosystem
- ✅ Get automatic updates through n8n

## Impact

### What Changed
- Package name only
- Version bumped to 2.0.0

### What Stayed the Same
- All functionality (29 operations across 6 resources)
- Authentication methods (API Key and OAuth2)
- Node configuration and credentials
- Code, APIs, and integrations
- GitLab repository and documentation structure

## Migration Steps

### For Self-Hosted n8n (npm Installation)

#### Step 1: Uninstall Old Package

```bash
cd ~/.n8n
npm uninstall @vybit/n8n-nodes
```

Or if installed globally:
```bash
npm uninstall -g @vybit/n8n-nodes
```

#### Step 2: Install New Package

```bash
npm install @vybit/n8n-nodes-vybit
```

Or globally:
```bash
npm install -g @vybit/n8n-nodes-vybit
```

#### Step 3: Restart n8n

```bash
# If running via pm2
pm2 restart n8n

# If running via systemd
sudo systemctl restart n8n

# If running manually
# Stop with Ctrl+C, then:
n8n start
```

### For Docker-based n8n

#### Option 1: Manual Installation (Current Method)

Update your Dockerfile:

**Old:**
```dockerfile
FROM n8nio/n8n:latest
USER root
RUN npm install -g @vybit/n8n-nodes
USER node
```

**New:**
```dockerfile
FROM n8nio/n8n:latest
USER root
RUN npm install -g @vybit/n8n-nodes-vybit
USER node
```

Rebuild and restart:
```bash
docker compose down
docker compose up -d --build
```

#### Option 2: Use n8n Community Nodes UI (Recommended)

With the new package name, you can now install via the n8n UI:

1. Update your docker-compose.yml to enable community packages:
   ```yaml
   version: '3'
   services:
     n8n:
       image: n8nio/n8n:latest
       environment:
         - N8N_COMMUNITY_PACKAGES_ENABLED=true
       ports:
         - "5678:5678"
       volumes:
         - n8n_data:/home/node/.n8n

   volumes:
     n8n_data:
   ```

2. Restart n8n:
   ```bash
   docker compose up -d
   ```

3. Install via UI:
   - Go to **Settings → Community Nodes**
   - Click **Install a community node**
   - Enter: `@vybit/n8n-nodes-vybit`
   - Click **Install**

### Existing Workflows

**Good news:** Your existing workflows will continue to work without changes!

- Credentials remain intact
- Node configurations are preserved
- All workflow logic stays the same

The node name and operations haven't changed, only the package name.

## Verification

After migration, verify the installation:

1. **Check installed version:**
   ```bash
   npm list @vybit/n8n-nodes-vybit
   ```

   Should show version 2.0.0 or higher.

2. **In n8n:**
   - Create a new workflow
   - Search for "Vybit" in the node palette
   - The Vybit node should appear
   - All 6 resources should be available (Profile, Vybits, Logs, Sounds, Peeps, Subscriptions)

## Deprecation Timeline

The old package `@vybit/n8n-nodes` has been deprecated on npm with a message pointing to this migration guide.

- **January 31, 2026:** Last version published (1.0.2)
- **February 2, 2026:** Package deprecated on npm
- **Going forward:** All updates published to `@vybit/n8n-nodes-vybit`

## Troubleshooting

### "Cannot find module @vybit/n8n-nodes"

This means the old package is still referenced somewhere:

1. Verify you uninstalled the old package:
   ```bash
   npm list @vybit/n8n-nodes
   ```
   Should show "empty" or not found.

2. Clear npm cache:
   ```bash
   npm cache clean --force
   ```

3. Restart n8n completely.

### "Vybit node not appearing in palette"

1. Verify installation:
   ```bash
   npm list @vybit/n8n-nodes-vybit
   ```

2. Check n8n logs for errors:
   ```bash
   # Docker
   docker logs n8n

   # PM2
   pm2 logs n8n

   # Systemd
   journalctl -u n8n -f
   ```

3. Restart n8n with clean cache:
   ```bash
   # Remove n8n cache
   rm -rf ~/.n8n/cache

   # Restart n8n
   ```

### Workflows not loading

If workflows fail to load after migration:

1. Export your workflows before migration (recommended)
2. The node internal name hasn't changed, so this shouldn't happen
3. If it does, contact support with the workflow JSON

## Support

If you encounter issues during migration:

- **GitHub Issues:** https://gitlab.com/flatirontek/vybit-sdk/-/issues
- **Documentation:** https://developer.vybit.net
- **Email:** developer@vybit.net

## FAQ

**Q: Do I need to reconfigure my credentials?**
A: No, credentials are stored separately and will work with the new package.

**Q: Will my existing workflows break?**
A: No, workflows remain compatible. Only the package name changed.

**Q: Can I use both packages simultaneously?**
A: Not recommended. Uninstall the old package to avoid conflicts.

**Q: What version should I use?**
A: Always use the latest version of `@vybit/n8n-nodes-vybit` (2.0.0+).

**Q: Do I need to update my OAuth2 app configuration?**
A: No, OAuth2 apps and redirect URIs remain unchanged.

**Q: Is this a breaking change in functionality?**
A: No, only the package name changed. All features work identically.

## Summary

This is a simple package rename to improve discoverability and installation through n8n's Community Nodes system. The migration is straightforward:

1. Uninstall `@vybit/n8n-nodes`
2. Install `@vybit/n8n-nodes-vybit`
3. Restart n8n
4. Continue using your workflows as before

Thank you for using Vybit! 🎵
