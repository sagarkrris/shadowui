import assert from "node:assert/strict";
import test from "node:test";

import {
  buildUserPrepLabel,
  getDisplayName,
  getStackGreeting,
} from "../lib/personalization.mjs";

test("formats Python greetings with a Python-style message", () => {
  const greeting = getStackGreeting({
    name: "  Sagar  ",
    stack: "Python, Django",
  });

  assert.equal(greeting.salutation, "Namaskara, Sagar");
  assert.equal(greeting.headline, 'print("Namaskara, Sagar")');
  assert.equal(greeting.context, "Python prep ready for Sagar.");
});

test("formats Java greetings with a Java-style message", () => {
  const greeting = getStackGreeting({
    name: "Ananya",
    stack: "Java, Spring Boot",
  });

  assert.equal(greeting.salutation, "Namaskara, Ananya");
  assert.equal(greeting.headline, "public class AnanyaPrep { ready(); }");
  assert.equal(greeting.context, "Java prep ready for Ananya.");
});

test("falls back to a neutral greeting when stack or name is missing", () => {
  assert.equal(getDisplayName({ name: "  " }), "there");

  const greeting = getStackGreeting({
    name: "",
    stack: "Internal tools",
  });

  assert.equal(greeting.salutation, "Namaskara, there");
  assert.equal(greeting.headline, "Namaskara, there");
  assert.equal(greeting.context, "Full Stack prep ready.");
});

test("builds concise user prep labels", () => {
  assert.equal(
    buildUserPrepLabel({ name: "Sagar", stack: "Python" }),
    "Sagar's Python Prep",
  );
  assert.equal(
    buildUserPrepLabel({ name: "", stack: "Legacy tools" }),
    "Full Stack Prep",
  );
});
