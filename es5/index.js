"use strict";

var AWS = require("aws-sdk"),
  zlib = require("zlib");

if (! process.env.CLOUDTRAIL_BUCKET) {
  console.log("Set CLOUDTRAIL_BUCKET");
  process.exit(1);
}

if (! process.env.CLOUDTRAIL_DIR) {
  console.log("Set CLOUDTRAIL_DIR");
  process.exit(1);
}


var s3 = new AWS.S3({ region: "ap-northeast-1"});

var params = {
  Bucket: process.env.CLOUDTRAIL_BUCKET,
  Prefix: process.env.CLOUDTRAIL_DIR + process.argv[2],
};

s3.listObjects(params, function(error, data) {
  if (error) {
    console.log(error);
    process.exit(1);
  }
  var files = data.Contents;
  var i, j;

  for (i=0; i < files.length; i++) {
    var file = files[i].Key; 
    var params = {
      Bucket: process.env.CLOUDTRAIL_BUCKET,
      Key: file
    };
    s3.getObject(params, function(error, data) {
      if (error) {
        console.log(error);
        process.exit(1);
      }
      zlib.unzip(data.Body, function(error, data) {
        var logs = JSON.parse(data.toString());
        var records = logs.Records;

        // console.log(records);
        for (j=0; j < records.length; j++) {
          var record = records[j];
          if (record.eventName !== "ConsoleLogin") {
            continue;
          }
          var msg = record.eventName +
            " by " + record.userIdentity.userName +
            " from " + record.sourceIPAddress;
          console.log(msg);
        }
      });
    });
  }
});
