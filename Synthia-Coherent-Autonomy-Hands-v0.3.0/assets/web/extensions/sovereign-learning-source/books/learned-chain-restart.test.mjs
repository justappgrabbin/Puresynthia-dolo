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
import { GapPrimitiveInferer } from './GapPrimitiveInferer.mjs';
import { EuclidIIProcedureInferer } from './EuclidIIProcedureInferer.mjs';
import { BookIngestionEngine } from './BookIngestionEngine.mjs';
import { DependencyResolver } from './DependencyResolver.mjs';
import { GapChannelFactory } from './GapChannelFactory.mjs';
import { BookLearningCoordinator } from './BookLearningCoordinator.mjs';
import { MemorySnapshotStore } from '../persistence/SnapshotStores.mjs';
import { StateCapsule } from '../persistence/StateCapsule.mjs';

const pages=[
 {page:35,text:'BOOK I. PROPOSITION I. PROBLEM. On a given finite straight line to describe an equilateral triangle. Describe two circles, each centered at an endpoint and passing through the other endpoint; draw the two lines from their intersection to the endpoints. The three lines are equal.'},
 {page:36,text:'BOOK I. PROP. II. PROB. From a given point to draw a straight line equal to a given finite straight line. Draw a line (post. 1), describe an equilateral triangle (pr. i.), produce the lines (post. 2), describe circles (post. 3), then is the line required. For the radii are equal (def. 15) and by ax. 3 the constructed line is equal.'},
 {page:37,text:'BOOK I. PROP. III. PROB. From the greater of two given straight lines, to cut off a part equal to the less. Draw the equal line (pr. 2); describe a circle (post. 3), then cut off the required part.'},
];
const known=['postulate:1','postulate:2','postulate:3','definition:15','axiom:3','action:draw','action:describe','action:equal'];

async function system(store){const nervousSystem=new NervousSystem(),compiler=new DeclarativeOperatorCompiler(),coatAuthority=new ArtifactCoat(),catalog=new LearnedToolCatalog({compiler,coatAuthority}),resolver=new DependencyResolver({knownPrimitives:known});nervousSystem.learnedTools=catalog;nervousSystem.bookDependencies=resolver;const installer=new ToolInstallationController({mesh:nervousSystem.ato.mesh,sandbox:new ArbitraryCodeSandbox({runner:new PlanSandboxRunner({compiler})}),governor:new ApprovalGovernor({settings:new ProtectedSettings()}),ledger:new ReversibleChangeLedger(),coatAuthority}),identity=await coatAuthority.generateIdentity(),ingestion=new BookIngestionEngine(),coordinator=new BookLearningCoordinator({ingestion,resolver,gapFactory:new GapChannelFactory({mind:nervousSystem.organism.mind})});return{nervousSystem,compiler,catalog,resolver,installer,identity,coordinator,capsule:new StateCapsule({store}),learner:inferer=>new AutonomousProcedureLearner({nervousSystem,inferer,compiler,installer,catalog,identity})};}

test('the complete I.1 -> extend-line -> I.2 chain survives restart and generically exposes the I.3 gap',async()=>{
 const store=new MemorySnapshotStore(),first=await system(store),propositions=first.coordinator.discover({bookId:'euclid-elements-i-vi-1847',title:'Euclid',pages});
 const learnedI=await first.learner(new GeometryProcedureInferer()).learn({sourceText:propositions[0].span,examples:[{input:{A:{x:0,y:0},B:{x:10,y:0}},condition:{path:['verification','passed'],equals:true}}],name:'euclid-I-1-equilateral'});assert.equal(learnedI.status,'installed');first.coordinator.retain(propositions[0],learnedI.toolId);
 const assessmentII=await first.coordinator.assess(propositions[1]);assert.equal(assessmentII.status,'gap-identified');
 const extendSource={text:'Postulate 2: produce a finite straight line continuously in a straight line.',members:assessmentII.gap.members,citation:()=>propositions[1].span.citation()};const extend=await first.learner(new GapPrimitiveInferer()).learn({sourceText:extendSource,examples:[{input:{A:{x:0,y:0},B:{x:5,y:0},extraLength:3},condition:{path:['verification','passed'],equals:true}}],name:'extend-line',resolvedAddress:assessmentII.gap.address});assert.equal(extend.status,'installed');first.resolver.registerPrimitive('action:produce');
 const readyII=await first.coordinator.assess(propositions[1]);assert.equal(readyII.status,'ready');const learnedII=await first.learner(new EuclidIIProcedureInferer()).learn({sourceText:{text:propositions[1].span.text,resolution:readyII.resolution,citation:()=>propositions[1].span.citation()},examples:[{input:{A:{x:0,y:0},B:{x:20,y:0},C:{x:20,y:11}},condition:{path:['verification','passed'],equals:true}}],name:'euclid-I-2-copy-segment'});assert.equal(learnedII.status,'installed');first.coordinator.retain(propositions[1],learnedII.toolId);
 await first.capsule.save(first.nervousSystem);const second=await system(store);await second.capsule.restore(second.nervousSystem);
 for(const id of ['euclid-I-1-equilateral','extend-line','euclid-I-2-copy-segment'])assert.equal(second.nervousSystem.ato.mesh.automatons.has(id),true);
 const replay=await second.nervousSystem.ato.mesh.automatons.get('euclid-I-2-copy-segment').call({A:{x:30,y:40},B:{x:130,y:80},C:{x:149,y:80}});assert.equal(replay.verification.passed,true);
 const after=second.coordinator.discover({bookId:'euclid-elements-i-vi-1847',title:'Euclid',pages}),assessmentIII=await second.coordinator.assess(after[2]);assert.equal(assessmentIII.status,'gap-identified');assert.equal(assessmentIII.resolution.dependencies.find(item=>item.kind==='proposition').toolId,'euclid-I-2-copy-segment');assert.ok(assessmentIII.gap.members.includes('action:cut off'));
});
