import test from 'node:test';
import assert from 'node:assert/strict';
import { NervousSystem } from '../NervousSystem.mjs';
import { ProtectedSettings } from '../autonomy/ProtectedSettings.mjs';
import { ApprovalGovernor } from '../autonomy/ApprovalGovernor.mjs';
import { ArbitraryCodeSandbox } from '../autonomy/ArbitraryCodeSandbox.mjs';
import { ReversibleChangeLedger } from '../autonomy/ReversibleChangeLedger.mjs';
import { ToolInstallationController } from '../autonomy/ToolInstallationController.mjs';
import { ArtifactCoat } from '../security/ArtifactCoat.mjs';
import { DeclarativeOperatorCompiler } from '../learning/DeclarativeOperatorCompiler.mjs';
import { PlanSandboxRunner } from '../learning/PlanSandboxRunner.mjs';
import { LearnedToolCatalog } from '../learning/LearnedToolCatalog.mjs';
import { AutonomousProcedureLearner } from '../learning/AutonomousProcedureLearner.mjs';
import { GeometryProcedureInferer } from './GeometryProcedureInferer.mjs';
import { BookSourceSpan } from './BookSourceSpan.mjs';
import { MemorySnapshotStore } from '../persistence/SnapshotStores.mjs';
import { StateCapsule } from '../persistence/StateCapsule.mjs';

async function organism(store){const nervousSystem=new NervousSystem(),compiler=new DeclarativeOperatorCompiler(),coatAuthority=new ArtifactCoat(),catalog=new LearnedToolCatalog({compiler,coatAuthority});nervousSystem.learnedTools=catalog;const installer=new ToolInstallationController({mesh:nervousSystem.ato.mesh,sandbox:new ArbitraryCodeSandbox({runner:new PlanSandboxRunner({compiler})}),governor:new ApprovalGovernor({settings:new ProtectedSettings()}),ledger:new ReversibleChangeLedger(),coatAuthority});return{nervousSystem,catalog,capsule:new StateCapsule({store}),learner:new AutonomousProcedureLearner({nervousSystem,inferer:new GeometryProcedureInferer(),compiler,installer,catalog,identity:await coatAuthority.generateIdentity()})};}

test('learns Euclid I.1 from a cited book span, verifies conditions, restarts and redraws',async()=>{
  const source=new BookSourceSpan({bookId:'euclid-elements-i-vi-1847',title:'The First Six Books of the Elements of Euclid',page:35,text:'On a given finite straight line to describe an equilateral triangle. Describe two circles, each centered at an endpoint and passing through the other endpoint; draw the two lines from their intersection to the endpoints. The three lines are equal.',visualEvidence:[{kind:'rendered-page',ref:'tmp/pdfs/euclid-page-035.png'}],provenance:{file:'Elements-I-VI.pdf',proposition:'Book I, Proposition I'}});
  const examples=[{input:{A:{x:180,y:320},B:{x:460,y:320}},condition:{path:['verification','passed'],equals:true}}],store=new MemorySnapshotStore(),first=await organism(store);
  const learned=await first.learner.learn({sourceText:source,examples,name:'euclid-I-1-equilateral'});
  assert.equal(learned.status,'installed');
  assert.deepEqual(learned.intake.source.metadata.citation,{bookId:source.bookId,title:source.title,page:35,visualEvidence:source.visualEvidence});
  const output=await first.nervousSystem.ato.mesh.automatons.get('euclid-I-1-equilateral').call({A:{x:0,y:0},B:{x:10,y:0}});
  assert.equal(output.verification.passed,true);assert.equal(output.primitives.filter(item=>item.type==='line').length,3);
  await first.capsule.save(first.nervousSystem);const second=await organism(store);await second.capsule.restore(second.nervousSystem);const replay=await second.nervousSystem.ato.mesh.automatons.get('euclid-I-1-equilateral').call({A:{x:20,y:50},B:{x:220,y:50}});assert.equal(replay.verification.passed,true);
});
