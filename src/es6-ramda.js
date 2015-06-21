"use strict";

import R from "ramda";
import zlib from "zlib";

function getConsoleLogin(s3, date, callback) {
  const nodeCallback = (dataFunc) => {
    return function(error, data) {
      if (error) {
        console.log(error);
        process.exit(1);
      } else {
        return dataFunc(data);
      }
    };
  };

  const format = (record) => `${record.eventName} by ${record.userIdentity.userName} from ${record.sourceIPAddress}`;

  const processLogRecords = R.pipe(
    R.invoke("toString", []),
    JSON.parse,
    R.prop("Records"),
    R.filter(
      R.where({
        eventName: R.equals("ConsoleLogin")
      })
    ),
    R.forEach(R.pipe(format, callback))
  );
    

  const processData = (data) => {
    zlib.unzip(data.Body, nodeCallback(processLogRecords));
  };

  const processFile = (file) => {
    var params = {
      Bucket: process.env.CLOUDTRAIL_BUCKET,
      Key: file.Key
    };
    s3.getObject(params, nodeCallback(processData));
  };

  const processList = R.pipe(
    R.prop("Contents"),
    R.forEach(processFile)
  );

  var params = {
    Bucket: process.env.CLOUDTRAIL_BUCKET,
    Prefix: process.env.CLOUDTRAIL_DIR + date
  };
  s3.listObjects(params, nodeCallback(processList));
}

export default {
  name: () => "es6-ramda",
  main: getConsoleLogin
};

