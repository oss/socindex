var indexer = require('./indexer');
var autocomplete = require('./autocomplete');
var assert = require("assert");
var moment = require('moment');

describe('calcSemesters', function () {

  it('gets january right', function () {
    var semesters = autocomplete.calcSemesters(0, '2011');

    assert(semesters[0] == '02011');
    assert(semesters[1] == '12011');
    assert(semesters[2] == '72011');
  });

  it('gets dec right', function () {
    var semesters = autocomplete.calcSemesters(11, '2010');

    assert(semesters[0] == '02011');
    assert(semesters[1] == '12011');
    assert(semesters[2] == '72011');
  });

  it('gets feb right', function () {
    var semesters = autocomplete.calcSemesters(1, '2011');

    assert(semesters[0] == '12011');
    assert(semesters[1] == '72011');
    assert(semesters[2] == '92011');
  });

  it('gets may right', function () {
    var semesters = autocomplete.calcSemesters(4, '2011');

    assert(semesters[0] == '12011');
    assert(semesters[1] == '72011');
    assert(semesters[2] == '92011');
  });

  it('gets june right', function () {
    var semesters = autocomplete.calcSemesters(5, '2011');

    assert(semesters[0] == '72011');
    assert(semesters[1] == '92011');
    assert(semesters[2] == '02012');
  });

  it('gets aug right', function () {
    var semesters = autocomplete.calcSemesters(7, '2011');

    assert(semesters[0] == '72011');
    assert(semesters[1] == '92011');
    assert(semesters[2] == '02012');
  });

  it('gets sep right', function () {
    var semesters = autocomplete.calcSemesters(8, '2011');

    assert(semesters[0] == '92011');
    assert(semesters[1] == '02012');
    assert(semesters[2] == '12012');
  });

  it('gets nov right', function () {
    var semesters = autocomplete.calcSemesters(10, '2011');

    assert(semesters[0] == '92011');
    assert(semesters[1] == '02012');
    assert(semesters[2] == '12012');
  });
});
