// Bundled smiley emotes. Longer prefixes first so regex matches greedily.
const EMOTES = [
  { prefix: 'O:-)', name: 'smiley-innocent' },
  { prefix: ':-)', name: 'smiley-smile' },
  { prefix: ':-(', name: 'smiley-frown' },
  { prefix: ';-)', name: 'smiley-wink' },
  { prefix: ':-P', name: 'smiley-tongue' },
  { prefix: '=-O', name: 'smiley-surprised' },
  { prefix: ':-*', name: 'smiley-kiss' },
  { prefix: '>:o', name: 'smiley-yelling' },
  { prefix: '8-)', name: 'smiley-cool' },
  { prefix: ':-$', name: 'smiley-money' },
  { prefix: ':-!', name: 'smiley-foot' },
  { prefix: ':-[', name: 'smiley-embarrassed' },
  { prefix: ':-\\', name: 'smiley-undecided' },
  { prefix: ":'(", name: 'smiley-cry' },
  { prefix: ':-X', name: 'smiley-silent' },
  { prefix: ':-D', name: 'smiley-grin' },
];

export default EMOTES;
