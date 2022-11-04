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

// sections in order.
const UserMenuSections = [
    { name: 'Admin', flairs: ['admin'] },
    { name: 'Moderator', flairs: ['moderator'] },
    { name: 'Broadcaster', flairs: ['flair12'] },
    { name: 'Vip', flairs: ['vip'] },
    { name: 'Trusted User', flairs: ['flair4'] },
    { name: 'Contributor', flairs: ['flair5', 'flair16'] }, // Contributor & Emote Contributor.
    { name: 'Subscriber Tier 4', flairs: ['flair8'] },
    { name: 'Subscriber Tier 3', flairs: ['flair3'] },
    { name: 'Subscriber Tier 2', flairs: ['flair1'] },
    { name: 'Subscriber Tier 1', flairs: ['flair13'] },
    { name: 'User', flairs: [] }, // KEEP (where all other users go).
    { name: 'Bot', flairs: ['bot', 'flair11'], force: true } // Bot && Community Bot
];

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
        this.flairSection = new Map();
        this.sections = new Map();
        this.header = this.ui.find('h5 span');
        this.container = this.ui.find('.content:first');
        this.searchinput = this.ui.find('#chat-user-list-search .form-control:first');
        this.container.on('click', '.user', e => this.chat.userfocus.toggleFocus(e.target.getAttribute('data-username')));
        this.container.on('click', '.mention-nick', e => {
            ChatMenu.closeMenus(this.chat);
            const value = this.chat.input.val().toString().trim();
            const username = $(e.target).parent().parent().data('username');
            this.chat.input.val(value + (value === '' ? '':' ') +  username + ' ').focus();
            return false;
        });
        this.container.on('click', '.whisper-nick', e => {
            ChatMenu.closeMenus(this.chat);
            const value = this.chat.input.val().toString().trim();
            const username = $(e.target).parent().parent().data('username');
            this.chat.input.val('/whisper ' + username + ' ' + value).focus();
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
                [...this.sections.values()].forEach((section) => {
                    $(section.title).html(`${section.searchcount} out of ${section.users.children.length} ${section.data.name}${section.users.children.length === 1 ? '' : 's'}${this.buildFeatures(section.data.flairs)}`);
                    if (section.searchcount === 0) $(section.container).hide();
                    else $(section.container).show();
                });
            } else {
                this.header.text(`Users (${this.totalcount})`);
                [...this.sections.values()].forEach((section) => {
                    $(section.title).html(`${section.users.children.length} ${section.data.name}${section.users.children.length === 1 ? '' : 's'}${this.buildFeatures(section.data.flairs)}`);
                    if (section.users.children.length === 0) $(section.container).hide();
                    else $(section.container).show();
                });
            }
            this.ui.toggleClass('search-in', searching);
        }
        super.redraw();
    }

    buildFeatures(flairs) {
        const features = flairs
            .filter(e => this.chat.flairsMap.has(e))
            .map(e => this.chat.flairsMap.get(e))
            .sort((a, b) => a.priority - b.priority)
            .reduce((str, e) => str + `<i class="flair ${e['name']}" title="${e['label']}"></i> `, '');
        return features !== '' ? `<span class="features">${features}</span>` : '';
    }

    addAll(){
        this.totalcount = 0;
        this.container.empty();
        this.sections = new Map();
        this.flairSection = new Map();
        UserMenuSections.forEach((data) => {
            this.addSection(data);
            [...data.flairs].forEach((flair) => this.flairSection.set(flair, data.name));
        });
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

    highestSection(user) {
        const flairs = [...this.flairSection.keys()];
        if (flairs.length > 0) {
            let lowestIndex = flairs.length + 1;
            for (let j = 0; j < user.features.length; j++) {
                const index = flairs.indexOf(user.features[j]);
                if (index >= 0) {
                    // force to stay in lower section even if it has a higher flair (Bots).
                    if (this.sections.get(this.flairSection.get(flairs[index])).data.force) {
                        lowestIndex = index;
                        break;
                    }

                    if (index < lowestIndex) lowestIndex = index;
                }
            }
            return lowestIndex > flairs.length ? 'User' : this.flairSection.get(flairs[lowestIndex]);
        } else {
            return 'User';
        }
    }

    addSection(data) {
        const section = $(`<div class="section" data-section="${data.name}"><p class="title">${data.name}</p><div class="users"></div></div>`);
        this.sections.set(data.name, {
            data: data,
            searchcount: 0,
            container: section[0],
            title: section[0].children[0],
            users: section[0].children[1]
        });
        this.container.append(section);
    }

    removeElement(username){
        this.container.find(`.user[data-username="${username}"]`).remove();
        this.totalcount--;
    }

    addElement(username, sort=false){
        const user = this.chat.users.get(username.toLowerCase()),
             label = !user.username || user.username === '' ? 'Anonymous' : user.username,
          features = user.features.length === 0 ? 'nofeature' : user.features.join(' '),
               usr = $(`<a data-username="${user.username}" class="user ${features}">${label}<div class="user-actions"><i class="mention-nick"></i><i class="whisper-nick"></i></div></a>`),
           section = this.sections.get(this.highestSection(user));

        if(sort && section.users.children.length > 0) {
            // Insert item in the correct order (instead of resorting the entire list)
            const items = section.users.children;
            let min = 0, max = items.length, index = Math.floor((min + max) / 2)
            while (max > min) {
                if (userComparator.apply(this, [usr[0], items[index]]) < 0) max = index
                else min = index + 1
                index = Math.floor((min + max) / 2)
            }
            if ((index - 1) < 0) usr.insertBefore(items[0]);
            else usr.insertAfter(items[index - 1]);
        } else {
            section.users.append(usr[0]);
        }
        this.totalcount++
    }

    hasElement(username){
        return this.container.find('.user[data-username="'+username+'"]').length > 0;
    }

    filter(){
        this.searchcount = 0;
        if(this.searchterm && this.searchterm.length > 0) {
            [...this.sections.values()].forEach((section) => {
                section.searchcount = 0;
                [...$(section.users.children)].forEach((user) => {
                    const found = user.getAttribute('data-username').toLowerCase().indexOf(this.searchterm.toLowerCase()) >= 0;
                    $(user).toggleClass('found', found);
                    if (found) {
                        section.searchcount++;
                        this.searchcount++;
                    }
                });
            });
        } else {
            this.container.children('.user').removeClass('found');
        }
    }

    sort(){
        [...this.sections.values()].forEach((section) => {
            [...$(section.users.children).sort(userComparator.bind(this))].forEach(a => a.parentNode.appendChild(a));
        });
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

export {
    ChatMenu,
    ChatSettingsMenu,
    ChatUserMenu,
    ChatEmoteMenu,
    ChatWhisperUsers
};
