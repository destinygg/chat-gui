import $ from 'jquery'
import {EmoteFormatter, GreenTextFormatter, HtmlTextFormatter, MentionedUserFormatter, UrlFormatter, EmbedUrlFormatter, BadWordsCensorshipFormatter, AmazonAssociatesTagInjector, SuspostFormatter} from './formatters'
import {DATE_FORMATS} from './const'
import {throttle} from 'throttle-debounce'
import moment from 'moment'

const MessageTypes = {
    STATUS    : 'STATUS',
    ERROR     : 'ERROR',
    INFO      : 'INFO',
    COMMAND   : 'COMMAND',
    BROADCAST : 'BROADCAST',
    UI        : 'UI',
    CHAT      : 'CHAT',
    USER      : 'USER',
    EMOTE     : 'EMOTE'
}
const formatters = new Map()
formatters.set('html', new HtmlTextFormatter())
formatters.set('amazon', new AmazonAssociatesTagInjector())
formatters.set('url', new UrlFormatter())
formatters.set('emote', new EmoteFormatter())
formatters.set('mentioned', new MentionedUserFormatter())
formatters.set('green', new GreenTextFormatter())
formatters.set('sus', new SuspostFormatter())
formatters.set('embed', new EmbedUrlFormatter())
formatters.set('badwordscensor', new BadWordsCensorshipFormatter())

class MessageBuilder {

    static element(message, classes=[]){
        return new ChatUIMessage(message, classes)
    }

    static status(message, timestamp = null){
        return new ChatMessage(message, timestamp, MessageTypes.STATUS)
    }

    static error(message, timestamp = null){
        return new ChatMessage(message, timestamp, MessageTypes.ERROR)
    }

    static info(message, timestamp = null){
        return new ChatMessage(message, timestamp, MessageTypes.INFO)
    }

    static broadcast(message, timestamp = null){
        return new ChatMessage(message, timestamp, MessageTypes.BROADCAST)
    }

    static command(message, timestamp = null){
        return new ChatMessage(message, timestamp, MessageTypes.COMMAND)
    }

    static message(message, user, timestamp = null){
        return new ChatUserMessage(message, user, timestamp)
    }

    static emote(emote, timestamp, count=1){
        return new ChatEmoteMessage(emote, timestamp, count);
    }

    static whisper(message, user, target, timestamp = null, id = null){
        const m = new ChatUserMessage(message, user, timestamp);
        m.id = id;
        m.target = target;
        return m;
    }

    static historical(message, user, timestamp = null){
        const m = new ChatUserMessage(message, user, timestamp);
        m.historical = true;
        return m;
    }

}

class ChatUIMessage {

    constructor(message, classes=[]){
        /** @type String */
        this.type = MessageTypes.UI
        /** @type String */
        this.message = message
        /** @type Array */
        this.classes = classes
        /** @type JQuery */
        this.ui = null
    }

    into(chat, window=null){
        chat.addMessage(this, window);
        return this;
    }

    wrap(content, classes=[], attr={}){
        classes.push(this.classes);
        classes.unshift(`msg-${this.type.toLowerCase()}`);
        classes.unshift(`msg-chat`);
        attr['class'] = classes.join(' ');
        return $('<div></div>', attr).html(content)[0].outerHTML;
    }

    html(chat=null){
        return this.wrap(this.message);
    }

    afterRender(chat=null){}

}

class ChatMessage extends ChatUIMessage {

    constructor(message, timestamp=null, type=MessageTypes.CHAT, unformatted=false){
        super(message);
        this.user = null;
        this.type = type;
        this.continued = false;
        this.timestamp = timestamp ? moment.utc(timestamp).local() : moment();
        this.unformatted = unformatted;
    }

    html(chat=null){
        const classes = [], attr = {};
        if(this.continued)
            classes.push('msg-continue');
        return this.wrap(`${this.buildTime()} ${this.buildMessageTxt(chat)}`, classes, attr);
    }

    buildMessageTxt(chat){
        // TODO we strip off the `/me ` of every message -- must be a better way to do this
        let msg = this.message.substring(0, 4).toLowerCase() === '/me ' ? this.message.substring(4) : this.message
        if (!this.unformatted) formatters.forEach(f => msg = f.format(chat, msg, this))
        return `<span class="text">${msg}</span>`
    }

    buildTime(){
        const datetime = this.timestamp.format(DATE_FORMATS.FULL);
        const label = this.timestamp.format(DATE_FORMATS.TIME);
        return `<time class="time" title="${datetime}">${label}</time>`;
    }

}

class ChatUserMessage extends ChatMessage {

    constructor(message, user, timestamp=null) {
        super(message, timestamp, MessageTypes.USER);
        this.user = user;
        this.id = null;
        this.isown = false;
        this.highlighted = false;
        this.historical = false;
        this.target = null;
        this.tag = null;
        this.title = '';
        this.slashme = false;
        this.mentioned = [];
    }

    html(chat=null){
        const classes = [], attr = {};

        if(this.id)
            attr['data-id'] = this.id;
        if(this.user && this.user.username)
            attr['data-username'] = this.user.username.toLowerCase();
        if(this.mentioned && this.mentioned.length > 0)
            attr['data-mentioned'] = this.mentioned.join(' ').toLowerCase();

        if(this.isown)
            classes.push('msg-own');
        if(this.slashme)
            classes.push('msg-me');
        if(this.historical)
            classes.push('msg-historical');
        if(this.highlighted)
            classes.push('msg-highlight');
        if(this.continued && !this.target)
            classes.push('msg-continue');
        if(this.tag)
            classes.push(`msg-tagged msg-tagged-${this.tag}`);
        if(this.target)
            classes.push(`msg-whisper`);

        let ctrl = ': ';
        if(this.target)
            ctrl = ' whispered: ';
        else if(this.slashme || this.continued)
            ctrl = '';

        const user = this.buildFeatures(this.user, chat) + ` <a title="${this.title}" class="user ${this.user.features.join(' ')}">${this.user.username}</a>`;
        return this.wrap(this.buildTime() + ` ${user}<span class="ctrl">${ctrl}</span> ` + this.buildMessageTxt(chat), classes, attr);
    }

    buildFeatures(user, chat){
        const features = (user.features || [])
            .filter(e => chat.flairsMap.has(e))
            .map(e => chat.flairsMap.get(e))
            .reduce((str, e) => str + `<i class="flair ${e['name']}" title="${e['label']}"></i> `, '');
        return features !== '' ? `<span class="features">${features}</span>` : '';
    }

}

function ChatEmoteMessageCount(message){
    if(!message || !message._combo)
        return;
    let stepClass = ''
    if(message.emotecount >= 50)
        stepClass = ' x50'
    else if(message.emotecount >= 30)
        stepClass = ' x30'
    else if(message.emotecount >= 20)
        stepClass = ' x20'
    else if(message.emotecount >= 10)
        stepClass = ' x10'
    else if(message.emotecount >= 5)
        stepClass = ' x5'
    if(!message._combo)
        console.error('no combo', message._combo)
    message._combo.attr('class', 'chat-combo' + stepClass)
    message._combo_count.text(`${message.emotecount}`)
    message.ui.append(message._text.detach(), message._combo.detach())
}
const ChatEmoteMessageCountThrottle = throttle(63, ChatEmoteMessageCount)

class ChatEmoteMessage extends ChatMessage {

    constructor(emote, timestamp, count=1){
        super(emote, timestamp, MessageTypes.EMOTE)
        this.emotecount = count
    }

    html(chat=null){
        this._text          = $(`<span class="text">${formatters.get('emote').format(chat, this.message, this)}</span>`)
        this._combo         = $(`<span class="chat-combo"></span>`)
        this._combo_count   = $(`<i class="count">${this.emotecount}</i>`)
        this._combo_x       = $(`<i class="x">X</i>`)
        this._combo_hits    = $(`<i class="hit">Hits</i>`)
        this._combo_txt     = $(`<i class="combo">C-C-C-COMBO</i>`)
        return this.wrap(this.buildTime())
    }

    afterRender(chat=null){
        this._combo.append(this._combo_count, ' ', this._combo_x, ' ', this._combo_hits, ' ', this._combo_txt)
        this.ui.append(this._text, this._combo)
    }

    incEmoteCount(){
        ++this.emotecount
        ChatEmoteMessageCountThrottle(this)
    }

    completeCombo(){
        ChatEmoteMessageCount(this)
        this._combo.attr('class', this._combo.attr('class') + ' combo-complete')
        this._combo = this._combo_count = this._combo_x = this._combo_hits = this._combo_txt = null
    }

}

export {
    MessageBuilder,
    MessageTypes,
    ChatMessage
};
