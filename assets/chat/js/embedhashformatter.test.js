import { EmbedHashFormatter } from './formatters';

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
    const formatter = new EmbedHashFormatter();
    expect(formatter.format(null, '', url)).toBe(expectedHash);
  });
});
