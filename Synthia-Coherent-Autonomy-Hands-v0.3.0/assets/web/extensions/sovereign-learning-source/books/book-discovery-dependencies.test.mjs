import test from 'node:test';
import assert from 'node:assert/strict';
import { BookIngestionEngine } from './BookIngestionEngine.mjs';
import { DependencyResolver } from './DependencyResolver.mjs';
import { GapChannelFactory } from './GapChannelFactory.mjs';
import { FirstMind } from '../FirstMind.mjs';

const pages=[
  {page:35,text:'BOOK I. PROPOSITION I. PROBLEM. On a given finite straight line to describe an equilateral triangle. Describe two circles (postulate 3); draw the two lines (post. 1). For the radii are equal (def. 15), therefore the triangle is equilateral.',visualEvidence:[{kind:'rendered-page',ref:'proofs/euclid-book-I-proposition-I/source-page-35.png'}]},
  {page:36,text:'BOOK I. PROP. II. PROB. From a given point to draw a straight line equal to a given finite straight line. Draw a line (post. 1), describe an equilateral triangle (pr. i.), produce the lines (post. 2), describe circles (post. 3), then is the line required. For the radii are equal (def. 15) and by ax. 3 the constructed line is equal.'},
  {page:37,text:'BOOK I. PROP. III. PROB. From the greater of two given straight lines, to cut off a part equal to the less. Draw a line (pr. 2); describe a circle (post. 3), then cut off the required part.'},
];

test('discovers propositions and reconstructs their dependency chain from page records',()=>{
  const engine=new BookIngestionEngine(),items=engine.discover({bookId:'euclid-elements-i-vi-1847',title:'The First Six Books of the Elements of Euclid',pages,provenance:{file:'Elements-I-VI.pdf'}});
  assert.deepEqual(items.map(item=>item.number),[1,2,3]);
  assert.match(items[1].goal,/given point/i);
  assert.ok(items[1].dependencies.some(item=>item.kind==='proposition'&&item.number===1));
  assert.ok(items[2].dependencies.some(item=>item.kind==='proposition'&&item.number===2));
  assert.equal(items[0].span.page,35);
});

test('known prior proposition resolves while a missing action creates a pressured channel candidate',async()=>{
  const items=new BookIngestionEngine().discover({bookId:'euclid-elements-i-vi-1847',title:'Euclid',pages});
  const resolver=new DependencyResolver({knownPrimitives:['postulate:1','postulate:2','postulate:3','definition:15','axiom:3','action:draw','action:describe','action:equal'],propositionTools:{'euclid-elements-i-vi-1847:I.1':'euclid-I-1-equilateral'}});
  const second=resolver.resolve(items[1]);
  assert.equal(second.dependencies.find(item=>item.kind==='proposition').toolId,'euclid-I-1-equilateral');
  assert.ok(second.missing.some(item=>item.key==='action:produce'));
  const mind=new FirstMind(),candidate=await new GapChannelFactory({mind}).identify(items[1],second);
  assert.equal(candidate.status,'candidate');assert.ok(candidate.members.includes('action:produce'));assert.ok(mind.pressure.current.get(candidate.id)>0);
});
