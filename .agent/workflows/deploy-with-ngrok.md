---
description: Deploy backend with ngrok for testing
---

# Deploy Backend with ngrok (Temporary Testing)

This workflow helps you create a temporary public URL for your backend so others can test your app.

## Steps:

1. Install ngrok (if not already installed):
```bash
brew install ngrok
```

2. Start your backend server (if not already running):
```bash
cd navigation-backend
uvicorn app.main:app --host 0.0.0.0 --port 8001
```

3. In a new terminal, start ngrok:
// turbo
```bash
ngrok http 8001
```

4. Copy the HTTPS forwarding URL from ngrok output (looks like: `https://xxxx-xx-xx-xx-xx.ngrok-free.app`)

5. Update `constants/config.ts` and replace the hardcoded URL with the ngrok URL:
```typescript
// For testing with ngrok
url = 'https://your-ngrok-url.ngrok-free.app';
```

6. Rebuild and share the app

**Note:** The ngrok URL changes every time you restart ngrok (unless you have a paid account). This is only for temporary testing!
