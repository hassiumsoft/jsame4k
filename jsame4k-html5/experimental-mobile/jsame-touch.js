(function() {
  // JSame
  //
  // Copyright (c) 2014 Gabor Bata
  //
  // Permission is hereby granted, free of charge, to any person
  // obtaining a copy of this software and associated documentation files
  // (the "Software"), to deal in the Software without restriction,
  // including without limitation the rights to use, copy, modify, merge,
  // publish, distribute, sublicense, and/or sell copies of the Software,
  // and to permit persons to whom the Software is furnished to do so,
  // subject to the following conditions:
  //
  // The above copyright notice and this permission notice shall be
  // included in all copies or substantial portions of the Software.
  //
  // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
  // EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
  // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
  // NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS
  // BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
  // ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
  // CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
  // SOFTWARE.

  var TABLE_WIDTH = 20; //8
  var TABLE_HEIGHT = 15; // 10
  var TILE_SIZE = 26;
  var STATUS_SIZE = 20;
  var BORDER_SIZE = 4;
  var BONUS_SCORE = 1000;
  // tile colors + removed tile color
  var COLORS = [0x914e3b, 0x7b8376, 0x3d6287, 0xaf8652, 0x262c4b];
  var COLOR_CHANGE_FACTOR = 0.7;
  var COLOR_NUMBER = COLORS.length - 1;
  var STATUS_BORDER_COLOR = '#484d50';
  var STATUS_BACKGROUND_COLOR = '#62696a';
  var STATUS_TEXT_COLOR = '#ffffff';
  var CANVAS_BACKGROUND_COLOR = '#262c4b';
  var FONT = 'bold 12px sans-serif';
  var NEW_GAME_TEXT = 'New Game';
  var MARKED_TEXT = 'Marked: %s (%s points)';
  var SCORE_TEXT = 'Score: %s';
  var GAME_OVER_TEXT = 'Game Over!';
  var tiles;
  var table;
  var texts;
  var canvas;
  var context;
  var enabled;
  var score;
  var markedAmount;
  var bonusAdded;

  // based on the book: Core HTML5 Canvas by David Geary
  function getMousePosition(event) {
     var boundingRect = canvas.getBoundingClientRect();
     return {
         x: (event.touches[0].clientX - boundingRect.left) * (canvas.width / boundingRect.width),
         y: (event.touches[0].clientY - boundingRect.top) * (canvas.height / boundingRect.height)
     };
  }

  function sprintf(format) {
     for (var i = 1; i < arguments.length; i++) {
         format = format.replace(/%s/, arguments[i]);
     }
     return format;
  }

  function colorFromNumber(number) {
     var r = number >> 16;
     var g = number >> 8 & 0xff;
     var b = number & 0xff;
     return [r, g, b];
  }

  function hexFromColor(color) {
     var bin = color[0] << 16 | color[1] << 8 | color[2];
     return '#' + (function(hex) {
         return new Array(7 - hex.length).join('0') + hex;
     })(bin.toString(16));
  }

  function brighterColor(color) {
     var r = color[0];
     var g = color[1];
     var b = color[2];
     var i = Math.floor(1.0 / (1.0 - COLOR_CHANGE_FACTOR));
     if (r == 0 && g == 0 && b == 0) {
         return [i, i, i];
     }
     if (r > 0 && r < i) {
         r = i;
     }
     if (g > 0 && g < i) {
         g = i;
     }
     if (b > 0 && b < i) {
         b = i;
     }
     return [
         Math.min(Math.floor(r / COLOR_CHANGE_FACTOR), 0xff),
         Math.min(Math.floor(g / COLOR_CHANGE_FACTOR), 0xff),
         Math.min(Math.floor(b / COLOR_CHANGE_FACTOR), 0xff)
     ];
  }

  function darkerColor(color) {
     return [
         Math.floor(color[0] * COLOR_CHANGE_FACTOR),
         Math.floor(color[1] * COLOR_CHANGE_FACTOR),
         Math.floor(color[2] * COLOR_CHANGE_FACTOR)
     ];
  }

  function generateTileImages() {
     tiles = new Array(COLORS.length * 2 - 1);
     for (var i = 0; i < COLORS.length; i++) {
         tiles[i] = createTileImage(colorFromNumber(COLORS[i]), true);
         tiles[COLORS.length * 2 - 2 - i] = createTileImage(colorFromNumber(COLORS[i]), false);
     }
  }

  function createTileImage(color, marked) {
     var image = document.createElement('canvas');
     image.width = TILE_SIZE;
     image.height = TILE_SIZE;
     var imageContext = image.getContext('2d');
     var original = marked ? brighterColor(color) : color;
     var brighter = brighterColor(original);
     var darker = darkerColor(original);
     imageContext.fillStyle = hexFromColor(darker);
     imageContext.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
     imageContext.fillStyle = hexFromColor(original);
     imageContext.fillRect(0, 0, TILE_SIZE - 1, TILE_SIZE - 1);
     imageContext.fillStyle = hexFromColor(brighter);
     imageContext.fillRect(1, 1, TILE_SIZE - 3, TILE_SIZE - 3);
     var gradient = imageContext.createLinearGradient(2, 2, TILE_SIZE - 4, TILE_SIZE - 4);
     gradient.addColorStop(0, hexFromColor(original));
     gradient.addColorStop(1, hexFromColor(brighter));
     imageContext.fillStyle = gradient;
     imageContext.fillRect(2, 2, TILE_SIZE - 4, TILE_SIZE - 4);
     if (marked) {
         imageContext.fillStyle = hexFromColor(darker);
         imageContext.fillRect(8, 8, TILE_SIZE - 16, TILE_SIZE - 16);
     }
     return image;
  }

  function paint() {
     // background
     context.fillStyle = CANVAS_BACKGROUND_COLOR;
     context.fillRect(
         0,
         0,
         TABLE_WIDTH * TILE_SIZE + BORDER_SIZE * 2,
         TABLE_HEIGHT * TILE_SIZE + BORDER_SIZE * 2
     );
     // draw status bar
     context.fillStyle = STATUS_BORDER_COLOR;
     context.fillRect(
         0,
         TABLE_HEIGHT * TILE_SIZE + BORDER_SIZE * 2,
         TABLE_WIDTH * TILE_SIZE + BORDER_SIZE * 2,
         STATUS_SIZE
     );
     // draw 3 column on status bar and texts
     context.font = FONT;
     texts[1] = markedAmount > 1 ?
         sprintf(MARKED_TEXT, markedAmount, points(markedAmount)) :
         (enabled ? '' : GAME_OVER_TEXT);
     texts[2] = sprintf(SCORE_TEXT, score);
     for (var i = 0; i < texts.length; i++) {
         context.fillStyle = STATUS_BACKGROUND_COLOR;
         context.fillRect(
             Math.floor((TABLE_WIDTH * TILE_SIZE + BORDER_SIZE * 2) / 3) * i + 1,
             TABLE_HEIGHT * TILE_SIZE + BORDER_SIZE * 2 + 1,
             Math.floor((TABLE_WIDTH * TILE_SIZE + BORDER_SIZE * 2) / 3) - 2,
             STATUS_SIZE - 2
         );
         context.fillStyle = STATUS_TEXT_COLOR;
         var textWidth = context.measureText(texts[i]).width;
         context.fillText(
             texts[i],
             Math.floor((TABLE_WIDTH * TILE_SIZE + BORDER_SIZE * 2) / 6) * (2 * i + 1) - Math.floor(textWidth / 2),
             TABLE_HEIGHT * TILE_SIZE + BORDER_SIZE * 2 + Math.floor(STATUS_SIZE / 2) + 4
         );
     }
     // draw tiles
     for (var x = 0; x < TABLE_WIDTH; x++) {
         for (var y = 0; y < TABLE_HEIGHT; y++) {
             context.drawImage(
                 tiles[table[TABLE_WIDTH * y + x] + COLOR_NUMBER],
                 x * TILE_SIZE + BORDER_SIZE,
                 y * TILE_SIZE + BORDER_SIZE
             );
         }
     }
  }

  function reset() {
     markedAmount = 0;
     score = 0;
     bonusAdded = false;
     enabled = true;
     for (var i = 0; i < table.length; i++) {
         table[i] = Math.floor((Math.random() * COLOR_NUMBER) + 1);
     }
  }

  function getState(x, y) {
     if (x < 0 || y < 0 || x > TABLE_WIDTH - 1 || y > TABLE_HEIGHT - 1) {
         return 0;
     }
     return table[TABLE_WIDTH * y + x];
  }

  function isMarked(x, y) {
     return getState(x, y) < 0;
  }

  function isRemoved(x, y) {
     return getState(x, y) == 0;
  }

  function getColor(x, y) {
     return getState(x, y) < 0 ? -1 * getState(x, y) : getState(x, y);
  }

  function points(removed) {
     return removed * removed - 4 * removed + 4;
  }

  function markColor(x, y, c) {
     if (isMarked(x, y) || c != getColor(x, y) || isRemoved(x, y)) {
         return 0;
     }
     var blocks = 1;
     table[TABLE_WIDTH * y + x] = -1 * getColor(x, y);
     blocks += markColor(x - 1, y, getColor(x, y));
     blocks += markColor(x, y - 1, getColor(x, y));
     blocks += markColor(x + 1, y, getColor(x, y));
     blocks += markColor(x, y + 1, getColor(x, y));
     return blocks;
  }

  function unmark() {
     for (var i = 0; i < table.length; i++) {
         table[i] = table[i] < 0 ? -1 * table[i] : table[i];
     }
  }

  function swap(x1, y1, x2, y2) {
     var pos1 = TABLE_WIDTH * y1 + x1;
     var pos2 = TABLE_WIDTH * y2 + x2;
     var temp = table[pos1];
     table[pos1] = table[pos2];
     table[pos2] = temp;
  }

  function mousePressed(event) {
     var c, r, i, j, k;
     var position = getMousePosition(event);
     // handle click on 'New Game' button
     if (position.x > 0 &&
             position.x < Math.floor((TABLE_WIDTH * TILE_SIZE + BORDER_SIZE * 2) / 3) - 1 &&
             position.y > TABLE_HEIGHT * TILE_SIZE + BORDER_SIZE * 2 &&
             position.y < TABLE_HEIGHT * TILE_SIZE + BORDER_SIZE * 2 + STATUS_SIZE - 1) {
         reset();
         enabled = true;
         markedAmount = 0;
         paint();
         return;
     }
     var x = position.x < BORDER_SIZE ? -1 : Math.floor((position.x - BORDER_SIZE) / TILE_SIZE);
     var y = position.y < BORDER_SIZE ? -1 : Math.floor((position.y - BORDER_SIZE) / TILE_SIZE);
     if (isMarked(x, y)) {
         // count marked tiles
         r = 0;
         for (i = 0; i < table.length; i++) {
             if (table[i] < 0) {
                 r++;
             }
         }
         if (r < 2) {
             return;
         }
         // remove marked tiles
         for (i = 0; i < table.length; i++) {
             if (table[i] < 0) {
                 table[i] = 0;
             }
         }
         // drop down tiles to fill the empty space
         for (j = 0; j < TABLE_WIDTH; j++) {
             c = true;
             while (c) {
                 c = false;
                 for (k = 1; k < TABLE_HEIGHT; k++) {
                     if (isRemoved(j, k) && !isRemoved(j, k - 1)) {
                         swap(j, k, j, k - 1);
                         c = true;
                     }
                 }
             }
         }
         // shift columns to the left if there is an empty one
         c = true;
         while (c) {
             c = false;
             for (j = 1; j < TABLE_WIDTH; j++) {
                 if (isRemoved(j - 1, TABLE_HEIGHT - 1) && !isRemoved(j, TABLE_HEIGHT - 1)) {
                     for (k = 0; k < TABLE_HEIGHT; k++) {
                         swap(j, k, j - 1, k);
                     }
                     c = true;
                 }
             }
         }
         score += points(r);
         // determine game end
         c = true;
         r = 0;
         for (i = 0; i < TABLE_WIDTH; i++) {
             for (j = 0; j < TABLE_HEIGHT; j++) {
                 if (isRemoved(i, j)) {
                     continue;
                 }
                 r++;
                 var color = getColor(i, j);
                 if (getColor(i - 1, j) == color ||
                     getColor(i, j - 1) == color ||
                     getColor(i + 1, j) == color ||
                     getColor(i, j + 1) == color) {
                     c = false;
                     break;
                 }
             }
         }
         // add bonus if all tiles are removed
         if (r == 0 && !bonusAdded) {
             bonusAdded = true;
             score += BONUS_SCORE;
         }
         markedAmount = 0;
         if (c && enabled) {
             enabled = false;
         }
     } else if (!isRemoved(x, y)) {
       unmark();
       markedAmount = markColor(x, y, getColor(x, y));
     }
     paint();
  }

  function init() {
     canvas = document.getElementById('jsame4k');
     if (canvas != null && !!canvas.getContext) {
         context = canvas.getContext('2d');
         generateTileImages();
         table = new Array(TABLE_WIDTH * TABLE_HEIGHT);
         texts = [NEW_GAME_TEXT, '', ''];
         reset();
         paint();
         canvas.addEventListener('touchstart', mousePressed, false);
     } else {
         document.body.appendChild(document.createTextNode('Could not initialize game.'));
     }
  }
  init();
})();
