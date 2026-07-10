import MentionedUserFormatter from './MentionedUserFormatter';

const formatter = new MentionedUserFormatter();

// Mirrors how chat renders a message: text is HTML-escaped first, then the
// escaped string is passed to the formatter.
function htmlEscape(str) {
  const el = document.createElement('div');
  el.textContent = str;
  return el.innerHTML;
}

function render(rawMessage, mentioned = []) {
  return formatter.format({}, htmlEscape(rawMessage), { mentioned });
}

describe('MentionedUserFormatter', () => {
  it('wraps an @token for a user who is not connected', () => {
    expect(render('hi @josidjfosd')).toBe(
      'hi @<span class="chat-user">josidjfosd</span>',
    );
  });

  it('keeps the @ outside the span', () => {
    expect(render('@Destiny')).toBe('@<span class="chat-user">Destiny</span>');
  });

  it('wraps a bare (no-@) mention of a connected user', () => {
    expect(render('hey Destiny', ['Destiny'])).toBe(
      'hey <span class="chat-user">Destiny</span>',
    );
  });

  it('wraps a connected @mention exactly once', () => {
    expect(render('yo @Destiny', ['Destiny'])).toBe(
      'yo @<span class="chat-user">Destiny</span>',
    );
  });

  it('keeps trailing punctuation outside the span', () => {
    expect(render('ping @Nick.')).toBe(
      'ping @<span class="chat-user">Nick</span>.',
    );
  });

  it('does not wrap an email address', () => {
    expect(render('mail me@example.com please')).toBe(
      'mail me@example.com please',
    );
  });

  it('does not wrap tokens shorter than 3 characters', () => {
    expect(render('yo @ab')).toBe('yo @ab');
  });

  it('does not corrupt an existing link or wrap an @handle inside a URL', () => {
    // Simulates the string the formatter receives after the URL formatter has
    // already linkified a URL containing an @handle.
    const input =
      'see <a class="externallink" href="https://x.com/@dev">https://x.com/@dev</a> @josidjfosd';

    const out = formatter.format({}, input, { mentioned: [] });

    // The in-URL @dev is untouched (href + link text intact)...
    expect(out).toContain('href="https://x.com/@dev"');
    expect(out).toContain('>https://x.com/@dev</a>');
    // ...and only the trailing standalone @token is wrapped.
    expect(out).toContain('@<span class="chat-user">josidjfosd</span>');
    expect(out).not.toContain('>dev</span>');
  });
});
