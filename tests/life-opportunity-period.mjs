import assert from 'node:assert/strict';
import {addedInPeriod,shiftPeriod,periodLabel} from '../life/opportunity-period.js';
assert.equal(addedInPeriod({createdAt:'2026-10-25T10:00:00Z'},'quarter','2026-11-21'),true);
assert.equal(addedInPeriod({createdAt:'2026-10-25T10:00:00Z'},'month','2026-11-21'),false);
assert.equal(addedInPeriod({createdAt:'2026-11-16T10:00:00Z'},'week','2026-11-21'),true);
assert.equal(addedInPeriod({createdAt:'2026-11-15T10:00:00Z'},'week','2026-11-21'),false);
assert.equal(addedInPeriod({},'all','2026-11-21'),true);
assert.equal(addedInPeriod({},'month','2026-11-21'),false);
assert.equal(shiftPeriod('2026-12-31','quarter',1),'2027-03-01');
assert.equal(shiftPeriod('2026-01-31','month',1),'2026-02-01');
assert.equal(shiftPeriod('2026-11-21','week',-1),'2026-11-14');
assert.equal(periodLabel('quarter','2026-11-21'),'Q4 2026');
console.log('Opportunity date scope, undated records and period boundaries passed');

assert.equal(addedInPeriod({createdAt:'2026-11-15T23:30:00Z'},'week','2026-11-21'),true,'Use Lagos calendar dates at the weekly boundary');
