import UrlFormatter from './UrlFormatter';

describe('Normalizing URLs', () => {
  test('Remove the query string from a tweet URL', () => {
    expect(
      UrlFormatter.untrackX('https://twitter.com/jack/status/20?lang=en'),
    ).toBe('https://twitter.com/jack/status/20');
  });

  test('Remove the query string from a xeet URL', () => {
    expect(UrlFormatter.untrackX('https://x.com/jack/status/20?lang=en')).toBe(
      'https://x.com/jack/status/20',
    );
  });

  test("Don't modify a URL to a tweet that doesn't contain a query string", () => {
    expect(UrlFormatter.untrackX('https://x.com/jack/status/20')).toBe(
      'https://x.com/jack/status/20',
    );
  });

  test('Remove the share tracking query param from a youtube.com link', () => {
    expect(
      UrlFormatter.untrackYouTube(
        'https://www.youtube.com/live/2NjXXQYtUNY?si=5ALpT28ptRec6T7u&t=70',
      ),
    ).toBe('https://www.youtube.com/live/2NjXXQYtUNY?t=70');
  });

  test('Remove the share tracking query param from a youtu.be link', () => {
    expect(
      UrlFormatter.untrackYouTube(
        'https://youtu.be/SbPP1i6INPk?si=K0qpdHBGOIJ-gBMK&t=60',
      ),
    ).toBe('https://youtu.be/SbPP1i6INPk?t=60');
  });

  test("Don't modify a youtube.com link that doesn't contain the share tracking query param", () => {
    expect(
      UrlFormatter.untrackYouTube(
        'https://www.youtube.com/live/2NjXXQYtUNY?t=70',
      ),
    ).toBe('https://www.youtube.com/live/2NjXXQYtUNY?t=70');
  });

  test("Don't modify a youtu.be link that doesn't contain the share tracking query param", () => {
    expect(
      UrlFormatter.untrackYouTube('https://youtu.be/SbPP1i6INPk?t=60'),
    ).toBe('https://youtu.be/SbPP1i6INPk?t=60');
  });

  test("Don't modify a URL that isn't Twitter, X or YouTube", () => {
    expect(
      UrlFormatter.untrackYouTube('https://www.twitch.tv/search?term=vtuber'),
    ).toBe('https://www.twitch.tv/search?term=vtuber');
  });
});
