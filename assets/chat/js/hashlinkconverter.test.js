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
      'Youtube video with timestamp',
      'https://www.youtube.com/watch?v=tZ_gn0E87Qo&t=5',
      '#youtube/tZ_gn0E87Qo?t=5',
    ],
    [
      'Youtube video shortened link with timestamp',
      'https://youtu.be/dPmLveKE_wY?t=5',
      '#youtube/dPmLveKE_wY?t=5',
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
      'Youtube live stream link with timestamp',
      'https://www.youtube.com/live/XstSLjhzKX8?t=11447',
      '#youtube/XstSLjhzKX8?t=11447',
    ],
    [
      'Youtube shorts link',
      'https://youtube.com/shorts/Bg1JpTqc0iA?si=7pzY1RnY2fEe9A8_',
      '#youtube/Bg1JpTqc0iA',
    ],
    [
      'Youtube shorts link with timestamp',
      'https://www.youtube.com/shorts/Bg1JpTqc0iA?t=4&feature=share',
      '#youtube/Bg1JpTqc0iA?t=4',
    ],
    [
      'Youtube embed link',
      'https://www.youtube.com/embed/Akala8bkIu8',
      '#youtube/Akala8bkIu8',
    ],
    [
      'Youtube embed link timestamp',
      'https://www.youtube.com/embed/Akala8bkIu8?t=5',
      '#youtube/Akala8bkIu8?t=5',
    ],
    [
      'Rumble embed',
      'https://rumble.com/embed/v26pcdc/?pub=4',
      '#rumble/v26pcdc',
    ],
    ['Kick stream link', 'https://kick.com/destiny', '#kick/destiny'],
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
      'Kick VOD link',
      'https://kick.com/video/d353657d-f6c5-40c0-9df2-645aadda1e66',
      INVALID_LINK_ERROR,
    ],
    [
      'Kick clip link',
      'https://kick.com/destiny?clip=clip_01H96SPCHRV0E2X8Y670CGXTS4',
      INVALID_LINK_ERROR,
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
