"use strict";

var zlib = require("zlib");

function getConsoleLogin(s3, date, callback) {
  var params = {
    Bucket: process.env.CLOUDTRAIL_BUCKET,
    Prefix: process.env.CLOUDTRAIL_DIR + date
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
            callback(msg);
          }
        });
      });
    }
  });
}

export default {
  name: () => "es5",
  main: getConsoleLogin
};
