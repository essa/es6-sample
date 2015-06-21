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

