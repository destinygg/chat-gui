import $ from 'jquery';
import ChatMenu from './ChatMenu';
import { MessageBuilder } from '../messages';
import ChatUser from '../user';

export default class ChatUserInfoMenu extends ChatMenu {
  constructor(ui, btn, chat) {
    super(ui, btn, chat);

    this.clickedNick = '';
    this.messageArray = [];

    this.header = this.ui.find('.toolbar span');

    this.flairList = this.ui.find('.user-info .flairs');
    [this.flairSubheader] = this.ui.find('.user-info h5');

    this.messagesContainer = this.ui.find('.content');
    [, this.messagesSubheader] = this.ui.find('.user-info h5');

    this.muteUserBtn = this.ui.find('#mute-user-btn');
    this.banUserBtn = this.ui.find('#ban-user-btn');
    this.logsUserBtn = this.ui.find('#logs-user-btn');
    this.whisperUserBtn = this.ui.find('#whisper-user-btn');
    this.ignoreUserBtn = this.ui.find('#ignore-user-btn');

    this.actionInputs = this.ui.find('#action-durations');
    this.muteDurations = ['1m', '10m', '1h', '1d'];
    this.banDurations = ['1d', '7d', '30d', 'Perm'];

    this.configureButtons();

    this.chat.output.on('contextmenu', '.msg-user .user', (e) => {
      const user = $(e.currentTarget).closest('.msg-user');
      this.clickedNick = user.data('username');

      this.setActionsVisibility();
      this.addContent(user);

      const rect = this.chat.output[0].getBoundingClientRect();
      // calculating floating window location (if it doesn't fit on screen, adjusting it a bit so it does)
      const x =
        this.ui.width() + e.clientX > rect.width
          ? e.clientX - rect.left + (rect.width - (this.ui.width() + e.clientX))
          : e.clientX - rect.left;
      const y =
        this.ui.height() + e.clientY > rect.height
          ? e.clientY -
            rect.top +
            (rect.height - (this.ui.height() + e.clientY)) -
            12
          : e.clientY - rect.top - 12;

      this.ui[0].style.left = `${x}px`;
      this.ui[0].style.top = `${y}px`;

      super.show();

      // gotta return false so that the actual context menu doesn't show up
      return false;
    });

    // preventing the window from closing instantly
    this.chat.output.on('mouseup', '.msg-user .user', (e) => {
      e.stopPropagation();
    });
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
      this.createDurationButtons(duration, 'mute')
    );

    this.banDurations.forEach((duration) =>
      this.createDurationButtons(duration, 'ban')
    );

    this.whisperUserBtn.on('click', () => {
      const win = this.chat.getWindow(this.clickedNick);
      if (win !== (null || undefined)) {
        this.chat.windowToFront(this.clickedNick);
      } else {
        if (!this.chat.whispers.has(this.clickedNick))
          this.chat.whispers.set(this.clickedNick, {
            nick: this.clickedNick,
            unread: 0,
            open: false,
          });
        this.chat.openConversation(this.clickedNick);
      }
      super.hide();
    });

    this.logsUserBtn.on('click', () => {
      this.chat.cmdSTALK([this.clickedNick]);
      super.hide();
    });

    this.ignoreUserBtn.on('click', () => {
      this.chat.ignore(this.clickedNick, true);
      this.chat.removeMessageByNick(this.clickedNick);
      MessageBuilder.status(`Ignoring ${this.clickedNick}`).into(this.chat);
      super.hide();
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
      this.processMuteOrBan(duration)
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
            `${this.clickedNick} banned by ${this.chat.user.nick}.`,
          ],
          'IPBAN'
        );
        break;
      case 'mute':
        this.chat.cmdMUTE([this.clickedNick, providedDuration]);
        break;
      default:
        break;
    }
    super.hide();
  }

  addContent(message) {
    this.messageArray = [message];

    const prettyNick = message.find('.user')[0].text;
    const nick = message.data('username');
    const usernameFeatures = message.find('.user')[0].attributes.class.value;

    const featuresList = this.buildFeatures(nick, usernameFeatures);
    if (featuresList === '') {
      this.flairList.toggleClass('hidden', true);
      this.flairSubheader.style.display = 'none';
    } else {
      this.flairList.toggleClass('hidden', false);
      this.flairSubheader.style.display = '';
    }

    const messageList = this.createMessages();
    if (messageList.length === 1) {
      this.messagesSubheader.innerText = 'Selected message:';
    } else {
      this.messagesSubheader.innerText = 'Selected messages:';
    }

    this.header.text('');
    this.header.attr('class', 'username');
    this.messagesContainer.empty();
    this.flairList.empty();

    this.header.text(prettyNick);
    this.header.addClass(usernameFeatures);
    this.flairList.append(featuresList);
    messageList.forEach((element) => {
      this.messagesContainer.append(element);
    });

    super.redraw();
  }

  buildFeatures(nick, messageFeatures) {
    const user = this.chat.users.get(nick);
    const messageFeaturesArray = messageFeatures
      .split(' ')
      .filter((e) => e !== 'user' && e !== 'subscriber');
    const features =
      user !== undefined
        ? this.buildFeatureHTML(
            user.features.filter((e) => e !== 'subscriber') || []
          )
        : this.buildFeatureHTML(messageFeaturesArray);
    return features !== '' ? `<span class="features">${features}</span>` : '';
  }

  createMessages() {
    const displayedMessages = [];
    if (this.messageArray.length > 0) {
      let nextMsg = this.messageArray[0].next('.msg-continue');
      while (nextMsg.length > 0) {
        this.messageArray.push(nextMsg);
        nextMsg = nextMsg.next('.msg-continue');
      }
      this.messageArray.forEach((element) => {
        const text = element.find('.text')[0].innerText;
        const nick = element.data('username');
        const msg = MessageBuilder.message(text, new ChatUser(nick));
        displayedMessages.push(msg.html(this.chat));
      });
    } else {
      const msg = MessageBuilder.error(
        "Wasn't able to grab the clicked message"
      );
      displayedMessages.push(msg.html(this.chat));
    }
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
