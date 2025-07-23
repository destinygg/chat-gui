import $ from 'jquery';
import moment from 'moment';
import { MessageBuilder } from '../messages';
import ChatUser from '../user';
import ChatMenuFloating from './ChatMenuFloating';

export default class ChatUserInfoMenu extends ChatMenuFloating {
  constructor(ui, btn, chat) {
    super(ui, btn, chat, ui.find('.toolbar'));

    this.clickedNick = '';
    this.messageArray = [];

    this.header = this.ui.find('.toolbar span');

    this.watchingSubheader = this.ui.find(
      '.user-info h5.watching-subheader',
    )[0];

    this.createdDateSubheader = this.ui.find('.user-info h5.date-subheader')[0];

    this.tagSubheader = this.ui.find('.user-info h5.tag-subheader')[0];

    this.flairList = this.ui.find('.user-info .flairs');
    this.flairSubheader = this.ui.find('.user-info h5.flairs-subheader')[0];

    this.messagesList = this.ui.find('.user-info .stalk');
    this.messagesContainer = this.ui.find('.content');

    this.muteUserBtn = this.ui.find('#mute-user-btn');
    this.banUserBtn = this.ui.find('#ban-user-btn');
    this.logsUserBtn = this.ui.find('#logs-user-btn');
    this.whisperUserBtn = this.ui.find('#whisper-user-btn');
    this.ignoreUserBtn = this.ui.find('#ignore-user-btn');
    this.unignoreUserBtn = this.ui.find('#unignore-user-btn');
    this.rustleUserBtn = this.ui.find('#rustle-user-btn');

    this.actionInputs = this.ui.find('#action-durations');
    this.muteDurations = ['1m', '10m', '1h', '1d'];
    this.banDurations = ['1d', '7d', '30d', 'Perm'];

    this.configureButtons();

    this.chat.output.on('contextmenu', '.msg-chat .user', (e) => {
      // If the target has this class, it's a sub tier label styled to match the
      // username color of the sub (which requires the `user` class).
      if (e.currentTarget.classList.contains('tier')) {
        return false;
      }

      const message = $(e.currentTarget).closest('.msg-chat');
      this.showUser(e, message);

      // gotta return false so that the actual context menu doesn't show up
      return false;
    });

    // preventing the window from closing instantly
    this.chat.output.on('mouseup', '.msg-chat .user', (e) => {
      e.stopPropagation();
    });
  }

  showUser(e, message) {
    this.clickedNick = e.currentTarget.innerText.toLowerCase();

    this.setActionsVisibility();
    this.addContent(message);

    this.position(e);
    this.show();
  }

  configureButtons() {
    this.muteUserBtn.on('click', () => {
      if (this.chat.user.hasModPowers()) {
        if (this.muteUserBtn.hasClass('active')) {
          this.setInputVisibility();
        } else {
          this.setInputVisibility('mute');
        }
      }
    });

    this.banUserBtn.on('click', () => {
      if (this.chat.user.hasModPowers()) {
        if (this.banUserBtn.hasClass('active')) {
          this.setInputVisibility();
        } else {
          this.setInputVisibility('ban');
        }
      }
    });

    this.muteDurations.forEach((duration) =>
      this.createDurationButtons(duration, 'mute'),
    );

    this.banDurations.forEach((duration) =>
      this.createDurationButtons(duration, 'ban'),
    );

    this.whisperUserBtn.on('click', () => {
      const win = this.chat.getWindow(this.clickedNick);
      if (win) {
        this.chat.windowToFront(this.clickedNick);
      } else {
        if (!this.chat.whispers.has(this.clickedNick)) {
          this.chat.whispers.set(this.clickedNick, {
            nick: this.clickedNick,
            unread: 0,
            open: false,
          });
        }
        this.chat.openConversation(this.clickedNick);
      }
      this.hide();
    });

    this.logsUserBtn.on('click', () => {
      this.chat.cmdSTALK([this.clickedNick]);
      this.hide();
    });

    this.ignoreUserBtn.on('click', () => {
      this.chat.ignore(this.clickedNick, true);
      this.chat.removeMessageByNick(this.clickedNick);
      MessageBuilder.status(`Ignoring ${this.clickedNick}`).into(this.chat);
      this.hide();
    });

    this.unignoreUserBtn.on('click', () => {
      this.chat.ignore(this.clickedNick, false);
      MessageBuilder.status(
        `${this.clickedNick} has been removed from your ignore list`,
      ).into(this.chat);
      this.hide();
    });
  }

  setActionsVisibility() {
    if (this.chat.user.hasModPowers()) {
      this.muteUserBtn.toggleClass('hidden', false);
      this.banUserBtn.toggleClass('hidden', false);
    } else {
      this.muteUserBtn.toggleClass('hidden', true);
      this.banUserBtn.toggleClass('hidden', true);
    }

    this.actionInputs.addClass('hidden');
    this.banUserBtn.removeClass('active');
    this.muteUserBtn.removeClass('active');

    if (this.chat.ignoring.has(this.clickedNick.toLowerCase())) {
      this.ignoreUserBtn.toggleClass('hidden', true);
      this.unignoreUserBtn.toggleClass('hidden', false);
    } else {
      this.ignoreUserBtn.toggleClass('hidden', false);
      this.unignoreUserBtn.toggleClass('hidden', true);
    }

    this.rustleUserBtn.attr(
      'href',
      `https://rustlesearch.dev/?username=${encodeURIComponent(this.clickedNick)}`,
    );
  }

  setInputVisibility(button) {
    this.actionInputs.removeClass('hidden');
    this.banUserBtn.removeClass('active');
    this.muteUserBtn.removeClass('active');
    switch (button) {
      case 'ban':
        this.banUserBtn.addClass('active');
        $('.ban-duration-button').toggleClass('hidden', false);
        $('.mute-duration-button').toggleClass('hidden', true);

        this.actionInputs.data('type', button);
        break;
      case 'mute':
        this.muteUserBtn.addClass('active');
        $('.mute-duration-button').toggleClass('hidden', false);
        $('.ban-duration-button').toggleClass('hidden', true);

        this.actionInputs.data('type', button);
        break;
      default:
        this.actionInputs.addClass('hidden');
        break;
    }
  }

  createDurationButtons(duration, button) {
    const durationButton = document.createElement('a');
    durationButton.classList.add('chat-tool-btn');
    switch (button) {
      case 'ban':
        durationButton.classList.add('ban-duration-button');
        break;
      case 'mute':
        durationButton.classList.add('mute-duration-button');
        break;
      default:
        break;
    }
    durationButton.textContent = duration;

    durationButton.addEventListener('click', () =>
      this.processMuteOrBan(duration),
    );

    this.actionInputs.append(durationButton);
  }

  processMuteOrBan(providedDuration) {
    switch (this.actionInputs.data('type')) {
      case 'ban':
        this.chat.cmdBAN(
          [
            this.clickedNick,
            providedDuration,
            `${this.clickedNick} banned by ${this.chat.user.displayName}.`,
          ],
          'IPBAN',
        );
        break;
      case 'mute':
        this.chat.cmdMUTE([this.clickedNick, providedDuration]);
        break;
      default:
        break;
    }
    this.hide();
  }

  addContent(message) {
    // Don't display messages if the giftee was clicked in a gift sub event
    // because the message belongs to the gifter.
    this.messageArray =
      message[0].querySelector('.text') &&
      this.clickedNick !== message.data('giftee')
        ? [message]
        : [];

    const selectedUser = [...message[0].querySelectorAll('.user')].find(
      (user) => user.innerText.toLowerCase() === this.clickedNick.toLowerCase(),
    );
    const displayName = selectedUser.innerText;
    const tagNote = this.chat.taggednotes.get(this.clickedNick);
    const usernameFeatures = selectedUser.classList.value;

    const watchingEmbed = this.buildWatchingEmbed(this.clickedNick);
    if (watchingEmbed !== '') {
      this.watchingSubheader.style.display = '';
      this.watchingSubheader.replaceChildren('Watching: ', watchingEmbed);
    } else {
      this.watchingSubheader.style.display = 'none';
      this.watchingSubheader.replaceChildren();
    }

    const formattedDate = this.buildCreatedDate(this.clickedNick);
    if (formattedDate) {
      this.createdDateSubheader.style.display = '';
      this.createdDateSubheader.replaceChildren('Joined on ', formattedDate);
    } else {
      this.createdDateSubheader.style.display = 'none';
      this.createdDateSubheader.replaceChildren(
        'Unable to display account creation date',
      );
    }

    if (tagNote) {
      this.tagSubheader.style.display = '';
      this.tagSubheader.replaceChildren('Tag: ', tagNote);
    } else {
      this.tagSubheader.style.display = 'none';
      this.tagSubheader.replaceChildren();
    }

    const featuresList = this.buildFeatures(this.clickedNick, usernameFeatures);
    if (featuresList) {
      this.flairList.toggleClass('hidden', false);
      this.flairSubheader.style.display = '';
    } else {
      this.flairList.toggleClass('hidden', true);
      this.flairSubheader.style.display = 'none';
    }

    this.header.text('');
    this.header.attr('class', 'username');
    this.messagesContainer.empty();
    this.flairList.empty();

    this.header.text(displayName);
    this.header.addClass(usernameFeatures);
    this.flairList.append(featuresList);

    this.messagesContainer.text('Loading messages...');

    this.createMessages(displayName)
      .then((messageList) => {
        if (messageList.length === 0) {
          this.messagesContainer.text('No messages');
        } else {
          this.messagesContainer.empty();
          messageList.forEach((element) => {
            this.messagesContainer.prepend(element);
          });
        }
      })
      .catch((error) => {
        this.messagesContainer.text(
          `Failed to load messages: ${error.message}`,
        );
      })
      .finally(() => {
        this.redraw();
        this.scrollplugin.scrollBottom();
      });
  }

  buildWatchingEmbed(nick) {
    const user = this.chat.users.get(nick);
    if (!user?.watching) {
      return '';
    }
    return `${user.watching.id} on ${user.watching.platform}`;
  }

  buildCreatedDate(nick) {
    const user = this.chat.users.get(nick.toLowerCase());
    if (!user?.createdDate) {
      return '';
    }
    const timeHTML = document.createElement('time');
    timeHTML.className = 'time';
    timeHTML.textContent = moment(user.createdDate).format(
      'Do MMMM, YYYY h:mm a',
    );
    timeHTML.setAttribute('datetime', user.createdDate);
    return timeHTML;
  }

  buildFeatures(nick, messageFeatures) {
    const user = this.chat.users.get(nick);
    const messageFeaturesArray = messageFeatures
      .split(' ')
      .filter((e) => e !== 'user' && e !== 'subscriber');
    const features =
      user !== undefined
        ? this.buildFeatureHTML(
            user.features.filter((e) => e !== 'subscriber') || [],
          )
        : this.buildFeatureHTML(messageFeaturesArray);
    return features !== '' ? `<span class="features">${features}</span>` : '';
  }

  async createMessages(nick) {
    const displayedMessages = [];

    const userMessages =
      await this.chat.userMessageService.getUserMessages(nick);

    userMessages.forEach((userMessage) => {
      // Create a new `ChatUser` to remove username styles for a cleaner look.
      const msg = MessageBuilder.message(
        userMessage.messageText,
        new ChatUser(userMessage.username),
        userMessage.timestamp,
      );
      displayedMessages.push(msg.html(this.chat));
    });

    return displayedMessages;
  }

  buildFeatureHTML(featureArray) {
    return featureArray
      .filter((e) => this.chat.flairsMap.has(e))
      .map((e) => this.chat.flairsMap.get(e))
      .reduce((str, e) => {
        if (e.hidden !== true) {
          return `${str}<i class="flair ${e.name}" title="${e.label}"></i> `;
        }
        return `${str}<div class="flair" title="${e.label}">${e.label}</div> `;
      }, '');
  }
}
