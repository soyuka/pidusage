// execute an array of asynchronous functions in parallel
// @param {Array} fns - an array of functions
// @param {Function} done - callback(err, results)
function parallel (fns, done) {
  var pending = fns.length
  var results = []

  function each (i, err, result) {
    results[i] = result

    if (--pending === 0 || err) {
      done && done(err, results)
      done = null
    }
  }

  fns.forEach(function (fn, i) {
    fn(function (err, res) {
      each(i, err, res)
    })
  })
}

module.exports = parallel
