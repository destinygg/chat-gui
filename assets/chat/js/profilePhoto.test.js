// @ts-nocheck

import profilePhotoElement from './profilePhoto';
import ChatUser from './user';

const chat = {
  config: { profilePhotos: { alien: 'https://cdn.destiny.gg/img/alien.png' } },
};

describe('profilePhotoElement', () => {
  it("shows the user's photo", () => {
    const img = profilePhotoElement(
      chat,
      new ChatUser({ nick: 'a', photo: 'alien' }),
    );

    expect(img.src).toBe('https://cdn.destiny.gg/img/alien.png');
    expect(img.classList.contains('profile-photo')).toBe(true);
    expect(img.alt).toBe('');
  });

  it.each([
    ['a name that is not an account', new ChatUser('Anonymous')],
    ['a photo chat has no URL for', new ChatUser({ nick: 'a', photo: 'new' })],
    ['no user', null],
  ])('shows nothing for %s', (_name, user) => {
    expect(profilePhotoElement(chat, user)).toBeNull();
  });

  it('shows nothing when chat was not given the photos', () => {
    const user = new ChatUser({ nick: 'a', photo: 'alien' });

    expect(profilePhotoElement({ config: {} }, user)).toBeNull();
  });
});
