'use strict'
var DEFAULT_MAXAGE = 60000

var expiration = {}
var history = {}
var expireListeners = {}

var last = 0;

function get (pid, maxage) {
  if (maxage <= 0) {
    return
  }

  var now = Date.now()
  runInvalidator(now)

  if (history[pid] !== undefined) {
    expiration[pid] = now + (maxage || DEFAULT_MAXAGE)
  }

  return history[pid]
}

function set (pid, object, maxage, onExpire) {
  if (object === undefined || maxage <= 0) return

  var now = Date.now()
  expiration[pid] = now + (maxage || DEFAULT_MAXAGE)
  runInvalidator(now)

  history[pid] = object
  if (onExpire) {
    expireListeners[pid] = onExpire
  }
}

function runInvalidator (now) {
  if (now - last < 1000) return
  last = now

  var pids = Object.keys(expiration)
  for (var i = 0; i < pids.length; i++) {
    var pid = pids[i]
    if (expiration[pid] < now) {
      if (expireListeners[pid]) {
        expireListeners[pid](history[pid])
      }

      delete history[pid]
      delete expiration[pid]
      delete expireListeners[pid]
    }
  }
}

function deleteLoop (obj) { for (const i in obj) { delete obj[i] } }

function clear () {
  deleteLoop(history)
  deleteLoop(expiration)
  deleteLoop(expireListeners)
}

module.exports = {
  get: get,
  set: set,
  clear: clear
}
