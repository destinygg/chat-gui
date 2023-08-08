import {
  HashLinkConverter,
  RUMBLE_EMBED_ERROR,
  INVALID_LINK_ERROR,
  MISSING_VIDEO_ID_ERROR,
  MISSING_ARG_ERROR,
} from './hashlinkconverter';

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
      'Youtube live stream shareable link - and _',
      'https://www.youtube.com/live/EHs-_2ddcUQ?feature=share',
      '#youtube/EHs-_2ddcUQ',
    ],
    [
      'Rumble embed',
      'https://rumble.com/embed/v26pcdc/?pub=4',
      '#rumble/v26pcdc',
    ],
  ])('%s', (_, url, expectedHashLink) => {
    const hlc = new HashLinkConverter();
    expect(hlc.convert(url)).toBe(expectedHashLink);
  });
});

describe('Invalid embeds', () => {
  test.each([
    ['Bad twitch link', 'witch.tv/xqc', INVALID_LINK_ERROR],
    [
      'Rumble non-embed link',
      'https://rumble.com/v29b9py-mirror-2023-02-13.html',
      RUMBLE_EMBED_ERROR,
    ],
    [
      'Youtube link missing video id parameter',
      'https://www.youtube.com/tZ_gn0E87Qo',
      MISSING_VIDEO_ID_ERROR,
    ],
    [
      'No arguments were giving after the command',
      undefined,
      MISSING_ARG_ERROR,
    ],
  ])('%s', (_, url, expectedError) => {
    const hlc = new HashLinkConverter();
    expect(() => hlc.convert(url)).toThrow(expectedError);
  });
});
