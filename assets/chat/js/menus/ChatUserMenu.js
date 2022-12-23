import $ from 'jquery';
import { debounce } from 'throttle-debounce';
import ChatMenu from './ChatMenu';

// sections in order.
const UserMenuSections = [
  { name: 'Admin', flairs: ['admin'] },
  { name: 'Moderator', flairs: ['moderator'] },
  { name: 'Broadcaster', flairs: ['flair12'] },
  { name: 'Vip', flairs: ['vip'] },
  { name: 'Trusted User', flairs: ['flair4'] },
  { name: 'Contributor', flairs: ['flair5', 'flair16'] }, // Contributor & Emote Contributor.
  { name: 'Subscriber Tier 5', flairs: ['flair42'] },
  { name: 'Subscriber Tier 4', flairs: ['flair8'] },
  { name: 'Subscriber Tier 3', flairs: ['flair3'] },
  { name: 'Subscriber Tier 2', flairs: ['flair1'] },
  { name: 'Subscriber Tier 1', flairs: ['flair13'] },
  { name: 'User', flairs: [] }, // KEEP (where all other users go).
  { name: 'Bot', flairs: ['bot', 'flair11'], force: true }, // Bot && Community Bot
];

function userComparator(a, b) {
  const u1 = this.chat.users.get(a.getAttribute('data-username').toLowerCase());
  const u2 = this.chat.users.get(b.getAttribute('data-username').toLowerCase());
  if (!u1 || !u2) return 0;

  const u1Nick = u1.nick.toLowerCase();
  const u2Nick = u2.nick.toLowerCase();
  if (u1Nick < u2Nick) return -1;
  if (u1Nick > u2Nick) return 1;
  return 0;
}

export default class ChatUserMenu extends ChatMenu {
  constructor(ui, btn, chat) {
    super(ui, btn, chat);
    this.searchterm = '';
    this.searchcount = 0;
    this.totalcount = 0;
    this.flairSection = new Map();
    this.sections = new Map();
    this.header = this.ui.find('h5 span');
    this.container = this.ui.find('.content:first');
    this.searchinput = this.ui.find(
      '#chat-user-list-search .form-control:first'
    );
    this.container.on('click', '.user-entry', (e) =>
      this.chat.userfocus.toggleFocus(
        e.currentTarget.getAttribute('data-username')
      )
    );
    this.container.on('click', '.flair', (e) =>
      this.chat.userfocus.toggleFocus(e.target.getAttribute('data-flair'), true)
    );
    this.container.on('click', '.mention-nick', (e) => {
      ChatMenu.closeMenus(this.chat);
      const value = this.chat.input.val().toString().trim();
      const username = $(e.target).parent().parent().data('username');
      this.chat.input
        .val(`${value + (value === '' ? '' : ' ') + username} `)
        .focus();
      return false;
    });
    this.container.on('click', '.whisper-nick', (e) => {
      ChatMenu.closeMenus(this.chat);
      const value = this.chat.input.val().toString().trim();
      const username = $(e.target).parent().parent().data('username');
      this.chat.input.val(`/whisper ${username} ${value}`).focus();
      return false;
    });
    this.container.on('contextmenu', '.users .user', (e) => {
      const userinfo = this.chat.menus.get('user-info');
      if (userinfo) {
        const user = $(e.currentTarget).closest('.user');
        userinfo.showUser(e, user, true);
        return false;
      }
      return true;
    });
    this.chat.source.on('JOIN', (data) => this.addAndRedraw(data.nick));
    this.chat.source.on('QUIT', (data) => this.removeAndRedraw(data.nick));
    this.chat.source.on('NAMES', () => this.addAll());
    this.searchinput.on(
      'keyup',
      debounce(100, false, () => {
        this.searchterm = this.searchinput.val();
        this.filter();
        this.redraw();
      })
    );
  }

  show() {
    super.show();
    this.searchinput.focus();
  }

  redraw() {
    if (this.visible) {
      const searching = this.searchterm.length > 0;
      if (searching && this.totalcount !== this.searchcount) {
        this.header.text(
          `Users (${this.searchcount} out of ${this.totalcount})`
        );
        [...this.sections.values()].forEach((section) => {
          $(section.title).html(
            `${section.searchcount} out of ${section.users.children.length} ${
              section.data.name
            }${
              section.users.children.length === 1 ? '' : 's'
            }${this.buildFeatures(section.data.flairs)}`
          );
          if (section.searchcount === 0) $(section.container).hide();
          else $(section.container).show();
        });
      } else {
        this.header.text(`Users (${this.totalcount})`);
        [...this.sections.values()].forEach((section) => {
          $(section.title).html(
            `${section.users.children.length} ${section.data.name}${
              section.users.children.length === 1 ? '' : 's'
            }${this.buildFeatures(section.data.flairs)}`
          );
          if (section.users.children.length === 0) $(section.container).hide();
          else $(section.container).show();
        });
      }
      this.ui.toggleClass('search-in', searching);
    }
    super.redraw();
  }

  buildFeatures(flairs) {
    const features = flairs
      .filter((e) => this.chat.flairsMap.has(e))
      .map((e) => this.chat.flairsMap.get(e))
      .sort((a, b) => a.priority - b.priority)
      .reduce(
        (str, e) =>
          `${str}<i data-flair="${e.name}" class="flair ${e.name}" title="${e.label}"></i> `,
        ''
      );
    return features !== '' ? `<span class="features">${features}</span>` : '';
  }

  addAll() {
    this.totalcount = 0;
    this.container.empty();
    this.sections = new Map();
    this.flairSection = new Map();
    UserMenuSections.forEach((data) => {
      this.addSection(data);
      [...data.flairs].forEach((flair) =>
        this.flairSection.set(flair, data.name)
      );
    });
    [...this.chat.users.keys()].forEach((username) =>
      this.addElement(username)
    );
    this.sort();
    this.filter();
    this.redraw();
  }

  addAndRedraw(username) {
    if (!this.hasElement(username)) {
      this.addElement(username, true);
      this.filter();
      this.redraw();
    }
  }

  removeAndRedraw(username) {
    if (this.hasElement(username)) {
      this.removeElement(username);
      this.redraw();
    }
  }

  highestSection(user) {
    const flairs = [...this.flairSection.keys()];
    if (flairs.length > 0) {
      let lowestIndex = flairs.length + 1;
      for (let j = 0; j < user.features.length; j++) {
        const index = flairs.indexOf(user.features[j]);
        if (index >= 0) {
          // force to stay in lower section even if it has a higher flair (Bots).
          if (
            this.sections.get(this.flairSection.get(flairs[index])).data.force
          ) {
            lowestIndex = index;
            break;
          }

          if (index < lowestIndex) lowestIndex = index;
        }
      }
      return lowestIndex > flairs.length
        ? 'User'
        : this.flairSection.get(flairs[lowestIndex]);
    }
    return 'User';
  }

  addSection(data) {
    const section = $(
      `<div class="section" data-section="${data.name}"><p class="title">${data.name}</p><div class="users"></div></div>`
    );
    this.sections.set(data.name, {
      data,
      searchcount: 0,
      container: section[0],
      title: section[0].children[0],
      users: section[0].children[1],
    });
    this.container.append(section);
  }

  removeElement(username) {
    this.container.find(`.user-entry[data-username="${username}"]`).remove();
    this.totalcount -= 1;
  }

  addElement(username, sort = false) {
    const user = this.chat.users.get(username.toLowerCase());
    const label =
      !user.username || user.username === '' ? 'Anonymous' : user.username;
    const features =
      user.features.length === 0 ? 'nofeature' : user.features.join(' ');
    const usr = $(
      `<div class="user-entry" data-username="${user.username}"><span class="user ${features}">${label}</span><div class="user-actions"><i class="mention-nick"></i><i class="whisper-nick"></i></div></div>`
    );
    const section = this.sections.get(this.highestSection(user));

    if (sort && section.users.children.length > 0) {
      // Insert item in the correct order (instead of resorting the entire list)
      const items = section.users.children;
      let min = 0;
      let max = items.length;
      let index = Math.floor((min + max) / 2);
      while (max > min) {
        if (userComparator.apply(this, [usr[0], items[index]]) < 0) max = index;
        else min = index + 1;
        index = Math.floor((min + max) / 2);
      }
      if (index - 1 < 0) usr.insertBefore(items[0]);
      else usr.insertAfter(items[index - 1]);
    } else {
      section.users.append(usr[0]);
    }
    this.totalcount += 1;
  }

  hasElement(username) {
    return (
      this.container.find(`.user-entry[data-username="${username}"]`).length > 0
    );
  }

  filter() {
    this.searchcount = 0;
    if (this.searchterm && this.searchterm.length > 0) {
      [...this.sections.values()].forEach((section) => {
        section.searchcount = 0;
        [...$(section.users.children)].forEach((user) => {
          const found =
            user
              .getAttribute('data-username')
              .toLowerCase()
              .indexOf(this.searchterm.toLowerCase()) >= 0;
          $(user).toggleClass('found', found);
          if (found) {
            section.searchcount += 1;
            this.searchcount += 1;
          }
        });
      });
    } else {
      this.container.children('.user-entry').removeClass('found');
    }
  }

  sort() {
    [...this.sections.values()].forEach((section) => {
      [...$(section.users.children).sort(userComparator.bind(this))].forEach(
        (a) => a.parentNode.appendChild(a)
      );
    });
  }
}
