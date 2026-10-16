// @ts-nocheck

import { readFileSync } from 'fs';
import { resolve } from 'path';
import MessageBuilder from './MessageBuilder';
import ChatUser from '../user';

const chat = {
  flairs: [],
  user: new ChatUser('Viewer'),
  config: { profilePhotos: { alien: 'https://cdn.destiny.gg/img/alien.png' } },
};

const donor = { id: 1, nick: 'Gunt_Guru', photo: 'alien' };

const event = { data: '', timestamp: 1711503299208, uuid: 'abc' };

/** The photo in front of the event's info, if it has one. */
function photoOf(message) {
  const photo = message.html(chat).querySelector('.event-top .profile-photo');
  if (photo) {
    expect(photo.nextElementSibling.classList.contains('event-info')).toBe(
      true,
    );
  }
  return photo;
}

beforeAll(() => {
  document.body.innerHTML = readFileSync(
    resolve(__dirname, '../../../views/templates.html'),
    'utf8',
  );
});

describe('event photos', () => {
  it.each([
    [
      'a donation',
      () => MessageBuilder.donation({ ...event, user: donor, amount: 500 }),
    ],
    [
      'a subscription',
      () => MessageBuilder.subscription({ ...event, user: donor, tier: 1 }),
    ],
    [
      'a gifted subscription',
      () =>
        MessageBuilder.gift({
          ...event,
          user: donor,
          tier: 1,
          recipient: { id: 2, nick: 'Giftee', photo: 'buddy' },
        }),
    ],
    [
      'a mass gift',
      () =>
        MessageBuilder.massgift({
          ...event,
          user: donor,
          tier: 1,
          quantity: 5,
        }),
    ],
  ])("shows the user's photo on %s", (_name, build) => {
    expect(photoOf(build()).src).toBe('https://cdn.destiny.gg/img/alien.png');
  });

  it('shows no photo for an anonymous donation', () => {
    const message = MessageBuilder.donation({
      ...event,
      user: { nick: 'Anonymous' },
      amount: 500,
    });

    expect(photoOf(message)).toBeNull();
  });

  // A broadcast names who sent it, but is about what it says.
  it('shows no photo on a broadcast', () => {
    const message = MessageBuilder.broadcast(
      'hello',
      new ChatUser(donor),
      'abc',
    );

    expect(message.showsPhoto).toBe(false);
  });
});
