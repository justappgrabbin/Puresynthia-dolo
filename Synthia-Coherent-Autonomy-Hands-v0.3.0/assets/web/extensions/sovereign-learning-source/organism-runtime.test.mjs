import test from 'node:test'; import assert from 'node:assert/strict';
import { SensoryOrgan } from './organs/SensoryOrgan.mjs';
import { QianKernelOrgan } from './organs/QianKernelOrgan.mjs';
import { IsomorphismOrgan } from './organs/IsomorphismOrgan.mjs';
import { EpisodicMemoryOrgan } from './organs/EpisodicMemoryOrgan.mjs';
import { HexagramStateOrgan } from './organs/HexagramStateOrgan.mjs';

test('sensory organ preserves available raw senses and structured sight',()=>{const s=new SensoryOrgan({clock:()=>1});const p=s.perceive({sight:{pixels:new Uint8Array([255,255,255]),objects:[{id:'a'}]},hearing:{frequency:440},touch:{pressure:.2}});assert.equal(p.at,1);assert.equal(p.senses.see.brightness,1);assert.equal(p.senses.hear.dominantFrequency,440);assert.equal(p.senses.touch.raw.pressure,.2);});
test('Qian kernel measures deviation from its five-dimensional baseline',()=>{const q=new QianKernelOrgan();assert.equal(q.measure([1,1,1,1,1]).coherence,1);assert.equal(q.kernels.length,5);});
test('isomorphism organ proposes structural candidates with evidence',()=>{const i=new IsomorphismOrgan().registerDomain('a',[{id:'x',label:'point',level:'atomic'}]).registerDomain('b',[{id:'y',label:'phoneme',level:'atomic'}]);assert.equal(i.compare('a','b')[0].score,.7);});
test('episodic memory retrieves similar prior experience without promoting it to fact',()=>{const m=new EpisodicMemoryOrgan();m.remember({id:'e1',input:'draw a circle through point b'});assert.equal(m.recall('draw circle')[0].episode.id,'e1');});
test('hexagram state transitions reuse the verified Kimi King Wen encoding',()=>{const h=new HexagramStateOrgan();assert.equal(h.transition(1,[1,2,3,4,5,6]).toGate,2);const moved=h.transition(6,[4]);assert.equal(h.transition(moved.toGate,[4]).toGate,6);assert.equal(h.shortestPath(1,2).length,6);});
