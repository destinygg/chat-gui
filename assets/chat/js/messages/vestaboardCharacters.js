/**
 * Vestaboard tile-code helpers, ported from the website's
 * `Destiny\Vestaboard\VestaboardCharacters`. The physical board addresses each
 * tile by an integer code; events carry a 6x22 matrix of these codes.
 *
 * Code map:
 *   0        blank
 *   1-26     A-Z
 *   27-35    1-9, 36 = 0
 *   37-60    punctuation (! @ # $ ( ) - + & = ; : ' " % , . / ?)
 *   63-71    spot colors: red, orange, yellow, green, blue, violet, white,
 *            black, filled (rendered gray)
 */

const BLANK = 0;

/** tile code -> spot-color name (matches the design editor's swatches) */
const COLOR_BY_CODE = {
  63: 'red',
  64: 'orange',
  65: 'yellow',
  66: 'green',
  67: 'blue',
  68: 'violet',
  69: 'white',
  70: 'black',
  71: 'gray',
};

/** tile code -> character */
const CHAR_BY_CODE = (() => {
  const map = {};
  for (let i = 0; i < 26; i += 1) {
    map[i + 1] = String.fromCharCode(65 + i); // 1 = A ... 26 = Z
  }
  const digits = '1234567890';
  for (let i = 0; i < 10; i += 1) {
    map[27 + i] = digits[i]; // 27 = 1 ... 35 = 9, 36 = 0
  }
  Object.assign(map, {
    37: '!',
    38: '@',
    39: '#',
    40: '$',
    41: '(',
    42: ')',
    44: '-',
    46: '+',
    47: '&',
    48: '=',
    49: ';',
    50: ':',
    52: "'",
    53: '"',
    54: '%',
    55: ',',
    56: '.',
    59: '/',
    60: '?',
  });
  return map;
})();

/**
 * Convert a code matrix into render cells: `null` (blank tile),
 * `{ ch: 'A' }` (character tile), or `{ color: 'red' }` (spot-color tile).
 *
 * @param {number[][]} matrix
 * @returns {(null | { ch: string } | { color: string })[][]}
 */
export function toCells(matrix) {
  if (!Array.isArray(matrix)) {
    return [];
  }
  return matrix.map((row) =>
    (Array.isArray(row) ? row : []).map((code) => {
      if (code === BLANK) {
        return null;
      }
      if (COLOR_BY_CODE[code]) {
        return { color: COLOR_BY_CODE[code] };
      }
      const ch = CHAR_BY_CODE[code];
      return ch != null ? { ch } : null;
    }),
  );
}

/**
 * Build the digital board element (`.vb > .vb__grid > .vb-tile`), mirroring the
 * website's `shared/_vestaboard_board.html.twig`. Returns `null` for an empty
 * or malformed matrix.
 *
 * @param {number[][]} matrix
 * @returns {HTMLDivElement | null}
 */
export function buildBoardElement(matrix) {
  if (!Array.isArray(matrix) || matrix.length === 0) {
    return null;
  }

  const board = document.createElement('div');
  board.className = 'vb';
  const grid = document.createElement('div');
  grid.className = 'vb__grid';

  toCells(matrix).forEach((row) => {
    row.forEach((cell) => {
      const tile = document.createElement('div');
      tile.className = 'vb-tile';
      if (cell?.color) {
        tile.classList.add(`vb-tile--${cell.color}`);
      }

      const seam = document.createElement('span');
      seam.className = 'vb-tile__seam';
      tile.append(seam);

      if (cell?.ch) {
        const ch = document.createElement('span');
        ch.className = 'vb-tile__ch';
        ch.textContent = cell.ch;
        tile.append(ch);
      }

      grid.append(tile);
    });
  });

  board.append(grid);
  return board;
}
