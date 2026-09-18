import test from 'node:test';
import assert from 'node:assert/strict';
import { COURSE_VISUAL_GUIDES, calculateTeachingBudget } from '../lib/courseVisualGuides.mjs';
import { AI_SESSIONS } from '../lib/aiEngineeringCurriculum.mjs';
import { BEGINNER_PATHS } from '../lib/aiBeginnerPaths.mjs';
import { ADVANCED_WORKSHOPS } from '../lib/aiAdvancedCourse.mjs';
import { contextBudget } from '../public/course/interviewiq-lab.mjs';

test('every beginner, core, and advanced lesson has a concrete visual guide', () => {
  const lessons = [...AI_SESSIONS, ...BEGINNER_PATHS.flatMap(path => path.lessons), ...ADVANCED_WORKSHOPS];
  assert.equal(lessons.length, 24);
  for (const lesson of lessons) {
    const guide = COURSE_VISUAL_GUIDES[lesson.id];
    assert.ok(guide?.story && guide.takeaway, lesson.id);
    assert.equal(guide.steps.length, 4, lesson.id);
    for (const step of guide.steps) assert.ok(step.length === 2 && step.every(Boolean), lesson.id);
  }
});
test('explorer agrees with the runnable lab and exposes overflow, exact fit, and headroom', () => {
  for (const history of [0, 1000, 1600, 2600, 3200, 4000]) {
    for (const extra of [false, true]) {
      const budget = calculateTeachingBudget(history, extra);
      const args = { historyTokens: history, retrievalTokens: extra ? 4500 : 3000 };
      assert.equal(budget.used + budget.remaining, 8000);
      if (budget.remaining < 0) assert.throws(() => contextBudget(args), /exceeded/);
      else assert.equal(contextBudget(args).remaining, budget.remaining);
    }
  }
  assert.equal(calculateTeachingBudget().remaining, 1000);
  assert.equal(calculateTeachingBudget(3200).remaining, -600);
  assert.equal(calculateTeachingBudget(2600).remaining, 0);
  assert.equal(calculateTeachingBudget(1000).remaining, 1600);
  assert.equal(calculateTeachingBudget(1600, true).remaining, -500);
});
