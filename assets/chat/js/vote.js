import $ from 'jquery'
import {throttle} from 'throttle-debounce'
import UserFeatures from './features'

const VOTE_START = /^\/vote /i;
const VOTE_STOP = /^\/votestop/i;
const VOTE_CONJUNCTION = /\bor\b/i;
const VOTE_INTERROGATIVE = /^(how|why|when|what|where)\b/i;
const VOTE_TIME = /\b([0-9]+(?:m|s)?)$/i;
const VOTE_MAX_TIME = 10*60*1000;
const VOTE_MIN_TIME = 5000;

function parseQuestionAndTime(rawQuestion) {
    let time
    const match = rawQuestion.match(VOTE_TIME)
    if (match && match[0]) {
        rawQuestion = rawQuestion.replace(VOTE_TIME, '')
        switch (match[0].replace(/[0-9]+/, '').toLowerCase()) {
            case 's':
                time = parseInt(match[0]) * 1000
                break;
            case 'm':
                time = parseInt(match[0]) * 60 * 1000
                break;
            default:
                time = 5000
                break;
        }
    } else {
        time = 5000
    }
    const question = parseQuestion(rawQuestion.trim())
    question.time = Math.max(VOTE_MIN_TIME, Math.min(time, VOTE_MAX_TIME));
    return question
}
function parseQuestion(msg) {
    if (msg.indexOf('?') === -1) {
        throw 'Must contain a ?'
    }
    const parts = msg.split('?'),
        question = parts[0] + '?'
    if (parts[1].trim() !== '') {
        const options = parts[1].split(VOTE_CONJUNCTION).map(a => a.trim())
        if (options.length < 2 && question.match(VOTE_INTERROGATIVE)) {
            throw 'question needs at least 2 available answers'
        }
        return {question, options}
    }
    return {question, options: ['Yes', 'No']}
}
function indexOfMax(arr) {
    if (arr.length === 0) {
        return -1;
    }
    let max = arr[0], maxIndex = 0;
    for (let i = 1; i < arr.length; i++) {
        if (arr[i] > max) {
            maxIndex = i;
            max = arr[i];
        }
    }
    return maxIndex;
}

class ChatVote {

    constructor(chat, ui) {
        this.chat = chat
        this.ui = ui
        this.vote = null
        this.voting = false
        this.hidden = false
        this.timerHeartBeat = -1;
        this.timerEndVote = -1;
        this.timerHideVote = -1;
        this.ui.on('click touch', '.vote-close', () => this.hide())
        this.throttleVoteCast = throttle(250, false, () => { this.updateBars() })
    }

    hide() {
        if (!this.hidden) {
            this.hidden = true
            this.chat.mainwindow.lock()
            this.ui.hide()
            this.chat.mainwindow.unlock()
        }
    }

    show() {
        if (this.hidden) {
            this.hidden = false
            this.chat.mainwindow.lock()
            this.ui.show()
            this.chat.mainwindow.unlock()
        }
    }

    isVoteStarted() {
        return this.voting
    }

    canUserStartVote(user) {
        return user.hasAnyFeatures(UserFeatures.ADMIN, UserFeatures.BOT, UserFeatures.PROTECTED, UserFeatures.MODERATOR)
    }

    isMsgVoteStopFmt(txt) {
        return txt.match(VOTE_STOP)
    }

    isMsgVoteStartFmt(txt) {
        return txt.match(VOTE_START)
    }

    isMsgVoteCastFmt(txt) {
        if (txt.length === 1 && txt.match(/[0-9]/i)) {
            const int = parseInt(txt)
            return int > 0 && int <= this.vote.question.options.length
        }
        return false
    }

    castVote(opt, username) {
        if (this.voting && !this.hidden && !this.vote.votes.has(username)) {
            this.vote.votes.set(username, opt);
            this.vote.totals[opt-1]++;
            this.throttleVoteCast(opt)
            return true
        }
        return false
    }

    startVote(rawQuestion, username) {
        try {
            this.voting = true
            clearTimeout(this.timerEndVote)
            clearTimeout(this.timerHideVote)
            clearInterval(this.timerHeartBeat)

            const question = parseQuestionAndTime(rawQuestion);
            this.vote = {
                start: new Date(),
                time: question.time,
                question: question,
                totals: question.options.map(() => 0),
                votes: new Map(),
                user: username,
            }

            let html = this.buildVoteFrame()
            this.ui.vote = html
            this.ui.label = html.find('.vote-label')
            this.ui.bars = html.find('.opt').toArray().map(e => {
                const opt = $(e),
                    barValue = opt.find('.opt-bar-value'),
                    barInner = opt.find('.opt-bar-inner');
                return {opt, barInner, barValue}
            });

            this.chat.mainwindow.lock()
            this.ui.empty().append(html)
            this.chat.mainwindow.unlock()
            this.updateTimers()
            this.updateBars()
            this.show()

            this.timerHeartBeat = setInterval(() => this.updateTimers(), 1000)
            this.timerEndVote = setTimeout(() => this.endVote(), this.vote.time)

            return true
        } catch (e) {
            console.error(e)
            this.voting = false
            return false
        }
    }

    endVote() {
        this.voting = false
        clearTimeout(this.timerEndVote)
        clearTimeout(this.timerHideVote)
        clearInterval(this.timerHeartBeat)
        const firstIndex = this.vote.totals.reduce((max, x, i, arr) => x > arr[max] ? i : max, 0)
        this.ui.vote.find(`.opt:nth-child(${firstIndex+1})`).addClass('opt-winner')
        this.ui.vote.find(`.opt-choice:nth-child(${firstIndex+1})`).addClass('opt-winner')
        this.ui.label.html(`Vote ended! ${this.vote.votes.size} votes cast.`)
        this.ui.vote.addClass('vote-completed')
        this.timerHideVote = setTimeout(() => this.hide(), Math.min(this.vote.time, new Date() - this.vote.start))
        this.vote = null
    }

    updateTimers() {
        const remaining = Math.floor(Math.min(((this.vote.time-(new Date() - this.vote.start))/1000)+1, this.vote.time/1000))
        this.ui.label.html(`Vote started by ${this.vote.user} ending in ${remaining} ${remaining>1?'seconds':'second'}!`)
    }

    updateBars() {
        if (this.vote && this.vote.question) {
            this.vote.question.options.forEach((opt, i) => {
                const percent = (this.vote.totals[i] / this.vote.votes.size * 100)
                this.ui.bars[i].barInner.css('width', percent + '%')
                this.ui.bars[i].barValue.text(Math.round(percent) + '%')
            });
        }
    }

    buildVoteFrame() {
        const question = this.vote.question
        return $(``
            +`<div class="vote-frame">`
                +`<div style="display: flex;">`
                    +`<label style="flex:1;" class="vote-question">`
                        + `<span>${question.question}</span>`
                        + `<span>`+ (question.options.map((v, i) => `<span class="opt-choice"><strong>${i+1}</strong> ${v}</span>`).join(' ')) +`</span>`
                    +`</label>`
                    +`<label class="vote-close" title="Close"></label>`
                +`</div>`
                +`<div>`
                    + question.options.reduce((a, v, i) => {
                        a += `<div class="opt">`
                        a +=    `<div class="opt-info"><strong>${i+1}</strong></div>`
                        a +=    `<div class="opt-bar"><div class="opt-bar-inner" style="width: 0;"><span class="opt-bar-value">0</span></div></div>`
                        a += `</div>`
                        return a
                    }, '')
                +`</div>`
                +`<label class="vote-label"></label>`
            +`</div>`
        );
    }

}

export default ChatVote