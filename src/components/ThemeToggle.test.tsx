/** @jest-environment jsdom */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from 'next-themes';
import { LocaleProvider } from '@/i18n/LocaleContext';
import { ThemeToggle } from './ThemeToggle';

function renderToggle() {
  return render(
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <LocaleProvider>
        <ThemeToggle />
      </LocaleProvider>
    </ThemeProvider>
  );
}

beforeEach(() => {
  window.localStorage.clear();
  document.documentElement.classList.remove('dark');

  // jsdom doesn't implement matchMedia; next-themes needs it to resolve "system".
  window.matchMedia = window.matchMedia ?? ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
});

test('renders all three mode buttons', async () => {
  renderToggle();
  await waitFor(() => {
    expect(screen.getByRole('button', { name: 'Light' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Dark' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'System' })).toBeInTheDocument();
  });
});

test('selecting Dark toggles the dark class on <html>, selecting Light removes it', async () => {
  renderToggle();
  const dark = await screen.findByRole('button', { name: 'Dark' });
  const light = await screen.findByRole('button', { name: 'Light' });

  fireEvent.click(dark);
  await waitFor(() => expect(document.documentElement.classList.contains('dark')).toBe(true));
  expect(dark).toHaveAttribute('aria-pressed', 'true');

  fireEvent.click(light);
  await waitFor(() => expect(document.documentElement.classList.contains('dark')).toBe(false));
  expect(light).toHaveAttribute('aria-pressed', 'true');
});
