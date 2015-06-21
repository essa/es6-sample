"use strict";

require('babel/polyfill');

var AWS = require("aws-sdk"),

  // select on of the modules
  notifyLogin = require("./lib/es6")
  //notifyLogin = require("./lib/es6-promise")
  //notifyLogin = require("./lib/es6-generator")
  //notifyLogin = require("./lib/es6-bacon")
  //notifyLogin = require("./lib/es5")
  ;

if (! process.env.CLOUDTRAIL_BUCKET) {
  console.log("Set CLOUDTRAIL_BUCKET");
  process.exit(1);
}

if (! process.env.CLOUDTRAIL_DIR) {
  console.log("Set CLOUDTRAIL_DIR");
  process.exit(1);
}

if (! process.argv[2]) {
  console.log("usage: node run.js 2015/06/18");
  process.exit(1);
}

var s3 = new AWS.S3({ region: "ap-northeast-1"});

console.log(notifyLogin.name() + " start " + process.argv[2]);
notifyLogin.main(s3, process.argv[2], function(msg) {
  console.log(msg);
});

