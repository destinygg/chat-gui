// @ts-nocheck

import $ from 'jquery';
import ChatUserFocus from './focus';

// Stands in for the `<style>` sheet the real chat inserts its focus rules into.
function makeSheet() {
  const cssRules = [];
  return {
    cssRules,
    insertRule: (rule, index) => cssRules.splice(index, 0, rule),
    deleteRule: (index) => cssRules.splice(index, 1),
  };
}

const OUTPUT_HTML = `
  <div id="chat-output-frame">
    <div class="msg-chat msg-user" data-username="destiny">
      <a class="user">Destiny</a>
      <span class="text">yo <span class="chat-user">Cake</span></span>
    </div>
    <div class="msg-chat msg-death" data-username="adminandy">
      <span class="text">
        AdminAndy was slain by <span class="chat-user">Cake</span>
      </span>
    </div>
    <div class="msg-chat msg-status">
      <span class="text"><span class="chat-user">Cake</span> joined</span>
    </div>
  </div>`;

function setup({ focusmentioned = false } = {}) {
  const output = $(OUTPUT_HTML);
  $(document.body).empty().append(output);

  const sheet = makeSheet();
  const chat = {
    output,
    ui: $('<div id="chat"></div>'),
    settings: new Map([['focusmentioned', focusmentioned]]),
  };
  return { focus: new ChatUserFocus(chat, sheet), sheet, output, chat };
}

// The nicks a rule set covers, in insertion order.
function focusedNicks(focus) {
  return [...focus.focused];
}

describe('ChatUserFocus.toggleElement', () => {
  it('also focuses the author of the message a mention sits in', () => {
    const { focus, output } = setup();

    focus.toggleElement(output.find('.msg-user .chat-user')[0]);

    expect(focusedNicks(focus)).toEqual(['destiny', 'cake']);
  });

  it('focuses the author of an event message a mention sits in', () => {
    const { focus, output } = setup();

    // `.msg-death` carries `data-username` but is not a `.msg-user`, which used
    // to leave the author lookup empty and insert a rule matching nothing.
    focus.toggleElement(output.find('.msg-death .chat-user')[0]);

    expect(focusedNicks(focus)).toEqual(['adminandy', 'cake']);
  });

  it('unfocuses cleanly when the message has no author to focus', () => {
    const { focus, output, chat } = setup();
    const mention = output.find('.msg-status .chat-user')[0];

    focus.toggleElement(mention);
    expect(focusedNicks(focus)).toEqual(['cake']);

    focus.toggleElement(mention);
    expect(focusedNicks(focus)).toEqual([]);
    expect(focus.isFocused()).toBe(false);
    expect(chat.ui.hasClass('focus')).toBe(false);
  });

  it('leaves the author alone when focusmentioned is on', () => {
    const { focus, output } = setup({ focusmentioned: true });

    focus.toggleElement(output.find('.msg-user .chat-user')[0]);

    expect(focusedNicks(focus)).toEqual(['cake']);
  });
});

describe('ChatUserFocus.toggleFocus', () => {
  it('ignores a missing nick or flair rather than inserting a dead rule', () => {
    const { focus, sheet } = setup();

    focus.toggleFocus(undefined);
    focus.toggleFocus(null, true);
    focus.toggleFocus('');

    expect(focusedNicks(focus)).toEqual([]);
    expect(sheet.cssRules).toEqual([]);
    expect(focus.isFocused()).toBe(false);
  });

  it('toggles a nick on and off, keeping the sheet in step', () => {
    const { focus, sheet } = setup();

    focus.toggleFocus('Destiny');
    expect(focusedNicks(focus)).toEqual(['destiny']);
    expect(sheet.cssRules).toHaveLength(1);
    expect(focus.isFocusedOn('DESTINY')).toBe(true);

    focus.toggleFocus('Destiny');
    expect(focusedNicks(focus)).toEqual([]);
    expect(sheet.cssRules).toEqual([]);
  });

  it('only adds when onlyAdd is set', () => {
    const { focus } = setup();

    focus.toggleFocus('destiny', false, true);
    focus.toggleFocus('destiny', false, true);

    expect(focusedNicks(focus)).toEqual(['destiny']);
  });
});
