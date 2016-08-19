/* eslint-disable no-new, no-console */
import test from 'ava';
import SubmitOrderResponseHandler from '../../../../src/response-handlers/submit-order-response-handler'; // eslint-disable-line max-len
import SubmitOrderResponse from '../../../../src/responses/submit-order-response';
import checkNotNullTest from '../../../helpers/check-not-null.js';
import FirebaseServer from 'firebase-server';
import firebaseDB from '../../../../src/firebase-db';

let server = null;
const response = new SubmitOrderResponse({
  passengerKey: 'cli_1',
  passengerLocation: [37.421955, -122.084058],
  passengerDestination: 'South San Francisco BART station, CA, 94080',
  createdAt: (new Date).getTime(), // use Firebase Timestamp in your code!
});

test.before(() => {
  server = new FirebaseServer(5504, 'localhost.firebaseio.test', {}); // empty db
});

test.after.always('guaranteed cleanup', () => {
  server.close();
});

checkNotNullTest('response', (args) => { new SubmitOrderResponseHandler(args); });

test('can be constructed with default parameters', t => {
  new SubmitOrderResponseHandler({ response: {} });
  t.pass();
});

test.cb('should create order when called', t => {
  t.plan(7);

  const assert = () => {
    const db = firebaseDB.config().ref('orders');
    db.on('value', (snapshot) => {
      const obj = snapshot.val();

      /* Database should look like this:

      { '27455828-d309-4370-bb10-6674d9d467f9':
         { createdAt: 1471578557107,
           g: '9q9hvumneq',
           l: [ 37.421955, -122.084058 ],
           passengerDestination: 'South San Francisco BART station, CA, 94080',
           passengerKey: 'cli_1',
           passengerLocation: [ 37.421955, -122.084058 ] } }

      Only one key-value pair. So we just need to get the first value.
      */

      t.is(Object.keys(obj).length, 1); // there should be 1 record
      const firstKey = Object.keys(obj)[0]; // first key (guid)
      const v = obj[firstKey]; // get the value (order properties)

      t.truthy(v.g); // geoFire metadata should be truthy
      t.deepEqual(v.l, [37.421955, -122.084058]); // geoFire location
      t.deepEqual(v.passengerLocation, [37.421955, -122.084058]);
      t.is(v.passengerKey, 'cli_1');
      t.is(v.passengerDestination, 'South San Francisco BART station, CA, 94080');
      t.truthy(v.createdAt);
      t.end();
    });
  };

  const handler = new SubmitOrderResponseHandler({ response });
  handler.call(assert);
});

test.cb('handles error while saving location', t => {
  const err = 'Sample error';

  // assert function, to be executed on `act`
  const assert = (actualMessage) => {
    const expectedMessage = `Error in SubmitOrderResponseHandler (geoFire): ${err}`;
    t.is(actualMessage, expectedMessage);
    t.end();

    // cleanup
    console.log = tmp; // eslint-disable-line no-use-before-define
  };

  // arrange: replace `console.log` with `assert` function created above
  const tmp = console.log;
  console.log = assert;

  // arrange: create fake geoFire, it will replace `handler.geoFire`
  const fakeGeoFire = { set: () => new Promise((resolve, reject) => { reject(err); }) };

  // act
  const handler = new SubmitOrderResponseHandler({ response });
  handler.geoFire = fakeGeoFire;
  handler.call(() => {});
});
