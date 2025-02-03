import { Icons } from '../icons';
import CommandMenu from './CommandMenu';

class CommandMenuPoll extends CommandMenu {
  constructor(ui, chat) {
    super(ui, chat);

    this.ui.question = this.ui.find('#command-menu-poll-question');
    this.ui.question.input = this.ui.find('#command-menu-poll-question input');

    this.ui.add = this.ui.find('#command-menu-poll-add');
    this.ui.answers = this.ui.find('#command-menu-poll-answers');
    this.ui.answers.options = [];

    this.ui.time = this.ui.find('#command-menu-poll-time');
    this.ui.time.input = this.ui.find('#command-menu-poll-time input');
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
    this.question = question;
    this.options = options;
    this.time = time;
    this.weighted = weighted;

    super.show();

    this.ui.question.input.focus();
  }

  validate() {
    let valid = true;

    this.ui.question[0].classList.toggle('input--error', this.question === '');
    if (this.question === '') {
      valid = false;
    }

    const answers = this.ui.answers.find('.command-menu-poll-answer');
    answers.each((i, answer) => {
      answer.classList.toggle('input--error', this.options[i] === '');
    });
    if (this.options.includes('')) {
      valid = false;
    }

    this.ui.time[0].classList.toggle(
      'input--error',
      this.time < 5000 || this.time > 600000,
    );
    if (this.time < 5000 || this.time > 600000) {
      valid = false;
    }

    return valid;
  }

  submit() {
    if (!this.validate()) {
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
    this.ui.answers[0].insertBefore(
      this.buildOptionHtml('', this.options.length),
      this.ui.add.closest('.command-menu__input')[0],
    );
  }

  buildOptionHtml(option, index) {
    const row = document.createElement('div');
    row.classList.add(
      'command-menu__input',
      'input',
      'command-menu-poll-answer',
    );

    const area = document.createElement('div');
    area.classList.add('input__area');

    const prefix = document.createElement('div');
    prefix.classList.add('input__prefix');
    prefix.textContent = index + 1;

    area.appendChild(prefix);

    const container = document.createElement('div');
    container.classList.add('input__container');

    const input = document.createElement('input');
    input.placeholder = 'YEE';
    input.value = option;

    container.appendChild(input);
    area.appendChild(container);

    const suffix = document.createElement('div');
    suffix.classList.add('input__suffix');

    const button = document.createElement('button');
    button.classList.add(
      'button',
      'button--danger',
      'button--icon-only',
      'button--small',
      'command-menu-poll-answer-remove',
    );

    const icon = this.chat.icons.getNode(Icons.X);

    button.appendChild(icon);
    suffix.appendChild(button);
    area.appendChild(suffix);
    row.appendChild(area);

    return row;
  }

  get question() {
    return this.ui.question.input.val();
  }

  set question(question) {
    this.ui.question[0].classList.remove('input--error');
    this.ui.question.input.val(question);
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
    return this.ui.time.input.val() * 1000;
  }

  set time(time) {
    this.ui.time[0].classList.remove('input--error');
    this.ui.time.input.val(time / 1000);
  }

  get weighted() {
    return this.ui.weighted[0].checked;
  }

  set weighted(weighted) {
    this.ui.weighted.attr('checked', weighted);
  }
}

export default CommandMenuPoll;
