import $ from 'jquery';
import ChatMenu from './ChatMenu';

class ChatPollInput extends ChatMenu {
  constructor(ui, btn, chat) {
    super(ui, btn, chat);

    this.ui.question = this.ui.find('#chat-poll-input-question');

    this.ui.add = this.ui.find('#chat-poll-input-add');
    this.ui.answers = this.ui.find('#chat-poll-input-answers');
    this.ui.answers.options = [];

    this.ui.time = this.ui.find('#chat-poll-input-time');
    this.ui.weighted = this.ui.find('#chat-poll-input-sub-weighted');

    this.ui.submit = this.ui.find('#chat-poll-input-submit');
    this.ui.cancel = this.ui.find('#chat-poll-input-cancel');

    this.ui.submit.on('click touch', () => this.submit());
    this.ui.cancel.on('click touch', () => this.hide());
    this.ui.add.on('click touch', () => this.addAnswer());

    this.ui.answers.on(
      'click touch',
      '.chat-poll-input-answer .chat-poll-input-answer-remove',
      (e) => {
        e.target.closest('.chat-poll-input-answer').remove();
        this.drawOptions(this.options);
      },
    );
  }

  show(question, options, time, weighted) {
    this.weighted = weighted;
    this.question = question;
    this.options = options;
    this.time = time;

    super.show();

    this.ui.question.focus();
  }

  submit() {
    if (this.question === '') {
      return;
    }
    if (this.options.includes('')) {
      return;
    }
    if (this.time < 5000 || this.time > 600000) {
      this.ui.time.val('');
      return;
    }

    this.hide();
    this.chat.source.send('STARTPOLL', {
      weighted: this.weighted,
      time: this.time,
      question: this.question,
      options: this.options,
    });
  }

  addAnswer() {
    this.buildOptionHtml('', this.options.length).insertBefore(
      this.ui.add.closest('.command-input-menu__content__section__row'),
    );
  }

  buildOptionHtml(option, index) {
    return $(`<div class="command-input-menu__content__section__row chat-poll-input-answer">
      <span>${index + 1}:</span>
      <input class="command-input-menu__input" type="text" placeholder="YEE" value="${option}" required>
      <button class="command-input-menu__button command-input-menu__button--danger chat-poll-input-answer-remove">X</button>
    </div>`);
  }

  get question() {
    return this.ui.question.val();
  }

  set question(question) {
    this.ui.question.val(question);
  }

  get options() {
    const options = [];
    this.ui.answers
      .find('.chat-poll-input-answer input')
      .each((_, input) => options.push(input.value));
    return options;
  }

  set options(rawOptions) {
    let options = rawOptions;
    // always have at least two options.
    if (options.length === 0) {
      options = ['', ''];
    } else if (options.length === 1) {
      options.push('');
    }

    this.drawOptions(options);
  }

  drawOptions(options) {
    this.ui.answers.options = options.map((option, index) =>
      this.buildOptionHtml(option, index),
    );
    this.ui.answers.children('.chat-poll-input-answer').remove();
    this.ui.answers.prepend(this.ui.answers.options);
  }

  get time() {
    return this.ui.time.val() * 1000;
  }

  set time(time) {
    this.ui.time.val(time / 1000);
  }

  get weighted() {
    return this.ui.weighted[0].checked;
  }

  set weighted(weighted) {
    this.ui.weighted.attr('checked', weighted);
  }
}

export default ChatPollInput;
