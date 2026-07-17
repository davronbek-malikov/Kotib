import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';

/**
 * A smoke test, not a component suite. It exists to catch the failures that
 * typecheck and unit tests cannot: the app not mounting at all, a Capacitor
 * import exploding in a browser context (there is no native bridge on web —
 * spec §10.1), or the core add-a-task loop being broken end to end.
 */

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
});

describe('App smoke', () => {
  it('mounts in a browser with no native bridge present', () => {
    render(<App />);
    expect(screen.getByRole('navigation')).toBeTruthy();
  });

  it('shows the four Uzbek tabs, with the assistant where Settings used to be', () => {
    render(<App />);
    const nav = screen.getByRole('navigation');
    for (const label of ['Bugun', 'Taqvim', "Ro'yxatlar", 'AI yordamchi']) {
      expect(within(nav).getByText(label), `missing tab ${label}`).toBeTruthy();
    }
    // Settings moved out of the tab bar and onto the header gear.
    expect(within(nav).queryByText('Sozlamalar')).toBeNull();
    expect(screen.getByLabelText('Sozlamalar')).toBeTruthy();
  });

  it('invites the user in rather than showing a void', () => {
    render(<App />);
    expect(screen.getByText(/Bugun hali reja yo'q/)).toBeTruthy();
  });

  it('defaults to the light theme', () => {
    render(<App />);
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('adds a task through the quick-add sheet and shows it on the timeline', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByLabelText('Yangi vazifa'));
    await user.type(screen.getByPlaceholderText('Nima qilasiz?'), 'Stomatolog');
    await user.click(screen.getByRole('button', { name: 'Saqlash' }));

    expect(screen.getByText('Stomatolog')).toBeTruthy();
    // The empty state must be gone.
    expect(screen.queryByText(/Bugun hali reja yo'q/)).toBeNull();
  });

  it('persists an added task across a remount', async () => {
    const user = userEvent.setup();
    const first = render(<App />);

    await user.click(screen.getByLabelText('Yangi vazifa'));
    await user.type(screen.getByPlaceholderText('Nima qilasiz?'), 'Planyorka');
    await user.click(screen.getByRole('button', { name: 'Saqlash' }));
    first.unmount();

    render(<App />);
    expect(screen.getByText('Planyorka')).toBeTruthy();
  });

  it('switches every label when the locale changes', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByLabelText('Sozlamalar'));
    await user.click(screen.getByRole('button', { name: 'English' }));

    const nav = screen.getByRole('navigation');
    expect(within(nav).getByText('Today')).toBeTruthy();
    expect(within(nav).getByText('Calendar')).toBeTruthy();
  });

  it('applies the dark theme without a reload', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByLabelText('Sozlamalar'));
    await user.click(screen.getByRole('button', { name: "Qorong'i" }));

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('completes a task when the check is clicked, and strikes it through', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);

    await user.click(screen.getByLabelText('Yangi vazifa'));
    await user.type(screen.getByPlaceholderText('Nima qilasiz?'), 'Koding');
    await user.click(screen.getByRole('button', { name: 'Saqlash' }));

    // This is the bug from the report: with a mouse, the click was being
    // swallowed by the swipe handler's pointer capture.
    await user.click(screen.getByLabelText('Bajarildi'));
    expect(container.querySelector('.taskrow')?.className).toContain('is-done');
  });

  it('switches to the Registon skin', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByLabelText('Sozlamalar'));
    await user.click(screen.getByRole('button', { name: 'Registon' }));

    expect(document.documentElement.getAttribute('data-skin')).toBe('registon');
  });

  it('groups the day by priority in advanced mode', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByLabelText('Sozlamalar'));
    await user.click(screen.getByRole('button', { name: 'Kengaytirilgan' }));
    await user.click(screen.getByText('Bugun'));

    await user.click(screen.getByLabelText('Yangi vazifa'));
    await user.type(screen.getByPlaceholderText('Nima qilasiz?'), 'Deploy');
    await user.click(screen.getByRole('button', { name: 'Shoshilinch' }));
    await user.click(screen.getByRole('button', { name: 'Saqlash' }));

    // The bucket heading appears; the timed/untimed split does not.
    expect(screen.getByText('Shoshilinch')).toBeTruthy();
    expect(screen.queryByText('Vaqtsiz')).toBeNull();
  });

  it('shows the broadcast announcement once, then not again', async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByText(/AI yordamchi keldi/)).toBeTruthy();
    await user.click(screen.getByLabelText('Yopish'));
    expect(screen.queryByText(/AI yordamchi keldi/)).toBeNull();
  });

  it('opens the assistant and asks it a real question', async () => {
    // The proxy is the only thing stubbed — everything else is the real app.
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ answer: 'Bugun 2 ta vazifa bor.' }), { status: 200 }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByText('AI yordamchi'));
    await user.type(screen.getByPlaceholderText('Savolingizni yozing…'), 'Bugun nima bor?');
    await user.click(screen.getByLabelText('Yuborish'));

    expect(await screen.findByText('Bugun 2 ta vazifa bor.')).toBeTruthy();

    // The user's tasks and today's date must actually reach the proxy —
    // otherwise it is a chatbot, not a secretary.
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/ai');
    const sent = JSON.parse(init.body as string) as { context: { bugun: unknown; ilova: unknown } };
    expect(sent.context.bugun).toBeTruthy();
    expect(sent.context.ilova).toBeTruthy();
    vi.unstubAllGlobals();
  });

  it('tells the user what to do when the assistant is unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline'); }));
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByText('AI yordamchi'));
    await user.type(screen.getByPlaceholderText('Savolingizni yozing…'), 'Salom');
    await user.click(screen.getByLabelText('Yuborish'));

    expect(await screen.findByText(/Internet yo'q/)).toBeTruthy();
    vi.unstubAllGlobals();
  });

  it('switches the completed-task style to marker', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByLabelText('Sozlamalar'));
    await user.click(screen.getByRole('button', { name: 'Marker' }));

    expect(document.documentElement.getAttribute('data-done')).toBe('marker');
  });

  it('switches to the handwriting font', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByLabelText('Sozlamalar'));
    await user.click(screen.getByRole('button', { name: "Qo'lyozma" }));

    expect(document.documentElement.getAttribute('data-font')).toBe('qolyozma');
  });

  it('offers the Tirikchilik support link', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByLabelText('Sozlamalar'));
    const link = screen.getByRole('link', { name: /Tirikchilik/ });
    expect(link.getAttribute('href')).toContain('tirikchilik.uz');
  });
});
