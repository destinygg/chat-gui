/* global Notification */

import {fetch} from 'whatwg-fetch'
import {Notification} from './notification'
import $ from 'jquery'
import ChatUser from './user'
import ChatScrollPlugin from './scroll'
import UserFeatures from './features'
import EventEmitter from './emitter'
import {debounce} from 'throttle-debounce'
import {isKeyCode, KEYCODES} from './const'
import { MessageBuilder } from './messages'

function getSettingValue(e){
    if(e.getAttribute('type') === 'checkbox') {
        const val = $(e).is(':checked');
        return Boolean(e.hasAttribute('data-opposite') ? !val : val);
    } else if(e.getAttribute('type') === 'text' || e.nodeName.toLocaleLowerCase() === 'select') {
        return $(e).val()
    }
    return undefined
}
function setSettingValue(e, val){
    if(e.getAttribute('type') === 'checkbox') {
        $(e).prop('checked', Boolean(e.hasAttribute('data-opposite') ? !val : val))
    } else if(e.getAttribute('type') === 'text' || e.nodeName.toLocaleLowerCase() === 'select') {
        $(e).val(val)
    }
}
function userComparator(a, b){
    const u1 = this.chat.users.get(a.getAttribute('data-username').toLowerCase())
    const u2 = this.chat.users.get(b.getAttribute('data-username').toLowerCase())
    if(!u1 || !u2) return 0
    let v1, v2

    v1 = u1.hasFeature(UserFeatures.ADMIN) || u1.hasFeature(UserFeatures.VIP)
    v2 = u2.hasFeature(UserFeatures.ADMIN) || u2.hasFeature(UserFeatures.VIP)
    if (v1 > v2) return -1
    if (v1 < v2) return 1

    v1 = u1.hasFeature(UserFeatures.BOT2)
    v2 = u2.hasFeature(UserFeatures.BOT2)
    if (v1 > v2) return 1
    if (v1 < v2) return -1
    v1 = u1.hasFeature(UserFeatures.BOT)
    v2 = u2.hasFeature(UserFeatures.BOT)
    if (v1 > v2) return 1
    if (v1 < v2) return -1

    v1 = u1.hasFeature(UserFeatures.BROADCASTER) || u1.hasFeature(UserFeatures.BROADCASTER)
    v2 = u2.hasFeature(UserFeatures.BROADCASTER) || u2.hasFeature(UserFeatures.BROADCASTER)
    if (v1 > v2) return -1
    if (v1 < v2) return 1

    v1 = u1.hasFeature(UserFeatures.SUBSCRIBER) || u1.hasFeature(UserFeatures.SUBSCRIBER)
    v2 = u2.hasFeature(UserFeatures.SUBSCRIBER) || u2.hasFeature(UserFeatures.SUBSCRIBER)
    if (v1 > v2) return -1
    if (v1 < v2) return 1

    let u1Nick = u1.nick.toLowerCase(), u2Nick = u2.nick.toLowerCase()

    if (u1Nick < u2Nick) return -1
    if (u1Nick > u2Nick) return 1
    return 0
}

class ChatMenu extends EventEmitter {

    constructor(ui, btn, chat){
        super()
        this.ui = ui
        this.btn = btn
        this.chat = chat
        this.visible = false
        this.shown = false
        this.ui.find('.scrollable').each((i, e) => {
            this.scrollplugin = new ChatScrollPlugin(chat, e)
        })
        this.ui.on('click', '.close,.chat-menu-close', this.hide.bind(this))
        this.btn.on('click', e => {
            if (this.visible)
                chat.input.focus()
            this.toggle(e)
            return false
        })
    }

    show(){
        if(!this.visible){
            this.visible = true
            this.shown = true
            this.btn.addClass('active')
            this.ui.addClass('active')
            this.redraw()
            this.emit('show')
        }
    }

    hide(){
        if(this.visible){
            this.visible = false
            this.btn.removeClass('active')
            this.ui.removeClass('active')
            this.emit('hide')
        }
    }

    toggle(){
        const wasVisible = this.visible;
        ChatMenu.closeMenus(this.chat);
        if(!wasVisible) this.show();
    }

    redraw(){
        if(this.visible && this.scrollplugin) this.scrollplugin.reset();
    }

    static closeMenus(chat){
        chat.menus.forEach(m => m.hide());
    }

}

class ChatSettingsMenu extends ChatMenu {

    constructor(ui, btn, chat) {
        super(ui, btn, chat)
        this.notificationEl = this.ui.find('#chat-settings-notification-permissions')
        this.ui.on('change', 'input[type="checkbox"],select', e => this.onSettingsChange(e))
        this.ui.on('keypress blur', 'textarea[name="customhighlight"]', e => this.onCustomHighlightChange(e))
    }

    onCustomHighlightChange(e){
        if (!isKeyCode(e, KEYCODES.ENTER)) return; // not Enter
        let data = $(e.target).val().toString().split(',').map(s => s.trim())
        this.chat.settings.set('customhighlight', [...new Set(data)])
        this.chat.applySettings(false)
        this.chat.commitSettings()
    }

    onSettingsChange(e){
        const val = getSettingValue(e.target)
        const name = e.target.getAttribute('name')
        if (val !== undefined) {
            switch (name) {
                case 'profilesettings':
                    if (!val && this.chat.authenticated)
                        fetch(`${this.config.api.base}/api/chat/me/settings`, {
                            credentials: 'include',
                            method: 'DELETE'
                        }).catch(console.warn)
                    break;
                case 'notificationwhisper':
                case 'notificationhighlight':
                    if (val)
                        this.notificationPermission().then(() => this.updateNotification())
                    break;
            }
            this.chat.settings.set(name, val)
            this.chat.applySettings(false)
            this.chat.commitSettings()
        }
    }

    show(){
        if(!this.visible){
            this.ui.find('input,select').get()
                .filter(e => this.chat.settings.has(e.getAttribute('name')))
                .forEach(e => setSettingValue(e, this.chat.settings.get(e.getAttribute('name'))))
            this.ui.find('textarea[name="customhighlight"]').val(this.chat.settings.get('customhighlight') || '')
            this.updateNotification()
        }
        super.show()
    }

    updateNotification(){
        const perm = Notification.permission === 'default' ? 'required' : Notification.permission
        this.notificationEl.text(`(Permission ${perm})`)
    }

    notificationPermission(){
        return new Promise((resolve, reject) => {
            switch(Notification.permission) {
                case 'default':
                    Notification.requestPermission(permission => {
                        switch(permission) {
                            case 'granted':
                                resolve(permission);
                                break;
                            default:
                                reject(permission);
                        }
                    });
                    break;
                case 'granted':
                    resolve(Notification.permission);
                    break;
                case 'denied':
                default:
                    reject(Notification.permission);
                    break;
            }
        });
    }
}

class ChatUserMenu extends ChatMenu {

    constructor(ui, btn, chat){
        super(ui, btn, chat);
        this.searchterm = '';
        this.searchcount = 0;
        this.totalcount = 0;
        this.header = this.ui.find('h5 span');
        this.container = this.ui.find('.content:first');
        this.searchinput = this.ui.find('#chat-user-list-search .form-control:first');
        this.container.on('click', '.user', e => this.chat.userfocus.toggleFocus(e.target.getAttribute('data-username')));
        this.container.on('click', '.whisper-nick', e => {
            ChatMenu.closeMenus(this.chat);
            const value = this.chat.input.val().toString().trim();
            const username = $(e.target).parent().data('username');
            this.chat.input.val(value + (value === '' ? '':' ') +  username + ' ').focus();
            return false;
        });
        this.chat.source.on('JOIN', data => this.addAndRedraw(data.nick));
        this.chat.source.on('QUIT', data => this.removeAndRedraw(data.nick));
        this.chat.source.on('NAMES', data => this.addAll());
        this.searchinput.on('keyup', debounce(100, false, () => {
            this.searchterm = this.searchinput.val();
            this.filter();
            this.redraw();
        }));
    }

    show(){
        super.show();
        this.searchinput.focus();
    }

    redraw(){
        if(this.visible){
            const searching = this.searchterm.length > 0;
            if(searching && this.totalcount !== this.searchcount) {
                this.header.text(`Users (${this.searchcount} out of ${this.totalcount})`);
            } else {
                this.header.text(`Users (${this.totalcount})`);
            }
            this.ui.toggleClass('search-in', searching);
        }
        super.redraw();
    }

    addAll(){
        this.totalcount = 0;
        this.container.empty();
        [...this.chat.users.keys()].forEach(username => this.addElement(username));
        this.sort();
        this.filter();
        this.redraw();
    }

    addAndRedraw(username){
        if(!this.hasElement(username)){
            this.addElement(username, true);
            this.filter();
            this.redraw();
        }
    }

    removeAndRedraw(username){
        if(this.hasElement(username)){
            this.removeElement(username);
            this.redraw();
        }
    }

    removeElement(username){
        this.container.find(`.user[data-username="${username}"]`).remove();
        this.totalcount--;
    }

    addElement(username, sort=false){
        const user = this.chat.users.get(username.toLowerCase()),
             label = !user.username || user.username === '' ? 'Anonymous' : user.username,
          features = user.features.length === 0 ? 'nofeature' : user.features.join(' '),
               usr = $(`<a data-username="${user.username}" class="user ${features}"><i class="whisper-nick"></i> ${label}</a>`)
        if(sort && this.totalcount > 0) {
            // Insert item in the correct order (instead of resorting the entire list)
            const items = this.container.children('.user').get()
            let min = 0, max = items.length, index = Math.floor((min + max) / 2)
            while (max > min) {
                if (userComparator.apply(this, [usr[0], items[index]]) < 0)
                    max = index
                else
                    min = index + 1
                index = Math.floor((min + max) / 2)
            }
            usr.insertAfter(items[index])
        } else {
            this.container.append(usr)
        }
        this.totalcount++
    }

    hasElement(username){
        return this.container.find('.user[data-username="'+username+'"]').length > 0;
    }

    filter(){
        this.searchcount = 0;
        if(this.searchterm && this.searchterm.length > 0) {
            this.container.children('.user').get().forEach(a => {
                const f = a.getAttribute('data-username').toLowerCase().indexOf(this.searchterm.toLowerCase()) >= 0;
                $(a).toggleClass('found', f);
                if(f) this.searchcount++;
            });
        } else {
            this.container.children('.user').removeClass('found');
        }
    }

    sort(){
        this.container.children('.user').get()
            .sort(userComparator.bind(this))
            .forEach(a => a.parentNode.appendChild(a));
    }

}

class ChatEmoteMenu extends ChatMenu {

    constructor(ui, btn, chat) {
        super(ui, btn, chat);
        this.ui.on('click', '.emote', e => {
            ChatMenu.closeMenus(chat);
            this.selectEmote(e.currentTarget.innerText);
        });
        this.emoteMenuContent = this.ui.find('.content');
    }

    show() {
        if (!this.visible) {
            this.chat.input.focus();
        }
        super.show();
        this.buildEmoteMenu();
    }

    buildEmoteMenu() {
        this.emoteMenuContent.empty();

        for (const tier of [0, 1, 2, 3, 4]) {
            const emotes = this.chat.emoteService.emotePrefixesForTier(tier);
            if (!emotes.length) continue;

            let title = tier === 0 ? 'All Users' : `Tier ${tier} Subscribers`;
            this.emoteMenuContent.append(
                this.buildEmoteMenuSection(title, emotes)
            )
        }

        const twitchEmotes = this.chat.emoteService.twitchEmotePrefixes;
        if (twitchEmotes.length) {
            this.emoteMenuContent.append(
                this.buildEmoteMenuSection('Twitch Subscribers', twitchEmotes)
            );
        }
    }

    buildEmoteMenuSection(title, emotes) {
        return `<div>
            <div id="emote-subscribe-note">${title}</div>
            <div class="emote-group">${emotes.map(this.buildEmoteItem).join('')}</div>
        </div>`;
    }

    buildEmoteItem(emote) {
        return `<div class="emote-item"><span title="${emote}" class="emote ${emote}">${emote}</span></div>`;
    }

    selectEmote(emote){
        let value = this.chat.input.val().toString().trim();
        this.chat.input.val(value + (value === '' ? '':' ') + emote + ' ').focus();
    }

}

class ChatWhisperUsers extends ChatMenu {

    constructor(ui, btn, chat){
        super(ui, btn, chat);
        this.unread = 0;
        this.empty = $(`<span class="empty">No new whispers :(</span>`);
        this.notif = $(`<span id="chat-whisper-unread-indicator"></span>`);
        this.btn.append(this.notif);
        this.usersEl = ui.find('ul:first');
        this.usersEl.on('click', '.user', e => chat.openConversation(e.target.getAttribute('data-username')));
        this.usersEl.on('click', '.remove', e => this.removeConversation(e.target.getAttribute('data-username')))
    }

    removeConversation(nick){
        const normalized = nick.toLowerCase();
        this.chat.whispers.delete(normalized);
        this.chat.removeWindow(normalized);
        this.redraw();
    }

    updateNotification(){
        const wasunread = this.unread;
        this.unread = [...this.chat.whispers.entries()]
            .map(e => parseInt(e[1].unread))
            .reduce((a,b) => a+b, 0);
        if(wasunread < this.unread) {
            this.btn.addClass('ping');
            setTimeout(() => this.btn.removeClass('ping'), 2000);
        }
        this.notif.text(this.unread);
        this.notif.toggle(this.unread > 0);
        try{ // Add the number of unread items to the window title.
            const t = window.parent.document.title.replace(/^\([0-9]+\) /, '');
            window.parent.document.title = this.unread > 0 ? `(${this.unread}) ${t}` : `${t}`;
        }catch(ignored){console.error(ignored)}
    }

    redraw(){
        this.updateNotification(); // its always visible
        if(this.visible){
            this.usersEl.empty();
            if(this.chat.whispers.size === 0) {
                this.usersEl.append(this.empty);
            } else {
                [...this.chat.whispers.entries()].sort((a,b) => {
                    if(a[1].unread === 0) return 1;
                    else if(b[1].unread === 0) return -1;
                    else if(a[1] === b[1]) return 0;
                })
                .forEach(e => this.addConversation(e[0], e[1].unread));
            }
        }
        super.redraw();
    }

    addConversation(nick, unread){
        const user = this.chat.users.get(nick.toLowerCase()) || new ChatUser(nick)
        this.usersEl.append(`
            <li class="conversation unread-${unread}">
                <a style="flex: 1;" data-username="${user.nick.toLowerCase()}" class="user">${user.nick}</a>
                <span class="badge">${unread}</span>
                <a data-username="${user.nick.toLowerCase()}" title="Hide" class="remove"></a>
            </li>
        `)
    }

}

class ChatUserInfoMenu extends ChatMenu {

	constructor(ui, btn, chat){
        super(ui, btn, chat)

        this.clickedNick = ""
        this.messageArray = []

        this.header = this.ui.find('.toolbar span')

        this.flairList = this.ui.find('.user-info .flairs')
        this.flairSubheader = this.ui.find('.user-info h5')[0]

        this.messagesContainer = this.ui.find('.content')
        this.messagesSubheader = this.ui.find('.user-info h5')[1]

        this.muteUserBtn = this.ui.find('#mute-user-btn')
        this.banUserBtn = this.ui.find('#ban-user-btn')
        this.logsUserBtn = this.ui.find('#logs-user-btn')
        this.whisperUserBtn = this.ui.find('#whisper-user-btn')
        this.ignoreUserBtn = this.ui.find('#ignore-user-btn')

        this.actionInputs = this.ui.find('#action-inputs')
        this.banTypeSelector = this.ui.find('#action-ban-type')
        this.durationInput = this.ui.find('#action-input-duration')
        this.reasonInput = this.ui.find('#action-input-reason')

        this.configureButtons()

        this.chat.output.on('contextmenu', '.msg-user .user', e => {
            const user = $(e.currentTarget).closest('.msg-user')
            this.clickedNick = user.data('username')

            this.setActionsVisibility()
            this.addContent(user)

            const rect = this.chat.output[0].getBoundingClientRect()
            // calculating floating window location (if it doesn't fit on screen, adjusting it a bit so it does)
            const x = (this.ui.width() + e.clientX > rect.width) ? e.clientX - rect.left + (rect.width - (this.ui.width() + e.clientX)) : e.clientX - rect.left
            const y = (this.ui.height() + e.clientY > rect.height) ? e.clientY - rect.top + (rect.height - (this.ui.height() + e.clientY)) - 12 : e.clientY - rect.top - 12

            this.ui[0].style.left = `${x}px`
            this.ui[0].style.top = `${y}px`

            super.show()

            //gotta return false so that the actual context menu doesn't show up
            return false
        })

        // preventing the window from closing instantly
        this.chat.output.on('mouseup', '.msg-user .user', e => {
            e.stopPropagation()
        })
    }

    configureButtons(){
        this.muteUserBtn.on('click', _ => {
            if (this.hasModPowers(this.chat.user)) {
                if (this.muteUserBtn.hasClass('active')) {
                    this.setInputVisibility()
                } else {
                    this.setInputVisibility('mute')
                }
            }
        })

        this.banUserBtn.on('click', _ => {
            if (this.hasModPowers(this.chat.user)) {
                if (this.banUserBtn.hasClass('active')) {
                    this.setInputVisibility()
                } else {
                    this.setInputVisibility('ban')
                }
            }
        })

        this.durationInput.on('keypress', e => this.processMuteOrBan(e))

        this.reasonInput.on('keypress', e => this.processMuteOrBan(e))

        this.whisperUserBtn.on('click', _ => {
            const win = this.chat.getWindow(this.clickedNick)
            if (win !== (null || undefined)) {
                this.chat.windowToFront(this.clickedNick)
            } else {
                if (!this.chat.whispers.has(this.clickedNick))
                    this.chat.whispers.set(this.clickedNick, {nick: this.clickedNick, unread: 0, open: false})
                this.chat.openConversation(this.clickedNick)
            }
            super.hide()
        })

        this.logsUserBtn.on('click', _ => {
            window.open(`https://rustlesearch.dev/?username=${this.clickedNick}&channel=Destinygg`)
            super.hide()
        })

        this.ignoreUserBtn.on('click', _ => {
            this.chat.ignore(this.clickedNick, true)
            this.chat.removeMessageByNick(this.clickedNick)
            MessageBuilder.status(`Ignoring ${this.clickedNick}`).into(this.chat)
            super.hide()
        })
    }

    setActionsVisibility(){
        if (this.hasModPowers(this.chat.user)) {
            this.muteUserBtn.show()
            this.banUserBtn.show()
        } else {
            this.muteUserBtn.hide()
            this.banUserBtn.hide()
        }

        this.actionInputs.addClass('hidden')
        this.banUserBtn.removeClass('active')
        this.muteUserBtn.removeClass('active')

        this.banTypeSelector.removeClass('hidden')
        this.durationInput.removeClass('hidden')
        this.reasonInput.removeClass('hidden')

        this.durationInput.val('')
        this.reasonInput.val('')
    }

    setInputVisibility(button){
        this.actionInputs.removeClass('hidden')
        this.banUserBtn.removeClass('active')
        this.muteUserBtn.removeClass('active')
        switch (button) {
            case "ban":
                this.banUserBtn.addClass('active')

                this.banTypeSelector.removeClass('hidden')
                this.durationInput.removeClass('hidden')
                this.reasonInput.removeClass('hidden')
                
                this.actionInputs.data('type', button)
                break
            case "mute":
                this.muteUserBtn.addClass('active')

                this.banTypeSelector.addClass('hidden')
                this.durationInput.removeClass('hidden')
                this.reasonInput.addClass('hidden')

                this.actionInputs.data('type', button)
                break
            default:
                this.actionInputs.addClass('hidden')
                break
        }
    }

    processMuteOrBan(e){
        if(isKeyCode(e, KEYCODES.ENTER) && !e.shiftKey && !e.ctrlKey) {
            const durationValue = this.durationInput.val()
            const reasonValue = this.reasonInput.val()
            switch (this.actionInputs.data('type')) {
                case 'ban':
                    if (reasonValue !== '') {
                        const banType = this.banTypeSelector.val()
                        let payload = {
                            nick   : this.clickedNick,
                            reason : reasonValue
                        };
                        if(/^perm/i.test(durationValue))
                            payload.ispermanent = true
                        else
                            payload.duration = this.chat.parseTimeInterval(durationValue)
            
                        payload.banip = banType === 'IPBAN'
            
                        this.chat.source.send('BAN', payload)
                    } else {
                        MessageBuilder.error('Providing a reason is mandatory').into(this.chat)
                    }
                    break;
                case 'mute':
                    const duration = (durationValue) ? this.chat.parseTimeInterval(durationValue) : null
                    if (duration && duration > 0) {
                        this.chat.source.send('MUTE', {data: this.clickedNick, duration: duration})
                    } else {
                        this.chat.source.send('MUTE', {data: this.clickedNick})
                    }
                    break
                default:
                    break
            }
            super.hide()
        }
    }

    addContent(message){
        this.messageArray = [message]

        const prettyNick = message.find('.user')[0].text
        const nick = message.data('username')
        const usernameFeatures = message.find('.user')[0].attributes.class.value

        const featuresList = this.buildFeatures(nick, usernameFeatures)
        if (featuresList === '') {
            this.flairList.hide()
            this.flairSubheader.style.display = 'none'
        } else {
            this.flairList.show()
            this.flairSubheader.style.display = ''
        }

        const messageList = this.createMessages()
        if (messageList.length === 1) {
            this.messagesSubheader.innerText = 'Selected message:'
        } else {
            this.messagesSubheader.innerText = 'Selected messages:'
        }

        this.header.text("")
        this.header.attr('class', 'username')
        this.messagesContainer.empty()
        this.flairList.empty()

        this.header.text(prettyNick)
        this.header.addClass(usernameFeatures)
        this.flairList.append(featuresList)
        messageList.forEach(element => {
            this.messagesContainer.append(element)
        })

        super.redraw()
    }

    buildFeatures(nick, messageFeatures){
        const user = this.chat.users.get(nick)
        const messageFeaturesArray = messageFeatures.split(' ').filter(e => e !== 'user' && e !== 'subscriber')
        const features = (user !== undefined) ? this.buildFeatureHTML((user.features.filter(e => e !== 'subscriber') || [])) : this.buildFeatureHTML(messageFeaturesArray)
        return features !== '' ? `<span class="features">${features}</span>` : ''
    }

    hasModPowers(user) {
        return user.hasAnyFeatures(UserFeatures.ADMIN, UserFeatures.MODERATOR)
    }

    createMessages(){
        let displayedMessages = []
        if (this.messageArray.length > 0) {
            let nextMsg = this.messageArray[0].next('.msg-continue')
            while (nextMsg.length > 0) {
                this.messageArray.push(nextMsg)
                nextMsg = nextMsg.next('.msg-continue')
            }
            this.messageArray.forEach(element => {
                const text = element.find('.text')[0].innerText
                const nick = element.data('username')
                const msg = MessageBuilder.message(text, new ChatUser(nick))
                displayedMessages.push(msg.html(this.chat))
            })
        } else {
            const msg = MessageBuilder.error("Wasn't able to grab the clicked message")
            displayedMessages.push(msg.html(this.chat))
        }
        return displayedMessages
    }

    buildFeatureHTML(featureArray){
        return featureArray.filter(e => this.chat.flairsMap.has(e))
            .map(e => this.chat.flairsMap.get(e))
            .reduce((str, e) => {
                if (e['hidden'] !== true) {
                    return str + `<i class="flair ${e['name']}" title="${e['label']}"></i> `
                } else {
                    return str + `<div class="flair" title="${e['label']}">${e['label']}</div> `
                }
            }, '')
    }
}

export {
    ChatMenu,
    ChatSettingsMenu,
    ChatUserMenu,
    ChatEmoteMenu,
    ChatWhisperUsers,
    ChatUserInfoMenu
};
