# Karen Huffstodt Static Website

A static website converted from WordPress to Eleventy, optimized for deployment on Cloudflare Pages with zero hosting costs.

## Site Overview

- **Source:** WordPress export (database + media)
- **Generator:** Eleventy (11ty)
- **Pages:** 11 static pages
- **Media:** 229 optimized images (697MB)
- **CMS:** Decap CMS for user-friendly content editing
- **Theme:** Twenty Seventeen inspired responsive design

## Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Build the site
npm run build

# Start development server
npm start
```

The site will be available at `http://localhost:8080`

### Content Management

Access the CMS at `/admin/` after deployment (requires Git Gateway setup).

## Deployment to Cloudflare Pages

### Step 1: Create GitHub Repository

1. Go to [GitHub](https://github.com/new)
2. Create a new repository named `karenhuffstodt-static`
3. Make it public
4. Don't initialize with README (we already have one)

### Step 2: Push Code to GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/karenhuffstodt-static.git
git branch -M main
git push -u origin main
```

### Step 3: Deploy to Cloudflare Pages

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Go to **Pages** → **Create a project** → **Connect to Git**
3. Select your GitHub repository `karenhuffstodt-static`
4. Configure build settings:
   - **Build command:** `npx @11ty/eleventy`
   - **Build output directory:** `_site`
   - **Root directory:** `/` (leave default)
   - **Node version:** 18 or later
5. Click **Save and Deploy**

### Step 4: Configure Custom Domain (Optional)

1. In Cloudflare Pages project, go to **Custom domains**
2. Add `karenhuffstodt.com` and `www.karenhuffstodt.com`
3. Follow DNS configuration instructions
4. Enable automatic HTTPS

### Step 5: Enable Decap CMS (Optional but Recommended)

For the CMS to work, you need to set up Git Gateway:

**Option A: Netlify Identity (Recommended)**
1. Create a free [Netlify](https://netlify.com) account
2. Go to Site settings → Identity → Enable Identity
3. Under Registration preferences, select "Invite only"
4. Under External providers, enable GitHub or GitLab
5. Under Services → Git Gateway, enable it
6. Update `src/admin/config.yml` to use Netlify Identity
7. Invite Karen to access the CMS

**Option B: GitHub OAuth**
1. Create a GitHub OAuth App
2. Configure in Decap CMS settings
3. More complex but no Netlify dependency

## Project Structure

```
karenhuffstodt-static/
├── .eleventy.js              # Eleventy configuration
├── package.json              # Dependencies and scripts
├── scripts/                  # Conversion scripts
│   ├── extract-content.js    # WordPress SQL → Markdown
│   ├── extract-menu.js       # Navigation extraction
│   └── process-media.js      # Media optimization
├── src/
│   ├── _data/                # Global data
│   │   └── navigation.json   # Menu structure
│   ├── _includes/            # Templates
│   │   ├── layouts/          # Page layouts
│   │   └── partials/         # Header, footer
│   ├── admin/                # Decap CMS
│   ├── assets/               # CSS, JS
│   ├── media/                # Uploaded images (697MB)
│   ├── pages/                # Markdown content
│   └── robots.txt            # SEO
└── _site/                    # Generated output (gitignored)
```

## Available Scripts

- `npm run build` - Build static site
- `npm start` - Start development server
- `npm run serve` - Alias for start
- `npm run extract:content` - Re-extract WordPress content
- `npm run extract:menu` - Re-extract navigation
- `npm run extract:media` - Re-extract and optimize media
- `npm run extract:all` - Run all extraction scripts

## Features

- ✅ Zero hosting costs (Cloudflare Pages free tier)
- ✅ Fast performance (static HTML, global CDN)
- ✅ SEO-friendly URLs (matches WordPress structure)
- ✅ Responsive design (mobile-first)
- ✅ User-friendly CMS (Decap CMS)
- ✅ Optimized images (TIFF→JPG, compression)
- ✅ Sitemap and robots.txt
- ✅ Professional Twenty Seventeen aesthetic

## WordPress Content Extraction

The original WordPress archives have been processed and converted:

- **Database:** `Wordpress Archives/database-1766317326.tar` (parsed and converted)
- **Media:** `Wordpress Archives/storage-1766317326.tar` (extracted and optimized)
- **Conversion:** 1.2GB → 697MB (42% reduction)
- **TIFF files:** 31 converted to JPG, 4 corrupted/skipped

## Maintenance

### Updating Content

**With CMS (Recommended):**
1. Access https://karenhuffstodt.com/admin/
2. Log in with credentials
3. Edit pages directly
4. Save and publish (auto-deploys)

**Without CMS (Manual):**
1. Edit markdown files in `src/pages/`
2. Commit and push to GitHub
3. Cloudflare Pages auto-deploys

### Adding New Media

1. Upload files to `src/media/uploads/`
2. Reference in content: `/media/uploads/filename.jpg`
3. Commit and push

## Support

- **Site Admin:** Tyler Wang ([twang73@me.com](mailto:twang73@me.com))
- **Issues:** [GitHub Issues](https://github.com/YOUR_USERNAME/karenhuffstodt-static/issues)

## Tech Stack

- **Generator:** Eleventy v3.1.2
- **Templating:** Nunjucks
- **CSS:** Custom (Twenty Seventeen inspired)
- **CMS:** Decap CMS v3.0
- **Hosting:** Cloudflare Pages
- **Image Processing:** Sharp
- **Markdown:** markdown-it

## License

© 2026 Karen Huffstodt. All rights reserved.

---

Built with ❤️ using Claude Code and deployed on Cloudflare Pages.
