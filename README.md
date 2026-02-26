# yap-bot 🤖💬

A WhatsApp chatbot powered by **whatsapp-web.js** and **Groq LLM**. Designed for configurable personas, context-aware replies, and simple customization via environment variables.

## Features
- 🔑 Login via QR code in the terminal
- 🎯 Responds only to a configured target WhatsApp number
- 🧠 Context-aware: keeps recent message history
- ⌨️ Simulated typing for human-like interaction
- 📝 Few-shot prompting: customize persona and sample dialogues
- ⚙️ Fully configurable through `.env`

## Quick Start

1) Install dependencies
```bash
bun install
```

2) Create `.env` from the template and edit values
```bash
cp .env.example .env
```
Minimum required:
```env
GROQ_API_KEY=your_groq_api_key_here
TARGET_NUMBER=62xxxxxxxxxxx@c.us
```
Get a Groq API key at https://console.groq.com.  
WhatsApp format: country code + number (no `+` or leading `0`), then `@c.us`.

3) Run the bot
```bash
bun run start
```
For development (auto-reload):
```bash
bun run dev
```

4) Scan the QR code shown in the terminal with your WhatsApp app.

## Environment Variables

| Variable        | Required | Default                   | Description                                                     |
|-----------------|----------|---------------------------|-----------------------------------------------------------------|
| GROQ_API_KEY    | ✅       | —                         | Groq API key for LLM access                                     |
| TARGET_NUMBER   | ✅       | `6281234567890@c.us`      | WhatsApp target number (format `62xxx@c.us`)                    |
| BOT_PERSONA     | ❌       | Built-in generic persona  | Persona/system prompt string (use `\n` for new lines)           |
| CHAT_SAMPLES    | ❌       | Generic examples          | JSON array of `{user, reply}` few-shot examples                 |
| GROQ_MODEL      | ❌       | `llama-3.3-70b-versatile` | Groq model name                                                 |
| MAX_HISTORY     | ❌       | `20`                      | Number of recent messages to keep for context                   |

## Customizing Persona
Set `BOT_PERSONA` to define tone and style. Example:
```env
BOT_PERSONA="You are a helpful WhatsApp bot with a friendly, concise style.\nUse emojis occasionally."
```

## Customizing Chat Samples
Guide the reply style with few-shot examples via `CHAT_SAMPLES`:
```env
CHAT_SAMPLES='[{"user":"hello bot!","reply":"Hi there! How can I help you today?"},{"user":"tell me a joke","reply":"Why did the chicken cross the road? To get to the other side! 😄"}]'
```

## Tech Stack
- Bun — runtime & package manager
- whatsapp-web.js — WhatsApp Web client
- Groq — LLM inference
- qrcode-terminal — QR rendering in terminal

## Notes
- Only responds to `TARGET_NUMBER`; other senders are ignored.
- Chat history is in-memory and clears on restart.
- WhatsApp auth data is stored in `.wwebjs_auth/` (gitignored).
- Keep your API keys secret; `.env` is gitignored for safety.