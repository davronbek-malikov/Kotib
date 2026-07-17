import { describe, expect, it, vi } from 'vitest';
import { buildContext } from '../ai/context';
import { addChecklist, addChecklistItem, addTask, createInitialState } from '../store';
import { handleAi } from '../../server/aiHandler';

const NOW = new Date(2026, 6, 16, 12, 0); // Thursday 2026-07-16

describe('buildContext', () => {
  it("gives the assistant today's date and weekday, so it can resolve 'ertaga'", () => {
    const ctx = buildContext(createInitialState(), NOW);
    expect(ctx.bugun).toEqual({ sana: '2026-07-16', hafta_kuni: 'payshanba' });
  });

  it('includes every field of a task the assistant needs to answer about it', () => {
    let s = createInitialState();
    s = addTask(s, {
      title: 'Stomatolog', date: '2026-07-16', time: '15:00',
      category: 'shaxsiy', priority: 'shoshilinch', reminderOffsetMin: 30,
    });
    const [task] = buildContext(s, NOW).vazifalar as Record<string, unknown>[];
    expect(task).toMatchObject({
      nomi: 'Stomatolog',
      sana: '2026-07-16',
      vaqt: '15:00',
      toifa: 'shaxsiy',
      muhimligi: 'shoshilinch',
      bajarilgan: false,
      eslatma_daqiqa: 30,
    });
  });

  it('sorts tasks by date then time, so the model reads the day in order', () => {
    let s = createInitialState();
    s = addTask(s, { title: 'Kech', date: '2026-07-16', time: '18:00', category: 'ish' });
    s = addTask(s, { title: 'Erta', date: '2026-07-16', time: '09:00', category: 'ish' });
    s = addTask(s, { title: 'Kecha', date: '2026-07-15', category: 'ish' });

    const names = (buildContext(s, NOW).vazifalar as { nomi: string }[]).map((t) => t.nomi);
    expect(names).toEqual(['Kecha', 'Erta', 'Kech']);
  });

  it('sends a window around today rather than the whole history', () => {
    let s = createInitialState();
    s = addTask(s, { title: 'Juda eski', date: '2020-01-01', category: 'ish' });
    s = addTask(s, { title: 'Juda uzoq', date: '2030-01-01', category: 'ish' });
    s = addTask(s, { title: 'Bugun', date: '2026-07-16', category: 'ish' });

    const names = (buildContext(s, NOW).vazifalar as { nomi: string }[]).map((t) => t.nomi);
    expect(names).toEqual(['Bugun']);
  });

  it('includes checklists with their items and counts', () => {
    let s = addChecklist(createInitialState(), 'Bozorlik');
    s = addChecklistItem(s, s.checklists[0].id, 'Non');
    const [list] = buildContext(s, NOW).royxatlar as Record<string, unknown>[];
    expect(list).toMatchObject({ nomi: 'Bozorlik', jami: 1, bajarilgan: 0 });
  });

  it('describes every page, so "qanday eslatma qo\'yaman?" is answerable', () => {
    const app = buildContext(createInitialState(), NOW).ilova as {
      sahifalar: Record<string, string>;
      imkoniyatlar: Record<string, string>;
    };
    for (const page of ['Bugun', 'Taqvim', "Ro'yxatlar", 'AI yordamchi', 'Sozlamalar']) {
      expect(app.sahifalar[page], `missing page ${page}`).toBeTruthy();
    }
    expect(app.imkoniyatlar['eslatma']).toContain('Eslatma');
  });

  it('passes the settings through, so it knows which mode the user is in', () => {
    const ctx = buildContext(createInitialState(), NOW);
    expect(ctx.sozlamalar).toMatchObject({ til: 'uz', uslub: 'klassik', vazifa_rejimi: 'simple' });
  });
});

describe('handleAi', () => {
  const body = { question: 'Bugun nima bor?', context: { bugun: {} } };

  it('refuses to call the provider without a key', async () => {
    await expect(handleAi(body, {})).rejects.toThrow();
  });

  it('sends the key as a bearer token and returns the answer', async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ choices: [{ message: { content: '3 ta vazifa' } }] }), {
        status: 200,
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await handleAi(body, { GROQ_API_KEY: 'test-key' });
    expect(result.answer).toBe('3 ta vazifa');

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer test-key');
    vi.unstubAllGlobals();
  });

  it('puts the context in the system prompt so the model always has the data', async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ choices: [{ message: { content: 'ok' } }] }), { status: 200 }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await handleAi({ ...body, context: { bugun: { sana: '2026-07-16' } } }, { GROQ_API_KEY: 'k' });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const sent = JSON.parse(init.body as string) as { messages: { role: string; content: string }[] };
    expect(sent.messages[0].role).toBe('system');
    expect(sent.messages[0].content).toContain('2026-07-16');
    vi.unstubAllGlobals();
  });

  it('throws on a provider error rather than returning a broken answer', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('nope', { status: 500 })));
    await expect(handleAi(body, { GROQ_API_KEY: 'k' })).rejects.toThrow();
    vi.unstubAllGlobals();
  });

  it('caps how much history it sends', async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ choices: [{ message: { content: 'ok' } }] }), { status: 200 }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const history = Array.from({ length: 30 }, (_, i) => ({
      role: (i % 2 === 0 ? 'user' : 'bot') as 'user' | 'bot',
      text: `turn ${i}`,
    }));
    await handleAi({ ...body, history }, { GROQ_API_KEY: 'k' });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const sent = JSON.parse(init.body as string) as { messages: unknown[] };
    // system + 8 history turns + the question
    expect(sent.messages).toHaveLength(10);
    vi.unstubAllGlobals();
  });
});
