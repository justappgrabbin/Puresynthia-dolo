import test from 'node:test';
import assert from 'node:assert/strict';
import { bootstrapATO } from '../../../vendor/ato-core/src/bootstrap.mjs';
import { ProtectedSettings } from './ProtectedSettings.mjs';
import { ApprovalGovernor } from './ApprovalGovernor.mjs';
import { ArbitraryCodeSandbox } from './ArbitraryCodeSandbox.mjs';
import { ReversibleChangeLedger } from './ReversibleChangeLedger.mjs';
import { ToolInstallationController } from './ToolInstallationController.mjs';
import { ArtifactCoat } from '../security/ArtifactCoat.mjs';

test('generated tool requires sandbox evidence and approval, installs, then reverses',async()=>{
  const ato=bootstrapATO(),settings=new ProtectedSettings();
  const sandbox=new ArbitraryCodeSandbox({runner:{execute:async artifact=>({status:artifact.code.includes('return')?'passed':'failed'})}});
  const governor=new ApprovalGovernor({settings}),ledger=new ReversibleChangeLedger(),coatAuthority=new ArtifactCoat();
  const controller=new ToolInstallationController({mesh:ato.mesh,sandbox,governor,ledger,coatAuthority});
  const identity=await coatAuthority.generateIdentity();
  const staged=await controller.propose({code:'export default input => { return {seen: input}; };',contract:{inputs:['json'],outputs:['json']},manifest:{id:'learned-observer',address:{dimension:'Design',gate:14,line:1,color:1,tone:1,base:1,mode:'macro'},structure:'bigram',activeLevels:[1],functionalLevel:'design',ports:[]},identity,confidence:.96,resonance:.91});
  await controller.test(staged.proposal.id);
  const installed=await controller.install(staged.proposal.id,'approve',{implementation:input=>({seen:input})});
  assert.equal(installed.status,'installed');
  assert.deepEqual(await ato.mesh.automatons.get('learned-observer').call('hello'),{seen:'hello'});
  assert.equal((await ledger.back()).status,'reverted');
  assert.equal(ato.mesh.automatons.has('learned-observer'),false);
});

test('approval alone cannot install untested generated code',async()=>{
  const ato=bootstrapATO(),settings=new ProtectedSettings(),governor=new ApprovalGovernor({settings}),coatAuthority=new ArtifactCoat();
  const controller=new ToolInstallationController({mesh:ato.mesh,sandbox:new ArbitraryCodeSandbox(),governor,ledger:new ReversibleChangeLedger(),coatAuthority});
  const staged=await controller.propose({code:'return input',contract:{inputs:['json'],outputs:['json']},manifest:{id:'untested',address:{dimension:'Design',gate:14,line:1,color:1,tone:1,base:1,mode:'macro'},structure:'bigram',activeLevels:[0],functionalLevel:'design'},identity:await coatAuthority.generateIdentity(),confidence:1,resonance:1});
  await assert.rejects(()=>controller.install(staged.proposal.id,'approve',{implementation:x=>x}),/PASSING_SANDBOX_EVIDENCE_REQUIRED/);
});
