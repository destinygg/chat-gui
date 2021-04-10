/* global window, document */

import {fetch} from 'whatwg-fetch'
import {Notification} from './notification'
import $ from 'jquery'
import {KEYCODES,DATE_FORMATS,isKeyCode} from './const'
import {debounce} from 'throttle-debounce'
import moment from 'moment'
import EventEmitter from './emitter'
import ChatSource from './source'
import ChatUser from './user'
import {MessageBuilder, MessageTypes, ChatMessage} from './messages'
import {ChatMenu, ChatUserMenu, ChatWhisperUsers, ChatEmoteMenu, ChatSettingsMenu} from './menus'
import ChatAutoComplete from './autocomplete'
import ChatInputHistory from './history'
import ChatUserFocus from './focus'
import ChatStore from './store'
import Settings from './settings'
import ChatWindow from './window'
import {ChatVote, parseQuestionAndTime} from './vote'
import {isMuteActive, MutedTimer} from './mutedtimer'

const regexslashcmd = /^\/([a-z0-9]+)[\s]?/i
const regextime = /(\d+(?:\.\d*)?)([a-z]+)?/ig
const regexsafe = /[\-\[\]\/{}()*+?.\\^$|]/g
const nickmessageregex = /(?:(?:^|\s)@?)([a-zA-Z0-9_]{3,20})(?=$|\s|[.?!,])/g
const nickregex = /^[a-zA-Z0-9_]{3,20}$/
const nsfwnsflregex = new RegExp(`\\b(?:NSFL|NSFW)\\b`, 'i')
const nsfwregex = new RegExp(`\\b(?:NSFW)\\b`, 'i')
const nsflregex = new RegExp(`\\b(?:NSFL)\\b`, 'i')
const tagcolors = ['green', 'yellow', 'orange', 'red', 'purple', 'blue', 'sky', 'lime', 'pink', 'black']
const errorstrings = new Map([
    ['unknown', 'Unknown error, this usually indicates an internal problem :('],
    ['nopermission', 'You do not have the required permissions to use that'],
    ['protocolerror', 'Invalid or badly formatted'],
    ['needlogin', 'You have to be logged in to use that'],
    ['invalidmsg', 'The message was invalid'],
    ['throttled', 'Throttled! You were trying to send messages too fast'],
    ['duplicate', 'The message is identical to the last one you sent'],
    ['submode', 'The channel is currently in subscriber only mode'],
    ['needbanreason', 'Providing a reason for the ban is mandatory'],
    ['privmsgbanned', 'Cannot send private messages while banned'],
    ['requiresocket', 'This chat requires WebSockets'],
    ['toomanyconnections', 'Only 5 concurrent connections allowed'],
    ['socketerror', 'Error contacting server'],
    ['privmsgaccounttooyoung', 'Your account is too recent to send private messages'],
    ['notfound', 'The user was not found'],
    ['notconnected', 'You have to be connected to use that']
])
const hintstrings = new Map([
    ['slashhelp', 'Type in /help for more a list of commands, do advanced things like modify your scroll-back size'],
    ['tabcompletion', 'Use the tab key to auto-complete names and emotes (for user only completion prepend a @ or press shift)'],
    ['hoveremotes', 'Hovering your mouse over an emote will show you the emote code'],
    ['highlight', 'Chat messages containing your username will be highlighted'],
    ['notify', 'Use /msg <username> to send a private message to someone'],
    ['ignoreuser', 'Use /ignore <username> to hide messages from pesky chatters'],
    ['mutespermanent', 'Mutes are never persistent, don\'t worry it will pass!'],
    ['tagshint', `Use the /tag <nick> [<color> <note>] to tag users you like. There are preset colors to choose from ${tagcolors.join(', ')}`],
    ['bigscreen', `Bigscreen! Did you know you can have the chat on the left or right side of the stream by clicking the swap icon in the top left?`]
])
const settingsdefault = new Map([
    ['schemaversion', 2],
    ['showtime', false],
    ['hideflairicons', false],
    ['profilesettings', false],
    ['timestampformat', 'HH:mm'],
    ['maxlines', 250],
    ['notificationwhisper', false],
    ['notificationhighlight', false],
    ['highlight', true], // todo rename this to `highlightself` or something
    ['customhighlight', []],
    ['highlightnicks', []],
    ['taggednicks', []],
    ['taggednotes', []],
    ['showremoved', 0], // 0 = false (removes), 1 = true (censor), 2 = do nothing
    ['showhispersinchat', false],
    ['ignorenicks', []],
    ['focusmentioned', false],
    ['notificationtimeout', true],
    ['ignorementions', false],
    ['autocompletehelper', true],
    ['taggedvisibility', false],
    ['hidensfw', false],
    ['hidensfl', false],
    ['fontscale', 'auto']
])
const commandsinfo = new Map([
    ['help', {
        desc: 'Helpful information.'
    }],
    ['emotes', {
        desc: 'A list of the chats emotes in text form.'
    }],
    ['me', {
        desc: 'A normal message, but emotive.'
    }],
    ['message', {
        desc: 'Whisper someone',
        alias: ['msg', 'whisper', 'w', 'tell', 't', 'notify']
    }],
    ['ignore', {
        desc: 'No longer see user messages, without <nick> to list the nicks ignored'
    }],
    ['unignore', {
        desc: 'Remove a user from your ignore list'
    }],
    ['highlight', {
        desc: 'Highlights target nicks messages for easier visibility'
    }],
    ['unhighlight', {
        desc: 'Unhighlight target nick'
    }],
    ['maxlines', {
        desc: 'The maximum number of lines the chat will store'
    }],
    ['mute', {
        desc: 'The users messages will be blocked from everyone.',
        admin: true
    }],
    ['unmute', {
        desc: 'Unmute the user.',
        admin: true
    }],
    ['subonly', {
        desc: 'Subscribers only',
        admin: true
    }],
    ['ban', {
        desc: 'User will no longer be able to connect to the chat.',
        admin: true
    }],
    ['unban', {
        desc: 'Unban a user',
        admin: true
    }],
    ['timestampformat', {
        desc: 'Set the time format of the chat.'
    }],
    ['tag', {
        desc: 'Mark a users messages'
    }],
    ['untag', {
        desc: 'No longer mark the users messages'
    }],
    ['exit', {
        desc: 'Exit the conversation you are in.'
    }],
    ['reply', {
        desc: 'Reply to the last private message.',
        alias: ['r']
    }],
    ['stalk', {
        desc: 'Return a list of messages from <nick>',
        alias: ['s']
    }],
    ['mentions', {
        desc: 'Return a list of messages where <nick> is mentioned',
        alias: ['m']
    }],
    ['vote', {
        desc: 'Start a vote.'
    }],
    ['votestop', {
        desc: 'Stop a vote you started.'
    }],
    ['svote', {
        desc: 'Start a sub-weighted vote.'
    }],
])
const banstruct = {
    id: 0,
    userid: 0,
    username: '',
    targetuserid: '',
    targetusername: '',
    ipaddress: '',
    reason: '',
    starttimestamp: '',
    endtimestamp: ''
}

class Chat {

    constructor(config){
        this.config = Object.assign({}, {
            url: '',
            api: {base: ''},
            cdn: {base: ''},
            cacheKey: '',
            banAppealUrl: null
        }, config)
        this.ui = null;
        this.css = null;
        this.output = null;
        this.input = null;
        this.loginscrn = null;
        this.loadingscrn = null;
        this.showmotd = true;
        this.authenticated = false;
        this.backlogloading = false;
        this.unresolved = [];

        this.flairs = new Set();
        this.emotes = new Set();
        this.flairsMap = new Map();
        this.emotesMap = new Map();
        this.emotePrefixes = new Set();
        this.emoteRegexNormal = null;
        this.emoteRegexTwitch = null;

        this.user = new ChatUser();
        this.users = new Map();
        this.whispers = new Map();
        this.windows = new Map();
        this.settings = new Map(settingsdefault);
        this.autocomplete = new ChatAutoComplete();
        this.menus = new Map();
        this.taggednicks = new Map();
        this.taggednotes = new Map();
        this.ignoring = new Set();
        this.mainwindow = null;
        this.regexhighlightcustom = null;
        this.regexhighlightnicks = null;
        this.regexhighlightself = null;
        this.replyusername = null;

        // An interface to tell the chat to do things via chat commands, or via emit
        // e.g. control.emit('CONNECT', 'ws://localhost:9001') is essentially chat.cmdCONNECT('ws://localhost:9001')
        this.control = new EventEmitter(this);

        // The websocket connection, emits events from the chat server
        this.source = new ChatSource();

        this.source.on('REFRESH', () => window.location.reload(false));
        this.source.on('PING', data => this.source.send('PONG', data));
        this.source.on('CONNECTING', data => this.onCONNECTING(data));
        this.source.on('OPEN', data => this.onOPEN(data));
        this.source.on('DISPATCH', data => this.onDISPATCH(data));
        this.source.on('CLOSE', data => this.onCLOSE(data));
        this.source.on('NAMES', data => this.onNAMES(data));
        this.source.on('QUIT', data => this.onQUIT(data));
        this.source.on('MSG', data => this.onMSG(data));
        this.source.on('MUTE', data => this.onMUTE(data));
        this.source.on('UNMUTE', data => this.onUNMUTE(data));
        this.source.on('BAN', data => this.onBAN(data));
        this.source.on('UNBAN', data => this.onUNBAN(data));
        this.source.on('ERR', data => this.onERR(data));
        this.source.on('SOCKETERROR', data => this.onSOCKETERROR(data));
        this.source.on('SUBONLY', data => this.onSUBONLY(data));
        this.source.on('BROADCAST', data => this.onBROADCAST(data));
        this.source.on('PRIVMSGSENT', data => this.onPRIVMSGSENT(data));
        this.source.on('PRIVMSG', data => this.onPRIVMSG(data));
        this.source.on('VOTE', data => this.onVOTE(data));
        this.source.on('VOTESTOP', data => this.onVOTESTOP(data));
        this.source.on('VOTECAST', data => this.onVOTECAST(data));

        this.control.on('SEND', data => this.cmdSEND(data));
        this.control.on('HINT', data => this.cmdHINT(data));
        this.control.on('EMOTES', data => this.cmdEMOTES(data));
        this.control.on('HELP', data => this.cmdHELP(data));
        this.control.on('IGNORE', data => this.cmdIGNORE(data));
        this.control.on('UNIGNORE', data => this.cmdUNIGNORE(data));
        this.control.on('MUTE', data => this.cmdMUTE(data));
        this.control.on('BAN', data => this.cmdBAN(data, 'BAN'));
        this.control.on('IPBAN', data => this.cmdBAN(data, 'IPBAN'));
        this.control.on('UNMUTE', data => this.cmdUNBAN(data, 'UNMUTE'));
        this.control.on('UNBAN', data => this.cmdUNBAN(data, 'UNBAN'));
        this.control.on('SUBONLY', data => this.cmdSUBONLY(data, 'SUBONLY'));
        this.control.on('MAXLINES', data => this.cmdMAXLINES(data, 'MAXLINES'));
        this.control.on('UNHIGHLIGHT', data => this.cmdHIGHLIGHT(data, 'UNHIGHLIGHT'));
        this.control.on('HIGHLIGHT', data => this.cmdHIGHLIGHT(data, 'HIGHLIGHT'));
        this.control.on('TIMESTAMPFORMAT', data => this.cmdTIMESTAMPFORMAT(data));
        this.control.on('BROADCAST', data => this.cmdBROADCAST(data));
        this.control.on('CONNECT', data => this.cmdCONNECT(data));
        this.control.on('TAG', data => this.cmdTAG(data));
        this.control.on('UNTAG', data => this.cmdUNTAG(data));
        this.control.on('BANINFO', data => this.cmdBANINFO(data));
        this.control.on('EXIT', data => this.cmdEXIT(data));
        this.control.on('MESSAGE', data => this.cmdWHISPER(data));
        this.control.on('MSG', data => this.cmdWHISPER(data));
        this.control.on('WHISPER', data => this.cmdWHISPER(data));
        this.control.on('W', data => this.cmdWHISPER(data));
        this.control.on('TELL', data => this.cmdWHISPER(data));
        this.control.on('T', data => this.cmdWHISPER(data));
        this.control.on('NOTIFY', data => this.cmdWHISPER(data));
        this.control.on('R', data => this.cmdREPLY(data));
        this.control.on('REPLY', data => this.cmdREPLY(data));
        this.control.on('MENTIONS', data => this.cmdMENTIONS(data));
        this.control.on('M', data => this.cmdMENTIONS(data));
        this.control.on('STALK', data => this.cmdSTALK(data));
        this.control.on('S', data => this.cmdSTALK(data));
        this.control.on('VOTE', data => this.cmdVOTE(data, 'VOTE'));
        this.control.on('SVOTE', data => this.cmdVOTE(data, 'SVOTE'));
        this.control.on('V', data => this.cmdVOTE(data, 'VOTE'));
        this.control.on('VOTESTOP', data => this.cmdVOTESTOP(data));
        this.control.on('VS', data => this.cmdVOTESTOP(data));
        return this;
    }

    setUser(user){
        if (!user || user.username === '') {
            this.user = this.addUser({nick: 'User' + Math.floor(Math.random() * (99999 - 10000 + 1)) + 10000})
            this.authenticated = false
        } else {
            this.user = this.addUser(user)
            this.authenticated = true
        }
        this.setDefaultPlaceholderText()
        return this
    }

    setSettings(settings){
        // If authed and #settings.profilesettings=true use #settings
        // Else use whats in LocalStorage#chat.settings
        let stored = settings !== null && this.authenticated && settings.get('profilesettings') ? settings : new Map(ChatStore.read('chat.settings') || [])

        // Loop through settings and apply any settings found in the #stored data
        if(stored.size > 0) {
            [...this.settings.keys()]
                .filter(k => stored.get(k) !== undefined && stored.get(k) !== null)
                .forEach(k => this.settings.set(k, stored.get(k)))
        }
        // Upgrade if schema is out of date
        const oldversion = stored.has('schemaversion') ? parseInt(stored.get('schemaversion')): -1;
        const newversion = settingsdefault.get('schemaversion')
        if(oldversion !== -1 && newversion > oldversion) {
            Settings.upgrade(this, oldversion, newversion)
            this.settings.set('schemaversion', newversion)
            this.saveSettings()
        }

        this.taggednicks = new Map(this.settings.get('taggednicks'))
        this.taggednotes = new Map(this.settings.get('taggednotes'))
        this.ignoring = new Set(this.settings.get('ignorenicks'))
        return this.applySettings(false)
    }

    withGui(template, appendTo = null){

        this.ui = $(template)
        this.ui.prependTo(appendTo || 'body')

        // We use this style sheet to apply GUI updates via css (e.g. user focus)
        this.css = (() => {
            const link = document.createElement('style');
            link.id = 'chat-styles'
            link.type = 'text/css'
            document.getElementsByTagName('head')[0].appendChild(link);
            return link['sheet']
        })()

        this.ishidden = (document['visibilityState'] || 'visible') !== 'visible'
        this.output = this.ui.find('#chat-output-frame')
        this.input = this.ui.find('#chat-input-control')
        this.loginscrn = this.ui.find('#chat-login-screen')
        this.loadingscrn = this.ui.find('#chat-loading')
        this.windowselect = this.ui.find('#chat-windows-select')
        this.inputhistory = new ChatInputHistory(this)
        this.userfocus = new ChatUserFocus(this, this.css)
        this.mainwindow = new ChatWindow('main').into(this)
        this.mutedtimer = new MutedTimer(this)

        this.ui.find('#chat-vote-frame:first').each((i, e) => {
            this.chatvote = new ChatVote(this, $(e))
        });

        this.windowToFront('main')

        this.menus.set('settings', new ChatSettingsMenu(this.ui.find('#chat-settings'), this.ui.find('#chat-settings-btn'), this))
        this.menus.set('emotes', new ChatEmoteMenu(this.ui.find('#chat-emote-list'), this.ui.find('#chat-emoticon-btn'), this))
        this.menus.set('users', new ChatUserMenu(this.ui.find('#chat-user-list'), this.ui.find('#chat-users-btn'), this))
        this.menus.set('whisper-users', new ChatWhisperUsers(this.ui.find('#chat-whisper-users'), this.ui.find('#chat-whisper-btn'), this))

        commandsinfo.forEach((a, k) => {
            this.autocomplete.add(`/${k}`);
            (a['alias'] || []).forEach(k => this.autocomplete.add(`/${k}`))
        });

        this.autocomplete.bind(this)

        // Chat input
        this.input.on('keypress', e => {
            if(isKeyCode(e, KEYCODES.ENTER) && !e.shiftKey && !e.ctrlKey) {
                e.preventDefault()
                e.stopPropagation()
                this.control.emit('SEND', this.input.val().toString().trim())
                this.input.focus()
            }
        })

        // Chat focus / menu close when clicking on some areas
        let downinoutput = false
        this.output.on('mousedown', () => downinoutput = true)
        this.output.on('mouseup', () => {
            if(downinoutput) {
                downinoutput = false
                ChatMenu.closeMenus(this)
                this.focusIfNothingSelected()
            }
        })
        this.ui.on('click', '#chat-tools-wrap',() => {
            ChatMenu.closeMenus(this)
            this.focusIfNothingSelected()
        })

        // ESC
        document.addEventListener('keydown', e => {
            if(isKeyCode(e, KEYCODES.ESC)) ChatMenu.closeMenus(this) // ESC key
        })

        // Visibility
        document.addEventListener('visibilitychange', debounce(100, false, () => {
            this.ishidden = (document['visibilityState'] || 'visible') !== 'visible'
            if(!this.ishidden)
                this.focusIfNothingSelected()
            else
                ChatMenu.closeMenus(this)
        }), true)

        // Resize
        let resizing = false
        const onresizecomplete = debounce(100, false, () => {
            resizing = false
            this.getActiveWindow().unlock()
            this.focusIfNothingSelected()
        })
        const onresize = () => {
            if(!resizing) {
                resizing = true
                ChatMenu.closeMenus(this)
                this.getActiveWindow().lock()
            }
            onresizecomplete()
        }
        window.addEventListener('resize', onresize, false)

        // Chat user whisper tabs
        this.windowselect.on('click', '.tab-close', e => {
            ChatMenu.closeMenus(this)
            this.removeWindow($(e.currentTarget).parent().data('name').toLowerCase())
            this.input.focus()
            return false
        })
        this.windowselect.on('click', '.tab', e => {
            ChatMenu.closeMenus(this)
            this.windowToFront($(e.currentTarget).data('name').toLowerCase())
            this.input.focus()
            return false
        })

        // Censored
        this.output.on('click', '.censored', e => {
            const nick = $(e.currentTarget).closest('.msg-user').data('username')
            this.getActiveWindow()
                .getlines(`.censored[data-username="${nick}"]`)
                .removeClass('censored')
            return false
        })

        // Login
        this.loginscrn.on('click', '#chat-btn-login', () => {
            this.loginscrn.hide()
            try { window.top['showLoginModal']() } catch(e){
                const uri = location.protocol+'//'+location.hostname+(location.port ? ':'+location.port: '')
                try {
                    if(window.self === window.top){
                        window.location.href = uri + '/login?follow=' + encodeURIComponent(window.location.pathname)
                    } else {
                        window.location.href = uri + '/login'
                    }
                    return false;
                } catch(ignored) {}
                window.location.href = uri + '/login'
            }
            return false
        })

        this.loginscrn.on('click', '#chat-btn-cancel', () => this.loginscrn.hide())
        this.output.on('click mousedown', '.msg-whisper a.user', e => {
            const msg = $(e.target).closest('.msg-chat')
            this.openConversation(msg.data('username').toString().toLowerCase())
            return false
        })

        this.loadingscrn.fadeOut(250, () => this.loadingscrn.remove())
        this.mainwindow.updateAndPin()

        this.setDefaultPlaceholderText()
        MessageBuilder.status(`Welcome to DGG chat`).into(this)
        return Promise.resolve(this)
    }

    connect() {
        this.source.connect(this.config.url)
    }

    async loadUserAndSettings(){
        return fetch(`${this.config.api.base}/api/chat/me`, {credentials: 'include'})
            .then(res => res.json())
            .then(data => {
                this.setUser(data)
                this.setSettings(new Map(data.settings))
            })
            .catch(() => {
                this.setUser(null)
                this.setSettings()
            })
    }

    async loadEmotesAndFlairs(){
        await this.loadEmotes();
        await this.loadFlairs();
    }

    async loadEmotes(){
        Chat.loadCss(`${this.config.cdn.base}/emotes/emotes.css?_=${this.config.cacheKey}`)
        return fetch(`${this.config.cdn.base}/emotes/emotes.json?_=${this.config.cacheKey}`)
            .then(res => res.json())
            .then(json => { this.setEmotes(json) })
            .catch(() => {})
    }

    async loadFlairs(){
        Chat.loadCss(`${this.config.cdn.base}/flairs/flairs.css?_=${this.config.cacheKey}`)
        return fetch(`${this.config.cdn.base}/flairs/flairs.json?_=${this.config.cacheKey}`)
            .then(res => res.json())
            .then(json => { this.setFlairs(json) })
            .catch(() => {})
    }

    async loadHistory(){
        return fetch(`${this.config.api.base}/api/chat/history`)
            .then(res => res.json())
            .then(json => { this.setHistory(json) })
            .catch(() => {})
    }

    async loadWhispers(){
        if (this.authenticated) {
            return fetch(`${this.config.api.base}/api/messages/unread`, {credentials: 'include'})
                .then(res => res.json())
                .then(d => {
                    d.forEach(e => this.whispers.set(e['username'].toLowerCase(), {
                        id: e['messageid'],
                        nick: e['username'],
                        unread: e['unread'],
                        open: false
                    }))
                })
                .then(() => this.menus.get('whisper-users').redraw())
                .catch(() => {})
        }
    }

    setEmotes(emotes) {
        this.emotes = emotes;
        this.emotesMap = new Map()
        emotes.forEach(v => this.emotesMap.set(v.prefix, v))
        const emoticons = emotes.filter(v => !v['twitch']).map(v => v['prefix']).join('|'),
            twitchemotes = emotes.filter(v => v['twitch']).map(v => v['prefix']).join('|')
        this.emoteRegexNormal = new RegExp(`(^|\\s)(${emoticons})(?=$|\\s)`, 'gm')
        this.emoteRegexTwitch = new RegExp(`(^|\\s)(${emoticons}|${twitchemotes})(?=$|\\s)`, 'gm')
        this.emotePrefixes = new Set([...emotes.map(v => v['prefix'])])
        this.emotePrefixes.forEach(e => this.autocomplete.add(e, true))
        return this;
    }

    setFlairs(flairs) {
        this.flairs = flairs;
        this.flairsMap = new Map()
        flairs.forEach(v => this.flairsMap.set(v.name, v))
        return this
    }

    setHistory(history) {
        if(history && history.length > 0) {
            this.backlogloading = true;
            history.forEach(line => this.source.parseAndDispatch({data: line}));
            this.backlogloading = false;
            MessageBuilder.element('<hr/>').into(this);
            this.mainwindow.updateAndPin();
        }
        return this;
    }

    saveSettings(){
        if(this.authenticated){
            if(this.settings.get('profilesettings')) {
                fetch(`${this.config.api.base}/api/chat/me/settings`, {
                    body: JSON.stringify([...this.settings]),
                    credentials: 'include',
                    method: 'POST',
                }).catch(console.warn)
            } else {
                ChatStore.write('chat.settings', this.settings);
            }
        } else {
            ChatStore.write('chat.settings', this.settings);
        }
    }

    // De-bounced saveSettings
    commitSettings(){
        if(!this.debouncedsave) {
            this.debouncedsave = debounce(1000, false, () => this.saveSettings());
        }
        this.debouncedsave();
    }

    // Save settings if save=true then apply current settings to chat
    applySettings(save=true){
        if(save) this.saveSettings();

        // Formats
        DATE_FORMATS.TIME = this.settings.get('timestampformat');

        // Ignore Regex
        const ignores = Array.from(this.ignoring.values()).map(Chat.makeSafeForRegex);
        this.ignoreregex = ignores.length > 0 ? new RegExp(`\\b(?:${ignores.join('|')})\\b`, 'i') : null;

        // Highlight Regex
        const cust = [...(this.settings.get('customhighlight') || [])].filter(a => a !== '');
        const nicks = [...(this.settings.get('highlightnicks') || [])].filter(a => a !== '');
        this.regexhighlightself = this.user.nick ? new RegExp(`\\b(?:${this.user.nick})\\b`, 'i') : null;
        this.regexhighlightcustom = cust.length > 0 ? new RegExp(`\\b(?:${cust.join('|')})\\b`, 'i') : null;
        this.regexhighlightnicks = nicks.length > 0 ? new RegExp(`\\b(?:${nicks.join('|')})\\b`, 'i') : null;

        // Settings Css
        Array.from(this.settings.keys())
            .filter(key => typeof this.settings.get(key) === 'boolean')
            .forEach(key => this.ui.toggleClass(`pref-${key}`, this.settings.get(key)));

        // Update maxlines
        [...this.windows.values()].forEach(w => w.maxlines = this.settings.get('maxlines'));

        // Font scaling
        // TODO document.body :(
        const fontscale = this.settings.get('fontscale') || 'auto'
        $(document.body).toggleClass(`pref-fontscale`, fontscale !== 'auto')
        $(document.body).attr('data-fontscale', fontscale)
        return Promise.resolve(this);
    }

    addUser(data){
        if(!data)
            return null;
        const normalized = data.nick.toLowerCase()
        let user = this.users.get(normalized)
        if (!user) {
            user = new ChatUser(data)
            this.users.set(normalized, user)
        } else if (data.hasOwnProperty('features') && !Chat.isArraysEqual(data.features, user.features)) {
            user.features = data.features
        }
        return user
    }

    addMessage(message, win=null){
        // Don't add the gui if user is ignored
        if (message.type === MessageTypes.USER && this.ignored(message.user.nick, message.message))
            return

        if(win === null)
            win = this.mainwindow
        win.lock()

        // Break the current combo if this message is not an emote
        // We don't need to check what type the current message is, we just know that its a new message, so the combo is invalid.
        if(win.lastmessage && win.lastmessage.type === MessageTypes.EMOTE && win.lastmessage.emotecount > 1)
            win.lastmessage.completeCombo()

        // Populate the tag, mentioned users and highlight for this $message.
        if(message.type === MessageTypes.USER){
            // check if message is `/me `
            message.slashme = message.message.substring(0, 4).toLowerCase() === '/me '
            // check if this is the current users message
            message.isown = message.user.username.toLowerCase() === this.user.username.toLowerCase()
            // check if the last message was from the same user
            message.continued = win.lastmessage && !win.lastmessage.target && win.lastmessage.user && win.lastmessage.user.username.toLowerCase() === message.user.username.toLowerCase()
            // get mentions from message
            message.mentioned = Chat.extractNicks(message.message).filter(a => this.users.has(a.toLowerCase()))
            // set tagged state
            message.tag = this.taggednicks.get(message.user.nick.toLowerCase());
            // set tagged note
            message.title = this.taggednotes.get(message.user.nick.toLowerCase()) || '';
            // set highlighted state
            message.highlighted = /*this.authenticated && */!message.isown && (
                // Check current user nick against msg.message (if highlight setting is on)
                (this.regexhighlightself && this.settings.get('highlight') && this.regexhighlightself.test(message.message)) ||
                // Check /highlight nicks against msg.nick
                (this.regexhighlightnicks && this.regexhighlightnicks.test(message.user.username)) ||
                // Check custom highlight against msg.nick and msg.message
                (this.regexhighlightcustom && this.regexhighlightcustom.test(message.user.username + ' ' + message.message))
            );
        }

        // This looks odd, although it would be a correct implementation
        /* else if(win.lastmessage && win.lastmessage.type === message.type && [MessageTypes.ERROR,MessageTypes.INFO,MessageTypes.COMMAND,MessageTypes.STATUS].indexOf(message.type)){
            message.continued = true
        }*/

        // The point where we actually add the message dom
        win.addMessage(this, message)

        // Show desktop notification
        if(!this.backlogloading && message.highlighted && this.settings.get('notificationhighlight') && this.ishidden) {
            Chat.showNotification(
                `${message.user.username} said ...`,
                message.message,
                message.timestamp.valueOf(),
                this.settings.get('notificationtimeout')
            )
        }

        win.unlock()
        return message
    }

    resolveMessage(nick, str){
        for(const message of this.unresolved){
            if(this.user.username.toLowerCase() === nick.toLowerCase() && message.message === str){
                this.unresolved.splice(this.unresolved.indexOf(message), 1)
                return true
            }
        }
        return false
    }

    removeMessageByNick(nick){
        this.mainwindow.lock()
        this.mainwindow.removelines(`.msg-chat[data-username="${nick.toLowerCase()}"]`)
        this.mainwindow.unlock()
    }


    windowToFront(name){
        const win = this.windows.get(name)
        if(win !== null && win !== this.getActiveWindow()) {
            this.windows.forEach(w => {
                if(w.visible) {
                    if(!w.locked()) w.lock()
                    w.hide()
                }
            })
            win.show()
            if(win.locked()) win.unlock()
            this.redrawWindowIndicators()
        }

        if (win.name === 'main' && this.mutedtimer.ticking) {
            this.mutedtimer.updatePlaceholderText()
        } else {
            this.setDefaultPlaceholderText()
        }

        return win
    }

    getActiveWindow(){
        return [...this.windows.values()].filter(win => win.visible)[0];
    }

    getWindow(name){
        return this.windows.get(name);
    }

    addWindow(name, win){
        this.windows.set(name, win);
        this.redrawWindowIndicators();
    }

    removeWindow(name){
        const win = this.windows.get(name);
        if(win) {
            const visible = win.visible;
            this.windows.delete(name);
            win.destroy();
            if(visible) {
                const keys = [...this.windows.keys()];
                this.windowToFront(this.windows.get(keys[keys.length-1]).name);
            } else {
                this.redrawWindowIndicators();
            }
        }
    }

    redrawWindowIndicators(){
        if(this.windows.size > 1) {
            this.windowselect.empty();
            this.windows.forEach(w => {
                if(w.name === 'main'){
                    this.windowselect.append(`<span title="Destiny GG" data-name="main" class="tab win-main tag-${w.tag} ${w.visible? 'active' :''}"><i class="dgg-icon"></i></span>`)
                } else {
                    const conv = this.whispers.get(w.name)
                    this.windowselect.append(`<span title="${w.label}" data-name="${w.name}" class="tab win-${w.name} tag-${w.tag} ${w.visible? 'active' :''} ${conv.unread>0? 'unread' :''}">
                    <span>${w.label}${conv.unread>0? ' ('+conv.unread+')': ''}</span>
                    <i class="tab-close" title="Close" />
                    </span>`)
                }
            });
        }
        // null check on main window, since main window calls this during initialization
        if(this.mainwindow !== null)
            this.mainwindow.lock()

        this.windowselect.toggle(this.windows.size > 1)

        if(this.mainwindow !== null)
            this.mainwindow.unlock()
    }

    censor(nick){
        this.mainwindow.lock()
        const c = this.mainwindow.getlines(`.msg-chat[data-username="${nick.toLowerCase()}"]`)
        switch(parseInt(this.settings.get('showremoved') || 1)) {
            case 0: // remove
                c.remove()
                break
            case 1: // censor
                c.addClass('censored')
                break
            case 2: // do nothing
                break
        }
        this.mainwindow.unlock()
    }

    ignored(nick, text=null){
        let ignore = this.ignoring.has(nick.toLowerCase());
        if (!ignore && text !== null) {
            return (this.settings.get('ignorementions') && this.ignoreregex && this.ignoreregex.test(text))
                || (this.settings.get('hidensfw') && this.settings.get('hidensfl') && nsfwnsflregex.test(text))
                || (this.settings.get('hidensfl') && nsflregex.test(text))
                || (this.settings.get('hidensfw') && nsfwregex.test(text))
        }
        return ignore
    }

    ignore(nick, ignore=true){
        nick = nick.toLowerCase();
        const exists = this.ignoring.has(nick);
        if(ignore && !exists){
            this.ignoring.add(nick);
        } else if(!ignore && exists) {
            this.ignoring.delete(nick);
        }
        this.settings.set('ignorenicks', [...this.ignoring]);
        this.applySettings();
    }

    focusIfNothingSelected() {
        if (this['debounceFocus'] === undefined) {
            this['debounceFocus'] = debounce(10, false, c => c.input.focus())
        }
        if(window.getSelection().isCollapsed && !this.input.is(':focus')) {
            this['debounceFocus'](this);
        }
    }

    setDefaultPlaceholderText() {
        const placeholderText = this.authenticated ? `Write something ${this.user.username} ...` : `Write something ...`
        this.input.attr('placeholder', placeholderText)
    }

    /**
     * EVENTS
     */

    onDISPATCH({data}){
        if (typeof data === 'object'){
            let users = [];
            const now = Date.now();
            if(data.hasOwnProperty('nick'))
                users.push(this.addUser(data));
            if(data.hasOwnProperty('users'))
                users = users.concat(Array.from(data.users).map(d => this.addUser(d)));
            users.forEach(u => this.autocomplete.add(u.nick, false, now));
        }
    }

    onCLOSE({retryMilli}){
        // https://www.iana.org/assignments/websocket/websocket.xml#close-code-number
        // const code = e.event.code || 1006
        if(retryMilli > 0)
            MessageBuilder.error(`Disconnected, retry in ${Math.round(retryMilli/1000)} seconds ...`).into(this)
        else
            MessageBuilder.error(`Disconnected.`).into(this)
    }

    onCONNECTING(url){
        if (this.authenticated) {
            MessageBuilder.status(`Connecting as ${this.user.username} to ${Chat.extractHostname(url)} ...`).into(this)
        } else {
            MessageBuilder.status(`Connecting to ${Chat.extractHostname(url)} ...`).into(this)
        }
    }

    onOPEN(){
        //MessageBuilder.status(`Connection established.`).into(this)
    }

    onNAMES(data){
        MessageBuilder.status(`Connected. serving ${data['connectioncount']||0} connections and ${data['users'].length} users.`).into(this);
        if(this.showmotd) {
            this.cmdHINT([Math.floor(Math.random() * hintstrings.size)]);
            this.showmotd = false;
        }
    }

    onQUIT(data){
        const normalized = data.nick.toLowerCase();
        if (this.users.has(normalized)){
            this.users.delete(normalized);
            this.autocomplete.remove(data.nick, true);
        }
    }

    onMSG(data){
        const textonly = Chat.removeSlashCmdFromText(data.data)
        const usr = this.users.get(data.nick.toLowerCase())

        // Checking if old messages are loading avoids starting votes for cached
        // `/vote` commands.
        if (!this.backlogloading) {
            // Voting is processed entirely in clients through messages with
            // type `MSG`, but we emit `VOTE`, `VOTESTOP`, and `VOTECAST`
            // events to mimic server involvement.
            if (this.chatvote.isMsgVoteStartFmt(data.data)) {
                this.source.emit('VOTE', data)
                return
            } else if (this.chatvote.isMsgVoteStopFmt(data.data)) {
                this.source.emit('VOTESTOP', data)
                return
            } else if (this.chatvote.isVoteStarted() && this.chatvote.isMsgVoteCastFmt(data.data)) {
                this.source.emit(`VOTECAST`, data)
                return
            }
        }

        const win = this.mainwindow
        if(win.lastmessage !== null && this.emotePrefixes.has(textonly) && Chat.removeSlashCmdFromText(win.lastmessage.message) === textonly){
            if(win.lastmessage.type === MessageTypes.EMOTE) {
                this.mainwindow.lock()
                win.lastmessage.incEmoteCount()
                this.mainwindow.unlock()
            } else {
                win.lastmessage.ui.remove()
                MessageBuilder.emote(textonly, data.timestamp, 2).into(this)
            }
        } else if(!this.resolveMessage(data.nick, data.data)){
            MessageBuilder.message(data.data, usr, data.timestamp).into(this)
        }
    }

    onVOTE(data) {
        const usr = this.users.get(data.nick.toLowerCase())
        if (this.chatvote.isVoteStarted() || !this.chatvote.canUserStartVote(usr)) {
            return
        }

        if (this.chatvote.startVote(data.data, usr)) {
            (new ChatMessage(this.chatvote.voteStartMessage(), null, MessageTypes.INFO, true)).into(this)
        }
    }

    onVOTESTOP(data) {
        const usr = this.users.get(data.nick.toLowerCase())
        if (!this.chatvote.isVoteStarted() || !this.chatvote.canUserStopVote(usr)) {
            return
        }

        this.chatvote.endVote()
    }

    onVOTECAST(data) {
        const usr = this.users.get(data.nick.toLowerCase())
        if (!this.chatvote.canVote(usr)) {
            return
        }

        // NOTE method returns false, if the GUI is hidden
        if (this.chatvote.castVote(data.data, usr)) {
            if (data.nick === this.user.username) {
                this.chatvote.markVote(data.data)
            }
        }
    }

    onMUTE(data){
        // data.data is the nick which has been banned
        if(this.user.username.toLowerCase() === data.data.toLowerCase()) {
            MessageBuilder.command(`You have been muted by ${data.nick}.`, data.timestamp).into(this)

            // Every cached mute message calls `onMUTE()`. We perform this check
            // to avoid setting the timer for mutes that have already expired.
            if (isMuteActive(data)) {
                this.mutedtimer.setTimer(data.duration)
                this.mutedtimer.startTimer()
            }
        } else {
            MessageBuilder.command(`${data.data} muted by ${data.nick}.`, data.timestamp).into(this)
        }
        this.censor(data.data)
    }

    onUNMUTE(data){
        if(this.user.username.toLowerCase() === data.data.toLowerCase()) {
            MessageBuilder.command(`You have been unmuted by ${data.nick}.`, data.timestamp).into(this)

            this.mutedtimer.stopTimer()
        } else {
            MessageBuilder.command(`${data.data} unmuted by ${data.nick}.`, data.timestamp).into(this)
        }
    }

    onBAN(data){
        // data.data is the nick which has been banned, no info about duration
        if(this.user.username.toLowerCase() === data.data.toLowerCase()) {
            MessageBuilder.command(`You have been banned by ${data.nick}. Check your profile for more information.`, data.timestamp).into(this)
            this.cmdBANINFO();
        } else {
            MessageBuilder.command(`${data.data} banned by ${data.nick}.`, data.timestamp).into(this)
        }
        this.censor(data.data);
    }

    onUNBAN(data){
        if(this.user.username.toLowerCase() === data.data.toLowerCase()) {
            MessageBuilder.command(`You have been unbanned by ${data.nick}.`, data.timestamp).into(this)

            // Unbanning a user unmutes them, too.
            this.mutedtimer.stopTimer()
        } else {
            MessageBuilder.command(`${data.data} unbanned by ${data.nick}.`, data.timestamp).into(this)
        }
    }

    // not to be confused with an error the chat.source may send onSOCKETERROR.
    onERR(data){
        const desc = data.description
        if(desc === 'toomanyconnections' || desc === 'banned') {
            this.source.retryOnDisconnect = false
        }

        let message;

        switch (desc) {
            case 'banned':
                let messageText = 'You have been banned! Check your profile for more information. <a target="_blank" class="externallink" href="/subscribe" rel="nofollow">Subscribing</a> or <a target="_blank" class="externallink" href="/donate" rel="nofollow">donating</a> removes non-permanent bans.'

                // Append ban appeal hint if a URL was provided.
                if (this.config.banAppealUrl) {
                    messageText += ` Visit <a target="_blank" class="externallink" href="${this.config.banAppealUrl}" rel="nofollow">this page</a> to appeal.`
                }

                // Use an unformatted `ChatMessage` to preserve the message's embedded HTML.
                message = new ChatMessage(messageText, null, MessageTypes.ERROR, true);
                break;
            case 'muted':
                this.mutedtimer.setTimer(data.muteTimeLeft)
                this.mutedtimer.startTimer()

                message = MessageBuilder.error(`You are temporarily muted! You can chat again ${this.mutedtimer.getReadableDuration()}. Subscribe to remove the mute immediately.`)
                break;
            default:
                message = MessageBuilder.error(errorstrings.get(desc) || desc)
        }

        message.into(this, this.getActiveWindow())
    }

    onSOCKETERROR(e){
        // There is no information on the Error event of the socket.
        // We rely on the socket close event to tell us more about what happened.
        // MessageBuilder.error(errorstrings.get('socketerror')).into(this, this.getActiveWindow())
        // console.error(e)
    }

    onSUBONLY(data){
        const submode = data.data === 'on' ? 'enabled': 'disabled'
        MessageBuilder.command(`Subscriber only mode ${submode} by ${data.nick}`, data.timestamp).into(this)
    }

    onBROADCAST(data){
        // TODO kind of ... hackey
        if (data.data === 'reload') {
            if (!this.backlogloading) {
                const retryMilli = Math.floor(Math.random() * 30000) + 4000
                setTimeout(() => window.location.reload(true), retryMilli)
                MessageBuilder.broadcast(`Restart incoming in ${Math.round(retryMilli/1000)} seconds ...`).into(this)
            }
        } else {
            MessageBuilder.broadcast(data.data, data.timestamp).into(this)
        }
    }

    onPRIVMSGSENT(){
        if(this.mainwindow.visible) {
            MessageBuilder.info('Your message has been sent.').into(this)
        }
    }

    onPRIVMSG(data) {
        const normalized = data.nick.toLowerCase()
        if (!this.ignored(normalized, data.data)) {

            if (!this.whispers.has(normalized))
                this.whispers.set(normalized, {nick: data.nick, unread: 0, open: false})

            const conv = this.whispers.get(normalized),
                user = this.users.get(normalized) || new ChatUser(data.nick),
                messageid = data.hasOwnProperty('messageid') ? data['messageid'] : null

            if (this.settings.get('showhispersinchat'))
                MessageBuilder.whisper(data.data, user, this.user.username, data.timestamp, messageid).into(this)
            if (this.settings.get('notificationwhisper') && this.ishidden)
                Chat.showNotification(`${data.nick} whispered ...`, data.data, data.timestamp, this.settings.get('notificationtimeout'))

            const win = this.getWindow(normalized)
            if (win)
                MessageBuilder.historical(data.data, user, data.timestamp).into(this, win)
            if (win === this.getActiveWindow()) {
                fetch(`${this.config.api.base}/api/messages/msg/${messageid}/open`, {
                    credentials: 'include',
                    method: 'POST',
                }).catch(console.warn)
            } else {
                conv.unread++
            }
            this.replyusername = user.username
            this.menus.get('whisper-users').redraw()
            this.redrawWindowIndicators()
        }
    }

    /**
     * COMMANDS
     */

    cmdSEND(raw) {
        if(raw !== ''){
            const win = this.getActiveWindow(),
                matches = raw.match(regexslashcmd),
                iscommand = matches && matches.length > 1,
                ismecmd = iscommand && matches[1].toLowerCase() === 'me',
                textonly = Chat.removeSlashCmdFromText(raw);

            // COMMAND
            if (iscommand && !ismecmd) {
                const command = matches[1].toUpperCase(),
                    normalized = command.toUpperCase();

                // Clear the input and add to history, before we do the emit
                // This makes it possible for commands to change the input.value, else it would be cleared after the command is run.
                this.inputhistory.add(raw)
                this.input.val('')

                if (win !== this.mainwindow && normalized !== 'EXIT') {
                    MessageBuilder.error(`No commands in private windows. Try /exit`).into(this, win)
                } else if (this.control.listeners.has(normalized)) {
                    const parts = (raw.substring(command.length + 1) || '').match(/([^ ]+)/g)
                    this.control.emit(normalized, parts || [])
                } else {
                    MessageBuilder.error(`Unknown command. Try /help`).into(this, win)
                }
            }
            // LOGIN
            else if (!this.authenticated) {
                this.loginscrn.show()
            }
            // WHISPER
            else if (win !== this.mainwindow) {
                MessageBuilder.message(raw, this.user).into(this, win)
                this.source.send('PRIVMSG', {nick: win.name, data: raw})
                this.input.val('')
            }
            // VOTE
            else if (this.chatvote.isVoteStarted() && this.chatvote.isMsgVoteCastFmt(textonly)) {
                if (this.chatvote.canVote(this.user)) {
                    MessageBuilder.info(`Your vote has been cast!`).into(this)
                    this.source.send('MSG', {data: raw})
                    this.input.val('')
                } else {
                    MessageBuilder.error(`You have already voted!`).into(this)
                    this.input.val('')
                }
            }
            // EMOTE SPAM
            else if (this.source.isConnected() && this.emotePrefixes.has(textonly)) {
                // Its easier to deal with combos with the this.unresolved flow
                this.source.send('MSG', {data: raw})
                this.inputhistory.add(raw)
                this.input.val('')
            }
            // MESSAGE
            else {
                // We add the message to the gui immediately
                // But we will also get the MSG event, so we need to make sure we dont add the message to the gui again.
                // We do this by storing the message in the unresolved array
                // The onMSG then looks in the unresolved array for the message using the nick + message
                // If found, the message is not added to the gui, its removed from the unresolved array and the message.resolve method is run on the message
                const message = MessageBuilder.message(raw, this.user).into(this)
                this.unresolved.unshift(message)
                this.source.send('MSG', {data: raw})
                this.inputhistory.add(raw)
                this.input.val('')
            }
        }
    }

    cmdVOTE(parts, command) {
        const slashCommand = `/${command.toLowerCase()}`
        const textOnly = parts.join(' ')

        try {
            // Assume the command's format is invalid if an exception is thrown.
            parseQuestionAndTime(textOnly)
        } catch {
            MessageBuilder.info(`Usage: ${slashCommand} <question>? <option 1> or <option 2>[ or <option 3>[ or <option 4> ... [ or <option n>]]][ <time>]`).into(this);
            return
        }

        if (this.chatvote.isVoteStarted()) {
            MessageBuilder.error('Vote already started.').into(this)
            return
        } else if (!this.chatvote.canUserStartVote(this.user)) {
            MessageBuilder.error('You do not have permission to start a vote.').into(this)
            return
        }

        this.source.send('MSG', {data: `${slashCommand} ${textOnly}`})
        // TODO if the chat isn't connected, the user has no warning of this action failing
    }

    cmdVOTESTOP() {
        if (!this.chatvote.isVoteStarted()) {
            MessageBuilder.error('No vote started.').into(this)
            return
        } else if (!this.chatvote.canUserStopVote(this.user)) {
            MessageBuilder.error('You do not have permission to stop this vote.').into(this)
            return
        }

        this.source.send('MSG', {data: '/votestop'})
        // TODO if the chat isn't connected, the user has no warning of this action failing
    }

    cmdEMOTES(){
        MessageBuilder.info(`Available emoticons: ${[...this.emotes.map(v => v['prefix'])].join(', ')}`).into(this);
    }

    cmdHELP(){
        let str = `Available commands: \r`;
        commandsinfo.forEach((a, k) => {
            str += ` /${k} - ${a.desc} \r`;
        });
        MessageBuilder.info(str).into(this);
    }

    cmdHINT(parts){
        const arr = [...hintstrings];
        const i = parts && parts[0] ? parseInt(parts[0])-1 : -1;
        if(i > 0 && i < hintstrings.size){
            MessageBuilder.info(arr[i][1]).into(this);
        } else {
            if(this.lasthintindex === undefined || this.lasthintindex === arr.length - 1) {
                this.lasthintindex = 0;
            } else  {
                this.lasthintindex++;
            }
            MessageBuilder.info(arr[this.lasthintindex][1]).into(this);
        }
    }

    cmdIGNORE(parts){
        const username = parts[0] || null;
        if (!username) {
            if (this.ignoring.size <= 0) {
                MessageBuilder.info('Your ignore list is empty').into(this);
            } else {
                MessageBuilder.info(`Ignoring the following people: ${Array.from(this.ignoring.values()).join(', ')}`).into(this);
            }
        } else if (!nickregex.test(username)) {
            MessageBuilder.info('Invalid nick - /ignore <nick>').into(this);
        } else {
            this.ignore(username, true);
            this.removeMessageByNick(username);
            MessageBuilder.status(`Ignoring ${username}`).into(this);
        }
    }

    cmdUNIGNORE(parts){
        const username = parts[0] || null;
        if (!username || !nickregex.test(username)) {
            MessageBuilder.error('Invalid nick - /ignore <nick>').into(this);
        } else {
            this.ignore(username, false);
            MessageBuilder.status(`${username} has been removed from your ignore list`).into(this);
        }
    }

    cmdMUTE(parts){
        if (parts.length === 0) {
            MessageBuilder.info(`Usage: /mute <nick>[ <time>]`).into(this);
        } else if (!nickregex.test(parts[0])) {
            MessageBuilder.info(`Invalid nick - /mute <nick>[ <time>]`).into(this);
        } else {
            const duration = (parts[1]) ? Chat.parseTimeInterval(parts[1]) : null;
            if (duration && duration > 0){
                this.source.send('MUTE', {data: parts[0], duration: duration});
            } else {
                this.source.send('MUTE', {data: parts[0]});
            }
        }
    }

    cmdBAN(parts, command){
        if (parts.length === 0 || parts.length < 3) {
            MessageBuilder.info(`Usage: /${command} <nick> <time> <reason> (time can be 'permanent')`).into(this);
        } else if (!nickregex.test(parts[0])) {
            MessageBuilder.info('Invalid nick').into(this);
        } else if (!parts[2]) {
            MessageBuilder.error('Providing a reason is mandatory').into(this);
        } else {
            let payload = {
                nick   : parts[0],
                reason : parts.slice(2, parts.length).join(' ')
            };
            if(/^perm/i.test(parts[1]))
                payload.ispermanent = true;
            else
                payload.duration = Chat.parseTimeInterval(parts[1]);

            payload.banip = command === 'IPBAN';

            this.source.send('BAN', payload);
        }
    }

    cmdUNBAN(parts, command){
        if (parts.length === 0) {
            MessageBuilder.info(`Usage: /${command} nick`).into(this);
        } else if (!nickregex.test(parts[0])) {
            MessageBuilder.info('Invalid nick').into(this);
        } else {
            this.source.send(command, {data: parts[0]});
        }
    }

    cmdSUBONLY(parts, command){
        if (/on|off/i.test(parts[0])) {
            this.source.send(command.toUpperCase(), {data: parts[0].toLowerCase()});
        } else {
            MessageBuilder.error(`Invalid argument - /${command.toLowerCase()} on | off`).into(this);
        }
    }

    cmdMAXLINES(parts, command){
        if (parts.length === 0) {
            MessageBuilder.info(`Maximum lines stored: ${this.settings.get('maxlines')}`).into(this);
            return;
        }
        const newmaxlines = Math.abs(parseInt(parts[0], 10));
        if (!newmaxlines) {
            MessageBuilder.info(`Invalid argument - /${command} is expecting a number`).into(this);
        } else {
            this.settings.set('maxlines', newmaxlines);
            this.applySettings();
            MessageBuilder.info(`Set maximum lines to ${newmaxlines}`).into(this);
        }
    }

    cmdHIGHLIGHT(parts, command){
        const highlights = this.settings.get('highlightnicks');
        if (parts.length === 0) {
            if (highlights.length > 0)
                MessageBuilder.info('Currently highlighted users: ' + highlights.join(',')).into(this);
            else
                MessageBuilder.info(`No highlighted users`).into(this);
            return;
        }
        if (!nickregex.test(parts[0])) {
            MessageBuilder.error(`Invalid nick - /${command} nick`).into(this);
        }
        const nick = parts[0].toLowerCase();
        const i = highlights.indexOf(nick);
        switch(command) {
            case 'UNHIGHLIGHT':
                if(i !== -1) highlights.splice(i, 1);
                break;
            default:
            case 'HIGHLIGHT':
                if(i === -1) highlights.push(nick);
                break;
        }
        MessageBuilder.info(command.toUpperCase() === 'HIGHLIGHT' ? `Highlighting ${nick}` : `No longer highlighting ${nick}`).into(this);
        this.settings.set('highlightnicks', highlights);
        this.applySettings();
    }

    cmdTIMESTAMPFORMAT(parts){
        if (parts.length === 0) {
            MessageBuilder.info(`Current format: ${this.settings.get('timestampformat')} (the default is 'HH:mm', for more info: http://momentjs.com/docs/#/displaying/format/)`).into(this);
        } else {
            const format = parts.slice(1, parts.length);
            if ( !/^[a-z :.,-\\*]+$/i.test(format)) {
                MessageBuilder.error('Invalid format, see: http://momentjs.com/docs/#/displaying/format/').into(this);
            } else {
                MessageBuilder.info(`New format: ${this.settings.get('timestampformat')}`).into(this);
                this.settings.set('timestampformat', format);
                this.applySettings();
            }
        }
    }

    cmdBROADCAST(parts){
        this.source.send('BROADCAST', {data: parts.join(' ')});
    }

    cmdWHISPER(parts){
        if (!parts[0] || !nickregex.test(parts[0])) {
            MessageBuilder.error('Invalid nick - /msg nick message').into(this);
        } else if (parts[0].toLowerCase() === this.user.username.toLowerCase()) {
            MessageBuilder.error('Cannot send a message to yourself').into(this);
        } else {
            const data = parts.slice(1, parts.length).join(' ');
            this.replyusername = parts[0];
            this.source.send('PRIVMSG', {nick: parts[0], data: data});
        }
    }

    cmdCONNECT(parts){
        this.source.connect(parts[0]);
    }

    cmdTAG(parts){
        if (parts.length === 0){
            if(this.taggednicks.size > 0) {
                let tags = 'Tagged nicks\n\n'
                this.taggednicks.forEach((color, nick) => {
                    let note = this.taggednotes.has(nick) ? this.taggednotes.get(nick) : '';
                    tags += `    ${nick} (${color}) ${note}` + '\n'
                });
                MessageBuilder.info(tags + '\n').into(this);
            } else {
                MessageBuilder.info(`No tagged nicks.`).into(this);
            }
            MessageBuilder.info(`Usage. /tag <nick> [<color>, <note>]\n(Available colors: ${tagcolors.join(', ')})`).into(this);
            return;
        }
        if(!nickregex.test(parts[0])) {
            MessageBuilder.error('Invalid nick - /tag <nick> [<color>, <note>]').into(this);
            return;
        }
        const n = parts[0].toLowerCase();
        if(n === this.user.username.toLowerCase()){
            MessageBuilder.error('Cannot tag yourself').into(this);
            return;
        }
        if(!this.users.has(n)) {
            MessageBuilder.error('User must be present in chat to tag.').into(this);
            return;
        }

        let color = ''
        let note = ''
        if (parts[1]) {
            if (tagcolors.indexOf(parts[1]) !== -1) {
                color = parts[1]
                note = parts[2] ? parts.slice(2, parts.length).join(' ') : ''
            } else {
                color = tagcolors[Math.floor(Math.random()*tagcolors.length)]
                note = parts[1] ? parts.slice(1, parts.length).join(' ') : ''
            }
            if (note.length > 100) {
                note = note.substr(0, 100)
            }
        } else {
            color = tagcolors[Math.floor(Math.random()*tagcolors.length)]
        }


        this.mainwindow.getlines(`.msg-user[data-username="${n}"]`)
            .removeClass(Chat.removeClasses('msg-tagged'))
            .addClass(`msg-tagged msg-tagged-${color}`)
            .find('.user').attr('title', note);

        this.taggednicks.set(n, color);
        this.taggednotes.set(n, note);
        this.settings.set('taggednicks', [...this.taggednicks]);
        this.settings.set('taggednotes', [...this.taggednotes]);
        this.applySettings();
        MessageBuilder.info(`Tagged ${parts[0]} as ${color}`).into(this);
    }

    cmdUNTAG(parts){
        if (parts.length === 0){
            if(this.taggednicks.size > 0) {
                let tags = 'Tagged nicks\n\n'
                this.taggednicks.forEach((color, nick) => {
                    let note = this.taggednotes.has(nick) ? this.taggednotes.get(nick) : '';
                    tags += `    ${nick} (${color}) ${note}` + '\n'
                });
                MessageBuilder.info(tags + '\n').into(this);
            } else {
                MessageBuilder.info(`No tagged nicks.`).into(this);
            }
            MessageBuilder.info(`Usage. /untag <nick>`).into(this);
            return;
        }
        if(!nickregex.test(parts[0])) {
            MessageBuilder.error('Invalid nick - /untag <nick> [<color>, <note>]').into(this);
            return;
        }
        const n = parts[0].toLowerCase();

        this.mainwindow.getlines(`.msg-chat[data-username="${n}"]`)
            .removeClass(Chat.removeClasses('msg-tagged'))
            .find('.user').removeAttr('title');

        this.taggednicks.delete(n);
        this.taggednotes.delete(n);
        this.settings.set('taggednicks', [...this.taggednicks]);
        this.settings.set('taggednotes', [...this.taggednotes]);
        this.applySettings();
        MessageBuilder.info(`Un-tagged ${n}`).into(this);
    }

    cmdBANINFO(){
        MessageBuilder.info('Loading ban info ...').into(this);
        fetch(`${this.config.api.base}/api/chat/me/ban`, {credentials: 'include'})
            .then(res => res.json())
            .then(data => {
                if (data === 'bannotfound') {
                    MessageBuilder.info(`You have no active bans. Thank you.`).into(this);
                    return;
                }
                const b = Object.assign({}, banstruct, data);
                const by = b.username ? b.username : 'Chat';
                const start = moment(b.starttimestamp).format(DATE_FORMATS.FULL);
                if (!b.endtimestamp) {
                    MessageBuilder.info(`Permanent ban by ${by} started on ${start}.`).into(this);
                } else {
                    const end = moment(b.endtimestamp).calendar();
                    MessageBuilder.info(`Temporary ban by ${by} started on ${start} and ending by ${end}`).into(this);
                }
                if (b.reason) {
                    const m = MessageBuilder.message(b.reason, new ChatUser(by), b.starttimestamp)
                    m.historical = true
                    m.into(this)
                }
                MessageBuilder.info(`End of ban information`).into(this);
            })
            .catch(() => MessageBuilder.error('Error loading ban info. Check your profile.').into(this));
    }

    cmdEXIT(){
        const win = this.getActiveWindow()
        if(win !== this.mainwindow) {
            this.windowToFront(this.mainwindow.name)
            this.removeWindow(win.name)
        }
    }

    cmdREPLY(){
        const win = this.getActiveWindow()
        const lastuser = win.lastmessage && win.lastmessage.user ? win.lastmessage.user.username : null;
        const username = this.replyusername !== null && this.replyusername !== '' ? this.replyusername : lastuser;
        if (username === null) {
            MessageBuilder.info(`No-one to reply to :(`).into(this);
        } else {
            this.input.val(`/w ${username} `)
        }
        this.input.focus()
    }

    cmdSTALK(parts){
        if (parts[0] && /^\d+$/.test(parts[0])){
            parts[1] = parts[0];
            parts[0] = this.user.username;
        }
        if (!parts[0] || !nickregex.test(parts[0].toLowerCase())) {
            MessageBuilder.error('Invalid nick - /stalk <nick> <limit>').into(this);
            return;
        }
        if(this.busystalk){
            MessageBuilder.error('Still busy stalking').into(this);
            return;
        }
        if(this.nextallowedstalk && this.nextallowedstalk.isAfter(new Date())){
            MessageBuilder.error(`Next allowed stalk ${this.nextallowedstalk.fromNow()}`).into(this);
            return;
        }
        this.busystalk = true;
        const limit = parts[1] ? parseInt(parts[1]) : 3;
        MessageBuilder.info(`Getting messages for ${[parts[0]]} ...`).into(this);

        fetch(`${this.config.api.base}/api/chat/stalk?username=${encodeURIComponent(parts[0])}&limit=${limit}`, {credentials: 'include'})
            .then(res => res.json())
            .then(d => {
                if(!d || !d.lines || d.lines.length === 0) {
                    MessageBuilder.info(`No messages for ${parts[0]}`).into(this);
                } else {
                    const date = moment.utc(d.lines[d.lines.length-1]['timestamp']*1000).local().format(DATE_FORMATS.FULL);
                    MessageBuilder.info(`Stalked ${parts[0]} last seen ${date}`).into(this);
                    d.lines.forEach(a => MessageBuilder.historical(a.text, new ChatUser(d.nick), a.timestamp*1000).into(this))
                    MessageBuilder.info(`End (https://dgg.overrustlelogs.net/${parts[0]})`).into(this);
                }
            })
            .catch(() => MessageBuilder.error(`No messages for ${parts[0]} received. Try again later`).into(this))
            .then(() => {
                this.nextallowedstalk = moment().add(10, 'seconds');
                this.busystalk = false;
            });
    }

    cmdMENTIONS(parts){
        if (parts[0] && /^\d+$/.test(parts[0])){
            parts[1] = parts[0];
            parts[0] = this.user.username;
        }
        if (!parts[0]) parts[0] = this.user.username;
        if (!parts[0] || !nickregex.test(parts[0].toLowerCase())) {
            MessageBuilder.error('Invalid nick - /mentions <nick> <limit>').into(this);
            return;
        }
        if(this.busymentions){
            MessageBuilder.error('Still busy getting mentions').into(this);
            return;
        }
        if(this.nextallowedmentions && this.nextallowedmentions.isAfter(new Date())){
            MessageBuilder.error(`Next allowed mentions ${this.nextallowedmentions.fromNow()}`).into(this);
            return;
        }
        this.busymentions = true;
        const limit = parts[1] ? parseInt(parts[1]) : 3;
        MessageBuilder.info(`Getting mentions for ${[parts[0]]} ...`).into(this);
        fetch(`${this.config.api.base}/api/chat/mentions?username=${encodeURIComponent(parts[0])}&limit=${limit}`, {credentials: 'include'})
            .then(res => res.json())
            .then(d => {
                if(!d || d.length === 0) {
                    MessageBuilder.info(`No mentions for ${parts[0]}`).into(this);
                } else {
                    const date = moment.utc(d[d.length-1].date*1000).local().format(DATE_FORMATS.FULL);
                    MessageBuilder.info(`Mentions for ${parts[0]} last seen ${date}`).into(this);
                    d.forEach(a => MessageBuilder.historical(a.text, new ChatUser(a.nick), a.date*1000).into(this))
                    MessageBuilder.info(`End (https://dgg.overrustlelogs.net/mentions/${parts[0]})`).into(this);
                }
            })
            .catch(() => MessageBuilder.error(`No mentions for ${parts[0]} received. Try again later`).into(this))
            .then(() => {
                this.nextallowedmentions = moment().add(10, 'seconds');
                this.busymentions = false;
            });
    }

    openConversation(nick){
        const normalized = nick.toLowerCase(),
            conv = this.whispers.get(normalized)
        if(conv) {
            ChatMenu.closeMenus(this)
            this.windows.has(normalized) || this.createConversation(conv, nick, normalized)
            this.windowToFront(normalized)
            this.menus.get('whisper-users').redraw()
            this.input.focus()
        }
    }

    createConversation(conv, nick, normalized) {
        const user = this.users.get(normalized) || new ChatUser(nick),
            win = new ChatWindow(normalized, 'chat-output-whisper', user.nick).into(this)
        let once = true
        win.on('show', () => {
            if (once) {
                once = false
                MessageBuilder.info(`Messages between you and ${nick}`).into(this, win)
                fetch(`${this.config.api.base}/api/messages/usr/${encodeURIComponent(user.nick)}/inbox`, {credentials: 'include'})
                    .then(res => res.json())
                    .then(data => {
                        if (data.length > 0) {
                            const date = moment(data[0].timestamp).format(DATE_FORMATS.FULL)
                            MessageBuilder.info(`Last message ${date}`).into(this, win)
                            data.reverse().forEach(e => {
                                const user = this.users.get(e['from'].toLowerCase()) || new ChatUser(e['from'])
                                MessageBuilder.historical(e.message, user, e.timestamp).into(this, win)
                            })
                        }
                    })
                    .catch(() => MessageBuilder.error(`Failed to load messages :(`).into(this, win))
            }
            conv.unread = 0
            conv.open = true
        })
        win.on('hide', () => conv.open = false)
    }

    static removeSlashCmdFromText(msg){
        return msg.replace(regexslashcmd, '').trim();
    }

    static extractNicks(text){
        let match, nicks = new Set();
        while (match = nickmessageregex.exec(text)) {
            nicks.add(match[1]);
        }
        return [...nicks];
    }

    static removeClasses(search){
        return function(i, c) {
            return (c.match(new RegExp(`\\b${search}(?:[A-z-]+)?\\b`, 'g')) || []).join(' ');
        }
    }

    static isArraysEqual(a, b){
        return (!a || !b) ? (a.length !== b.length || a.sort().toString() !== b.sort().toString()) : false;
    }

    static showNotification(title, message, timestamp, timeout=false){
        if(Notification.permission === 'granted'){
            const n = new Notification(title, {
                body : message,
                tag  : `dgg${timestamp}`,
                icon : '/notifyicon.png?v2',
                dir  : 'auto'
            });
            if(timeout) setTimeout(() => n.close(), 8000);
        }
    }

    static makeSafeForRegex(str){
        return str.trim().replace(regexsafe, "\\$&");
    }

    static parseTimeInterval(str){
        let nanoseconds = 0,
            units = {
                s: 1000000000,
                sec: 1000000000, secs: 1000000000,
                second: 1000000000, seconds: 1000000000,

                m: 60000000000,
                min: 60000000000, mins: 60000000000,
                minute: 60000000000, minutes: 60000000000,

                h: 3600000000000,
                hr: 3600000000000, hrs: 3600000000000,
                hour: 3600000000000, hours: 3600000000000,

                d: 86400000000000,
                day: 86400000000000, days: 86400000000000
            };
        str.replace(regextime, function($0, number, unit) {
            number *= (unit) ? units[unit.toLowerCase()] || units.s : units.s;
            nanoseconds += +number;
        });
        return nanoseconds;
    }

    static loadCss(url) {
        const link = document.createElement('link');
        link.href = url;
        link.type = 'text/css';
        link.rel = 'stylesheet';
        link.media = 'screen';
        document.getElementsByTagName('head')[0].appendChild(link);
        return link;
    }

    static reqParam(name, url) {
        name = name.replace(/[\[\]]/g, "\\$&");
        url = location || window.location.href || null;
        const regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
            results = regex.exec(url);
        if (!results || !results[2]) return null;
        return decodeURIComponent(results[2].replace(/\+/g, " "));
    }

    static extractHostname(url) {
        let hostname = url.indexOf("://") > -1? url.split('/')[2]: url.split('/')[0];
        hostname = hostname.split(':')[0];
        hostname = hostname.split('?')[0];
        return hostname;
    }

}

export default Chat;
