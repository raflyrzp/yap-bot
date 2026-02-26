# yap-bot 🤖💬

Bot WhatsApp pengganti sementara Rafly buat nemenin Yaya ngobrol.
Powered by **whatsapp-web.js** + **Groq** (Llama 3.3 70B).

## Fitur

- 🔐 Login via QR Code di terminal
- 🎯 Hanya membalas pesan dari nomor target (Yaya)
- 🧠 Context-aware — menyimpan riwayat chat singkat biar nyambung
- ⌨️ Simulate typing — ada delay sebelum bales biar keliatan manusiawi
- 🎭 Few-shot prompting — gaya chat meniru Rafly tapi tetap identitas yap-bot
- ⚙️ Fully configurable — persona, chat samples, dan model bisa diatur lewat `.env`

## Setup

### 1. Install dependencies

```bash
bun install
```

### 2. Buat file `.env`

Copy dari template yang sudah disediakan:

```bash
cp .env.example .env
```

Lalu edit `.env` sesuai kebutuhan. Minimal yang **wajib** diisi:

```env
GROQ_API_KEY=your_groq_api_key_here
TARGET_NUMBER=62812xxxxx@c.us
```

> 🔑 Ambil API key Groq gratis di [console.groq.com](https://console.groq.com).
> 📱 Format nomor WA: kode negara + nomor tanpa `+` atau `0`, lalu `@c.us`.

### 3. Jalankan bot

```bash
bun run start
```

Atau mode development (auto-reload):

```bash
bun run dev
```

### 4. Scan QR code

Scan QR code yang muncul di terminal pakai WhatsApp kamu.

### 5. Done! yap-bot siap nemenin Yaya 🎀

## Environment Variables

| Variable | Wajib | Default | Deskripsi |
| --- | --- | --- | --- |
| `GROQ_API_KEY` | ✅ | — | API key dari Groq |
| `TARGET_NUMBER` | ✅ | `6281234567890@c.us` | Nomor WA target (format `62xxx@c.us`) |
| `BOT_PERSONA` | ❌ | Persona bawaan Rafly | Persona/system prompt bot dalam teks biasa. Gunakan `\n` untuk newline |
| `CHAT_SAMPLES` | ❌ | 7 sample bawaan | Contoh gaya chat dalam format JSON array `[{"user":"...","reply":"..."}]` |
| `GROQ_MODEL` | ❌ | `llama-3.3-70b-versatile` | Model Groq yang dipakai |
| `MAX_HISTORY` | ❌ | `20` | Jumlah pesan terakhir yang disimpan untuk konteks percakapan |

### Kustomisasi Persona

Kamu bisa ganti persona bot sesuai kebutuhan lewat `BOT_PERSONA` di `.env`. Contoh:

```env
BOT_PERSONA="Kamu adalah bot pengganti sementara dari Budi.\nGaya bicara santai dan gaul.\nPanggilan sayang: \"beb\", \"sayang\"."
```

> 💡 Gunakan `\n` untuk baris baru dan `\"` untuk tanda kutip di dalam string.

### Kustomisasi Chat Samples

Chat samples dipakai sebagai few-shot examples biar AI bisa meniru gaya chat. Format JSON array:

```env
CHAT_SAMPLES='[{"user":"lagi apa?","reply":"ini lagi rebahan beb, kamu gimana?"},{"user":"aku bosen","reply":"yaudah sini aku temenin ngobrol"}]'
```

> 💡 Setiap item harus punya key `user` (pesan masuk) dan `reply` (contoh balasan).

## Tech Stack

- [Bun](https://bun.sh) — runtime & package manager
- [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js) — WhatsApp Web client
- [Groq](https://groq.com) — LLM inference (Llama 3.3 70B)
- [qrcode-terminal](https://www.npmjs.com/package/qrcode-terminal) — QR code di terminal

## Catatan

- Bot hanya akan membalas pesan dari `TARGET_NUMBER`. Pesan dari nomor lain diabaikan.
- Riwayat chat disimpan di memori (bukan database). Kalau bot restart, riwayat hilang.
- Data autentikasi WhatsApp disimpan di folder `.wwebjs_auth/` (sudah di-`.gitignore`).
- Jangan share API key kamu. File `.env` sudah di-`.gitignore` supaya tidak ter-commit.