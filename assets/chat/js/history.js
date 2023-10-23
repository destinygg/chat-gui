import { KEYCODES, isKeyCode } from './const';
import ChatStore from './store';

class ChatInputHistory {
  constructor(chat) {
    this.input = chat.input;
    this.history = ChatStore.read('chat.history') || [];
    this.index = -1;
    this.lastinput = '';
    this.maxentries = 20;
    this.input.on('keydown', (e) => {
      // if up arrow we subtract otherwise add

      if (
        !(e.shiftKey || e.metaKey || e.ctrlKey) &&
        (isKeyCode(e, KEYCODES.UP) || isKeyCode(e, KEYCODES.DOWN))
      ) {
        this.show(isKeyCode(e, KEYCODES.UP) ? -1 : 1);
        e.preventDefault();
        e.stopPropagation();
      } else {
        this.index = -1;
      }
    });
  }

  show(direction) {
    // const dir = direction === -1 ? 'UP':'DOWN';
    // console.debug(`Show ${dir}(${direction}) index ${this.index} total ${this.history.length}`);
    // if we are not currently showing any lines from the history
    if (this.index < 0) {
      // if up arrow
      if (direction === -1) {
        // set the current line to the end if the history, do not subtract 1
        // that's done later
        this.index = this.history.length;
        // store the typed in message so that we can go back to it
        this.lastinput = this.input.val().toString();

        if (this.index <= 0)
          // nothing in the history, bail out
          return;
        // down arrow, but nothing to show
      } else return;
    }

    const index = this.index + direction;
    let val = this.lastinput;
    // out of bounds
    if (index >= this.history.length || index < 0) {
      // down arrow was pressed to get back to the original line, reset
      if (index >= this.history.length) {
        this.index = -1;
      }
    } else {
      this.index = index;
      val = this.history[index];
    }

    this.input.val(val);
  }

  add(message) {
    this.index = -1;
    // dont add entry if the last entry is the same
    if (
      this.history.length > 0 &&
      this.history[this.history.length - 1] === message
    )
      return;
    this.history.push(message);
    // limit entries
    if (this.history.length > this.maxentries)
      this.history.splice(0, this.history.length - this.maxentries);
    ChatStore.write('chat.history', this.history);
  }
}

export default ChatInputHistory;
