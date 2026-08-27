// @ts-nocheck

import { messageHash } from './ChatMessage';

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
