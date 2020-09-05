import moment from 'moment'

function isMuteActive(mute) {
    // If either field is `undefined`, we don't have enough information to
    // determine if the mute is expired.
    if (mute.timestamp == undefined || mute.duration == undefined) {
        return null
    }

    const now = moment()

    // Note that `timestamp` is in milliseconds, but `duration` is in seconds.
    let muteExpirationTime = moment(mute.timestamp)
    muteExpirationTime.add(mute.duration, 'seconds')
    return muteExpirationTime.isAfter(now)
}

class MutedTimer {
    constructor(chat) {
        this.chat = chat
        this.ticking = false
        this.duration = null
    }

    startTimer() {
        if (this.ticking || !this.duration) {
            return
        }

        this.ticking = true

        // Update placeholder text immediately to account for delay when using
        // `setInterval()`.
        this.updatePlaceholderText()

        // The timer ticks every second.
        this.timerInterval = setInterval(() => this.tickTimer(), 1000)
    }

    tickTimer() {
        this.duration = this.duration.subtract(1, 'seconds')

        if (this.duration.asSeconds() <= 0) {
            this.stopTimer()
        } else {
            this.updatePlaceholderText()
        }
    }

    stopTimer() {
        if (!this.ticking) {
            return
        }

        this.ticking = false

        clearInterval(this.timerInterval)

        this.duration = null
        this.chat.setDefaultPlaceholderText()
    }

    setTimer(seconds = 0) {
        this.duration = moment.duration(seconds, 'seconds')
    }

    updatePlaceholderText() {
        // Only update the placeholder text when the main chat window is active.
        // A muted user can still send messages in direct message windows.
        if (this.chat.getActiveWindow().name === 'main') {
            this.chat.input.attr('placeholder', this.getPlaceholderText())
        }
    }

    getPlaceholderText() {
        return `Sorry, ${this.chat.user.username}, you are muted. You can chat again ${this.getReadableDuration()}.`
    }

    getReadableDuration() {
        return this.duration.humanize(true, {s: 60, ss: 2})
    }
}

export {
    isMuteActive,
    MutedTimer
}