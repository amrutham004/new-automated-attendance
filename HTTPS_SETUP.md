# HTTPS Setup Guide (Using mkcert)

This guide will help you set up local HTTPS for the attendance system without using ngrok.

## Prerequisites

- Windows PowerShell (Run as Administrator)
- Node.js and npm installed

## Step 1: Install mkcert

### Option A: Using Chocolatey (Recommended)

```powershell
choco install mkcert
```

### Option B: Using Scoop

```powershell
scoop bucket add extras
scoop install mkcert
```

### Option C: Manual Download

1. Download from: https://github.com/FiloSottile/mkcert/releases
2. Get `mkcert-v1.4.4-windows-amd64.exe`
3. Rename to `mkcert.exe`
4. Add to your PATH or place in project directory

## Step 2: Install Local Certificate Authority

Open PowerShell as Administrator and run:

```powershell
mkcert -install
```

You should see:
```
Created a new local CA 💥
The local CA is now installed in the system trust store! ⚡️
```

## Step 3: Generate SSL Certificates

Navigate to your project directory:

```powershell
cd C:\Users\amrut\Downloads\automated-attendance-system
```

Generate certificates:

```powershell
mkcert localhost 127.0.0.1 ::1 192.168.1.* 10.0.0.*
```

This creates two files:
- `localhost+4.pem` (SSL certificate)
- `localhost+4-key.pem` (Private key)

The wildcards (192.168.1.*, 10.0.0.*) allow you to access the site from other devices on your local network.

## Step 4: Start Development Server

```powershell
npm run dev
```

The server will now run with HTTPS enabled at:
- **Local**: https://localhost:8080
- **Network**: https://192.168.1.X:8080 (your local IP)

## Step 5: Access from Mobile Devices

1. Find your computer's local IP address:
   ```powershell
   ipconfig
   ```
   Look for "IPv4 Address" under your active network adapter

2. On your mobile device (connected to same WiFi):
   - Open browser
   - Go to: `https://YOUR_IP:8080`
   - Example: `https://192.168.1.100:8080`

3. The certificate will be trusted (no warnings) because mkcert installed the CA

## Troubleshooting

### Certificate Not Found Error

If you see an error about certificates not found:

1. Make sure you ran `mkcert` in the project root directory
2. Check that these files exist:
   - `localhost+4.pem`
   - `localhost+4-key.pem`

### Browser Shows "Not Secure"

1. Make sure you ran `mkcert -install` as Administrator
2. Restart your browser
3. Clear browser cache and try again

### Mobile Device Shows Certificate Warning

1. You need to install the mkcert CA on your mobile device
2. Run: `mkcert -CAROOT` to find the CA location
3. Transfer the `rootCA.pem` file to your mobile device
4. Install it as a trusted certificate

### Port Already in Use

If port 8080 is already in use, you can change it in `vite.config.ts`:

```typescript
server: {
  port: 3000, // Change to any available port
  // ... rest of config
}
```

## Security Notes

- ✅ Certificates are only trusted on your local machine
- ✅ Perfect for development and testing
- ✅ No external services required
- ⚠️ Do NOT use these certificates in production
- ⚠️ For production, use Let's Encrypt or a commercial CA

## Benefits Over ngrok

- ✅ No internet connection required
- ✅ No random URLs that change
- ✅ Faster (local network only)
- ✅ Complete privacy (no external tunneling)
- ✅ No session timeouts
- ✅ Free forever

## Next Steps

Once HTTPS is working:
1. Test QR code generation and scanning
2. Test face recognition (requires HTTPS for camera access)
3. Test on mobile devices on your local network
4. Mark attendance using the dual-verification system

## Removing mkcert (Optional)

If you want to uninstall mkcert later:

```powershell
# Uninstall the local CA
mkcert -uninstall

# Remove mkcert
choco uninstall mkcert
# or
scoop uninstall mkcert
```
