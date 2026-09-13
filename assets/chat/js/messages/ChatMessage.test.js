// @ts-nocheck

import { readFileSync } from 'fs';
import { resolve } from 'path';
import ChatMessage, { messageHash } from './ChatMessage';

// These vectors pin the message-identity recipe, which the Go server
// reimplements as `SpotlightKey` in `chat/events/spotlight.go` to name the
// message a moderator spotlighted. If the two drift, a spotlight silently does
// nothing for everyone except the moderator who sent it.
//
// The same literals are asserted in `chat/events/spotlight_test.go` —
// change one, change both.
describe('messageHash', () => {
  it.each([
    [
      'plain',
      1711503299208,
      1,
      'hello chat',
      'b3fdc84db6a7432f67d9ebed8d194ac9',
    ],
    // A leading `/me ` is part of the hashed text: `ChatMessage.message` keeps
    // the prefix, and the server hashes what it was sent.
    [
      'slash me',
      1711503299208,
      42,
      '/me waves',
      'eeae6abf753feaaa585a5b83448be067',
    ],
    // Multi-byte text must hash as UTF-8 on both sides.
    [
      'unicode and emote code',
      1700000000000,
      7,
      'PepeLaugh ✨ café',
      '698851ab8f92e78580a9dab4a85a5568',
    ],
  ])('matches the server for %s', (_name, timestamp, userId, message, want) => {
    expect(messageHash(timestamp, userId, message)).toBe(want);
  });

  it('treats a missing user id as empty, matching the dedupe hash', () => {
    expect(messageHash(1711503299208, undefined, 'system line')).toBe(
      messageHash(1711503299208, '', 'system line'),
    );
  });
});

// The rendered shape of a user message: everything ahead of `.text` is header
// material, which is what the frame splits on.
const FLAT_HTML =
  '<time class="time">19:15</time> <span class="features"></span> ' +
  '<a class="user">Destiny</a><span class="ctrl">: </span> ' +
  '<span class="text">hello chat</span>';

function renderedMessage() {
  const message = new ChatMessage('hello chat');
  message.ui = document.createElement('div');
  message.ui.className = 'msg-chat msg-user';
  message.ui.innerHTML = FLAT_HTML;
  return message;
}

describe('setSpotlight', () => {
  it('rebuilds the message as an event card', () => {
    const message = renderedMessage();

    message.setSpotlight('abc123');

    const { ui } = message;
    expect(ui.classList.contains('msg-spotlighted')).toBe(true);
    expect(ui.dataset.spotlightKey).toBe('abc123');

    const info = ui.querySelector('.event-top .event-info');
    expect(info.querySelector('time')).not.toBeNull();
    expect(info.querySelector('.user').textContent).toBe('Destiny');
    expect(info.querySelector('.text')).toBeNull();

    expect(ui.querySelector('.event-top .event-icon.spotlight')).not.toBeNull();
    expect(ui.querySelector('.event-bottom .text').textContent).toBe(
      'hello chat',
    );
  });

  it('restores the flat message when the spotlight is cleared', () => {
    const message = renderedMessage();

    message.setSpotlight('abc123');
    message.setSpotlight(null);

    expect(message.ui.classList.contains('msg-spotlighted')).toBe(false);
    expect(message.ui.dataset.spotlightKey).toBeUndefined();
    expect(message.ui.querySelector('.event-wrapper')).toBeNull();
    expect(message.ui.innerHTML).toBe(FLAT_HTML);
  });

  // The reconcile re-asserts rather than diffing, so this runs more than once
  // for the same message.
  it('does not build a second frame when re-asserted', () => {
    const message = renderedMessage();

    message.setSpotlight('abc123');
    message.setSpotlight('abc123');

    expect(message.ui.querySelectorAll('.event-wrapper')).toHaveLength(1);
    expect(message.ui.querySelectorAll('.event-icon')).toHaveLength(1);
  });

  // Messages keep the mutators that operate on a rendered message working,
  // because the frame moves the existing nodes rather than rebuilding them.
  it('keeps the nodes other mutators look for reachable', () => {
    const message = renderedMessage();

    message.setSpotlight('abc123');

    expect(message.ui.querySelector('.ctrl')).not.toBeNull();
    expect(message.ui.querySelector('time')).not.toBeNull();
    expect(message.ui.querySelector('.user')).not.toBeNull();
  });

  // The action trigger is rendered into the message, so it sits among the
  // nodes the frame is built from. It belongs to the message rather than to
  // its content, and is positioned against it — swept into the header it would
  // land in the wrong place and move with the wrong thing.
  it('leaves the action trigger where it is', () => {
    const message = renderedMessage();
    const button = document.createElement('button');
    button.className = 'message-actions-trigger';
    message.ui.append(button);

    message.setSpotlight('abc123');

    expect(button.parentElement).toBe(message.ui);
    expect(
      message.ui.querySelector('.event-info .message-actions-trigger'),
    ).toBeNull();
    expect(
      message.ui.querySelector('.event-bottom .message-actions-trigger'),
    ).toBeNull();

    message.setSpotlight(null);
    expect(button.parentElement).toBe(message.ui);
  });

  // A highlight is a background on the row, and the card built above paints
  // over the whole row. Only the stylesheet decides whether it shows through,
  // and jsdom never loads it, so the rule is read directly.
  it('has a stylesheet rule that keeps a highlight visible through the card', () => {
    const scss = readFileSync(
      resolve(__dirname, '../../css/messages/modifiers/_spotlight.scss'),
      'utf8',
    );

    expect(scss).toMatch(
      /&\.msg-highlight\s*\{[\s\S]*?\.event-bottom\s*\{[^{}]*background-color:\s*transparent/,
    );
  });

  it("leaves an event message's own frame alone", () => {
    const message = new ChatMessage('donated');
    message.ui = document.createElement('div');
    message.ui.className = 'msg-chat msg-donation msg-event';
    message.ui.innerHTML =
      '<div class="event-wrapper"><div class="event-top"></div>' +
      '<div class="event-bottom">donated</div></div>';
    const original = message.ui.innerHTML;

    message.setSpotlight('abc123');
    expect(message.ui.innerHTML).toBe(original);

    message.setSpotlight(null);
    expect(message.ui.innerHTML).toBe(original);
  });
});
