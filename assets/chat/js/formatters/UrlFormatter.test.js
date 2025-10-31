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

  test('Remove the share tracking query param from a youtube.com link', () => {
    expect(
      urlFormatter.normalizeUrl(
        'https://www.youtube.com/live/2NjXXQYtUNY?si=5ALpT28ptRec6T7u&t=70',
      ),
    ).toBe('https://www.youtube.com/live/2NjXXQYtUNY?t=70');
  });

  test('Remove the share tracking query param from a youtu.be link', () => {
    expect(
      urlFormatter.normalizeUrl(
        'https://youtu.be/SbPP1i6INPk?si=K0qpdHBGOIJ-gBMK&t=60',
      ),
    ).toBe('https://youtu.be/SbPP1i6INPk?t=60');
  });

  test("Don't modify a youtube.com link that doesn't contain the share tracking query param", () => {
    expect(
      urlFormatter.normalizeUrl(
        'https://www.youtube.com/live/2NjXXQYtUNY?t=70',
      ),
    ).toBe('https://www.youtube.com/live/2NjXXQYtUNY?t=70');
  });

  test("Don't modify a youtu.be link that doesn't contain the share tracking query param", () => {
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
