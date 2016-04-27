/* eslint-disable no-new */
import test from 'ava';
import User from '../src/user';

test('user can be constructed with default parameters', t => {
  new User({ platformType: 'cli', platformId: 1 });
  t.pass();
});

test('user can be constructed with extra parameters', t => {
  new User({ platformType: 'cli', platformId: 1, extra: 555 });
  t.pass();
});

test('user parameters should be accessible from outside', t => {
  const u = new User({ platformType: 'cli', platformId: 1, extra: 555 });
  t.is(u.platformType, 'cli');
  t.is(u.platformId, 1);
  t.is(u.extra, 555);
  t.pass();
});
