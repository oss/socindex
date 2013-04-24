var _;
try {
  try { _ = require('lodash'); } catch (e) {}
  try { _ = require('vendor/lodash'); } catch (e) {}
} catch (e) {
  if (!_) throw new Error('socindex: couldnt find lodash');
}

// Capitalizes shit
function capitalize (text) {
  return text.trim().toLowerCase().split(' ').map(function (item) {
    if (item == 'ii' || item == 'i' || item == 'iii' || item == 'iv') return item.toUpperCase();

    // TODO: about a million other english oddities and other edge cases

    if (item != 'and') {
      if (item) return item[0].toUpperCase() + item.slice(1);
      else return '';
    } else return item;
  }).join(' ');
}

// Takes the current month and year and produces a list of semesters we're
// interested in
function calcSemesters (month, year) {
  var semesters, nextYear = String(parseInt(year, 10) + 1);

  // This is probably the simplest way to represent this
  if (month === 0) // Jan: winter, spring, summer
    semesters = ['0' + year, '1' + year, '7' + year];
  else if (month <= 4) // Feb - May: Spr Sum F
    semesters = ['1' + year, '7' + year, '9' + year];
  else if (month <= 7) // Jun - Aug: Sum F W
    semesters = ['7' + year, '9' + year, '0' + nextYear];
  else if (month <= 10) // Sep - Nov: F W Spr
    semesters = ['9' + year, '0' + nextYear, '1' + nextYear];
  else // December
    semesters = ['0' + nextYear, '1' + nextYear, '7' + nextYear];

  return semesters;
}

// Does a fuzzy match against an array `data` with string `query`, extracting
// values from `data` with `extractor`.
function fuzzy (data, query, extractor) {
  var reg;

  // cache the last regexp
  if (fuzzy.last && fuzzy.last == query) reg = fuzzy.reg;
  else {
    reg = new RegExp(query.split('').join('\\w*').replace(/\W/, ""), 'i');
    fuzzy.reg = reg; fuzzy.last = query;
  }

  if (!extractor) {
    if (_.isArray(data)) extractor = function (item) { return item; };
    else extractor = function (val, key) { return key; };
  }
  return _.filter(data, function (item, key) {
    return extractor(item, key).match(reg);
  });
}

function tryNumber (str) {
  var num = parseInt(str, 10);
  var hack = str;
  // nasty hack for supporting numbers with a leading 0
  if (str[0] == "0") hack = str.slice(1);
  if (num.toString() === hack && str.length === 3) return num;
  else return false;
}

// Runs an autocompletion search on the given index with the given query
function autocomplete (index, query) {
  var reg, matches = [];

  query = query.trim();
  var queryItems = query.split(' ');

  // kindof hacky but supports input like 198:111
  if (query.indexOf(':') != -1) {
    var nums = query.split(':');
    if (tryNumber(nums[0]) && tryNumber(nums[1])) {
      queryItems = [nums[0], nums[1]];
    }
  }

  // If the last token looks like a number and is the right length, don't use it
  // when looking for subjects because its probably a courseno

  // Also, if queryItems.length is 1 then this is a subjno, not a courseno

  var courseno = queryItems[queryItems.length - 1];
  if (tryNumber(courseno) && queryItems.length > 1) {
    queryItems.pop();
    query = queryItems.join(' ');
  } else courseno = null;

  var subjno = queryItems[0];
  if (tryNumber(subjno)) {
    if (index.ids[subjno]) matches.push({subj: subjno});
  }

  // fuzzy search of subject names
  if (query.length > 2) {
    var temp = fuzzy(index.names, query);

    matches = matches.concat(_.map(temp, function (item) {
      return {subj: item};
    }));
  } 

  // Search subject abbreviations
  if (index.abbrevs[query.toUpperCase()]) {
    matches = matches.concat(_.map(index.abbrevs[query.toUpperCase()], function (id) {
      return {subj: id};
    }));
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
  if (matches.length === 0 && query.length > 2) {
    matches = fuzzy(index.courses, query);
  }

  return matches;
}

autocomplete.calcSemesters = calcSemesters;
autocomplete.capitalize = capitalize;
autocomplete.fuzzy = fuzzy;

module.exports = autocomplete;
