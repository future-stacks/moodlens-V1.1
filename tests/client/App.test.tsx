// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App';
import { KEYS, loadCheckIns } from '../../src/lib/storage';
import { buildLibraryIntervention } from '../../shared/library';

function mockFetch(handler: (body: any) => unknown) {
  const fn = vi.fn(async (_url: string, init?: RequestInit) => {
    const result = handler(JSON.parse(String(init?.body ?? '{}')));
    if (result instanceof Error) throw result;
    return new Response(JSON.stringify(result), { status: 200, headers: { 'Content-Type': 'application/json' } });
  });
  vi.stubGlobal('fetch', fn);
  return fn;
}

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem(KEYS.onboarding, 'true');
  vi.unstubAllGlobals();
});

describe('core journey: check in -> understand -> thought -> action -> reflect', () => {
  it('works end to end and records the check-in', async () => {
    const user = userEvent.setup();
    const fetchMock = mockFetch((body) => ({ kind: 'intervention', intervention: buildLibraryIntervention(body) }));
    render(<App />);

    expect(screen.getByText(/No check-ins yet this week/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Overwhelmed/ }));
    await user.click(screen.getByRole('button', { name: /Add a little context/ }));
    await user.click(screen.getByRole('radio', { name: 'Low' }));
    await user.click(screen.getByRole('button', { name: 'Too many tasks' }));
    await user.click(screen.getByRole('button', { name: /Find my next step/ }));

    // Understand + thought + action
    expect(await screen.findByRole('heading', { name: /competing for your attention/ })).toBeInTheDocument();
    expect(screen.getByText('A MoodLens reflection')).toBeInTheDocument();
    expect(screen.getByText('Your next step')).toBeInTheDocument();
    expect(fetchMock.mock.calls[0][1]?.body).toContain('"contributors":["too-many-tasks"]');

    // Choose the smaller alternative and complete it
    await user.click(screen.getByRole('button', { name: /Show me something smaller/ }));
    expect(screen.getByText('A smaller step')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /I did it/ }));

    // Reflect
    expect(await screen.findByRole('heading', { name: 'You took a step.' })).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: 'Yes' }));
    await user.click(screen.getByRole('radio', { name: 'A bit better' }));
    await user.click(screen.getByRole('button', { name: 'Save and finish' }));

    expect(await screen.findByText('You checked in once this week.')).toBeInTheDocument();
    const [saved] = loadCheckIns();
    expect(saved).toMatchObject({ mood: 'overwhelmed', energy: 2, actionChoice: 'alternative', feedback: 'helpful', feltAfter: 'better' });
  });

  it('still gives a complete thought and action when the server is unreachable', async () => {
    const user = userEvent.setup();
    mockFetch(() => new TypeError('Failed to fetch'));
    render(<App />);

    await user.click(screen.getByRole('button', { name: /Tired/ }));
    await user.click(screen.getByRole('button', { name: /Find my next step/ }));

    expect(await screen.findByText('Your next step')).toBeInTheDocument();
    expect(screen.getByText(/built-in library/)).toBeInTheDocument();
    expect(screen.queryByText('undefined')).not.toBeInTheDocument();
  });

  it('never renders an incomplete AI response', async () => {
    const user = userEvent.setup();
    mockFetch(() => ({ kind: 'intervention', intervention: { action: { title: 'Half a response' } } }));
    render(<App />);

    await user.click(screen.getByRole('button', { name: /Anxious/ }));
    await user.click(screen.getByRole('button', { name: /Find my next step/ }));

    expect(await screen.findByText('Your next step')).toBeInTheDocument();
    expect(screen.queryByText('Half a response')).not.toBeInTheDocument();
  });

  it('offers something different after "This isn\'t helpful" and avoids it next time', async () => {
    const user = userEvent.setup();
    const fetchMock = mockFetch((body) => ({ kind: 'intervention', intervention: buildLibraryIntervention(body) }));
    render(<App />);

    await user.click(screen.getByRole('button', { name: /Stressed/ }));
    await user.click(screen.getByRole('button', { name: /Find my next step/ }));
    const first = buildLibraryIntervention({ mood: 'stressed' }).action.title;
    expect(await screen.findByText(first)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /This isn't helpful/ }));
    await waitFor(() => expect(screen.queryByText(first)).not.toBeInTheDocument());
    expect(loadCheckIns()[0].notHelpful).toEqual([first]);
    expect(loadCheckIns()).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: /Start over/ }));
    await user.click(await screen.findByRole('button', { name: /Stressed/ }));
    await user.click(screen.getByRole('button', { name: /Find my next step/ }));
    await screen.findByText('Your next step');
    expect(JSON.parse(String(fetchMock.mock.calls.at(-1)![1]!.body)).exclude).toContain(first);
  });
});

describe('safeguarding in the UI', () => {
  it('shows support resources instead of a quote and action, without sending the text anywhere', async () => {
    const user = userEvent.setup();
    const fetchMock = mockFetch(() => ({}));
    render(<App />);

    await user.type(screen.getByLabelText(/own words/), 'I want to end my life');
    await user.click(screen.getByRole('button', { name: /Find my next step/ }));

    expect(await screen.findByRole('heading', { name: /really hard right now/ })).toBeInTheDocument();
    expect(screen.getByText(/Samaritans/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Call 999/ })).toHaveAttribute('href', 'tel:999');
    expect(screen.queryByText('Your next step')).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(loadCheckIns()).toHaveLength(0);
  });
});

describe('legacy data', () => {
  it('removes plaintext passwords left by V1.1 on load', async () => {
    localStorage.setItem('moodlens_users', JSON.stringify({ alice: 'pw' }));
    render(<App />);
    await waitFor(() => expect(localStorage.getItem('moodlens_users')).toBeNull());
  });
});

describe('privacy controls', () => {
  it('sends nothing to the server when AI suggestions are turned off', async () => {
    const user = userEvent.setup();
    const fetchMock = mockFetch(() => ({}));
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Settings' }));
    const toggle = screen.getByRole('switch', { name: /Personalise with Google Gemini/ });
    expect(toggle).toHaveAttribute('aria-checked', 'true');
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-checked', 'false');
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /Lonely/ }));
    await user.click(screen.getByRole('button', { name: /Find my next step/ }));
    expect(await screen.findByText('Your next step')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('deletes all local data after confirmation', async () => {
    const user = userEvent.setup();
    localStorage.setItem('moodlens_history', JSON.stringify([{ id: 'l1', mood: 'sad', action: 'Walk', timestamp: new Date().toISOString() }]));
    render(<App />);
    expect(await screen.findByText('You checked in once this week.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Settings' }));
    await user.click(screen.getByRole('button', { name: /Delete all my data/ }));
    await user.click(screen.getByRole('button', { name: 'Delete everything' }));

    expect(loadCheckIns()).toHaveLength(0);
    expect(localStorage.getItem('moodlens_history')).toBeNull();
    expect(screen.getByText(/No check-ins yet this week/)).toBeInTheDocument();
  });
});

describe('history and insights', () => {
  it('lists past check-ins with the thought and action, and summarises them descriptively', async () => {
    const user = userEvent.setup();
    mockFetch((body) => ({ kind: 'intervention', intervention: buildLibraryIntervention(body) }));
    render(<App />);

    await user.click(screen.getByRole('button', { name: /Anxious/ }));
    await user.click(screen.getByRole('button', { name: /Find my next step/ }));
    await user.click(await screen.findByRole('button', { name: /I did it/ }));
    await user.click(await screen.findByRole('radio', { name: 'Yes' }));
    await user.click(screen.getByRole('button', { name: 'Save and finish' }));

    await user.click(await screen.findByRole('button', { name: 'History' }));
    const dialog = screen.getByRole('dialog', { name: 'Your check-ins' });
    const expected = buildLibraryIntervention({ mood: 'anxious' });
    expect(dialog).toHaveTextContent(expected.action.title);
    expect(dialog).toHaveTextContent(expected.quote.text);
    expect(dialog).toHaveTextContent('Helped');
    await user.keyboard('{Escape}');

    await user.click(screen.getByRole('button', { name: 'Insights' }));
    const insights = await screen.findByRole('dialog', { name: 'Insights' });
    expect(insights).toHaveTextContent('1 check-in');
    expect(insights).toHaveTextContent(expected.action.title);
    expect(insights).toHaveTextContent(/not a diagnosis/);
  });
});
