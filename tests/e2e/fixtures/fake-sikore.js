var curpos = 0;
var results = [];
var kettenstart = [];
var kettenoperands = [];
var kettenoperations = [];

function erzeuge_blatt() {
  curpos = 0;
  var level = document.getElementById("level").value;
  var isMultiplication = level === "500M20";
  var isDivision = level === "1000M10";
  var start = isDivision ? 4096 : isMultiplication ? 2 : 10;
  var operand = isMultiplication ? 4 : isDivision ? 2 : 1;
  var operation = isMultiplication ? 2 : isDivision ? 3 : 0;
  var current = start;

  kettenstart = [start];
  kettenoperands = [Array(12).fill(operand)];
  kettenoperations = [Array(12).fill(operation)];
  results = Array.from({ length: 12 }, function () {
    current = isMultiplication
      ? current * operand
      : isDivision
        ? current / operand
        : current + operand;
    return current;
  });
  document.getElementById("ffehler").value = "0";
  for (var index = 0; index < 12; index += 1) {
    document.liveform["i" + index].value = "";
  }
}

function liveblur(position) {
  if (position !== curpos || curpos >= 12) return;
  var field = document.liveform["i" + curpos];
  if (Number(field.value) === results[curpos]) {
    curpos += 1;
  } else {
    var mistakes = document.getElementById("ffehler");
    mistakes.value = String(Number(mistakes.value) + 1);
  }
}
