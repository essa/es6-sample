"use strict";

import co from "co";
import zlib from "zlib";

function AsPromise(func) {
  return function(arg) {
    return new Promise((resolve, reject)=>{
      func(arg, (error, data) => {
        if (error) {
          reject(error);
        } else {
          resolve(data);
        }
      });
    }); 
  };
}

function getConsoleLogin(s3, date, callback) {
  const listObjectsAsPromise = AsPromise(s3.listObjects.bind(s3));
  const getObjectAsPromise = AsPromise(s3.getObject.bind(s3));
  const unzipAsPromise = AsPromise(zlib.unzip);

  const params = {
    Bucket: process.env.CLOUDTRAIL_BUCKET,
    Prefix: process.env.CLOUDTRAIL_DIR + date
  };

  return co(function*(){
    const files = yield listObjectsAsPromise(params);
    for(let file of files.Contents) {
      const params = {
        Bucket: process.env.CLOUDTRAIL_BUCKET,
        Key: file.Key
      };
      const ret = yield getObjectAsPromise(params);
      const data = yield unzipAsPromise(ret.Body);
      const logs = JSON.parse(data.toString());
      for (let record of logs.Records) {
        if (record.eventName !== "ConsoleLogin") {
          continue;
        }
        const msg = record.eventName +
          " by " + record.userIdentity.userName +
          " from " + record.sourceIPAddress;
        callback(msg);
      }
    }
  });
}

export default {
  name: () => "es6-generator",
  main: getConsoleLogin
};

