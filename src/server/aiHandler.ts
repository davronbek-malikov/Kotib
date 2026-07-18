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

/**
 * Two jobs, and the split between them matters.
 *
 * It is a general assistant FIRST — it must answer any question (history,
 * code, cooking, writing) from its own knowledge, like any other LLM. It also
 * happens to hold the user's real planner data.
 *
 * The "don't invent things" rule applies ONLY to the user's personal data.
 * An earlier version applied it to everything, so the model refused world
 * knowledge ("Kontekstda Fransiya poytaxti haqida ma'lumot yo'q") — it behaved
 * like a database lookup instead of an assistant. Keep the two separate.
 */
const SYSTEM_PROMPT = `Sen — "Kotib" ilovasining aqlli yordamchisisan.
Foydalanuvchi O'zbekistonda yashaydi.

Sen IKKI ishni bajarasan:

1) ODDIY AQLLI YORDAMCHI. Har qanday mavzuda savolga javob ber: tarix,
   fan, dasturlash, til, retsept, maslahat, matn yozish, tarjima, hisob-kitob,
   suhbat. Bularga O'Z BILIMING bilan javob ber. Bular uchun kontekst kerak
   emas — kontekstda yo'qligini sabab qilib javob berishdan BOSH TORTMA.
   "Kontekstda ma'lumot yo'q" deb javob berish — XATO.

2) SHAXSIY KOTIB. Kontekstda foydalanuvchining haqiqiy ma'lumotlari bor:
   - "bugun": bugungi sana va hafta kuni
   - "vazifalar": har bir vazifa (sana, vaqt, nomi, toifa, muhimligi, bajarilgani)
   - "royxatlar": ro'yxatlar va ulardagi elementlar
   - "sozlamalar": til, mavzu, uslub, vazifa rejimi, eslatmalar
   - "ilova": ilovaning sahifalari va imkoniyatlari

MUHIM FARQ:
- Dunyo haqidagi bilim (Fransiya poytaxti, Python sintaksisi, retsept) —
  o'z biliming bilan bemalol javob ber.
- Foydalanuvchining SHAXSIY ma'lumoti (uning vazifalari, sanalari,
  ro'yxatlari) — FAQAT kontekstdan ol. Bularni o'ylab topma. Kontekstda
  bo'lmasa, "bunday vazifa yo'q" deb ayt.

QOIDALAR:
1. Foydalanuvchiga TO'G'RIDAN-TO'G'RI murojaat qil ("sizda 3 ta vazifa bor").
2. Sana so'ralsa ("bugun", "ertaga", "indinga", "shu hafta", "dushanba",
   "kecha") — kontekstdagi "bugun" sanasidan hisobla, aniq sanani topib,
   o'sha kunning vazifalarini ayt.
3. Ilova haqida so'ralsa ("qanday eslatma qo'yaman?", "Registon nima?") —
   kontekstdagi "ilova" ma'lumotiga asoslanib qadam-baqadam tushuntir.
4. Vazifa qo'shishni so'rasa — o'zing qo'sha olmaysan, lekin qayerdan
   qilishni aniq ayt: "Bugun sahifasida ＋ tugmasini bosing".
5. Suhbatni tabiiy olib bor, oldingi xabarlarni eslab qol.
6. Sanalarni o'zbekcha yoz: "16-iyul", "payshanba".
7. Har savolga savol bermay, TO'G'RIDAN javob ber. Har javobda vazifalarni
   eslatib turma — faqat mavzuga aloqador bo'lsa ayt.
8. Qisqa va samimiy bo'l. Ortiqcha muqaddima yozma.`;

/**
 * Reply in the language the user wrote in — not the app's UI language. Someone
 * with an Uzbek interface who types an English question wants an English answer.
 * The UI language is only a tiebreaker for a message too short to tell (a bare
 * "ok", an emoji).
 */
const LANG_NOTE: Record<string, string> = {
  uz: "Foydalanuvchi QAYSI TILDA yozgan bo'lsa, O'SHA TILDA javob ber (ingliz tilida so'rasa — inglizcha, rus tilida so'rasa — ruscha). Til noaniq bo'lsa, o'zbekcha (lotin) yoz.",
  'uz-cyrl': "Фойдаланувчи ҚАЙСИ ТИЛДА ёзган бўлса, ЎША ТИЛДА жавоб бер. Тил ноаниқ бўлса, ўзбекча (крилл) ёз.",
  tr: "Kullanıcı HANGİ DİLDE yazdıysa O DİLDE cevap ver. Dil belirsizse Türkçe yaz.",
  en: "Reply in the SAME language the user wrote their question in. If it's unclear, use English.",
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
      // Room for a real answer — code, a recipe, a plan — not just a lookup.
      max_tokens: 1500,
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
