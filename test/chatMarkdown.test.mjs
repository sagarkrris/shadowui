import assert from "node:assert/strict";
import test from "node:test";

import { escHtml, renderInline } from "../lib/chatMarkdown.mjs";

test("escapes HTML before rendering inline markdown", () => {
  assert.equal(escHtml("<script>alert(1)</script>"), "&lt;script&gt;alert(1)&lt;/script&gt;");
  assert.equal(renderInline("<img src=x onerror=alert(1)>"), "&lt;img src=x onerror=alert(1)&gt;");
});

test("renders supported inline markdown safely", () => {
  assert.equal(
    renderInline("Use **bold**, *emphasis*, and `code`."),
    'Use <strong>bold</strong>, <em>emphasis</em>, and <span class="inline-code">code</span>.',
  );
});
