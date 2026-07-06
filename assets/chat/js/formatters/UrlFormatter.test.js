import UrlFormatter from './UrlFormatter';

const urlFormatter = new UrlFormatter();

describe('Normalizing URLs', () => {
  test('Remove the query string from a tweet URL', () => {
    expect(
      urlFormatter.normalizeUrl('https://twitter.com/jack/status/20?lang=en'),
    ).toBe('https://twitter.com/jack/status/20');
  });

  test('Remove the query string from a xeet URL', () => {
    expect(
      urlFormatter.normalizeUrl('https://x.com/jack/status/20?lang=en'),
    ).toBe('https://x.com/jack/status/20');
  });

  test("Don't modify a URL to a tweet that doesn't contain a query string", () => {
    expect(urlFormatter.normalizeUrl('https://x.com/jack/status/20')).toBe(
      'https://x.com/jack/status/20',
    );
  });

  test('Remove the `si` share tracking query param from a youtube.com link', () => {
    expect(
      urlFormatter.normalizeUrl(
        'https://www.youtube.com/live/2NjXXQYtUNY?si=5ALpT28ptRec6T7u&t=70',
      ),
    ).toBe('https://www.youtube.com/live/2NjXXQYtUNY?t=70');
  });

  test('Remove the `si` share tracking query param from a youtu.be link', () => {
    expect(
      urlFormatter.normalizeUrl(
        'https://youtu.be/SbPP1i6INPk?si=K0qpdHBGOIJ-gBMK&t=60',
      ),
    ).toBe('https://youtu.be/SbPP1i6INPk?t=60');
  });

  test('Remove the `is` share tracking query param from a youtube.com link', () => {
    expect(
      urlFormatter.normalizeUrl(
        'https://www.youtube.com/live/2NjXXQYtUNY?is=5ALpT28ptRec6T7u&t=70',
      ),
    ).toBe('https://www.youtube.com/live/2NjXXQYtUNY?t=70');
  });

  test('Remove the `is` share tracking query param from a youtu.be link', () => {
    expect(
      urlFormatter.normalizeUrl(
        'https://youtu.be/SbPP1i6INPk?is=K0qpdHBGOIJ-gBMK&t=60',
      ),
    ).toBe('https://youtu.be/SbPP1i6INPk?t=60');
  });

  test("Don't modify a youtube.com link that doesn't contain the share tracking query params", () => {
    expect(
      urlFormatter.normalizeUrl(
        'https://www.youtube.com/live/2NjXXQYtUNY?t=70',
      ),
    ).toBe('https://www.youtube.com/live/2NjXXQYtUNY?t=70');
  });

  test("Don't modify a youtu.be link that doesn't contain any of the share tracking query params", () => {
    expect(urlFormatter.normalizeUrl('https://youtu.be/SbPP1i6INPk?t=60')).toBe(
      'https://youtu.be/SbPP1i6INPk?t=60',
    );
  });

  test('Remove the share tracking query param from a instagram.com link', () => {
    expect(
      urlFormatter.normalizeUrl(
        'https://www.instagram.com/reel/DMv28huPlan?igsh=cW93Y2FheGtxMmJi',
      ),
    ).toBe('https://www.instagram.com/reel/DMv28huPlan');
  });

  test("Don't modify a instagram.com link that doesn't contain the share tracking query param", () => {
    expect(
      urlFormatter.normalizeUrl('https://www.instagram.com/reel/DMv28huPlan'),
    ).toBe('https://www.instagram.com/reel/DMv28huPlan');
  });

  test("Don't modify a URL that isn't Twitter, X, YouTube or Instagram", () => {
    expect(
      urlFormatter.normalizeUrl('https://www.twitch.tv/search?term=vtuber'),
    ).toBe('https://www.twitch.tv/search?term=vtuber');
  });
});

describe('Escaping rendered links (XSS prevention)', () => {
  // Minimal chat stub covering everything UrlFormatter.format() touches.
  const chat = {
    settings: new Map(),
    config: { dggOrigin: 'https://www.destiny.gg' },
    bigscreenPath: '/bigscreen',
    isBigscreenEmbed: () => false,
  };

  // Mirrors how chat renders a message: text is HTML-escaped first, then the
  // escaped string is passed to UrlFormatter (which runs it through linkify).
  function htmlEscape(str) {
    const el = document.createElement('div');
    el.textContent = str;
    return el.innerHTML;
  }

  function render(rawMessage) {
    return urlFormatter.format(chat, htmlEscape(rawMessage));
  }

  test('does not let a URL break out of the href attribute', () => {
    const output = render('http://x.com/"onmouseover=alert(1)//');
    // The stray double quote must be encoded so it stays inside href=""...
    expect(output).toContain('&quot;onmouseover=alert(1)//');
    // ...and must never appear as a bare event-handler attribute.
    expect(output).not.toMatch(/["']\s+onmouseover=/i);
  });

  test('does not let link text break out of the anchor element', () => {
    const output = render('http://x.com/</a><img src=x onerror=alert(1)>');
    // No real closing tag / injected element may survive in the link text.
    expect(output).not.toContain('</a><img');
    expect(output).not.toContain('<img');
    expect(output).toContain('&lt;img');
  });

  test('escapes angle brackets injected via link text', () => {
    const output = render('http://x.com/<svg/onload=alert(1)>');
    expect(output).not.toContain('<svg');
    expect(output).toContain('&lt;svg');
  });

  test('renders a normal URL as a working anchor', () => {
    const output = render('check http://x.com/page out');
    expect(output).toContain('<a');
    expect(output).toContain('href="http://x.com/page"');
    expect(output).toContain('class="externallink"');
  });
});
