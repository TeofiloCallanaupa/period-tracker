# Private Cycle Coach

A privacy-first period tracking chatbot that uses Qwen 3 via Cerebras/OpenRouter to provide empathetic responses without sending sensitive data directly.

# Deployed At

https://period-tracker-bl6bq9j2a-teos-projects-616fcc46.vercel.app/

# Youtube

https://youtu.be/bXieHki3dvU

## Features

- **Local Text Summarization**: Extracts JSON summaries from user input client-side
- **Privacy-Preserving AI**: Only sends summarized data, never full personal messages
- **Encrypted Data Export/Import**: Download/upload cycle data as encrypted `.qcycle` files
- **CORS-Free Deployment**: Backend proxy handles API calls securely

## Quick Start

### Local Development

1. Clone and navigate to the project:
   ```bash
   git clone <your-repo>
   cd period-tracker
   ```

2. Install Vercel CLI (for local development):
   ```bash
   npm i -g vercel
   ```

3. Start the development server:
   ```bash
   vercel dev
   ```

4. Open http://localhost:3000 in your browser

5. Enter your OpenRouter API key when prompted

### Deployment on Vercel

1. Connect your GitHub repository to Vercel
2. Deploy with one click
3. No environment variables needed - users enter their own API keys

## File Structure

```
period-tracker/
├── index.html          # Main UI
├── css/style.css       # Styling
├── js/
│   ├── summarizer.js   # Local text analysis
│   ├── crypto.js       # AES encryption/decryption
│   ├── api.js         # Frontend API calls
│   └── app.js         # Main application logic
├── api/
│   └── llm.js         # Vercel serverless function (CORS proxy)
├── vercel.json        # Vercel configuration
└── .env.example       # Environment template
```

## How It Works

1. **User Input**: User types cycle-related messages
2. **Local Processing**: Client-side summarization extracts key data
3. **Secure API Call**: Backend proxy forwards to OpenRouter/Cerebras
4. **AI Response**: Qwen 3 provides empathetic health advice
5. **Privacy**: Original messages never leave the user's device

## API Key Setup

Get your OpenRouter API key:
1. Visit https://openrouter.ai/keys
2. Create an account and generate a key
3. Enter it in the app's password field

## Security Features

- Client-side encryption using AES
- No API keys stored in code
- Backend proxy prevents CORS issues
- Minimal data transmission to AI

## Tech Stack

- **Frontend**: Vanilla JavaScript (ES6 modules)
- **Backend**: Vercel Serverless Functions
- **AI**: Qwen 3 32B via Cerebras on OpenRouter
- **Encryption**: CryptoJS (AES)
- **Deployment**: Vercel

## License

MIT License - feel free to use for hackathons and personal projects!
