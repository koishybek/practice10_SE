// UI behaviour / integration checks: real index.html + all modules, driven through a jsdom document.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8")
  .replace(/<script[^>]*><\/script>/g, "");

async function setup() {
  const dom = new JSDOM(html);
  globalThis.window = dom.window;
  window.__TEST__ = true;
  const { mountApp } = await import("../src/ui/app.js");
  const doc = dom.window.document;
  mountApp(doc);
  const form = doc.getElementById("form");
  const fire = (el, type) => el.dispatchEvent(new dom.window.Event(type, { bubbles: true }));
  const set = (name, value) => { const el = form.elements.namedItem(name); el.value = value; fire(el, "input"); };
  const pickRoom = id => {
    const radio = doc.querySelector(`input[name="room"][value="${id}"]`);
    radio.click(); // real click: fires input + change like a browser
  };
  const submit = () => form.dispatchEvent(new dom.window.Event("submit", { bubbles: true, cancelable: true }));
  const result = () => doc.getElementById("result");
  return { doc, form, set, pickRoom, submit, result, fire };
}

test("UI: impossible requirements show the empty state (F4)", async () => {
  const { doc, set } = await setup();
  set("attendees", "100");
  assert.ok(doc.querySelector('[data-testid="empty-state"]'));
  assert.equal(doc.getElementById("match-count").textContent, "0 of 5 rooms match");
});

test("UI: switching rooms refreshes the availability result (F5)", async () => {
  const { set, pickRoom, submit, result } = await setup();
  set("start", "10:30"); set("end", "11:30");
  pickRoom("R-520"); submit();
  assert.equal(result().dataset.status, "available");
  pickRoom("R-204");
  assert.equal(result().dataset.status, "conflict");
  assert.match(result().textContent, /Software Engineering lecture/);
});

test("UI: a selected room that is filtered out is deselected and the result asks for a room", async () => {
  const { doc, set, pickRoom, submit, result } = await setup();
  set("start", "15:00"); set("end", "16:00");
  pickRoom("R-310"); submit();
  assert.equal(result().dataset.status, "available");
  set("attendees", "21");
  assert.equal(doc.querySelector('input[name="room"][value="R-310"]'), null);
  assert.equal(result().dataset.status, "no-room");
});
