var request = require('request');
var async = require('async');
var _ = require('lodash');
var fs = require('fs');
var moment = require('moment');
var autocomplete = require('./autocomplete');
var EventEmitter = require('events').EventEmitter;
var cross = require('./cross');

var subjectsBase = "http://sis.rutgers.edu/soc/subjects.json?semester=$SEMESTER&campus=$CAMPUS&level=$LEVEL";
var coursesBase = "http://sis.rutgers.edu/soc/courses.json?subject=$SUBJ&semester=$SEMESTER&campus=$CAMPUS&level=$LEVEL";

var onlineSubjectsBase = "http://sis.rutgers.edu/soc/onlineSubjects.json?term=$TERM&year=$YEAR&level=$LEVEL";
var onlineCoursesBase = "http://sis.rutgers.edu/soc/onlineCourses.json?term=$TERM&year=$YEAR&level=$LEVEL&subject=$SUBJ";

// Number is the month they start in
//  winter: 0
//  spring: 1
//  summer: 7
//  fall: 9

var campuses = ['NB', 'NK', 'CM', 'WM', 'AC', 'MC', 'J', 'RV', 'CC', 'CU', 'ONLINE'];

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

function index (semester, campus, level, callback) {
  var myUrl;

  // Online courses request a different URL for some reason
  if (campus == 'ONLINE') {
    myUrl = onlineSubjectsBase
      .replace('$TERM', semester.slice(0, 1)) 
      .replace('$YEAR', semester.slice(1)) 
      .replace('$CAMPUS', campus)
      .replace('$LEVEL', level);
  }

  else {
    myUrl = subjectsBase
      .replace('$SEMESTER', semester) 
      .replace('$CAMPUS', campus)
      .replace('$LEVEL', level);
  }


  request(myUrl, function (err, res, body) {
    try {
      if (err) throw err;
      var data = JSON.parse(body);
      var base = {ids: {}, names: {}, abbrevs: {}, courses: {}};

      async.reduce(data, base, function (memo, item, callback) {
        var subjUrl;
        
        // Online courses request a different URL for some reason
        if (campus == 'ONLINE') {
          subjUrl = onlineCoursesBase
            .replace('$TERM', semester.slice(0, 1)) 
            .replace('$YEAR', semester.slice(1)) 
            .replace('$CAMPUS', campus)
            .replace('$LEVEL', level)
            .replace('$SUBJ', item.code);
        }

        else {
          subjUrl = coursesBase
            .replace('$SEMESTER', semester) 
            .replace('$CAMPUS', campus)
            .replace('$LEVEL', level)
            .replace('$SUBJ', item.code);
        }

        request(subjUrl, function (err, res, body) {
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

// Indexes all semesters we care about, returns a hash of those.
function run (callback) {
  var semesters = autocomplete.calcSemesters(new Date().getMonth(), new Date().getFullYear());
  var dbg = new EventEmitter();

  // create a job for each combination of semester, campus, and level of study
  var jobs = cross.for(
    semesters, 
    campuses, 
    ['G', 'U'], 
    function (sem, campus, level) { 
      return function (callback) {
        index(sem, campus, level, function (err, data) {
          dbg.emit('debug', 'Done indexing ' + sem + ' ' + campus + ' ' + level);
          callback(err, {filename: 'indexes/' + sem + "_" + campus + "_" + level + ".json", data: data});
        });
      };
    }
  );

  async.parallel(jobs, callback);
  return dbg;
}

module.exports = run;
run.index = index;


if (require.main === module) {
  var emitter = run(function (err, data) {
    if (err) console.log(err.stack);
    else {
      _.each(data, function (item) {
        console.log('writing to ' + item.filename);
        fs.writeFile(item.filename, JSON.stringify(item.data));
      });
    }
  });
  emitter.on('debug', function (msg) { console.log(msg); });
}

