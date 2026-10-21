import test from 'node:test';
import assert from 'node:assert/strict';
import { NervousSystem } from '../NervousSystem.mjs';
import { ProtectedSettings } from '../autonomy/ProtectedSettings.mjs';
import { ApprovalGovernor } from '../autonomy/ApprovalGovernor.mjs';
import { ArbitraryCodeSandbox } from '../autonomy/ArbitraryCodeSandbox.mjs';
import { ReversibleChangeLedger } from '../autonomy/ReversibleChangeLedger.mjs';
import { ToolInstallationController } from '../autonomy/ToolInstallationController.mjs';
import { ArtifactCoat } from '../security/ArtifactCoat.mjs';
import { DeclarativeOperatorCompiler } from './DeclarativeOperatorCompiler.mjs';
import { ExamplePlanLearner } from './ExamplePlanLearner.mjs';
import { PlanSandboxRunner } from './PlanSandboxRunner.mjs';
import { LearnedToolCatalog } from './LearnedToolCatalog.mjs';
import { AutonomousProcedureLearner } from './AutonomousProcedureLearner.mjs';
import { MemorySnapshotStore } from '../persistence/SnapshotStores.mjs';
import { StateCapsule } from '../persistence/StateCapsule.mjs';

async function configured(store){
  const nervousSystem=new NervousSystem(),compiler=new DeclarativeOperatorCompiler(),coatAuthority=new ArtifactCoat(),catalog=new LearnedToolCatalog({compiler,coatAuthority});nervousSystem.learnedTools=catalog;
  const installer=new ToolInstallationController({mesh:nervousSystem.ato.mesh,sandbox:new ArbitraryCodeSandbox({runner:new PlanSandboxRunner({compiler})}),governor:new ApprovalGovernor({settings:new ProtectedSettings()}),ledger:new ReversibleChangeLedger(),coatAuthority});
  return {nervousSystem,compiler,catalog,learner:new AutonomousProcedureLearner({nervousSystem,inferer:new ExamplePlanLearner(),compiler,installer,catalog,identity:await coatAuthority.generateIdentity()}),capsule:new StateCapsule({store})};
}

test('ingests an unseen procedure, derives a plan, verifies, installs, restarts and reuses it',async()=>{
  const store=new MemorySnapshotStore(),first=await configured(store);
  const learned=await first.learner.learn({sourceText:'To triple a quantity, multiply the input by three.',examples:[{input:2,output:6},{input:5,output:15}],name:'triple-quantity'});
  assert.equal(learned.status,'installed');
  assert.equal(await first.nervousSystem.ato.mesh.automatons.get('triple-quantity').call(7),21);
  await first.capsule.save(first.nervousSystem);
  const second=await configured(store);
  await second.capsule.restore(second.nervousSystem);
  assert.equal(await second.nervousSystem.ato.mesh.automatons.get('triple-quantity').call(9),27);
  assert.equal(second.catalog.records.get('triple-quantity').coat.coatHash,learned.installation.coatHash);
});

test('restart refuses a learned plan whose persisted body was altered',async()=>{const store=new MemorySnapshotStore(),first=await configured(store);await first.learner.learn({sourceText:'To double a quantity, multiply the input by two.',examples:[{input:4,output:8}],name:'double-quantity'});const snapshot=await first.capsule.save(first.nervousSystem);snapshot.learnedTools.records[0][1].plan.right.value=999;await store.save('cynthia:organism',snapshot);const second=await configured(store);await assert.rejects(()=>second.capsule.restore(second.nervousSystem),/LEARNED_TOOL_COAT_INVALID/);});

test('unknown procedure remains explicit instead of inventing an implementation',async()=>{const setup=await configured(new MemorySnapshotStore());const result=await setup.learner.learn({sourceText:'Fold the field through its mirrored harmonic.',examples:[{input:2,output:8}]});assert.equal(result.status,'needs-definition');assert.equal(result.inference.reason,'NO_SUPPORTED_PRIMITIVE_CONTRACT');});
