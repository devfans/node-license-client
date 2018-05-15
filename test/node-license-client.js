process.env.NO_DEPRECATION = 'node-license-client';

var after = require('after')
var assert = require('assert')
var Client = require('../')

describe('node-license-client', function(){
  it('get function', function(){
    assert.equal(typeof Client, 'function')
  })

  it('should success', function() {
  })
})
