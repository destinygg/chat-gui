// @ts-nocheck

// The scroll plugin pulls in a CSS import that jest can't parse, and this menu
// never uses it in these tests (no `.scrollable` in the fixture). Stub it so the
// import chain stays JS-only.
jest.mock('../scroll', () => ({ __esModule: true, default: class {} }));

import $ from 'jquery';
import ChatUserInfoMenu from './ChatUserInfoMenu';
import ChatUser from '../user';

// A minimal `.user-info` subtree containing the subheader rows that
// `renderUserDetails` reads. `.scrollable` is intentionally omitted so the base
// menu skips building a scroll plugin.
const MENU_HTML = `
  <div id="chat-user-info">
    <div class="toolbar"><span></span></div>
    <div class="user-info">
      <h5 class="watching-subheader"></h5>
      <h5 class="date-subheader"></h5>
      <h5 class="age-subheader"></h5>
      <h5 class="gender-subheader"></h5>
      <h5 class="bio-subheader"></h5>
      <h5 class="flairs-subheader"></h5>
      <div class="flairs"></div>
    </div>
  </div>`;

function makeMenu() {
  const ui = $(MENU_HTML);
  const chat = {
    output: { on: () => {} },
    source: { on: () => {} },
    user: { hasModPowers: () => false },
    config: { dggOrigin: 'https://www.destiny.gg' },
    bigscreenPath: '/bigscreen',
    isBigscreenEmbed: () => false,
    isDesktop: false,
    flairsMap: new Map(),
  };
  const menu = new ChatUserInfoMenu(ui, $('<div></div>'), chat);
  return { menu, ui };
}

describe('ChatUserInfoMenu.renderUserDetails', () => {
  it('renders age, gender, and bio with mapped labels when set', () => {
    const { menu, ui } = makeMenu();

    menu.renderUserDetails(
      new ChatUser({
        nick: 'Destiny',
        gender: 'nonbinary',
        age: '18-24',
        bio: 'gaming <b>weow</b>',
      }),
      '',
    );

    const age = ui.find('h5.age-subheader')[0];
    const gender = ui.find('h5.gender-subheader')[0];
    const bio = ui.find('h5.bio-subheader')[0];

    expect(age.style.display).toBe('');
    expect(age.textContent).toBe('Age: 18-24');
    expect(gender.style.display).toBe('');
    expect(gender.textContent).toBe('Gender: Nonbinary');
    // Bio is rendered as a text node, so markup is shown literally, not parsed.
    expect(bio.style.display).toBe('');
    expect(bio.textContent).toBe('Bio: gaming <b>weow</b>');
    expect(bio.querySelector('b')).toBeNull();
  });

  it('hides each row when its field is unset', () => {
    const { menu, ui } = makeMenu();

    menu.renderUserDetails(new ChatUser({ nick: 'Blank' }), '');

    expect(ui.find('h5.age-subheader')[0].style.display).toBe('none');
    expect(ui.find('h5.gender-subheader')[0].style.display).toBe('none');
    expect(ui.find('h5.bio-subheader')[0].style.display).toBe('none');
  });

  it('falls back to the raw value for an unknown gender/age', () => {
    const { menu, ui } = makeMenu();

    menu.renderUserDetails(
      new ChatUser({ nick: 'Future', gender: 'agender', age: '65+' }),
      '',
    );

    expect(ui.find('h5.gender-subheader')[0].textContent).toBe(
      'Gender: agender',
    );
    expect(ui.find('h5.age-subheader')[0].textContent).toBe('Age: 65+');
  });
});
