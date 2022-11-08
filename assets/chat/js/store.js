const localStorage = window.localStorage || {
  setItem: () => {},
  getItem: () => {},
};
const { JSON } = window;

class ChatStore {
  static write(name, obj) {
    let str = '';
    try {
      str = JSON.stringify(
        obj instanceof Map || obj instanceof Set ? [...obj] : obj
      );
    } catch {} // eslint-disable-line no-empty
    localStorage.setItem(name, str);
  }

  static read(name) {
    let data = null;
    try {
      data = JSON.parse(localStorage.getItem(name));
    } catch {} // eslint-disable-line no-empty
    return data;
  }

  static remove(name) {
    try {
      localStorage.removeItem(name);
    } catch {} // eslint-disable-line no-empty
  }
}

export default ChatStore;
