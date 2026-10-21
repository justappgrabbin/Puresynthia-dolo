import { createUnifiedStateSpace } from '../src/unified-state-space.mjs';
const s = createUnifiedStateSpace();
console.log(JSON.stringify(s.resolve({gate:41,line:2,color:3,tone:4,base:5}), null, 2));
