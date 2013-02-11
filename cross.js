var _ = require("lodash");

// fn last
function cross() {
  return _.reduce(arguments, function (memo, item) {
    var ret = [];
    _.each(memo, function (a) {
      if (_.isArray(item)) _.each(item, function (b) {
        ret.push(a.concat([b]));
      }); else ret.push(a.concat([item]));
    });
    return ret;
  }, [[]]);
}

function forCross() {
  var args = _.toArray(arguments);
  var fn = args.pop();
  var binding = null;

  if (!_.isFunction(fn)) {
    binding = fn;
    fn = args.pop();
  }

  return _.reduce(cross.apply(null, args), function (memo, item) {
    memo.push(fn.apply(binding, item));
    return memo;
  }, []);
}

exports.cross = cross;
exports.forCross = forCross;
exports.for = forCross;
