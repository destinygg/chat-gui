import HashLinkConverter from './hashlinkconverter';

describe('Valid embeds', () => {
  test.each([
    ['Twitch stream', 'twitch.tv/xqc', '#twitch/xqc'],
    [
      'Twitch VoD',
      'www.twitch.tv/videos/174256129?filter=archives&sort=views',
      '#twitch-vod/174256129',
    ],
    [
      'Twitch clip 1',
      'https://www.twitch.tv/trainwreckstv/clip/ObeseFrigidBibimbapTBTacoLeft?filter=clips&range=all&sort=time',
      '#twitch-clip/ObeseFrigidBibimbapTBTacoLeft',
    ],
    [
      'Twitch clip 2',
      'https://clips.twitch.tv/SingleHilariousRamenPunchTrees-NR0pJT1Lec5Q9E8p',
      '#twitch-clip/SingleHilariousRamenPunchTrees-NR0pJT1Lec5Q9E8p',
    ],
    [
      'Youtube video',
      'https://www.youtube.com/watch?v=tZ_gn0E87Qo',
      '#youtube/tZ_gn0E87Qo',
    ],
    [
      'Youtube video shortened link',
      'https://youtu.be/dPmLveKE_wY',
      '#youtube/dPmLveKE_wY',
    ],
    [
      'Youtube live stream shareable link',
      'https://www.youtube.com/live/jfKfPfyJRdk?feature=share',
      '#youtube/jfKfPfyJRdk',
    ],
    [
      'Rumble embed',
      'https://rumble.com/embed/v26pcdc/?pub=4',
      '#rumble/v26pcdc',
    ],
  ])('%s', (_, url, expectedHash) => {
    const hasher = new HashLinkConverter();
    expect(hasher.convert(url)).toBe(expectedHash);
  });
});

const errors = {
  invalidLink: 'Invalid link',
  badRumble:
    'Rumble links have to be embed links - https://rumble.com/embed/<id>',
};

describe('Invalid embeds', () => {
  test.each([
    ['Bad twitch link', 'witch.tv/xqc', errors.invalidLink],
    [
      'Rumble non-embed link',
      'https://rumble.com/v29b9py-mirror-2023-02-13.html',
      errors.badRumble,
    ],
    [
      'Sussy fake youtube link',
      'https://www.yoütübe.com/watch?v=0EqSXDwTq6U',
      errors.invalidLink,
    ],
  ])('%s', (_, url, expectedError) => {
    const hasher = new HashLinkConverter();
    try {
      hasher.convert(url);
      expect(true).toBe(false);
    } catch (error) {
      expect(error.message).toBe(expectedError);
    }
  });
});
