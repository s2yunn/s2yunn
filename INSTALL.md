# Installation & Deployment Guide

## 📋 Table of Contents
1. [Local Development Setup](#local-development-setup)
2. [GitHub Pages Deployment](#github-pages-deployment)
3. [Server Deployment](#server-deployment)
4. [Docker Deployment](#docker-deployment)
5. [Troubleshooting](#troubleshooting)

---

## 💻 Local Development Setup

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Python 3.6+ (for local server)
- OR Node.js 12+ (alternative server)
- Git (optional, for cloning)

### Step 1: Download/Clone Project

#### Option A: Using Git
```bash
git clone https://github.com/s2yunn/s2yunn.git
cd s2yunn
```

#### Option B: Manual Download
1. Visit GitHub repository
2. Click "Code" → "Download ZIP"
3. Extract zip file
4. Open folder in terminal

### Step 2: Start Local Server

#### Method 1: Python (Recommended)
```bash
# Python 3
python3 -m http.server 8000

# Python 2 (if Python 3 not available)
python -m SimpleHTTPServer 8000
```

#### Method 2: Node.js
```bash
# Using http-server
npx http-server -p 8000

# Or install globally
npm install -g http-server
http-server -p 8000
```

#### Method 3: Live Server (VS Code)
1. Install "Live Server" extension
2. Right-click on `index.html`
3. Select "Open with Live Server"

### Step 3: Open in Browser
```
http://localhost:8000
```

### Step 4: Login
```
Username: admin
Password: admin123
```

---

## 🚀 GitHub Pages Deployment

### Prerequisites
- GitHub account
- Git installed locally
- Repository access

### Step 1: Push to GitHub

```bash
# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit: Member Management System"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/s2yunn.git
git push -u origin main
```

### Step 2: Enable GitHub Pages

1. Go to repository settings
   ```
   GitHub → Settings → Pages
   ```

2. Configure source:
   - Branch: `main`
   - Folder: `/ (root)`

3. Click "Save"

### Step 3: Wait for Deployment

- Wait 1-2 minutes for deployment
- Check "Deployments" tab for status

### Step 4: Access Your Site

```
https://YOUR_USERNAME.github.io/s2yunn
```

### Step 5: Update Repository

After making changes:
```bash
git add .
git commit -m "Update: Add new features"
git push origin main
```

---

## 🖥️ Server Deployment

### Option 1: Shared Hosting (cPanel, Plesk)

#### Upload Files
1. Use FTP client (FileZilla, WinSCP)
2. Connect to server with credentials
3. Upload all files to `public_html` folder
4. Access via: `https://yourdomain.com`

#### Configuration
- Ensure .htaccess allows HTML files
- Set proper file permissions (644 for files, 755 for folders)

### Option 2: VPS/Dedicated Server

#### Using Nginx

```bash
# 1. SSH into server
ssh user@your-server.com

# 2. Navigate to web folder
cd /var/www/html

# 3. Clone/download project
git clone https://github.com/YOUR_USERNAME/s2yunn.git
cd s2yunn

# 4. Nginx configuration
sudo nano /etc/nginx/sites-available/default
```

**Nginx config:**
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /var/www/html/s2yunn;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }
}
```

```bash
# 5. Test and restart
sudo nginx -t
sudo systemctl restart nginx
```

#### Using Apache

```bash
# Enable mod_rewrite
sudo a2enmod rewrite

# Create .htaccess file
cat > .htaccess << EOF
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^ index.html [QSA,L]
</IfModule>
EOF
```

### Option 3: Cloud Platforms

#### Vercel (Recommended for static sites)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Follow prompts
```

#### Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=.

# Or connect GitHub repo
# https://app.netlify.com
```

#### AWS S3 + CloudFront

```bash
# Configure AWS CLI
aws configure

# Sync files to S3
aws s3 sync . s3://your-bucket-name/

# Create CloudFront distribution
# Via AWS Console
```

---

## 🐳 Docker Deployment

### Step 1: Create Dockerfile

Create `Dockerfile` in project root:

```dockerfile
FROM nginx:alpine

# Copy project files
COPY . /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Step 2: Create nginx.conf

Create `nginx.conf`:

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }
}
```

### Step 3: Build Docker Image

```bash
docker build -t member-cms:1.0 .
```

### Step 4: Run Container

```bash
# Local
docker run -p 8000:80 member-cms:1.0

# Production
docker run -d \
  --name member-cms \
  -p 80:80 \
  -p 443:443 \
  member-cms:1.0
```

### Step 5: Access Application

```
http://localhost:8000
```

### Step 6: Push to Docker Hub (Optional)

```bash
# Tag image
docker tag member-cms:1.0 YOUR_USERNAME/member-cms:1.0

# Login to Docker Hub
docker login

# Push
docker push YOUR_USERNAME/member-cms:1.0

# Others can pull
docker pull YOUR_USERNAME/member-cms:1.0
```

---

## 📊 Advanced Setup

### 1. Enable HTTPS (Let's Encrypt)

#### Using Certbot (Nginx)
```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

#### Using Certbot (Apache)
```bash
sudo certbot --apache -d yourdomain.com
```

### 2. Enable Gzip Compression

#### Nginx
```nginx
gzip on;
gzip_types text/plain text/css application/javascript;
gzip_min_length 1000;
```

#### Apache
```apache
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/javascript
</IfModule>
```

### 3. Cache Configuration

#### Nginx
```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 4. Security Headers

#### Nginx
```nginx
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
```

---

## 🔐 Production Checklist

- [ ] Enable HTTPS
- [ ] Set up SSL certificate
- [ ] Configure CORS headers
- [ ] Enable gzip compression
- [ ] Set cache headers
- [ ] Add security headers
- [ ] Configure CDN
- [ ] Set up monitoring
- [ ] Enable logging
- [ ] Backup data regularly
- [ ] Test backup restoration
- [ ] Set up automated updates
- [ ] Document deployment process
- [ ] Test disaster recovery

---

## 🐛 Troubleshooting

### Issue 1: "Cannot GET /"

**Cause:** Server not configured properly  
**Solution:**
```bash
# Make sure server is running
# Check if you're accessing correct port
# Verify index.html exists
ls -la index.html
```

### Issue 2: CSS/JS not loading

**Cause:** Wrong file paths  
**Solution:**
```html
<!-- Check file paths in index.html -->
<link rel="stylesheet" href="css/styles.css">
<script src="js/app.js"></script>
```

### Issue 3: Data not persisting

**Cause:** LocalStorage not available  
**Solution:**
```javascript
// Check browser console for errors
// Enable browser storage
// Check if site is HTTPS (required for some cases)
```

### Issue 4: CORS errors

**Cause:** Cross-origin request blocked  
**Solution:**

**Nginx:**
```nginx
add_header Access-Control-Allow-Origin "*" always;
```

**Apache:**
```apache
Header set Access-Control-Allow-Origin "*"
```

### Issue 5: 404 errors on refresh (SPA)

**Cause:** Server not configured for SPA routing  
**Solution:**

**Nginx:**
```nginx
error_page 404 /index.html;
location = /404.html {
    internal;
}
```

**Apache:**
```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    RewriteRule ^index\.html$ - [L]
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /index.html [L]
</IfModule>
```

### Issue 6: Slow performance

**Solutions:**
- Enable gzip compression
- Implement caching
- Use CDN for static files
- Minify CSS/JS
- Optimize images
- Lazy load components

---

## 🆘 Getting Help

### Resources
- [MDN Web Docs](https://developer.mozilla.org)
- [GitHub Help](https://help.github.com)
- [Stack Overflow](https://stackoverflow.com)
- [Project Issues](https://github.com/s2yunn/s2yunn/issues)

### Contact Support
- Email: support@example.com
- GitHub Issues: Open issue
- Discussion Forum: TBA

---

## 📝 Environment Variables (Future)

For future backend integration:

```bash
# .env file
API_URL=https://api.example.com
API_KEY=your-api-key
DATABASE_URL=your-database-url
JWT_SECRET=your-secret-key
```

---

**Last Updated:** December 10, 2025  
**Version:** 1.0.0
