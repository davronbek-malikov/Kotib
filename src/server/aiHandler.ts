/**
 * The AI proxy's logic, kept out of api/ai.ts so it is unit-testable and so
 * vite.config.ts can serve the same code during `npm run dev`.
 *
 * The API key NEVER reaches the browser. It lives in a Vercel environment
 * variable and is only read here, on the server — anything shipped in the web
 * bundle is readable by every user.
 */

export interface AiRequestBody {
  question: string;
  /** The user's tasks, lists, settings and today's date — see lib/ai/context. */
  context: object;
  lang?: 'uz' | 'uz-cyrl' | 'tr' | 'en';
  /** Previous turns, so the assistant keeps the thread. */
  history?: { role: 'user' | 'bot'; text: string }[];
}

export interface AiEnv {
  GROQ_API_KEY?: string;
}

export interface AiResult {
  answer: string;
}

const MODEL = 'llama-3.3-70b-versatile';

/** How many turns of history to send. Enough to hold a thread, cheap to send. */
const HISTORY_TURNS = 8;

const SYSTEM_PROMPT = `Sen — "Kotib" ilovasining aqlli shaxsiy kotibisan.
Foydalanuvchi O'zbekistonda yashaydi. Sen uning vaqtini, rejalarini va
vazifalarini boshqarishga yordam berasan.

KONTEKST: foydalanuvchining BARCHA ma'lumotlari JSON'da beriladi:
- "bugun": bugungi sana va hafta kuni
- "vazifalar": har bir vazifa (sana, vaqt, nomi, toifa, muhimligi, bajarilgani)
- "royxatlar": belgilar ro'yxatlari va ulardagi elementlar
- "sozlamalar": til, mavzu, uslub, vazifa rejimi, eslatma sozlamalari
- "ilova": ilovaning sahifalari va imkoniyatlari

QOIDALAR:
1. Foydalanuvchiga TO'G'RIDAN-TO'G'RI murojaat qil ("sizda 3 ta vazifa bor").
   Uchinchi shaxsda gapirma.
2. Sana so'ralsa ("bugun", "ertaga", "indinga", "shu hafta", "dushanba",
   "kecha") — kontekstdagi "bugun" sanasidan hisobla va aniq sanani (YYYY-MM-DD)
   aniqlab, o'sha kunning vazifalarini ayt. O'zing sana o'ylab topma.
3. Ilova haqida so'ralsa ("qanday qilib eslatma qo'yaman?", "Registon nima?",
   "kengaytirilgan rejim nima?") — kontekstdagi "ilova" ma'lumotiga asoslanib
   aniq, qadam-baqadam javob ber.
4. Vazifa qo'shishni so'rasa — o'zing qo'sha olmaysan, lekin qanday qilishni
   aniq tushuntir: "Bugun sahifasida ＋ tugmasini bosing".
5. Suhbatni tabiiy olib bor: oldingi xabarlarni eslab qol. Oddiy savolga —
   qisqa aniq javob. Reja, tahlil yoki maslahat so'ralsa — batafsil va
   foydali javob ber.
6. Sanalarni o'zbekcha yoz: "16-iyul", "payshanba".
7. Bilmagan narsani o'ylab topma. Kontekstda ma'lumot bo'lmasa, shuni ayt.
8. Qisqa va samimiy bo'l. Ortiqcha muqaddima yozma.`;

const LANG_NOTE: Record<string, string> = {
  uz: "Javobni O'ZBEK tilida (lotin alifbosida) yoz.",
  'uz-cyrl': "Javобни ЎЗБЕК тилида (крилл алифбосида) ёз.",
  tr: 'Cevabı TÜRKÇE yaz.',
  en: 'Answer in ENGLISH.',
};

/** Never let a provider error surface as a stack trace to the user. */
export async function handleAi(body: AiRequestBody, env: AiEnv): Promise<AiResult> {
  const key = env.GROQ_API_KEY;
  if (!key) throw new Error('no api key configured');

  const history = (body.history ?? []).slice(-HISTORY_TURNS).map((turn) => ({
    role: turn.role === 'user' ? ('user' as const) : ('assistant' as const),
    content: turn.text,
  }));

  const lang = body.lang ?? 'uz';
  const system = [
    SYSTEM_PROMPT,
    LANG_NOTE[lang] ?? LANG_NOTE.uz,
    `KONTEKST:\n${JSON.stringify(body.context)}`,
  ].join('\n\n');

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: system },
        ...history,
        { role: 'user', content: body.question },
      ],
      temperature: 0.6,
      max_tokens: 900,
    }),
  });

  if (!res.ok) throw new Error(`groq ${res.status}`);

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const answer = data.choices?.[0]?.message?.content?.trim();
  if (!answer) throw new Error('empty answer');
  return { answer };
}
