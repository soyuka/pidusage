'use strict'

var expiration = {}
var history = {}

var size = 0
var maxage = 60000
var interval = null

function get (pid) {
  if (history[pid] !== undefined) {
    expiration[pid] = Date.now() + maxage
  }
  return history[pid]
}

function set (pid, object) {
  if (object === undefined) return

  expiration[pid] = Date.now() + maxage
  if (history[pid] === undefined) {
    size++
    sheduleInvalidator()
  }
  history[pid] = object
}

function remove (pid) {
  if (history[pid] !== undefined) {
    size--
    delete history[pid]
    delete expiration[pid]
    sheduleInvalidator()
  }
}

function sheduleInvalidator () {
  if (size > 0) {
    if (interval === null) {
      interval = setInterval(runInvalidator, maxage / 2)
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
  set: set,
  remove: remove
}
