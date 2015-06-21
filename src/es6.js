"use strict";

import zlib from "zlib";

function getConsoleLogin(s3, date, callback) {
  var params = {
    Bucket: process.env.CLOUDTRAIL_BUCKET,
    Prefix: process.env.CLOUDTRAIL_DIR + date
  };

  s3.listObjects(params, (error, data) => {
    if (error) {
      console.log(error);
      process.exit(1);
    }
    let files = data.Contents;

    for (let file of files) {
      let params = {
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
          let logs = JSON.parse(data.toString());
          let records = logs.Records;

          for (let record of records) {
            if (record.eventName !== "ConsoleLogin") {
              continue;
            }
            let msg = record.eventName +
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
  name: () => "es6",
  main: getConsoleLogin
};

