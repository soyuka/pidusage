'use strict'
var DEFAULT_MAXAGE = 60000

var expiration = {}
var history = {}

var size = 0
var interval = null

function get (pid, maxage) {
  if (maxage <= 0) {
    return
  }

  if (history[pid] !== undefined) {
    expiration[pid] = Date.now() + (maxage || DEFAULT_MAXAGE)
  }

  return history[pid]
}

function set (pid, object, maxage) {
  if (object === undefined || maxage <= 0) return

  expiration[pid] = Date.now() + (maxage || DEFAULT_MAXAGE)
  if (history[pid] === undefined) {
    size++
    sheduleInvalidator(maxage)
  }
  history[pid] = object
}

function sheduleInvalidator (maxage) {
  if (size > 0) {
    if (interval === null) {
      interval = setInterval(runInvalidator, (maxage || DEFAULT_MAXAGE) / 2)
    }

    return
  }

  if (interval !== null) {
    clearInterval(interval)
    interval = null
  }
}

function runInvalidator () {
  var now = Date.now()
  var pids = Object.keys(expiration)
  for (var i = 0; i < pids.length; i++) {
    if (expiration[pids[i]] < now) {
      size--
      delete history[pids[i]]
      delete expiration[pids[i]]
    }
  }
  sheduleInvalidator()
}

module.exports = {
  get: get,
  set: set
}
