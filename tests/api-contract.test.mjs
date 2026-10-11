import test from "node:test";
import assert from "node:assert/strict";
import { api, ApiError } from "../src/lib/api.ts";

function reply(status, data) {
  return new Response(data == null ? null : JSON.stringify({ status, success: status < 400, data }), {
    status,
    headers: data == null ? {} : { "Content-Type": "application/json" },
  });
}

function mockFetch(handler) {
  const previous = globalThis.fetch;
  globalThis.fetch = async (url, init) => handler(String(url), init);
  return () => { globalThis.fetch = previous; };
}

test("orders use the v1 proxy path, Bearer auth and nested create response", async () => {
  const restore = mockFetch((url, init) => {
    assert.equal(url, "/api/v1/orders");
    assert.equal(new Headers(init.headers).get("Authorization"), "Bearer token");
    assert.equal(init.credentials, "include");
    assert.equal(JSON.parse(init.body).originWarehouseId, "warehouse-id");
    return reply(201, { order: { order: { id: "order-id", status: "draft", totalPrice: 0 } } });
  });
  try {
    const order = await api.orders.create("token", { originWarehouseId: "warehouse-id", destinationAddress: "Казань" });
    assert.equal(order.id, "order-id");
    assert.equal(order.status, "draft");
    assert.equal(order.totalPrice, 0);
  } finally { restore(); }
});

test("refresh uses cookie without an Authorization header", async () => {
  const restore = mockFetch((url, init) => {
    assert.equal(url, "/api/auth/refresh");
    assert.equal(new Headers(init.headers).get("Authorization"), null);
    assert.equal(init.credentials, "include");
    return reply(200, { auth: { access_token: "new", expires_in: 86400, user: { ID: "u", Role: "client" } } });
  });
  try { assert.equal((await api.auth.refresh()).access_token, "new"); }
  finally { restore(); }
});

test("assignment commands use assignment ID and return server state", async () => {
  const restore = mockFetch((url, init) => {
    assert.equal(url, "/api/v1/assignments/assignment-id/arrive");
    assert.equal(init.method, "POST");
    return reply(200, { assignment: { id: "assignment-id", orderId: "order-id", status: "active" } });
  });
  try { assert.equal((await api.assignments.arrive("token", "assignment-id")).status, "active"); }
  finally { restore(); }
});

test("empty success and backend errors are handled by HTTP status", async () => {
  let response = reply(204, null);
  const restore = mockFetch(() => response);
  try {
    await api.auth.logout("token");
    response = reply(409, { error: "ASSIGNMENT_STALE" });
    await assert.rejects(api.orders.submit("token", "order-id"), (err) => err instanceof ApiError && err.status === 409 && err.message === "ASSIGNMENT_STALE");
  } finally { restore(); }
});

test("document downloads keep PDF bytes intact", async () => {
  const restore = mockFetch((url, init) => {
    assert.equal(url, "/api/v1/documents/doc-id/download");
    assert.equal(new Headers(init.headers).get("Authorization"), "Bearer token");
    return new Response(new Uint8Array([37, 80, 68, 70]), { status: 200, headers: { "Content-Type": "application/pdf" } });
  });
  try { assert.deepEqual([...new Uint8Array(await (await api.documents.download("token", "doc-id")).arrayBuffer())], [37, 80, 68, 70]); }
  finally { restore(); }
});
