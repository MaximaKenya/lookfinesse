import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  TRIAL_DAYS,
  daysRemaining,
  daysRemainingLabel,
  dueReminderDays,
  extendTrialEnd,
  trialAllowsWrite,
  trialWindow,
} from "../config/trial.ts";

const NOW = new Date("2026-10-23T08:00:00.000Z");

function plusDays(days: number, from = NOW): Date {
  return new Date(from.getTime() + days * 24 * 60 * 60 * 1000);
}

describe("account trial day count", () => {
  it("uses a single 30-day length", () => {
    assert.equal(TRIAL_DAYS, 30);
    const window = trialWindow(NOW);
    assert.equal(window.trial_start, NOW.toISOString());
    assert.equal(daysRemaining(window.trial_end, NOW), 30);
  });

  it("counts partial days up and stops at the end", () => {
    assert.equal(daysRemaining(plusDays(7), NOW), 7);
    assert.equal(daysRemaining(plusDays(1), NOW), 1);
    assert.equal(daysRemaining(new Date(NOW.getTime() + 60_000), NOW), 1);
    assert.equal(daysRemaining(NOW, NOW), 0);
    assert.equal(daysRemaining(plusDays(-1), NOW), 0);
    assert.equal(daysRemaining(null, NOW), 0);
    assert.equal(daysRemaining("not-a-date", NOW), 0);
  });

  it("labels the counter", () => {
    assert.equal(daysRemainingLabel(30), "30 days remaining");
    assert.equal(daysRemainingLabel(1), "1 day remaining");
  });

  it("keeps writes open until the end date, and when the date is missing", () => {
    assert.equal(trialAllowsWrite({ trialEnd: plusDays(1), now: NOW }), true);
    assert.equal(trialAllowsWrite({ trialEnd: NOW, now: NOW }), false);
    assert.equal(trialAllowsWrite({ trialEnd: null, now: NOW }), true);
    assert.equal(trialAllowsWrite({ trialEnd: "nope", now: NOW }), true);
  });
});

describe("trial reminder windows", () => {
  it("sends 7, 3, and 1 exactly once inside each window", () => {
    assert.deepEqual(dueReminderDays(30, []), []);
    assert.deepEqual(dueReminderDays(8, []), []);
    assert.deepEqual(dueReminderDays(7, []), [7]);
    assert.deepEqual(dueReminderDays(5, []), [7]);
    assert.deepEqual(dueReminderDays(4, []), [7]);
    assert.deepEqual(dueReminderDays(3, []), [3]);
    assert.deepEqual(dueReminderDays(2, []), [3]);
    assert.deepEqual(dueReminderDays(1, []), [1]);
    assert.deepEqual(dueReminderDays(0, []), []);
  });

  it("skips milestones that were already sent", () => {
    assert.deepEqual(dueReminderDays(6, [7]), []);
    assert.deepEqual(dueReminderDays(1, [7, 3]), [1]);
    assert.deepEqual(dueReminderDays(1, [1]), []);
  });

  it("extends from the later of now and the current end", () => {
    const extended = extendTrialEnd(plusDays(2).toISOString(), 30, NOW);
    assert.equal(daysRemaining(extended, NOW), 32);
    const revived = extendTrialEnd(plusDays(-4).toISOString(), 30, NOW);
    assert.equal(daysRemaining(revived, NOW), 30);
  });
});
