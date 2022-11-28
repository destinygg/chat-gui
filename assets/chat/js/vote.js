import $ from 'jquery';
import { throttle } from 'throttle-debounce';
import UserFeatures from './features';

const VOTE_START = /^\/(vote|svote) /i;
const VOTE_STOP = /^\/votestop/i;
const VOTE_CONJUNCTION = /\bor\b/i;
const VOTE_INTERROGATIVE = /^(how|why|when|what|where)\b/i;
const VOTE_TIME = /\b([0-9]+(?:m|s)?)$/i;
const VOTE_DEFAULT_TIME = 30000;
const VOTE_MAX_TIME = 10 * 60 * 1000;
const VOTE_MIN_TIME = 5000;
const VOTE_END_TIME = 7000;

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
    const options = parts[1].split(VOTE_CONJUNCTION).map((a) => a.trim());
    if (options.length < 2 && question.match(VOTE_INTERROGATIVE)) {
      throw new Error('question needs at least 2 available answers');
    }
    return { question, options };
  }
  return { question, options: ['Yes', 'No'] };
}
function parseQuestionAndTime(rawQuestion) {
  let time;
  const match = rawQuestion.match(VOTE_TIME);
  if (match && match[0]) {
    switch (match[0].replace(/[0-9]+/, '').toLowerCase()) {
      case 's':
        time = parseInt(match[0], 10) * 1000;
        break;
      case 'm':
        time = parseInt(match[0], 10) * 60 * 1000;
        break;
      default:
        time = VOTE_DEFAULT_TIME;
        break;
    }
  } else {
    time = VOTE_DEFAULT_TIME;
  }
  const question = parseQuestion(rawQuestion.replace(VOTE_TIME, '').trim());
  question.time = Math.max(VOTE_MIN_TIME, Math.min(time, VOTE_MAX_TIME));
  return question;
}

class ChatVote {
  constructor(chat, ui) {
    this.chat = chat;
    this.ui = ui;
    this.vote = null;
    this.voting = false;
    this.hidden = true;
    this.timerHeartBeat = -1;
    this.timerEndVote = -1;
    this.timerHideVote = -1;
    this.ui.on('click touch', '.vote-close', () => this.hide());
    this.ui.on('click touch', '.opt', (e) => {
      if (this.voting) {
        this.chat.cmdSEND(`${$(e.currentTarget).index() + 1}`);
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

  canCastVote(timestamp) {
    if (this.vote) {
      return (new Date(timestamp).getTime() - (this.vote.start.getTime() + this.vote.time + VOTE_END_TIME)) < 0
    }
    return false;
  }

  isVoteStarted() {
    return this.voting;
  }

  canUserStartVote(user) {
    return user.hasAnyFeatures(
      UserFeatures.ADMIN,
      UserFeatures.BOT,
      UserFeatures.MODERATOR
    );
  }

  canUserStopVote(user) {
    // A user can only stop their own vote.
    return this.canUserStartVote(user) && this.vote.user === user.nick;
  }

  isMsgVoteStopFmt(txt) {
    return txt.match(VOTE_STOP);
  }

  isMsgVoteStartFmt(txt) {
    return txt.match(VOTE_START);
  }

  isMsgVoteCastFmt(txt) {
    if (txt.match(/^[0-9]+$/i)) {
      const int = parseInt(txt, 10);
      return int > 0 && int <= this.vote.question.options.length;
    }
    return false;
  }

  canVote(user) {
    return !this.vote.votes.has(user.username);
  }

  castVote(opt, user, timestamp = new Date().getTime()) {
    if (this.canCastVote(timestamp) && !this.hidden && this.canVote(user.username)) {
      this.vote.votes.set(user.username, opt);

      const votes = this.votesForUser(user);
      this.vote.totals[opt - 1] += votes;
      this.vote.votesCast += votes;

      this.throttleVoteCast(opt);

      if (!this.voting) this.markWinner();

      return true;
    }
    return false;
  }

  votesForUser(user) {
    switch (this.vote.type) {
      case PollType.Weighted:
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

  startVote(rawCommand, user, startTime) {
    try {
      this.voting = true;
      clearTimeout(this.timerEndVote);
      clearTimeout(this.timerHideVote);
      clearInterval(this.timerHeartBeat);

      const [type, rawQuestion] = rawCommand.split(/\s+(.*)/);
      const question = parseQuestionAndTime(rawQuestion);
      this.vote = {
        type: type === '/svote' ? PollType.Weighted : PollType.Normal,
        start: new Date(startTime),
        time: question.time,
        question,
        totals: question.options.map(() => 0),
        votes: new Map(),
        user: user.username,
        votesCast: 0,
      };

      const html = this.buildVoteFrame();
      this.ui.vote = html;
      this.ui.label = html.find('.vote-label');
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
      this.show();

      this.timerHeartBeat = setInterval(() => this.updateTimers(), 500);

      const elapsedTime = new Date().getTime() - startTime;
      if (this.vote.time - elapsedTime > 0) {
        this.timerEndVote = setTimeout(
          () => this.endVote(startTime + this.vote.time),
          this.vote.time - elapsedTime
        );
      } else {
        this.endVote(startTime + this.vote.time);
      }

      return true;
    } catch (e) {
      this.voting = false;
      return false;
    }
  }

  endVote(timestamp) {
    this.voting = false;
    clearTimeout(this.timerEndVote);
    clearTimeout(this.timerHideVote);
    clearInterval(this.timerHeartBeat);

    this.markWinner();

    this.ui.label.html(`Vote ended! ${this.vote.votesCast} votes cast.`);
    this.ui.vote.addClass('vote-completed');
    const elapsedTime = new Date().getTime() - timestamp;
    if (VOTE_END_TIME - elapsedTime > 0) {
      this.timerHideVote = setTimeout(() => this.reset(), VOTE_END_TIME - elapsedTime);
    } else {
      this.reset();
    }
  }

  reset() {
    this.vote = null;
    this.hide();
  }

  markWinner() {

    $('.opt-winner').removeClass('opt-winner');

    const firstIndex = this.vote.totals.reduce(
      (max, x, i, arr) => (x > arr[max] ? i : max),
      0
    );
    const options = this.ui.vote.find('.opt-options');
    const choices = this.ui.vote.find('.opt-choices');
    options.find(`.opt:nth-child(${firstIndex + 1})`).addClass('opt-winner');
    choices
      .find(`.opt-choice:nth-child(${firstIndex + 1})`)
      .addClass('opt-winner');
  }

  markVote(opt) {
    this.ui.vote
      .find(`.opt-options .opt:nth-child(${opt})`)
      .addClass('opt-marked');
  }

  updateTimers() {
    const remaining = Math.floor(
      Math.min(
        (this.vote.time - (new Date() - this.vote.start)) / 1000 + 1,
        this.vote.time / 1000
      )
    );
    this.ui.label.html(
      `(Type in chat to participate) Started by ${
        this.vote.user
      } ending in ${remaining} ${remaining > 1 ? 'seconds' : 'second'}!`
    );
  }

  updateBars() {
    if (this.vote && this.vote.question) {
      this.vote.question.options.forEach((opt, i) => {
        const percent =
          this.vote.votesCast > 0
            ? (this.vote.totals[i] / this.vote.votesCast) * 100
            : 0;
        this.ui.bars[i].barInner.css('width', `${percent}%`);
        this.ui.bars[i].barValue.text(
          percent > 0 ? `${Math.round(percent)}%` : ''
        );
      });
    }
  }

  buildVoteFrame() {
    const { question } = this.vote;
    const tagQuestion = $(`<span />`).text(question.question)[0];
    const tagOptions = question.options
      .map((v, i) => {
        const tagVal = $(`<span/>`).text(v)[0];
        return `<span class="opt-choice"><strong>${i + 1}</strong> ${
          tagVal.outerHTML
        }</span>`;
      })
      .join(' ');
    return $(
      `` +
        `<div class="vote-frame">` +
        `<div class="vote-header">` +
        `<label class="vote-question">${tagQuestion.outerHTML}<span class="opt-choices">${tagOptions}</span>` +
        `</label>` +
        `<label class="vote-close" title="Close"></label>` +
        `</div>` +
        `<div class="opt-options">${question.options.reduce((a, v, i) => {
          const newOption =
            `<div class="opt" title="Vote">` +
            `<div class="opt-info"><strong>${i + 1}</strong></div>` +
            `<div class="opt-bar"><div class="opt-bar-inner" style="width: 0;"><span class="opt-bar-value">0</span></div></div>` +
            `</div>`;
          return a + newOption;
        }, '')}</div>` +
        `<label class="vote-label"></label>` +
        `</div>`
    );
  }

  voteStartMessage() {
    switch (this.vote.type) {
      case PollType.Weighted:
        return `A sub-weighted vote has been started. <strong>The value of your vote depends on your subscription tier.</strong> Type ${this.vote.totals
          .map((a, i) => i + 1)
          .join(' or ')} in chat to participate.`;
      case PollType.Normal:
      default:
        return `A vote has been started. Type ${this.vote.totals
          .map((a, i) => i + 1)
          .join(' or ')} in chat to participate.`;
    }
  }
}

export { ChatVote, parseQuestionAndTime, VOTE_END_TIME };
