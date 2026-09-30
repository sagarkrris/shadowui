import assert from "node:assert/strict";
import test from "node:test";
import { SYSTEM_DESIGN_VISUAL_GUIDE } from "../lib/systemDesignVisualGuide.mjs";

test("visual system design guide groups fifty concepts with diagrams throughout", () => {
  assert.equal(SYSTEM_DESIGN_VISUAL_GUIDE.sections.length, 5);
  const ids = new Set(SYSTEM_DESIGN_VISUAL_GUIDE.sections.map(section => section.id));
  assert.equal(ids.size, SYSTEM_DESIGN_VISUAL_GUIDE.sections.length);
  for (const section of SYSTEM_DESIGN_VISUAL_GUIDE.sections) {
    assert.ok(section.takeaway);
    assert.equal(section.concepts.length, 10);
    assert.equal(section.diagrams.length, 2);
    for (const diagram of section.diagrams) {
      assert.ok(diagram.title && diagram.description);
      assert.ok(diagram.nodes.length >= 4);
      assert.equal(diagram.edges.length, diagram.nodes.length - 1);
    }
  }
  assert.equal(SYSTEM_DESIGN_VISUAL_GUIDE.sections.flatMap(section => section.concepts).length, 50);
});
