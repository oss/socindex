var request = require('request');
var async = require('async');
var _ = require('lodash');
var fs = require('fs');

var url = "http://sis.rutgers.edu/soc/subjects.json?semester=12013&campus=NB&level=U";
var subj = "http://sis.rutgers.edu/soc/courses.json?subject=$SUBJ&semester=12013&campus=NB&level=U";

function titleToAbbrev (title) {
  return title.split(' ').reduce(function (memo, item) {
    if (item != 'and') return memo + item[0];
    else return memo;
  }, "");
}

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

function index (callback) {
  request(url, function (err, res, body) {
    try {
      if (err) throw err;
      var data = JSON.parse(body);
      var base = {ids: {}, names: {}, abbrevs: {}, courses: {}};

      async.reduce(data, base, function (memo, item, callback) {

        request(subj.replace('$SUBJ', item.code), function (err, res, body) {
          try {
            if (err) throw err;
            var data = JSON.parse(body);
            var subject = {id: item.code, name: capitalize(item.description)};

            subject.courses = _.reduce(data, function (c, item) {
              var t = capitalize(item.expandedTitle || item.title);
              c[item.courseNumber] = t;
              memo.courses[t] = {
                subj: subject.id, 
                course: item.courseNumber
              };
              return c;
            }, {});

            memo.ids[subject.id] = subject;
            var abbrev = titleToAbbrev(subject.name);
            memo.abbrevs[abbrev] = memo.abbrevs[abbrev] || [];
            memo.abbrevs[abbrev].push(subject.id);

            memo.names[subject.name] = subject.id;
            callback(null, memo);
          } catch (e) { callback(e); }
        });

      }, function (err, result) {
        callback(err, result);
      });
    } catch (e) { callback(e); }
  });
}

module.exports = index;

if (require.main === module) {
  index(function (err, data) {
    if (err) console.log(err.stack);
    else console.log(JSON.stringify(data));
  });
}

