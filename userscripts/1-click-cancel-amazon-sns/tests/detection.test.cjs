const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const scriptPath = path.join(__dirname, '../1-click-cancel-amazon-sns.user.js');
const source = fs.readFileSync(scriptPath, 'utf8');
const instrumented = source.replace(
  '  addButton();\n})();',
  '  globalThis.testApi = { getVisibleSubscriptionIds, updateButton, setButtonMode };\n  addButton();\n})();'
);
assert.notEqual(instrumented, source, 'The test harness must export the actual script functions');

function card(attributes = {}, options = {}) {
  return {
    attributes,
    style: {},
    dataset: {},
    isConnected: true,
    visibility: options.visibility || 'visible',
    getAttribute(name) { return this.attributes[name] ?? null; },
    getClientRects() { return options.rendered === false ? [] : [{}]; },
    closest() { return options.hiddenAncestor ? {} : null; },
    contains(target) { return target === this; },
    addEventListener(name, callback) { this[name] = callback; },
  };
}

function editCard(id, options) {
  return card({ 'data-edit-url': `/auto-deliveries/ajax/subscription/?subscriptionId=${encodeURIComponent(id)}&subAsin=B012345678` }, options);
}

function setup(elements = []) {
  const frames = [];
  const observers = [];
  const children = [];
  let fetches = 0;
  let scans = 0;
  const body = { appendChild(element) { children.push(element); } };
  const context = vm.createContext({
    URL, URLSearchParams,
    location: { href: 'https://www.amazon.com.au/auto-deliveries?ref_=nav_AccountFlyout_sns', origin: 'https://www.amazon.com.au' },
    document: {
      body,
      querySelectorAll(selector) {
        assert.equal(selector, '[data-subscription-id], [data-edit-url]');
        scans++;
        return elements;
      },
      getElementById(id) { return children.find(element => element.id === id); },
      createElement() { return card(); },
    },
    MutationObserver: class {
      constructor(callback) { this.callback = callback; observers.push(this); }
      observe(target, options) { this.target = target; this.options = options; }
    },
    requestAnimationFrame(callback) { frames.push(callback); },
    getComputedStyle(element) { return { visibility: element.visibility }; },
    fetch() { fetches++; throw new Error('Network forbidden in this verification'); },
    console,
  });
  vm.runInContext(instrumented, context, { filename: scriptPath });
  return {
    context, elements, frames, observers, body,
    button: children[0],
    ids: () => Array.from(context.testApi.getVisibleSubscriptionIds()),
    mutate: (target = body) => observers[0].callback([{ target }]),
    flush: () => { while (frames.length) frames.shift()(); },
    get fetches() { return fetches; },
    get scans() { return scans; },
  };
}

let passed = 0;
function test(name, callback) {
  callback();
  passed++;
  console.log(`PASS ${name}`);
}

test('new relative and absolute edit URLs are detected at startup without requests', () => {
  const app = setup([editCard('SNST0_A'), card({ 'data-edit-url': 'https://www.amazon.com.au/auto-deliveries/ajax/subscription?subscriptionId=SNST0_B' })]);
  assert.deepEqual(app.ids(), ['SNST0_A', 'SNST0_B']);
  assert.equal(app.button.dataset.count, '2');
  assert.equal(app.button.textContent, '🛒 Cancel 2 visible S&S');
  assert.equal(app.fetches, 0);
});

test('legacy layout remains supported and IDs are deduplicated', () => {
  const app = setup([card({ 'data-subscription-id': ' SNST0_A ' }), editCard('SNST0_A'), editCard('SNST0_B'), editCard('SNST0_B')]);
  assert.deepEqual(app.ids(), ['SNST0_A', 'SNST0_B']);
});

test('URLSearchParams decodes encoded subscription IDs', () => {
  const app = setup([editCard('SNST0_a+b/c=')]);
  assert.deepEqual(app.ids(), ['SNST0_a+b/c=']);
});

test('hidden cards are excluded while rendered cards below the fold are included', () => {
  const app = setup([
    editCard('rendered'), editCard('display-none', { rendered: false }),
    editCard('hidden-parent', { hiddenAncestor: true }),
    editCard('visibility-hidden', { visibility: 'hidden' }),
    editCard('visibility-collapse', { visibility: 'collapse' }),
  ]);
  assert.deepEqual(app.ids(), ['rendered']);
});

test('malformed, external, unrelated and empty URLs are ignored', () => {
  const app = setup([
    editCard('valid'),
    card({ 'data-edit-url': 'https://[invalid' }),
    card({ 'data-edit-url': 'https://example.com/auto-deliveries/ajax/subscription/?subscriptionId=external' }),
    card({ 'data-edit-url': '/other-path?subscriptionId=unrelated' }),
    card({ 'data-edit-url': '/auto-deliveries/ajax/subscription/?subscriptionId=' }),
    card({ 'data-edit-url': '/auto-deliveries/ajax/subscription/?subAsin=B012345678' }),
  ]);
  assert.deepEqual(app.ids(), ['valid']);
});

test('subscriptions added after document-idle refresh the empty button', () => {
  const app = setup();
  assert.equal(app.button.dataset.mode, 'empty');
  app.elements.push(editCard('delayed'));
  app.mutate();
  app.flush();
  assert.equal(app.button.dataset.mode, 'cancel');
  assert.equal(app.button.dataset.count, '1');
  assert.equal(app.fetches, 0);
});

test('observer watches card and visibility changes throughout the body', () => {
  const app = setup();
  assert.equal(app.observers[0].target, app.body);
  const options = app.observers[0].options;
  assert.equal(options.childList, true);
  assert.equal(options.subtree, true);
  assert.equal(options.attributes, true);
  for (const name of ['data-subscription-id', 'data-edit-url', 'hidden', 'inert', 'aria-hidden', 'class', 'style']) {
    assert.ok(options.attributeFilter.includes(name));
  }
});

test('button mutations do not cause refresh loops', () => {
  const app = setup([editCard('A')]);
  const scans = app.scans;
  app.mutate(app.button);
  app.flush();
  assert.equal(app.scans, scans);
});

test('rapid page mutations share one scheduled scan', () => {
  const app = setup([editCard('A')]);
  const scans = app.scans;
  app.mutate(); app.mutate(); app.mutate();
  assert.equal(app.frames.length, 1);
  app.flush();
  assert.equal(app.scans, scans + 1);
});

test('mutations and already scheduled refreshes cannot reset a working button', () => {
  const app = setup([editCard('A')]);
  app.mutate();
  app.context.testApi.setButtonMode(app.button, 'working', 1);
  app.elements.push(editCard('B'));
  app.mutate();
  app.flush();
  assert.equal(app.button.dataset.mode, 'working');
  assert.equal(app.button.disabled, true);
  app.context.testApi.updateButton(app.button);
  assert.equal(app.button.dataset.mode, 'cancel');
  assert.equal(app.button.dataset.count, '2');
  assert.equal(app.button.disabled, false);
  assert.equal(app.fetches, 0);
});

test('removed cards update the count back to empty', () => {
  const app = setup([editCard('A')]);
  app.elements.length = 0;
  app.mutate();
  app.flush();
  assert.equal(app.button.dataset.mode, 'empty');
  assert.equal(app.button.dataset.count, '0');
});

console.log(`${passed} checks passed. No live cancellation requests were made.`);
