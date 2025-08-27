# Google OAuth Setup for Uzaji

This guide will help you set up Google OAuth authentication for your Uzaji application using Supabase.

## Prerequisites

- A Supabase project (see README.md for setup instructions)
- A Google Cloud Console account

## Step 1: Create Google OAuth Credentials

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API:
   - Go to **APIs & Services > Library**
   - Search for "Google+ API" and enable it
4. Create OAuth 2.0 credentials:
   - Go to **APIs & Services > Credentials**
   - Click **Create Credentials > OAuth 2.0 Client IDs**
   - Choose **Web application**
   - Add authorized JavaScript origins:
     - `http://localhost:5173` (for development)
     - `https://rwhkgiftdflqedllpoec.supabase.co` (replace with your project ID)
   - Add authorized redirect URIs:
     - `https://rwhkgiftdflqedllpoec.supabase.co/auth/v1/callback` (replace with your project ID)
   - Save the **Client ID** and **Client Secret**

## Step 2: Find Your Supabase Project ID

Your Supabase project ID is in your project URL. For example:
- If your Supabase URL is: `https://rwhkgiftdflqedllpoec.supabase.co`
- Your project ID is: `rwhkgiftdflqedllpoec`

## Step 3: Configure Google Cloud Console

**CRITICAL**: Add these exact URLs to your Google OAuth client:

### Authorized JavaScript Origins:
```
http://localhost:5173
https://rwhkgiftdflqedllpoec.supabase.co
```

### Authorized Redirect URIs:
```
https://rwhkgiftdflqedllpoec.supabase.co/auth/v1/callback
```

**Replace `rwhkgiftdflqedllpoec` with your actual Supabase project ID**

## Step 4: Configure Supabase

1. Go to your Supabase dashboard
2. Navigate to **Authentication > Providers**
3. Find **Google** in the list and click to configure
4. Enable the Google provider
5. Enter your Google OAuth credentials:
   - **Client ID**: Your Google OAuth Client ID
   - **Client Secret**: Your Google OAuth Client Secret
6. Save the configuration

## Step 5: Update Site URL Configuration

1. In your Supabase dashboard, go to **Authentication > URL Configuration**
2. Set your Site URL:
   - For development: `http://localhost:5173`
   - For production: `https://your-domain.com`
3. Add redirect URLs:
   - For development: `http://localhost:5173`
   - For production: `https://your-domain.com`

## Step 6: Test the Integration

1. Start your development server: `npm run dev`
2. Go to the authentication page
3. Click "Sign in with Google"
4. You should be redirected to Google's OAuth consent screen
5. After granting permissions, you'll be redirected back to your app

## Quick Fix for Current Error

The issue you're experiencing is that Google is redirecting to `localhost:3000` instead of `localhost:5173`. Here's how to fix it:

### 1. Update Google Cloud Console

1. **Go to Google Cloud Console > APIs & Services > Credentials**
2. **Click on your OAuth 2.0 Client ID**
3. **In "Authorized JavaScript origins", make sure you have**:
   ```
   http://localhost:5173
   https://rwhkgiftdflqedllpoec.supabase.co
   ```
4. **In "Authorized redirect URIs", make sure you have**:
   ```
   https://rwhkgiftdflqedllpoec.supabase.co/auth/v1/callback
   ```
5. **Click Save**
6. **Wait 5-10 minutes for changes to propagate**

### 2. Update Supabase Site URL

1. **Go to your Supabase dashboard**
2. **Navigate to Authentication > URL Configuration**
3. **Set Site URL to**: `http://localhost:5173`
4. **Add redirect URL**: `http://localhost:5173`
5. **Save the configuration**

### 3. Clear Browser Cache

1. Clear your browser cache and cookies
2. Try the Google sign-in again

## Understanding the OAuth Flow

1. **User clicks "Sign in with Google"**
2. **App redirects to Google OAuth** with your configured redirect URI
3. **Google authenticates user** and redirects to Supabase callback
4. **Supabase processes the OAuth response** and creates a session
5. **Supabase redirects back to your app** with the session tokens
6. **Your app detects the session** and logs the user in

## Troubleshooting

### Common Issues

1. **"redirect_uri_mismatch" error**:
   - **Most common cause**: Redirect URI doesn't match exactly
   - **Solution**: Use this exact format: `https://YOUR-PROJECT-ID.supabase.co/auth/v1/callback`
   - **Check**: No trailing slashes, correct project ID, https (not http)
   - **Wait**: Changes can take 5-10 minutes to propagate

2. **Redirecting to wrong port (localhost:3000 instead of localhost:5173)**:
   - **Cause**: Site URL in Supabase is set to wrong port
   - **Solution**: Update Site URL in Supabase to `http://localhost:5173`
   - **Also check**: Redirect URLs in Supabase settings

3. **"OAuth client not found" error**:
   - Verify that your Client ID and Client Secret are correctly entered in Supabase
   - Make sure the Google+ API is enabled in Google Cloud Console

4. **"Invalid site URL" error**:
   - Check that your site URL in Supabase matches your application's URL
   - Ensure redirect URLs are properly configured

5. **User not being created**:
   - Check your Supabase logs in the dashboard
   - Verify that email signup is enabled in Authentication settings

### Development vs Production

- **Development**: 
  - Site URL: `http://localhost:5173`
  - JavaScript Origins: `http://localhost:5173`
  - Google Redirect URI: `https://YOUR-PROJECT-ID.supabase.co/auth/v1/callback`
- **Production**: 
  - Site URL: `https://your-domain.com`
  - JavaScript Origins: `https://your-domain.com`
  - Google Redirect URI: `https://YOUR-PROJECT-ID.supabase.co/auth/v1/callback`

### Security Notes

- Always use HTTPS for the Supabase callback URL
- Keep your Client Secret secure and never expose it in client-side code
- Regularly rotate your OAuth credentials
- Monitor your Google Cloud Console for any suspicious activity

## Additional Configuration

### Custom Scopes

If you need additional Google scopes, you can configure them in the Supabase provider settings:

```
email profile openid
```

### User Metadata

Google OAuth will automatically populate user metadata with:
- `full_name`: User's full name from Google
- `avatar_url`: User's profile picture URL
- `email`: User's email address

This metadata is accessible in your application through the user object.

## Debug Steps

If you're still having issues, try these debug steps:

1. **Check browser console** for any error messages
2. **Check Supabase logs** in your dashboard
3. **Verify environment variables** are correctly set
4. **Test with incognito mode** to avoid cache issues
5. **Check network tab** to see the actual redirect URLs being used

## Need Help?

If you're still having issues:
1. Double-check your Supabase project ID in the URL
2. Verify the redirect URI matches exactly (no typos)
3. Wait 5-10 minutes after making changes
4. Check Supabase logs for detailed error messages
5. Ensure Google+ API is enabled in Google Cloud Console
6. Make sure Site URL in Supabase is set to `http://localhost:5173`