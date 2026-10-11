import test from 'node:test';
import assert from 'node:assert/strict';
import { api, ApiError } from '../src/lib/api.ts';
import { Session, SessionChangedError } from '../src/lib/session.ts';
const auth = (token) => ({ access_token: token, user: { ID: 'u' } });
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
};
test('parallel 401 responses perform one refresh and retry once', async () => {
  const previous = api.auth.refresh,
    pending = deferred();
  let calls = 0;
  api.auth.refresh = () => {
    calls++;
    return pending.promise;
  };
  try {
    const session = new Session(() => {});
    await session.signIn(async () => auth('old'));
    const run = () =>
      session.run(async (token) => {
        if (token === 'old') throw new ApiError(401, 'expired');
        return token;
      });
    const all = Promise.all([run(), run(), run()]);
    await Promise.resolve();
    pending.resolve(auth('new'));
    assert.deepEqual(await all, ['new', 'new', 'new']);
    assert.equal(calls, 1);
  } finally {
    api.auth.refresh = previous;
  }
});
test('logout invalidates an in-flight refresh', async () => {
  const previous = api.auth.refresh,
    pending = deferred(),
    values = [];
  api.auth.refresh = () => pending.promise;
  try {
    const session = new Session((value) => values.push(value));
    const refresh = session.refresh();
    session.clear();
    pending.resolve(auth('late'));
    await assert.rejects(refresh, SessionChangedError);
    assert.equal(session.token, null);
    assert.deepEqual(values, [null]);
  } finally {
    api.auth.refresh = previous;
  }
});
test('new sign-in cannot be overwritten by late restoration or login', async () => {
  const previous = api.auth.refresh,
    pending = deferred();
  api.auth.refresh = () => pending.promise;
  try {
    const session = new Session(() => {});
    const restore = session.refresh();
    await session.signIn(async () => auth('current'));
    pending.resolve(auth('old'));
    await assert.rejects(restore, SessionChangedError);
    assert.equal(session.token, 'current');
    const late = deferred();
    const login = session.signIn(() => late.promise);
    session.clear();
    late.resolve(auth('late-login'));
    await assert.rejects(login, SessionChangedError);
    assert.equal(session.token, null);
  } finally {
    api.auth.refresh = previous;
  }
});
test('a retried request never refreshes for a second 401', async () => {
  const previous = api.auth.refresh;
  let calls = 0,
    requests = 0;
  api.auth.refresh = async () => {
    calls++;
    return auth('new');
  };
  try {
    const session = new Session(() => {});
    await session.signIn(async () => auth('old'));
    await assert.rejects(
      session.run(async () => {
        requests++;
        throw new ApiError(401, 'expired');
      }),
      ApiError,
    );
    assert.equal(calls, 1);
    assert.equal(requests, 2);
  } finally {
    api.auth.refresh = previous;
  }
});
test('late protected response is rejected after logout', async () => {
  const pending = deferred(),
    session = new Session(() => {});
  await session.signIn(async () => auth('old'));
  const result = session.run(() => pending.promise);
  session.clear();
  pending.resolve('private-data');
  await assert.rejects(result, SessionChangedError);
});
test('logout aborts the refresh HTTP request', async () => {
  const previous = api.auth.refresh;
  let signal;
  api.auth.refresh = (input) => {
    signal = input;
    return new Promise((_, reject) =>
      input.addEventListener('abort', () => reject(new Error('aborted'))),
    );
  };
  try {
    const session = new Session(() => {});
    const result = session.refresh();
    session.clear();
    assert.equal(signal.aborted, true);
    await assert.rejects(result, SessionChangedError);
  } finally {
    api.auth.refresh = previous;
  }
});
