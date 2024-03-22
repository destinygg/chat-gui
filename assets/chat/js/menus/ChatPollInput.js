import $ from 'jquery';
import ChatMenu from './ChatMenu';

class ChatPollInput extends ChatMenu {
  constructor(ui, btn, chat) {
    super(ui, btn, chat);

    this.ui.send = this.ui.find('.chat-poll-input-button-send');
    this.ui.add = this.ui.find('.chat-poll-input-button-add');
    this.ui.question = this.ui.find('.chat-poll-input-question');
    this.ui.answers = this.ui.find('.chat-poll-input-answers');
    this.ui.answers.options = [];
    this.ui.time = this.ui.find('.chat-poll-input-time');
    this.ui.weighted = this.ui.find('.chat-poll-input-weighted');

    this.ui.send.on('click touch', () => this.send());
    this.ui.add.on('click touch', () => this.addAnswer());

    this.ui.answers.on(
      'click touch',
      '.chat-poll-input-answer .chat-poll-input-button-remove',
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
  }

  send() {
    if (this.question === '') return;
    if (this.options.includes('')) return;
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
      this.ui.add.closest('.chat-poll-input-row'),
    );
  }

  buildOptionHtml(option, index) {
    return $(`<div class="chat-poll-input-row chat-poll-input-answer">
      <span>${index + 1}:</span>
      <input type="text" placeholder="YEE" value="${option}">
      <button class="chat-poll-input-button chat-poll-input-button-remove">X</button>
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
    if (options.length === 0) options = ['', ''];
    else if (options.length === 1) options.push('');

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
