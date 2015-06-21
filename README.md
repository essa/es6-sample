# es6-sample 


## description

This tool reports logins to AWS Web Console from logs of AWS CloudTrail.

I've writen same logic with following styles.

* ES5
* ES6
* ES6 with Promise
* ES6 with a genarator
* ES6 with functional programing style with [Ramda](http://ramdajs.com/)
* ES6 with FRP with [Bacon.js - Functional Reactive Programming library for JavaScript](https://baconjs.github.io/)  

This projet is based on [ぼくのかんがえたさいきょうのES6プロジェクトテンプレート - Qiita](http://qiita.com/mohayonao/items/9b0655b8b4979bffda31)

## run

Set up aws credentials.

    $ export CLOUDTRAIL_BUCKET=(your S3 bucket for AWS CloudTrail)
    $ export CLOUDTRAIL_DIR=(your directory for AWS CloudTrail)
    $ npm install
    $ npm build
    $ node run.js 2015/06/18
    ConsoleLogin by essa from 122.29.xxx.yyy

## build
- `npm run build`
  - `build-to5` && `build-browser` && `build-minify`

## test
- `npm run test`

## lint
- `npm run lint`


## Memo on styles

### ES5

The basic version.

AWS Cloudtrail logs all usage of APIs to a S3 bucket as gzipped json file.

This function scans all logs from a directory of specified date. And select the 'ConsoleLogin' api which is used when you logged in to AWS WebConsole.

```javascript
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
```

### ES6

Straightforward translation to ES6.

```javascript
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
```

## ES6 with Promise

With Promise.

```javascript
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
```

This version returns a Promise which notify success of all or failure.

### ES6 with generator

ES6 has a new feature 'generator'. You can write a psudo sync logic with async APIs.

```javascript
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

```

This version gets log files in sequential way.

### ES6 with functional programing style with ramda.js

```javascript
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

```

```javascript
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
```

This function is almost same with following logic from plain ES6 sample.

```javascript
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

```

### ES6 with functional reactive programing style with bacon.js

```javascript
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

```

