import EmoteService from './emotes';

const emote = (prefix, minimumSubTier = 0) => ({
  prefix,
  minimumSubTier,
  twitch: false,
});

describe('EmoteService.setEmotes', () => {
  test('replaces the previous emotes when called again', () => {
    const service = new EmoteService();
    service.setEmotes([emote('PepeLaugh'), emote('OMEGALUL', 2)]);

    service.setEmotes([emote('PepeLaugh', 1), emote('Kappa')]);

    expect(service.hasEmote('OMEGALUL')).toBe(false);
    expect(service.hasEmote('Kappa')).toBe(true);
    expect(service.getEmote('PepeLaugh').minimumSubTier).toBe(1);
    expect(service.tiers).toEqual([0, 1]);
  });
});
