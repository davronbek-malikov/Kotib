import { beforeEach, describe, expect, it } from 'vitest';
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

  it('shows the four Uzbek tabs from plan.md §3.6', () => {
    render(<App />);
    const nav = screen.getByRole('navigation');
    for (const label of ['Bugun', 'Taqvim', "Ro'yxatlar", 'Sozlamalar']) {
      expect(within(nav).getByText(label), `missing tab ${label}`).toBeTruthy();
    }
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

    await user.click(screen.getByText('Sozlamalar'));
    await user.click(screen.getByRole('button', { name: 'English' }));

    const nav = screen.getByRole('navigation');
    expect(within(nav).getByText('Today')).toBeTruthy();
    expect(within(nav).getByText('Calendar')).toBeTruthy();
  });

  it('applies the dark theme without a reload', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByText('Sozlamalar'));
    await user.click(screen.getByRole('button', { name: "Qorong'i" }));

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });
});
