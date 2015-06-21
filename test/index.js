"use strict";

import index from "../src";
import AWS from "aws-sdk";
import assert from "power-assert";
import zlib from "zlib";
import sinon from "sinon";

let s3 = new AWS.S3({ region: "ap-northeast-1"});

describe("index", () => {
  function setupStubs() {
    before(() =>{
      sinon.stub(s3, "listObjects", (param, callback)=>{
        callback(null, {
          Contents: [
            { Key: "AWSLogs/123456789012/CloudTrail/ap-northeast-1/2015/06/18/726632824334_CloudTrail_ap-northeast-1_20150618T0030Z_ngi76AKB6ALPImWd.json.gz"},
            { Key: "AWSLogs/123456789012/CloudTrail/ap-northeast-1/2015/06/18/726632824334_CloudTrail_ap-northeast-1_20150618T0010Z_EDjqL14qSCVGHwgR.json.gz"},
            { Key: "AWSLogs/123456789012/CloudTrail/ap-northeast-1/2015/06/18/726632824334_CloudTrail_ap-northeast-1_20150618T0010Z_lLM7yZFddJH4v2M5.json.gz"}
          ]
        });
      });
      let records = [
        [
          { 
            userIdentity: { userName: "essa" },
            eventName: "ConsoleLogin",
            sourceIPAddress: "122.29.100.101",
          },
          {
            eventName: "DescribeInstanceHealth",
          }
        ],
        [
          {
            eventName: "DescribeInstanceHealth",
          },
          { 
            userIdentity: { userName: "uncate" },
            eventName: "ConsoleLogin",
            sourceIPAddress: "133.236.102.103",
          },
        ],
        [
          { 
            userIdentity: { userName: "essa" },
            eventName: "ConsoleLogin",
            sourceIPAddress: "104.155.104.105",
          },
          {
            eventName: "DescribeInstanceHealth",
          }
        ],
      ];
      let it = records[Symbol.iterator]();
      sinon.stub(s3, "getObject", (param, callback)=>{
        let data = { Records: it.next().value };
        const json = JSON.stringify(data);
        zlib.gzip(json, (error, data) => {
          callback(null, { Body: data } );
        });
      });
    });

    after(()=>{
      s3.listObjects.restore();
      s3.getObject.restore();
    });
  }

  const variants = [
    index.ES5,
    index.ES6,
    index.ES6_PROMISE,
    index.ES6_GENERATOR,
    index.ES6_RAMDA,
    index.ES6_BACON,
  ];
  for(let mod of variants) {
    describe(mod.name(), () => {
      setupStubs();
      it("should define function", () => {
        assert(typeof mod.main === "function");
      });
      it("should report login messages by callback", () => {
        const messages = [
          "ConsoleLogin by essa from 122.29.100.101",
          "ConsoleLogin by uncate from 133.236.102.103",
          "ConsoleLogin by essa from 104.155.104.105"
        ];
        let it = messages[Symbol.iterator]();
        return mod.main(s3, "2015/06/18", (message) => {
          assert.equal(message, it.next().value);
        });
      });
    });
  }
});
