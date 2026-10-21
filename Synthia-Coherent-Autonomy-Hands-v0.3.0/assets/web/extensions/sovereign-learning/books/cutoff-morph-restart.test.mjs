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
import { BookIngestionEngine } from './BookIngestionEngine.mjs';
import { DependencyResolver } from './DependencyResolver.mjs';
import { GapChannelFactory } from './GapChannelFactory.mjs';
import { BookLearningCoordinator } from './BookLearningCoordinator.mjs';
import { GapPrimitiveInferer } from './GapPrimitiveInferer.mjs';
import { RelationalConstructionInferer } from './RelationalConstructionInferer.mjs';
import { renderSvg } from '../geometry/MorphSvgRenderer.mjs';
import { MemorySnapshotStore } from '../persistence/SnapshotStores.mjs';
import { StateCapsule } from '../persistence/StateCapsule.mjs';

const page={page:37,text:'BOOK I. PROP. III. PROB. From the greater of two given straight lines, to cut off a part equal to the less. Draw the equal line (pr. 2); describe a circle (post. 3), then cut off the required part.',visualEvidence:[{kind:'rendered-page',ref:'proofs/euclid-book-I-proposition-III/source-page-37.png'}]};
const examples=[{input:{A:{x:100,y:180},B:{x:500,y:180},C:{x:100,y:350},D:{x:260,y:350}},condition:{path:['verification','passed'],equals:true}}];

async function system(store){const nervousSystem=new NervousSystem(),compiler=new DeclarativeOperatorCompiler(),coatAuthority=new ArtifactCoat(),catalog=new LearnedToolCatalog({compiler,coatAuthority}),resolver=new DependencyResolver({knownPrimitives:['postulate:3','action:draw','action:describe','action:equal'],propositionTools:{'euclid-elements-i-vi-1847:I.2':'euclid-I-2-copy-segment'}});nervousSystem.learnedTools=catalog;nervousSystem.bookDependencies=resolver;const installer=new ToolInstallationController({mesh:nervousSystem.ato.mesh,sandbox:new ArbitraryCodeSandbox({runner:new PlanSandboxRunner({compiler})}),governor:new ApprovalGovernor({settings:new ProtectedSettings()}),ledger:new ReversibleChangeLedger(),coatAuthority}),identity=await coatAuthority.generateIdentity();return{nervousSystem,compiler,catalog,resolver,installer,capsule:new StateCapsule({store}),learner:inferer=>new AutonomousProcedureLearner({nervousSystem,inferer,compiler,installer,catalog,identity}),coordinator:new BookLearningCoordinator({ingestion:new BookIngestionEngine(),resolver,gapFactory:new GapChannelFactory({mind:nervousSystem.organism.mind})})};}

test('I.3 gap grows cut-off-segment, retries relationally, Morph renders it, and restart reuses it',async()=>{
 const store=new MemorySnapshotStore(),first=await system(store),proposition=first.coordinator.discover({bookId:'euclid-elements-i-vi-1847',title:'Euclid',pages:[page]})[0],assessment=await first.coordinator.assess(proposition);assert.equal(assessment.status,'gap-identified');assert.ok(assessment.gap.members.includes('action:cut off'));
 const gapSource={text:'Cut off from the greater directed segment a part equal to the lesser segment by intersecting its direction with the circle of the lesser radius.',members:assessment.gap.members,citation:()=>proposition.span.citation()};const primitive=await first.learner(new GapPrimitiveInferer()).learn({sourceText:gapSource,examples,name:'cut-off-segment',resolvedAddress:assessment.gap.address});assert.equal(primitive.status,'installed');first.resolver.registerPrimitive('action:cut off');
 const ready=await first.coordinator.assess(proposition);assert.equal(ready.status,'ready');const learned=await first.learner(new RelationalConstructionInferer()).learn({sourceText:{text:proposition.span.text,resolution:ready.resolution,citation:()=>proposition.span.citation()},examples,name:'euclid-I-3-cut-equal-segment'});assert.equal(learned.status,'installed');first.coordinator.retain(proposition,learned.toolId);
 const output=await first.nervousSystem.ato.mesh.automatons.get(learned.toolId).call(examples[0].input);assert.equal(output.verification.passed,true);const svg=renderSvg(output.primitives,{width:640,height:480});assert.match(svg,/data-id="AE"/);assert.match(svg,/data-id="cutoff-circle"/);assert.match(svg,/data-id="CD"/);
 await first.capsule.save(first.nervousSystem);const second=await system(store);await second.capsule.restore(second.nervousSystem);const replay=await second.nervousSystem.ato.mesh.automatons.get('euclid-I-3-cut-equal-segment').call({A:{x:40,y:80},B:{x:540,y:220},C:{x:80,y:400},D:{x:203,y:400}});assert.equal(replay.verification.passed,true);assert.equal(second.resolver.propositionTools.get('euclid-elements-i-vi-1847:I.3'),'euclid-I-3-cut-equal-segment');
});
