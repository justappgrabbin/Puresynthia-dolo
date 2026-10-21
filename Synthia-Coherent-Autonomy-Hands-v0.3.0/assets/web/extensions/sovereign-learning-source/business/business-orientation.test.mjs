import test from 'node:test';
import assert from 'node:assert/strict';
import { NervousSystem } from '../NervousSystem.mjs';
import { configureJoeProductiveSynth } from '../identity/JoeProductiveSynth.mjs';
import { MemorySnapshotStore } from '../persistence/SnapshotStores.mjs';
import { StateCapsule } from '../persistence/StateCapsule.mjs';

const opportunities=[
  {id:'finish-bike-listing',expectedRevenue:350,upfrontCost:0,timeHours:2,timeToCashHours:24,evidence:.8,readiness:.9,risk:.1,actions:['publication','negotiation'],dependencies:[]},
  {id:'offer-local-repairs',expectedRevenue:200,upfrontCost:25,timeHours:8,timeToCashHours:72,evidence:.65,readiness:.65,risk:.25,recurring:true,actions:['publication'],dependencies:['replacement-parts']},
  {id:'invent-untested-product',expectedRevenue:5000,upfrontCost:600,timeHours:180,timeToCashHours:720,evidence:.1,readiness:.1,risk:.8,speculative:true,actions:['purchase','publication'],dependencies:['prototype','market-validation']}
];

test('pressing need—not a universal hard-coded favorite—weights business opportunities and explains the result',()=>{
  const nervous=new NervousSystem(),decision=nervous.business.evaluate(opportunities,{cashAvailable:18,cashTarget:350,cashUrgency:1,deadlineHours:48,recurringIncomeNeed:.4,riskTolerance:.2});
  assert.equal(decision.ranked[0].id,'finish-bike-listing');assert.equal(decision.ranked[0].horizon,'quick-cash');assert.equal(decision.ranked.at(-1).horizon,'speculative');assert.ok(decision.weights.urgency>0);assert.ok(decision.ranked[0].approvalRequired.includes('publication'));
  const explanation=nervous.business.explain(decision);assert.equal(explanation[0].id,'finish-bike-listing');assert.ok(explanation[0].reason.factors.evidence>.5);
});

test('Joe receives a private productive configuration without overwriting public Cynthia',()=>{
  const nervous=new NervousSystem(),before=structuredClone(nervous.personalSynths.sharedIdentity),joe=configureJoeProductiveSynth(nervous.personalSynths);
  assert.equal(joe.id,'personal-synth:joe');assert.equal(joe.sharedIdentityId,before.id);assert.equal(joe.sharedIdentityUnchanged,true);assert.ok(joe.tooling.focusAreas.includes('fabrication'));assert.ok(joe.tooling.focusAreas.includes('listings'));assert.deepEqual(nervous.personalSynths.sharedIdentity,before);
});

test('business evidence and personal configuration survive restart while binding actions remain approval-gated',async()=>{
  const store=new MemorySnapshotStore(),first=new NervousSystem();configureJoeProductiveSynth(first.personalSynths);const decision=first.business.evaluate(opportunities,{cashAvailable:18,cashTarget:350,cashUrgency:1,deadlineHours:48});first.business.recordOutcome({decisionId:decision.id,opportunityId:'finish-bike-listing',revenue:350,cost:0,hours:2,result:'sold',evidence:{receipt:'owner-recorded'}});await new StateCapsule({store}).save(first);
  const second=new NervousSystem();await new StateCapsule({store}).restore(second);assert.equal(second.business.outcomes[0].net,350);assert.equal(second.personalSynths.get('joe').private,true);assert.ok(second.business.decisions[0].ranked[0].approvalRequired.includes('publication'));
});
