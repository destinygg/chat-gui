import $ from 'jquery'
import {throttle} from 'throttle-debounce'
import UserFeatures from './features'

const VOTE_START = /^\/vote /i;
const VOTE_STOP = /^\/votestop/i;
const VOTE_CONJUNCTION = /\bor\b/i;
const VOTE_INTERROGATIVE = /^(how|why|when|what|where)\b/i;
const VOTE_TIME = /\b([0-9]+(?:m|s)?)$/i;
const VOTE_DEFAULT_TIME = 30000;
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
                time = VOTE_DEFAULT_TIME
                break;
        }
    } else {
        time = VOTE_DEFAULT_TIME
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

class ChatVote {

    constructor(chat, ui) {
        this.chat = chat
        this.ui = ui
        this.vote = null
        this.voting = false
        this.hidden = true
        this.timerHeartBeat = -1;
        this.timerEndVote = -1;
        this.timerHideVote = -1;
        this.ui.on('click touch', '.vote-close', () => this.hide())
        this.ui.on('click touch', '.opt', e => {
            if (this.voting) {
                this.chat.cmdSEND($(e.currentTarget).index() + 1 + '')
            }
        })
        this.throttleVoteCast = throttle(100, false, () => { this.updateBars() })
    }

    hide() {
        if (!this.hidden) {
            this.hidden = true
            this.chat.mainwindow.lock()
            this.ui.removeClass('active')
            this.chat.mainwindow.unlock()
        }
    }

    show() {
        if (this.hidden) {
            this.hidden = false
            this.chat.mainwindow.lock()
            this.ui.addClass('active')
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

    canVote(username) {
        return !this.vote.votes.has(username)
    }

    castVote(opt, username) {
        if (this.voting && !this.hidden && this.canVote(username)) {
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

            const html = this.buildVoteFrame()
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
        const options = this.ui.vote.find('.opt-options')
        const choices = this.ui.vote.find('.opt-choices')
        options.find(`.opt:nth-child(${firstIndex+1})`).addClass('opt-winner')
        choices.find(`.opt-choice:nth-child(${firstIndex+1})`).addClass('opt-winner')

        this.ui.label.html(`Vote ended! ${this.vote.votes.size} votes cast.`)
        this.ui.vote.addClass('vote-completed')
        this.timerHideVote = setTimeout(() => this.hide(), 7000)
        this.vote = null
    }

    markVote(opt, username) {
        this.ui.vote.find(`.opt-options .opt:nth-child(${opt})`).addClass('opt-marked')
    }

    updateTimers() {
        const remaining = Math.floor(Math.min(((this.vote.time-(new Date() - this.vote.start))/1000)+1, this.vote.time/1000))
        this.ui.label.html(`(Type in chat to participate) Started by ${this.vote.user} ending in ${remaining} ${remaining>1?'seconds':'second'}!`)
    }

    updateBars() {
        if (this.vote && this.vote.question) {
            this.vote.question.options.forEach((opt, i) => {
                const percent = this.vote.votes.size > 0 ? (this.vote.totals[i] / this.vote.votes.size * 100) : 0
                this.ui.bars[i].barInner.css('width', percent + '%')
                this.ui.bars[i].barValue.text(percent > 0 ? Math.round(percent) + '%' : '')
            });
        }
    }

    buildVoteFrame() {
        const question = this.vote.question
        const tagQuestion = $(`<span />`).text(question.question)[0]
        const tagOptions = (question.options.map((v, i) => {
            const tagVal = $(`<span/>`).text(v)[0]
            return `<span class="opt-choice"><strong>${i+1}</strong> ${tagVal.outerHTML}</span>`
        }).join(' '))
        return $(``
            +`<div class="vote-frame">`
                +`<div class="vote-header">`
                    +`<label class="vote-question">`
                        + tagQuestion.outerHTML
                        + `<span class="opt-choices">${tagOptions}</span>`
                    +`</label>`
                    +`<label class="vote-close" title="Close"></label>`
                +`</div>`
                +`<div class="opt-options">`
                    + question.options.reduce((a, v, i) => {
                        a += `<div class="opt" title="Vote">`
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