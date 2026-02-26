import { Client, LocalAuth, type Message } from "whatsapp-web.js";
import qrcode from "qrcode-terminal";
import Groq from "groq-sdk";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
if (!GROQ_API_KEY) {
  console.error("❌  GROQ_API_KEY belum di-set! Tambahkan di .env");
  console.error("   Daftar gratis di https://console.groq.com");
  process.exit(1);
}

const targetNumber: string = process.env.TARGET_NUMBER ?? "6281234567890@c.us";

const DEFAULT_PERSONA = `
Kamu adalah "yap-bot", asisten chat ramah yang mendukung percakapan santai.
Kamu bukan manusia; jelaskan secara sopan jika ditanya identitasmu.

Gaya:
- Santai dan ringkas, tidak kaku atau formal.
- Hindari huruf kapital berlebihan; pakai bahasa Indonesia casual.
- Jawab nyambung, tidak dry-text.
- Gunakan emoji secukupnya, tidak berlebihan.
- Jika diminta bercanda, beri humor ringan.

Aturan:
- Jangan mengklaim sebagai manusia.
- Jaga konteks percakapan singkat dan relevan.
- Bila tidak yakin, minta klarifikasi secara sopan.
`.trim();

const DEFAULT_CHAT_SAMPLES = [
  {
    user: "halo bot!",
    reply: "hai! ada yang bisa aku bantu?",
  },
  {
    user: "apa kabar?",
    reply: "aku baik, terima kasih sudah bertanya.",
  },
  {
    user: "bot, tolong kasih joke dong",
    reply: "kenapa ayam nyebrang jalan? karena mau ke seberang! 😄",
  },
  {
    user: "cuaca hari ini gimana?",
    reply: "aku nggak bisa cek cuaca, tapi semoga harimu cerah!",
  },
  {
    user: "bot, kamu bisa bantu hitung?",
    reply: "tentu! kasih tahu aja apa yang mau dihitung.",
  },
];

const myPersona: string = process.env.BOT_PERSONA?.trim() || DEFAULT_PERSONA;

let chatSamples: Array<{ user: string; reply: string }>;
if (process.env.CHAT_SAMPLES) {
  try {
    chatSamples = JSON.parse(process.env.CHAT_SAMPLES);
    if (!Array.isArray(chatSamples)) {
      throw new Error("CHAT_SAMPLES harus berupa JSON array");
    }
    console.log(`✅ Loaded ${chatSamples.length} chat sample(s) dari env`);
  } catch (err) {
    console.error("❌  Gagal parse CHAT_SAMPLES dari env:", err);
    console.error("   Menggunakan default chat samples...");
    chatSamples = DEFAULT_CHAT_SAMPLES;
  }
} else {
  chatSamples = DEFAULT_CHAT_SAMPLES;
}

const groq = new Groq({ apiKey: GROQ_API_KEY });
const GROQ_MODEL = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const MAX_HISTORY = Number(process.env.MAX_HISTORY) || 20;
const chatHistory: ChatMessage[] = [];
const BOT_START_TIMESTAMP = Math.floor(Date.now() / 1000);

function addToHistory(role: "user" | "assistant", content: string) {
  chatHistory.push({ role, content });
  while (chatHistory.length > MAX_HISTORY) {
    chatHistory.shift();
  }
}

function buildSystemPrompt(): string {
  let prompt = myPersona + "\n\n";
  prompt += "Berikut contoh gaya chat Rafly untuk referensi:\n\n";
  for (const sample of chatSamples) {
    prompt += `Yaya: "${sample.user}"\n`;
    prompt += `Rafly (contoh): "${sample.reply}"\n\n`;
  }
  prompt +=
    "Sekarang kamu yap-bot. Balas chat Yaya dengan gaya di atas. Jangan pakai prefix nama. Langsung balas pesannya saja.";
  return prompt;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const MAX_RETRIES = 3;

async function generateReply(incomingMessage: string): Promise<string> {
  addToHistory("user", incomingMessage);

  const systemPrompt = buildSystemPrompt();

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const completion = await groq.chat.completions.create({
        model: GROQ_MODEL,
        messages: [{ role: "system", content: systemPrompt }, ...chatHistory],
        temperature: 0.8,
        max_tokens: 300,
      });

      const text = completion.choices[0]?.message?.content?.trim();
      if (!text) throw new Error("Empty response from Groq");

      addToHistory("assistant", text);
      return text;
    } catch (err: unknown) {
      const errStr = String(err);
      const isRateLimit =
        errStr.includes("429") || errStr.includes("rate_limit");

      if (isRateLimit && attempt < MAX_RETRIES) {
        const delay = 10_000 * attempt;
        console.log(
          `⏳ Rate limited! Retry ${attempt}/${MAX_RETRIES} — waiting ${delay / 1000}s...`,
        );
        await sleep(delay);
        continue;
      }

      console.error(`❌  Groq error (attempt ${attempt}/${MAX_RETRIES}):`, err);

      if (isRateLimit) {
        return "bentar ya ndut, yap-bot lagi kena limit nih. ntar aku bales lagi 🥺";
      }
      return "aduh sorry ndut, yap-bot lagi error nih 😵";
    }
  }

  return "aduh sorry ndut, yap-bot lagi error nih 😵";
}

async function simulateTyping(
  chat: Awaited<ReturnType<Message["getChat"]>>,
  text: string,
): Promise<void> {
  const baseDelay = 1500;
  const perCharDelay = 30;
  const maxDelay = 8000;
  const delay = Math.min(baseDelay + text.length * perCharDelay, maxDelay);

  await chat.sendStateTyping();
  await new Promise((resolve) => setTimeout(resolve, delay));
  await chat.clearState();
}

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  },
});

client.on("qr", (qr: string) => {
  console.log("📱 Scan QR code ini untuk login WhatsApp:");
  qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
  console.log("✅ yap-bot is online!");
  console.log(`🎯 Target number: ${targetNumber}`);
  console.log(`🧠 Model: ${GROQ_MODEL}`);
  console.log(`🎭 Persona: ${myPersona.substring(0, 60)}...`);
  console.log(`📝 Chat samples: ${chatSamples.length} loaded`);
  console.log("⏳ Menunggu pesan dari Yaya...\n");
});

client.on("authenticated", () => {
  console.log("🔐 Authenticated successfully!");
});

client.on("auth_failure", (msg: string) => {
  console.error("❌ Auth failure:", msg);
});

client.on("disconnected", (reason: string) => {
  console.log("🔌 Client disconnected:", reason);
});

client.on("message", async (message: Message) => {
  if (message.from !== targetNumber) return;
  if (message.fromMe) return;
  const text = message.body?.trim();
  if (!text) return;
  if (message.timestamp && message.timestamp < BOT_START_TIMESTAMP) return;

  console.log(`📩 [Yaya]: ${text}`);

  try {
    const reply = await generateReply(text);
    const finalReply = `${reply} -YapBot`;
    const chat = await message.getChat();
    await simulateTyping(chat, finalReply);
    await message.reply(finalReply);
    console.log(`🤖 [yap-bot]: ${finalReply}\n`);
  } catch (err) {
    console.error("❌ Error handling message:", err);
  }
});

console.log("🚀 Starting yap-bot...");
console.log("━".repeat(50));
client.initialize();
