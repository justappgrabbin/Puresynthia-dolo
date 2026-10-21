import test from 'node:test';
import assert from 'node:assert/strict';
import { NervousSystem } from '../NervousSystem.mjs';
import { StateCapsule } from '../persistence/StateCapsule.mjs';
import { MemorySnapshotStore } from '../persistence/SnapshotStores.mjs';

test('media Morph preserves identity and original before addressing, while exposing honest faculty gaps',async()=>{
  const nervous=new NervousSystem();
  const source={kind:'photo',subjectId:'person:ada',origin:'owner-device',provenance:{filename:'portrait.jpg'},identityReferences:['front','profile'],transformations:['clothing','pose','environment'],outputs:['sprites','video','playable-character']};
  const plan=await nervous.morph.ingest(source,{mode:'media',request:'make a consistent playable character',identityId:'person:ada'});
  assert.equal(plan.original.preserved,true);assert.equal(plan.descendant.mutatesOriginal,false);assert.equal(plan.addressDerivedAfterAnalysis,true);assert.equal(plan.identity.continuous,true);
  assert.ok(plan.capabilities.available.includes('sensory-ingestion'));assert.ok(plan.capabilities.gaps.includes('identity-embedding'));assert.equal(plan.execution.preference,'local-device');assert.equal(plan.execution.heavyFallback,'person-sovereign-backend');
});

test('repository Morph refuses wishful evolution until original runtime evidence exists, then plans a versioned descendant',async()=>{
  const nervous=new NervousSystem(),repository={repository:true,owner:'donor',origin:'https://example.invalid/game',revision:'abc123',description:'perfect revolutionary game',files:[{path:'src/game.js'},{path:'assets/hero.png'},{path:'README.md'},{path:'package.json'},{path:'test/game.test.js'},{path:'.git/logs/HEAD'}]};
  const blocked=await nervous.morph.ingest(repository,{mode:'repository',request:'repair and personalize'});assert.equal(blocked.status,'original-test-required');assert.equal(blocked.interrogation.descriptionTrustedAsEvidence,false);assert.equal(blocked.interrogation.inventory.tests,1);assert.equal(blocked.original.preserved,true);
  nervous.morph.registerCapability('test-runner').registerCapability('crash-runner').registerCapability('repository-reader').registerCapability('descendant-builder');
  const planned=await nervous.morph.ingest(repository,{mode:'repository',request:'repair and personalize',testEvidence:{ran:true,exitCode:1,crash:'missing asset'}});assert.notEqual(planned.status,'original-test-required');assert.equal(planned.descendant.versioned,true);assert.equal(planned.descendant.mutatesOriginal,false);assert.deepEqual(planned.interrogation.runtimeEvidence,{ran:true,exitCode:1,crash:'missing asset'});
});

test('expressive Morph keeps Cynthia continuous, gates external commitment, and remembers corrections across restart',async()=>{
  const store=new MemorySnapshotStore(),first=new NervousSystem();
  const form=await first.morph.ingest({form:'interactive-application',surface:'conversation',actions:['navigate','type','select','upload','submit'],permissions:['draft-fields']},{mode:'expression',request:'become the application interface',identityId:'cynthia',bindingAction:true});
  assert.equal(form.identity.id,'cynthia');assert.equal(form.identity.continuous,true);assert.equal(form.execution.reviewRequired,true);
  first.morph.correct({subjectId:'person:ada',trait:'eye-color',expected:'brown',observed:'blue',sourceId:form.original.sourceId});
  await new StateCapsule({store}).save(first);const second=new NervousSystem();await new StateCapsule({store}).restore(second);
  assert.equal(second.morph.corrections.forSubject('person:ada')[0].expected,'brown');
});
