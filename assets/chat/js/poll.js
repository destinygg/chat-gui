import $ from 'jquery';
import { throttle } from 'throttle-debounce';
import UserFeatures from './features';
import { MessageBuilder } from './messages';

const POLL_START = /^\/(vote|svote|poll|spoll) /i;
const POLL_STOP = /^\/(votestop|pollstop)/i;
const POLL_CONJUNCTION = /\bor\b/i;
const POLL_INTERROGATIVE = /^(how|why|when|what|where)\b/i;
const POLL_TIME = /\b([0-9]+(?:m|s))$/i;
const POLL_DEFAULT_TIME = 30000;
const POLL_MAX_TIME = 10 * 60 * 1000;
const POLL_MIN_TIME = 5000;
const POLL_END_TIME = 7000;

const PollType = {
  Normal: 0,
  Weighted: 1,
};

function parseQuestion(msg) {
  if (msg.indexOf('?') === -1) {
    throw new Error('Must contain a ?');
  }
  const parts = msg.split('?');
  const question = `${parts[0]}?`;
  if (parts[1].trim() !== '') {
    const options = parts[1].split(POLL_CONJUNCTION).map((a) => a.trim());
    if (options.length < 2 && question.match(POLL_INTERROGATIVE)) {
      throw new Error('question needs at least 2 available answers');
    }
    return { question, options };
  }
  return { question, options: ['Yes', 'No'] };
}
function parseQuestionAndTime(rawQuestion) {
  let time;
  const match = rawQuestion.match(POLL_TIME);
  if (match && match[0]) {
    switch (match[0].replace(/[0-9]+/, '').toLowerCase()) {
      case 's':
        time = parseInt(match[0], 10) * 1000;
        break;
      case 'm':
        time = parseInt(match[0], 10) * 60 * 1000;
        break;
      default:
        time = POLL_DEFAULT_TIME;
        break;
    }
  } else {
    time = POLL_DEFAULT_TIME;
  }
  const question = parseQuestion(rawQuestion.replace(POLL_TIME, '').trim());
  question.time = Math.max(POLL_MIN_TIME, Math.min(time, POLL_MAX_TIME));
  return question;
}

class ChatPoll {
  constructor(chat, ui) {
    this.chat = chat;
    this.ui = ui;
    this.poll = null;
    this.voting = false;
    this.hidden = true;
    this.timerHeartBeat = -1;
    this.timerHidePoll = -1;
    this.ui.on('click touch', '.poll-close', () => this.hide());
    this.ui.on('click touch', '.opt', (e) => {
      if (this.voting) {
        if (this.poll.canVote) {
          this.chat.source.send('CASTVOTE', {
            vote: `${$(e.currentTarget).index() + 1}`,
          });
        } else {
          MessageBuilder.error(`You have already voted!`).into(this.chat);
        }
      }
    });
    this.throttleVoteCast = throttle(100, false, () => {
      this.updateBars();
    });
  }

  hide() {
    if (!this.hidden) {
      this.hidden = true;
      this.chat.mainwindow.lock();
      this.ui.removeClass('active');
      this.chat.mainwindow.unlock();
    }
  }

  show() {
    if (this.hidden) {
      this.hidden = false;
      this.chat.mainwindow.lock();
      this.ui.addClass('active');
      this.chat.mainwindow.unlock();
    }
  }

  isPollStarted() {
    return this.voting;
  }

  canUserStartPoll(user) {
    return user.hasAnyFeatures(
      UserFeatures.ADMIN,
      UserFeatures.BOT,
      UserFeatures.MODERATOR
    );
  }

  canUserStopPoll(user) {
    // A user can only stop their own poll.
    return this.canUserStartPoll(user) && this.poll.user === user.nick;
  }

  isMsgPollStopFmt(txt) {
    return txt.match(POLL_STOP);
  }

  isMsgPollStartFmt(txt) {
    return txt.match(POLL_START);
  }

  isMsgVoteCastFmt(txt) {
    if (txt.match(/^[0-9]+$/i)) {
      const int = parseInt(txt, 10);
      return int > 0 && int <= this.poll.options.length;
    }
    return false;
  }

  castVote(data, user) {
    if (!this.hidden) {
      const votes = this.votesForUser(user);
      this.poll.totals[data.vote - 1] += votes;
      this.poll.votesCast += votes;
      this.throttleVoteCast(data.vote);
      if (!this.voting) this.markWinner();
      return true;
    }
    return false;
  }

  votesForUser(user) {
    switch (this.poll.type) {
      case PollType.Weighted:
        if (user.hasFeature(UserFeatures.SUB_TIER_5)) {
          return 32;
        }
        if (user.hasFeature(UserFeatures.SUB_TIER_4)) {
          return 16;
        }
        if (user.hasFeature(UserFeatures.SUB_TIER_3)) {
          return 8;
        }
        if (user.hasFeature(UserFeatures.SUB_TIER_2)) {
          return 4;
        }
        if (user.hasFeature(UserFeatures.SUB_TIER_1)) {
          return 2;
        }

        return 1;
      case PollType.Normal:
      default:
        return 1;
    }
  }

  startPoll(data) {
    try {
      this.voting = true;
      clearTimeout(this.timerHidePoll);
      clearInterval(this.timerHeartBeat);

      this.poll = {
        canVote: data.canvote,
        myVote: data.myvote,
        type: data.weighted ? PollType.Weighted : PollType.Normal,
        start: new Date(data.start),
        offset: new Date(data.now).getTime() - new Date().getTime(),
        time: data.time,
        question: data.question,
        options: data.options,
        totals: data.totals,
        user: data.nick,
        votesCast: data.totalvotes,
      };

      const html = this.buildPollFrame();
      this.ui.poll = html;
      this.ui.label = html.find('.poll-label');
      this.ui.bars = html
        .find('.opt')
        .toArray()
        .map((e) => {
          const opt = $(e);
          const barValue = opt.find('.opt-bar-value');
          const barInner = opt.find('.opt-bar-inner');
          return { opt, barInner, barValue };
        });

      this.chat.mainwindow.lock();
      this.ui.empty().append(html);
      this.chat.mainwindow.unlock();
      this.updateTimers();
      this.updateBars();

      if (this.poll.myVote !== 0) {
        this.markVote(this.poll.myVote);
      }

      this.show();

      this.timerHeartBeat = setInterval(() => this.updateTimers(), 500);

      return true;
    } catch (e) {
      this.voting = false;
      return false;
    }
  }

  endPoll() {
    this.voting = false;
    clearTimeout(this.timerHidePoll);
    clearInterval(this.timerHeartBeat);

    this.markWinner();

    this.ui.label.html(`Poll ended! ${this.poll.votesCast} votes cast.`);
    this.ui.poll.addClass('poll-completed');
    this.timerHidePoll = setTimeout(() => this.reset(), POLL_END_TIME);
  }

  reset() {
    this.poll = null;
    this.hide();
  }

  markWinner() {
    $('.opt-winner').removeClass('opt-winner');

    const firstIndex = this.poll.totals.reduce(
      (max, x, i, arr) => (x > arr[max] ? i : max),
      0
    );
    const options = this.ui.poll.find('.opt-options');
    const choices = this.ui.poll.find('.opt-choices');
    options.find(`.opt:nth-child(${firstIndex + 1})`).addClass('opt-winner');
    choices
      .find(`.opt-choice:nth-child(${firstIndex + 1})`)
      .addClass('opt-winner');
  }

  markVote(opt) {
    this.poll.canVote = false;
    this.ui.poll
      .find(`.opt-options .opt:nth-child(${opt})`)
      .addClass('opt-marked');
  }

  updateTimers() {
    let remaining =
      (this.poll.time -
        (new Date().getTime() + this.poll.offset - this.poll.start.getTime())) /
      1000;
    remaining = Math.max(
      0,
      Math.floor(Math.min(remaining, this.poll.time / 1000))
    );

    this.ui.label.html(
      `(Type in chat to participate) Started by ${
        this.poll.user
      } ending in ${remaining} ${remaining > 1 ? 'seconds' : 'second'}!`
    );
  }

  updateBars() {
    if (this.poll && this.poll.question) {
      this.poll.options.forEach((opt, i) => {
        const percent =
          this.poll.votesCast > 0
            ? (this.poll.totals[i] / this.poll.votesCast) * 100
            : 0;
        this.ui.bars[i].barInner.css('width', `${percent}%`);
        this.ui.bars[i].barValue.text(
          percent > 0 ? `${Math.round(percent)}%` : ''
        );
      });
    }
  }

  buildPollFrame() {
    const { question, options } = this.poll;
    const tagQuestion = $(`<span />`).text(question)[0];
    const tagOptions = options
      .map((v, i) => {
        const tagVal = $(`<span/>`).text(v)[0];
        return `<span class="opt-choice"><strong>${i + 1}</strong> ${
          tagVal.outerHTML
        }</span>`;
      })
      .join(' ');
    return $(
      `` +
        `<div class="poll-frame">` +
        `<div class="poll-header">` +
        `<label class="poll-question">${tagQuestion.outerHTML}<span class="opt-choices">${tagOptions}</span>` +
        `</label>` +
        `<label class="poll-close" title="Close"></label>` +
        `</div>` +
        `<div class="opt-options">${options.reduce((a, v, i) => {
          const newOption =
            `<div class="opt" title="Vote">` +
            `<div class="opt-info"><strong>${i + 1}</strong></div>` +
            `<div class="opt-bar"><div class="opt-bar-inner" style="width: 0;"><span class="opt-bar-value">0</span></div></div>` +
            `</div>`;
          return a + newOption;
        }, '')}</div>` +
        `<label class="poll-label"></label>` +
        `</div>`
    );
  }

  pollStartMessage() {
    switch (this.poll.type) {
      case PollType.Weighted:
        return `A sub-weighted poll has been started. <strong>The value of your vote depends on your subscription tier.</strong> Type ${this.poll.totals
          .map((a, i) => i + 1)
          .join(' or ')} in chat to participate.`;
      case PollType.Normal:
      default:
        return `A poll has been started. Type ${this.poll.totals
          .map((a, i) => i + 1)
          .join(' or ')} in chat to participate.`;
    }
  }
}

export { ChatPoll, parseQuestionAndTime };
