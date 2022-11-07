import ChatMenu from './ChatMenu';

export default class ChatEmoteMenu extends ChatMenu {
  constructor(ui, btn, chat) {
    super(ui, btn, chat);
    this.ui.on('click', '.emote', (e) => {
      ChatMenu.closeMenus(chat);
      this.selectEmote(e.currentTarget.innerText);
    });
    this.emoteMenuContent = this.ui.find('.content');
  }

  show() {
    if (!this.visible) {
      this.chat.input.focus();
    }
    super.show();
    this.buildEmoteMenu();
  }

  buildEmoteMenu() {
    this.emoteMenuContent.empty();

    [0, 1, 2, 3, 4].forEach((tier) => {
      const emotes = this.chat.emoteService.emotePrefixesForTier(tier);
      if (!emotes.length) return;

      const title = tier === 0 ? 'All Users' : `Tier ${tier} Subscribers`;
      this.emoteMenuContent.append(this.buildEmoteMenuSection(title, emotes));
    });

    const twitchEmotes = this.chat.emoteService.twitchEmotePrefixes;
    if (twitchEmotes.length) {
      this.emoteMenuContent.append(
        this.buildEmoteMenuSection('Twitch Subscribers', twitchEmotes)
      );
    }
  }

  buildEmoteMenuSection(title, emotes) {
    return `<div>
            <div id="emote-subscribe-note">${title}</div>
            <div class="emote-group">${emotes
              .map(this.buildEmoteItem)
              .join('')}</div>
        </div>`;
  }

  buildEmoteItem(emote) {
    return `<div class="emote-item"><span title="${emote}" class="emote ${emote}">${emote}</span></div>`;
  }

  selectEmote(emote) {
    const value = this.chat.input.val().toString().trim();
    this.chat.input
      .val(`${value + (value === '' ? '' : ' ') + emote} `)
      .focus();
  }
}
