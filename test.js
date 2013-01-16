var data = require('./out');
var _ = require('lodash');
var keypress = require('keypress');
var charm = require('charm')();
charm.pipe(process.stdout);
charm.reset();

keypress(process.stdin);

var getAutocomplete = require('./autocomplete');

function prettyMatches (matches) {
  // make them look nice
  return _.map(matches, function (item) {
    return data.ids[item.subj].name + (item.course? ": " + data.ids[item.subj].courses[item.course] : "");
  });
}

process.stdin.resume();
process.stdin.setRawMode(true);

var size = process.stdout.getWindowSize();
var height = size[1] - 1;
var width = size[0] - 1;
var search = "";
var cursor = 1;

process.stdin.on('keypress', function (chunk, key) {
  if (key) {
    if (key.name == 'escape') process.exit();
    if (key.name == 'backspace') {
      cursor--;
      if (cursor < 1) cursor = 1;
      search = search.slice(0, -1);
    }
  }

  if (((key && key.name != 'backspace') || !key) && chunk) {
    cursor++;
    search += chunk;
  }

  charm.erase('down');
  var res = prettyMatches(getAutocomplete(data, search));

  _.each(res, function (item, index) {
    charm.position(0, index + 2).write(item);
  });

  charm.position(0, 0).write(search);
  charm.position(cursor, 0);
});

