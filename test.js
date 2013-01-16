var data = require('./out');
var _ = require('lodash');
var keypress = require('keypress');
var charm = require('charm')();
charm.pipe(process.stdout);
charm.reset();

keypress(process.stdin);

function getAutocomplete (index, query) {
  var reg, matches = [];

  query = query.trim();
  queryItems = query.split(' ');

  // If the last token looks like a number and is the right length, don't use it
  // when looking for subjects because its probably a courseno

  var courseno = queryItems[queryItems.length - 1];
  if (Number(courseno).toString() == courseno && courseno.length == 3) {
    queryItems.pop();
    query = queryItems.join(' ');
  } else courseno = null;

  // fuzzy search of subject names
  if (query.length > 2) {
    reg = new RegExp(query.split('').join('\\w*').replace(/\W/, ""), 'i');

    var temp = _.filter(index.names, function (item, key) {
      if (key.match(reg)) return key;
    });

    matches = _.map(temp, function (item) {
      return {subj: item};
    }).concat(matches);
  } 

  // Search course abbreviations
  if (index.abbrevs[query.toUpperCase()]) {
    matches = _.map(index.abbrevs[query.toUpperCase()], function (id) {
      return {subj: id};
    }).concat(matches);
  }

  // if we have a courseno try to locate it in the subjects we found
  if (courseno) {
    if (matches.length > 0) {
      matches = _.reduce(matches, function (memo, item) {
        var idx;
        if (index.ids[item.subj].courses[courseno]) {
          memo.push({subj: item.subj, course: courseno});
        }
        return memo;
      }, []);
    }
  }

  // search all courses.. only do this if we couldn't find anything else
  if (matches.length == 0 && reg) {
    matches = _.filter(index.courses, function (item, key) {
      if (key.match(reg)) return key;
    });
  }

  return matches;
}

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

