import UrlFormatter from './UrlFormatter';

const urlFormatter = new UrlFormatter();

describe('Normalizing URLs', () => {
  test('Remove the query string from a tweet URL', () => {
    expect(
      urlFormatter.normalizeUrl('https://twitter.com/jack/status/20?lang=en')
    ).toBe('https://twitter.com/jack/status/20');
  });

  test('Remove the query string from a xeet URL', () => {
    expect(
      urlFormatter.normalizeUrl('https://x.com/jack/status/20?lang=en')
    ).toBe('https://x.com/jack/status/20');
  });

  test("Don't modify a URL to a tweet that doesn't contain a query string", () => {
    expect(urlFormatter.normalizeUrl('https://x.com/jack/status/20')).toBe(
      'https://x.com/jack/status/20'
    );
  });

  test("Don't modify a URL that isn't Twitter or X", () => {
    expect(
      urlFormatter.normalizeUrl('https://www.twitch.tv/search?term=vtuber')
    ).toBe('https://www.twitch.tv/search?term=vtuber');
  });
});
