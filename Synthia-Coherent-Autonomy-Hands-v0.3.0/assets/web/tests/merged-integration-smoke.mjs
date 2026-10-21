import assert from 'node:assert/strict';
import UnifiedSynthiaOS from '../integration/UnifiedSynthiaOS.mjs';
import TermiteHost from '../integration/TermiteHost.mjs';

const unit = new UnifiedSynthiaOS({ autoStart:false, memoryKey:`merge-smoke-${Date.now()}` });
const resolved = unit.resolveUnifiedState({gate:1,line:1,color:1,tone:1,base:1,dimension:'Movement',degree:0,minute:0,second:0});
assert.equal(resolved.address.gate,1);
assert.ok(resolved.views.kimi);
assert.ok(resolved.views.emergent);

const transition = unit.transitionUnifiedState({address:resolved.address,transition:'mirror'});
assert.ok(transition.record);

const success = unit.recordHumanSuccessV2('user','movement',0.8,{patternId:'test-pattern',gate:1,line:1,sourceNode:'local'});
assert.ok(success.vitality>=0 && success.vitality<=1);
unit.recordHumanSuccessV2('user','movement',0.9,{patternId:'test-pattern',gate:1,line:1,sourceNode:'local2'});
assert.ok(Array.isArray(unit.mycelialSuccess.exportShareable()));

const gateProcess = unit.activateGateLineProcess('user',{gate:2,line:2,color:1,tone:1,base:1,dimension:'Movement'});
assert.equal(gateProcess.horizon,4);
unit.gateLineProcesses.process(gateProcess.id,{amount:1});

const learned = unit.preserveAndLearnSource('Step 1: inspect the project. Step 2: test the change. Step 3: keep it only if verification passes.');
assert.ok(learned.source.id);
assert.ok(learned.procedures);

const media = unit.recursiveMedia.snapshot();
assert.equal(media.field.nodes.length,64);
assert.ok(unit.os.listApps().some(x=>x.id==='world'));
assert.ok(unit.os.listApps().some(x=>x.id==='browser'));
assert.ok(unit.os.listApps().some(x=>x.id==='builder'));
assert.ok(unit.os.listApps().some(x=>x.id==='morph'));

const termite = new TermiteHost({workspaceRoot:process.cwd(),initialNodes:8,cycleMs:1000});
const artifact = termite.ingest('example.js','export function hello(name){ return `hello ${name}`; }');
assert.ok(artifact.address);
assert.equal(termite.verify(artifact.id).decision,'allow');
termite.stop();

const snap = unit.snapshot();
assert.ok(snap.mergedExtensions.unifiedStateSpace);
assert.ok(snap.mergedExtensions.recursiveMedia);
assert.ok(snap.mergedExtensions.os.apps.length>=10);
unit.stopLife();
console.log(JSON.stringify({ok:true,stateViews:Object.keys(resolved.views),mediaNodes:media.field.nodes.length,osApps:snap.mergedExtensions.os.apps.length,termiteAddress:artifact.address},null,2));
