"use strict";

var zlib = require("zlib");

function getConsoleLogin(s3, date, callback) {
  var params = {
    Bucket: process.env.CLOUDTRAIL_BUCKET,
    Prefix: process.env.CLOUDTRAIL_DIR + date
  };

  s3.listObjects(params, (error, data) => {
    // console.log(data.IsTruncated);
    // console.log(data.Contents.length);
    if (error) {
      console.log(error);
      process.exit(1);
    }
    var files = data.Contents;

    for (let file of files) {
      var params = {
        Bucket: process.env.CLOUDTRAIL_BUCKET,
        Key: file.Key
      };
      // console.log('getting ' + file.Key)
      s3.getObject(params, (error, data) => {
        if (error) {
          console.log(error);
          process.exit(1);
        }
        // console.log(file.Key)
        zlib.unzip(data.Body, (error, data) => {
          var logs = JSON.parse(data.toString());
          var records = logs.Records;

          for (let record of records) {
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

      //if (++i > 9)
      //  break;

    }
  });
}

export default {
  name: () => "es6",
  main: getConsoleLogin
};

