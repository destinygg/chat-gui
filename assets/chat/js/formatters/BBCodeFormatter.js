const COLORS = [
  '#ff8080',
  '#ffff80',
  '#80ff80',
  '#00ff80',
  '#80ffff',
  '#0080ff',
  '#ff80c0',
  '#ff80ff',
  '#ff0000',
  '#ffff00',
  '#80ff00',
  '#00ff40',
  '#00ffff',
  '#0080c0',
  '#8080c0',
  '#ff00ff',
  '#804040',
  '#ff8040',
  '#00ff00',
  '#008080',
  '#004080',
  '#8080ff',
  '#800040',
  '#ff0080',
  '#800000',
  '#ff8000',
  '#008000',
  '#008040',
  '#0000ff',
  '#0000a0',
  '#800080',
  '#8000ff',
  '#400000',
  '#804000',
  '#004000',
  '#004040',
  '#000080',
  '#000040',
  '#400040',
  '#400080',
  '#000000',
  '#808000',
  '#808040',
  '#808080',
  '#408080',
  '#c0c0c0',
  '#400041',
  '#ffffff',
];

const SIZES = { 1: '12px', 2: '16px', 3: '20px' };

export { COLORS };

export default class BBCodeFormatter {
  format(chat, s /* , message=null */) {
    let result = s;
    // Bold
    result = result.replace(/\[b\](.*?)\[\/b\]/gi, '<strong>$1</strong>');
    // Italic
    result = result.replace(/\[i\](.*?)\[\/i\]/gi, '<em>$1</em>');
    // Underline
    result = result.replace(
      /\[u\](.*?)\[\/u\]/gi,
      '<span style="text-decoration:underline">$1</span>',
    );
    // Font size
    result = result.replace(
      /\[s([1-3])\](.*?)\[\/s\1\]/gi,
      (match, size, content) => {
        const px = SIZES[size];
        return px ? `<span style="font-size:${px}">${content}</span>` : match;
      },
    );
    // Font color
    result = result.replace(
      /\[c(\d{1,2})\](.*?)\[\/c\1\]/gi,
      (match, num, content) => {
        const idx = parseInt(num, 10);
        if (idx >= 1 && idx <= 48) {
          return `<span style="color:${COLORS[idx - 1]}">${content}</span>`;
        }
        return match;
      },
    );
    // Background color
    result = result.replace(
      /\[bg(\d{1,2})\](.*?)\[\/bg\1\]/gi,
      (match, num, content) => {
        const idx = parseInt(num, 10);
        if (idx >= 1 && idx <= 48) {
          return `<span style="background-color:${COLORS[idx - 1]}">${content}</span>`;
        }
        return match;
      },
    );
    return result;
  }
}
