"use strict";

import Bacon from "baconjs";
import zlib from "zlib";

function getConsoleLogin(s3, date, callback) {
  var params = {
    Bucket: process.env.CLOUDTRAIL_BUCKET,
    Prefix: process.env.CLOUDTRAIL_DIR + date
  };
  
  const files = Bacon.fromNodeCallback(s3.listObjects.bind(s3), params)
    .map(".Contents")
    .flatMap(Bacon.fromArray)
    .map(".Key")
    ;

  const records = files.flatMap((fname)=>{
    var params = {
      Bucket: process.env.CLOUDTRAIL_BUCKET,
      Key: fname
    };
    return Bacon.fromNodeCallback(s3.getObject.bind(s3), params);
  })
    .map(".Body")
    .flatMap((data)=>{
      return Bacon.fromNodeCallback(zlib.unzip, data);
    })
    .map((x)=>x.toString())
    .map(JSON.parse)
    .map(".Records")
    .flatMap(Bacon.fromArray)
    ;

  const format = (record) => `${record.eventName} by ${record.userIdentity.userName} from ${record.sourceIPAddress}`;
  return records.filter((x)=>x.eventName === "ConsoleLogin")
    .map(format)
    .doAction(callback)
    .toPromise()
    ;
}

export default {
  name: () => "es6-bacon",
  main: getConsoleLogin
};

