"use strict";

alert('Hello Gulp!');
;
var tetris = {
  a: 1
};

var logTetris = function logTetris() {
  return console.log(tetris === null || tetris === void 0 ? void 0 : tetris.a);
};