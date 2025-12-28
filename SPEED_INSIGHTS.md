# Vercel Speed Insights Integration Guide

This document describes the integration of Vercel Speed Insights into the Vulsoft project. Speed Insights helps you monitor and optimize your website's performance by tracking real user metrics.

## Overview

Vercel Speed Insights is a real user monitoring (RUM) solution that helps you:
- Track Core Web Vitals and other performance metrics
- Monitor performance across different devices and regions
- Identify performance bottlenecks in your application
- Understand how users experience your website

## What Was Implemented

### 1. **Backend Integration**

Added the `@vercel/speed-insights` package to the API project:

```json
{
  "name": "vulsoft-auth-api",
  "dependencies": {
    "@vercel/speed-insights": "^1.3.1"
  }
}
```

This package is available for use in the Node.js backend if you need server-side integration.

**Installation:**
```bash
cd api
npm install
```

The `package-lock.json` file has been updated to lock the dependency versions.

### 2. **Frontend Integration**

The Speed Insights tracking script has been added to all primary HTML pages in the project:

**Pages Updated:**
- `index.html` - Home page
- `about.html` - About page
- `contact.html` - Contact page
- `login.html` - Login page
- `signup.html` - Sign up page
- `projects.html` - Projects page
- `blog.html` - Blog listing page
- `blog-post.html` - Individual blog post page
- `dashboard.html` - Dashboard page
- `academie.html` - Academy page
- `course-details.html` - Course details page
- `cours.html` - Courses page
- `project-details.html` - Project details page

**Implementation:**

Each page includes the Speed Insights initialization script before the closing `</body>` tag:

```html
<!-- Vercel Speed Insights -->
<script>
    window.si = window.si || function () { (window.siq = window.siq || []).push(arguments); };
</script>
<script defer src="/_vercel/speed-insights/script.js"></script>
```

This implementation:
- Initializes the Speed Insights queue (`window.si`)
- Asynchronously loads the tracking script from Vercel's CDN
- Does not block page rendering (uses `defer` attribute)
- Is non-intrusive and doesn't require additional configuration

## How Speed Insights Works

### Data Collection

Once deployed to Vercel, Speed Insights will:
1. Automatically collect real user metrics from visitors
2. Track Core Web Vitals (LCP, FID, CLS)
3. Monitor additional performance metrics
4. Send aggregated data to Vercel's backend

### Available Metrics

Speed Insights tracks:

**Core Web Vitals:**
- **Largest Contentful Paint (LCP)** - How long until the main content loads
- **First Input Delay (FID)** / **Interaction to Next Paint (INP)** - Responsiveness to user interactions
- **Cumulative Layout Shift (CLS)** - Visual stability

**Additional Metrics:**
- First Contentful Paint (FCP)
- Time to First Byte (TTFB)
- Domain Lookup Time (DNS)
- Connect Time (TCP)
- Request Time (TTFB)
- Render Time
- DOM Interactions
- Custom events

## Deployment Requirements

To use Speed Insights, your application must be deployed to Vercel. The feature is **not available** when running locally.

### Prerequisites

1. **Vercel Account** - Sign up at https://vercel.com/signup
2. **Vercel Project** - Create a new project or import existing one
3. **Enable Speed Insights** - In your Vercel dashboard:
   - Select your project
   - Go to the "Speed Insights" tab
   - Click "Enable"

### Important Note

When Speed Insights is enabled, Vercel automatically creates special routes scoped at `/_vercel/speed-insights/*` after your next deployment. These routes handle the script serving and data collection.

## Deployment Steps

### 1. Deploy to Vercel

```bash
# Using Vercel CLI
vercel deploy

# Or connect your Git repository
# Then push to your connected branch
```

### 2. Wait for Data Collection

Once deployed:
1. Users who visit your site will have their metrics tracked
2. Data collection starts immediately
3. You can view initial results in the dashboard within minutes
4. Full analytics dashboard becomes available after a few hours of traffic

### 3. View Metrics

In your Vercel dashboard:
1. Select your project
2. Navigate to the "Speed Insights" tab
3. Explore metrics by device type, location, and page

## Configuration & Advanced Usage

### Custom Events

You can track custom events using the `window.si` function:

```javascript
// Track a custom event
window.si('event', {
    name: 'checkout_started',
    value: 100 // optional numeric value
});
```

### Filtering Sensitive Data

To prevent sensitive information from being sent to Vercel, you can use the `beforeSend` callback. This is particularly useful for URLs containing sensitive parameters.

Add this to your pages:

```html
<script>
    window.speedInsightsBeforeSend = function(data) {
        // Remove or modify sensitive data
        if (data.path) {
            // Remove query parameters
            data.path = data.path.split('?')[0];
        }
        return data;
    };
</script>
```

### Performance Optimization Tips

Based on Speed Insights data, consider optimizing:

1. **Images** - Use modern formats (WebP), implement lazy loading
2. **JavaScript** - Code split, defer non-critical scripts
3. **CSS** - Minimize critical CSS, defer non-critical styles
4. **Server Response Time** - Optimize database queries, cache responses
5. **Third-party Scripts** - Defer or lazy-load non-essential scripts

## Monitoring & Alerting

Vercel Speed Insights provides:
- Real-time performance dashboards
- Historical trend analysis
- Device and browser breakdowns
- Geographic performance comparison

## Privacy & Compliance

Speed Insights respects:
- **GDPR** - No personally identifiable information is collected
- **CCPA** - User data is aggregated and anonymized
- **Adblockers** - Not blocked (unlike other analytics tools)

Learn more at: https://vercel.com/docs/speed-insights/privacy-policy

## Troubleshooting

### Speed Insights Not Tracking

**Issue:** No data appears in the Speed Insights dashboard after 24 hours.

**Solutions:**
1. Verify the project is deployed to Vercel (not localhost)
2. Check that Speed Insights is enabled in the project settings
3. Ensure the script is present in your HTML:
   ```html
   <script defer src="/_vercel/speed-insights/script.js"></script>
   ```
4. Check browser console for any errors
5. Verify network requests include `/_vercel/speed-insights/script.js`

### Script 404 Error

**Issue:** Getting 404 errors for `/_vercel/speed-insights/script.js`

**Solutions:**
1. This is normal when running locally
2. Only occurs after enabling Speed Insights in Vercel dashboard
3. After enabling, redeploy your application
4. Wait a few minutes for routes to be created

## Testing Locally

To test that the script is properly integrated (without actual tracking):

```bash
# Search for Speed Insights in your HTML
grep -r "speed-insights" *.html

# Check that the script tag is present
grep -r "_vercel/speed-insights" *.html
```

## Resources

- **Official Documentation:** https://vercel.com/docs/speed-insights
- **Getting Started Guide:** https://vercel.com/docs/speed-insights/getting-started
- **Package Reference:** https://vercel.com/docs/speed-insights/package
- **Metrics Explained:** https://vercel.com/docs/speed-insights/metrics
- **Troubleshooting:** https://vercel.com/docs/speed-insights/troubleshooting
- **Privacy Policy:** https://vercel.com/docs/speed-insights/privacy-policy
- **Pricing & Limits:** https://vercel.com/docs/speed-insights/limits-and-pricing

## Next Steps

After integration:

1. **Deploy to Vercel** - Push your changes and deploy
2. **Enable Speed Insights** - Turn it on in your Vercel dashboard
3. **Monitor Performance** - Check the Speed Insights dashboard daily
4. **Optimize Based on Data** - Use insights to improve performance
5. **Set Performance Budgets** - Define targets for Core Web Vitals

---

**Last Updated:** December 28, 2024
