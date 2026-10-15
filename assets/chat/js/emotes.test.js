import EmoteService from './emotes';
import ChatUser from './user';
import UserFeature from './features';
import UserRole from './roles';

const emote = (prefix, minimumSubTier = 0) => ({
  prefix,
  minimumSubTier,
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

describe('EmoteService.canUserUseEmote', () => {
  const service = new EmoteService();
  service.setEmotes([emote('PepeLaugh'), emote('OMEGALUL', 2)]);

  test('lets a user use emotes at or below their sub tier', () => {
    const user = new ChatUser({
      nick: 'sub',
      features: [UserFeature.SUB_TIER_2],
    });

    expect(service.canUserUseEmote(user, 'PepeLaugh')).toBe(true);
    expect(service.canUserUseEmote(user, 'OMEGALUL')).toBe(true);
  });

  test('refuses emotes above the user’s sub tier', () => {
    const user = new ChatUser('pleb');

    expect(service.canUserUseEmote(user, 'PepeLaugh')).toBe(true);
    expect(service.canUserUseEmote(user, 'OMEGALUL')).toBe(false);
  });

  test('lets a privileged user use every emote regardless of sub tier', () => {
    const user = new ChatUser({ nick: 'mod', roles: [UserRole.MODERATOR] });

    expect(service.canUserUseEmote(user, 'OMEGALUL')).toBe(true);
  });

  test('refuses text that is not an emote', () => {
    const user = new ChatUser({ nick: 'admin', roles: [UserRole.ADMIN] });

    expect(service.canUserUseEmote(user, 'NotAnEmote')).toBe(false);
  });
});
