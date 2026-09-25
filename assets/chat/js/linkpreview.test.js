import { getImagePreviewUrl, getXPostId } from './linkpreview';

describe('getImagePreviewUrl', () => {
  it.each([
    ['https://i.imgur.com/0KFBHTB.jpg', 'https://i.imgur.com/0KFBHTB.jpg'],
    [
      'https://pbs.twimg.com/media/abc.webp?name=large',
      'https://pbs.twimg.com/media/abc.webp?name=large',
    ],
    ['https://imgur.com/0KFBHTB', 'https://i.imgur.com/0KFBHTBm.jpg'],
    ['https://m.imgur.com/0KFBHTB', 'https://i.imgur.com/0KFBHTBm.jpg'],
    ['https://i.imgur.com/0KFBHTB.gifv', 'https://i.imgur.com/0KFBHTBm.jpg'],
    [
      'https://files.catbox.moe/h06d7u.png',
      'https://files.catbox.moe/h06d7u.png',
    ],
    ['https://kappa.lol/NodsrJ.png', 'https://kappa.lol/NodsrJ.png'],
    ['https://kappa.lol/NodsrJ', 'https://kappa.lol/NodsrJ'],
    ['https://gachi.gay/NodsrJ', 'https://gachi.gay/NodsrJ'],
    ['https://femboy.beauty/ZFNKk6', 'https://femboy.beauty/ZFNKk6'],
    ['https://segs.lol/GdrAPC', 'https://segs.lol/GdrAPC'],
  ])('Should preview %s as %s', (href, expected) => {
    expect(getImagePreviewUrl(href)).toBe(expected);
  });

  it.each(['https://i.redd.it/abc123.PNG', 'https://example.com/image.png'])(
    'Should preview %s only when previewing all images',
    (href) => {
      expect(getImagePreviewUrl(href)).toBeNull();
      expect(getImagePreviewUrl(href, true)).toBe(href);
    },
  );

  it.each([
    'http://example.com/image.png',
    'https://example.com/page',
    'https://example.com/image.png.html',
    'https://imgur.com/a/abcdefg',
    'https://imgur.com/gallery/cute-dog-5eBAyD4',
    'https://segs.lol/',
    'https://kappa.lol/some/page',
    'https://example.com/GdrAPC',
    'not a url',
  ])('Should not preview %s even when previewing all images', (href) => {
    expect(getImagePreviewUrl(href, true)).toBeNull();
  });
});

describe('getXPostId', () => {
  it.each([
    ['https://x.com/jack/status/20', '20'],
    ['https://twitter.com/jack/status/20?s=20', '20'],
    [
      'https://mobile.x.com/jack/status/1585341984679469056/photo/1',
      '1585341984679469056',
    ],
  ])('Should find the post id in %s', (href, expected) => {
    expect(getXPostId(href)).toBe(expected);
  });

  it.each([
    'https://x.com/jack',
    'https://notx.com/jack/status/20',
    'https://x.com/i/lists/123',
  ])('Should not find a post id in %s', (href) => {
    expect(getXPostId(href)).toBeNull();
  });
});
