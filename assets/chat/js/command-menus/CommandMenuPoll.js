import $ from 'jquery';
import CommandMenu from './CommandMenu';

class CommandMenuPoll extends CommandMenu {
  constructor(ui, chat) {
    super(ui, chat);

    this.ui.question = this.ui.find('#command-menu-poll-question');

    this.ui.add = this.ui.find('#command-menu-poll-add');
    this.ui.answers = this.ui.find('#command-menu-poll-answers');
    this.ui.answers.options = [];

    this.ui.time = this.ui.find('#command-menu-poll-time');
    this.ui.weighted = this.ui.find('#command-menu-poll-sub-weighted');

    this.ui.submit.on('click touch', () => this.submit());
    this.ui.add.on('click touch', () => this.addAnswer());

    this.ui.answers.on(
      'click touch',
      '.command-menu-poll-answer .command-menu-poll-answer-remove',
      (e) => {
        e.target.closest('.command-menu-poll-answer').remove();
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

    super.submit('STARTPOLL', {
      weighted: this.weighted,
      time: this.time,
      question: this.question,
      options: this.options,
    });
  }

  addAnswer() {
    this.buildOptionHtml('', this.options.length).insertBefore(
      this.ui.add.closest('.command-menu__section__row'),
    );
  }

  buildOptionHtml(option, index) {
    return $(`<div class="command-menu__section__row command-menu-poll-answer">
      <span>${index + 1}:</span>
      <input class="command-menu__input" type="text" placeholder="YEE" value="${option}" required>
      <button class="command-menu__button command-menu__button--danger command-menu-poll-answer-remove">X</button>
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
      .find('.command-menu-poll-answer input')
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
    this.ui.answers.children('.command-menu-poll-answer').remove();
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

export default CommandMenuPoll;
