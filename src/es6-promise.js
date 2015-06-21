"use strict";

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

function getProp(key) {
  return function(obj) {
    return obj[key];
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

  return listObjectsAsPromise(params)
    .then(getProp("Contents"))
    .then((files)=>{
      return Promise.all(files.map((file)=>{
        const params = {
          Bucket: process.env.CLOUDTRAIL_BUCKET,
          Key: file.Key
        };
        return getObjectAsPromise(params)
          .then(getProp("Body"))
          .then(unzipAsPromise)
          .then((data)=>{
            const logs = JSON.parse(data.toString());
            const records = logs.Records;

            return Promise.all(records.filter((record)=>{
              return record.eventName === "ConsoleLogin" ;
            }).map((record)=>{
              const msg = `${record.eventName} by ${record.userIdentity.userName} from ${record.sourceIPAddress}`;
              return callback(msg);
            }));
          });
      }));
    });
}

export default {
  name: () => "es6-promise",
  main: getConsoleLogin
};

