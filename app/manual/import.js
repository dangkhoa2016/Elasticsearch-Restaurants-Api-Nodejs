'use strict'

require('array.prototype.flatmap').shim();
const debug = require('debug')('elasticsearch-restaurants-api-nodejs:->manual->import');

const ElasticsearchService = require('./elasticsearch');
const { client, index_name } = require('./client');
// const index_name = 'restaurants';
const StreamArray = require('stream-json/streamers/StreamArray');
const { Writable } = require('stream');
const fs = require('fs'), path = require('path');
const filePath = path.join(__dirname, './au-final.json');
const fileStream = fs.createReadStream(filePath);
const jsonStream = StreamArray.withParser();
var arr = [];
var doneTotal = 0;

const processingStream = new Writable({
  write: async ({ key, value }, encoding, callback) => {
    arr.push(value);

    if (arr.length === 40) {
      await run(arr).catch((ex) => {
        debug('Error bulk', ex);
        fileStream.close();
      });
      arr = [];
    }

    callback();

    //test
    // await run(arr);
    // fileStream.close();
  },
  //Don't skip this, as we need to operate with objects, not buffers
  objectMode: true
});

async function run(dataset) {

  const body = dataset.flatMap(doc => {
    var _id = doc['restaurantId'];
    delete doc['_id'];
    delete doc['restaurantId'];
    delete doc['diningStyle'];
    // v7
    return [{ index: { _index: index_name, _id, } }, doc];
    // v6
    // return [{ index: { _index: index_name, _id, _type: '_doc' } }, doc];
    // v5
    // return [{ index: { _index: index_name, _id, _type: 'restaurants' } }, doc];
  });
  debug(`run: ${body.length}`);
  // return;

  const { body: bulkResponse } = await client.bulk({ refresh: true, body });

  if (bulkResponse.errors) {
    const erroredDocuments = []
    // The items array has the same order of the dataset we just indexed.
    // The presence of the `error` key indicates that the operation
    // that we did for the document has failed.
    bulkResponse.items.forEach((action, i) => {
      const operation = Object.keys(action)[0];
      debug('operation', operation, action[operation]);
      if (action[operation].error) {
        erroredDocuments.push({
          // If the status is 429 it means that you can retry the document,
          // otherwise it's very likely a mapping error, and you should
          // fix the document before to try it again.
          status: action[operation].status,
          error: action[operation].error,
          operation: body[i * 2],
          document: body[i * 2 + 1]
        });
      }
    });
    debug('Error documents', erroredDocuments);
  }

  const { body: count } = await client.count({ index: index_name });
  debug(`count`, count);
  doneTotal += dataset.length;

};

(async () => {

  await ElasticsearchService.initIndex(index_name);

  //Pipe the streams as follows
  fileStream.pipe(jsonStream.input);
  jsonStream.pipe(processingStream);
  //So we're waiting for the 'finish' event when everything is done.
  processingStream.on('finish', async () => {
    if (arr.length > 0) {
      await run(arr).catch((ex) => {
        debug('Error bulk', ex);
        fileStream.close();
      });
    }

    debug(`All done: ${doneTotal}`);
  });

})();
