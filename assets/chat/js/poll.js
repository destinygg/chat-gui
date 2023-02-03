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
  constructor(chat) {
    this.chat = chat;
    this.ui = this.chat.ui.find('#chat-poll-frame');
    this.ui.title = this.ui.find('.poll-title');
    this.ui.question = this.ui.find('.poll-question');
    this.ui.options = this.ui.find('.poll-options');
    this.ui.timer = this.ui.find('.poll-timer-inner');
    this.ui.endmsg = this.ui.find('.poll-end');
    this.poll = null;
    this.voting = false;
    this.hidden = true;
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
    this.voting = true;
    clearTimeout(this.timerHidePoll);

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

    this.reset();
    this.ui.title.text(
      `${
        this.poll.type === PollType.Weighted ? 'Sub-weighted poll' : 'Poll'
      } started by ${this.poll.user} for ${Math.floor(
        this.poll.time / 1000
      )} seconds.`
    );
    this.ui.question.text(this.poll.question);
    this.ui.options.html(
      this.poll.options
        .map(
          (option, i) => `
        <div class="opt" title="Vote ${option}">
          <div class="opt-info">
            <span class="opt-vote-number">
              <strong>${i + 1}</strong>
            </span>
            <span class="opt-bar-option">${option}</span>
          </div>
          <div class="opt-bar">
            <div class="opt-bar-inner" style="width: 0;">
              <span class="opt-bar-value"></span>
            </div>
          </div>
        </div>
      `
        )
        .join('')
    );

    this.pollStartMessage();
    this.updateTimer();
    this.updateBars();

    if (this.poll.myVote !== 0) {
      this.markVote(this.poll.myVote);
    }

    this.show();
  }

  reset() {
    this.ui.removeClass('poll-completed');
    this.ui.timer.css('transition', `none`);
    this.ui.timer.css('width', `100%`);
    this.ui.endmsg.hide();
    this.ui.timer.parent().show();
  }

  endPoll() {
    this.voting = false;
    clearTimeout(this.timerHidePoll);
    this.markWinner();
    this.ui.timer.parent().hide();
    this.ui.endmsg
      .text(`Poll ended! ${this.poll.votesCast} votes cast.`)
      .show();
    this.ui.addClass('poll-completed');
    this.timerHidePoll = setTimeout(() => this.hide(), POLL_END_TIME);
  }

  markWinner() {
    $('.opt-winner').removeClass('opt-winner');

    const winnerIndex = this.poll.totals.reduce(
      (max, x, i, arr) => (x > arr[max] ? i : max),
      0
    );

    this.ui.options.children().eq(winnerIndex).addClass('opt-winner');

    this.pollEndMessage(
      winnerIndex + 1,
      this.ui.options.children().eq(winnerIndex).data('percentage')
    );
  }

  markVote(opt) {
    this.poll.canVote = false;
    this.ui.options
      .children()
      .eq(opt - 1)
      .addClass('opt-marked');
  }

  updateTimer() {
    let remaining =
      this.poll.time -
      (new Date().getTime() + this.poll.offset - this.poll.start.getTime());
    remaining = Math.max(0, Math.floor(Math.min(remaining, this.poll.time)));
    const percentage = Math.max(0, (remaining / this.poll.time) * 100 - 1);
    this.ui.timer.css('width', `${percentage}%`);
    this.ui.timer.css('transition', `width ${remaining - 1}ms linear`);
    setTimeout(() => this.ui.timer.css('width', '0%'), 1);
  }

  updateBars() {
    if (this.voting) {
      this.poll.options.forEach((_, i) => {
        const percent =
          this.poll.votesCast > 0
            ? (this.poll.totals[i] / this.poll.votesCast) * 100
            : 0;

        this.ui.options.children().eq(i).attr('data-percentage', `${percent}`);

        this.ui.options
          .children()
          .eq(i)
          .find('.opt-bar-inner')
          .css('width', `${percent}%`);

        this.ui.options
          .children()
          .eq(i)
          .find('.opt-bar-value')
          .text(`${Math.round(percent)}% (${this.poll.totals[i]} votes)`);
      });
    }
  }

  pollStartMessage() {
    let message = `A poll has been started. Type ${this.poll.totals
      .map((_, i) => i + 1)
      .join(' or ')} in chat to participate.`;
    if (this.poll.type === PollType.Weighted) {
      message = `A sub-weighted poll has been started. <strong>The value of your vote depends on your subscription tier.</strong> Type ${this.poll.totals
        .map((_, i) => i + 1)
        .join(' or ')} in chat to participate.`;
    }

    MessageBuilder.info(message).into(this.chat);
  }

  pollEndMessage(winner, winnerPercentage) {
    let message = `The poll has ended. Option ${winner} won!`;
    if (winnerPercentage > 0) {
      message = `The poll has ended. Option ${winner} won with ${winnerPercentage}% of the vote.`;
    }

    MessageBuilder.info(message).into(this.chat);
  }
}

export { ChatPoll, parseQuestionAndTime };
