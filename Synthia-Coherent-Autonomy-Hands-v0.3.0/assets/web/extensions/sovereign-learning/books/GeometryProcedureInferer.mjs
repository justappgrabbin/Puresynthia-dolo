export class GeometryProcedureInferer {
  infer(source,examples=[]){
    const text=String(source?.text??source);
    const hasGoal=/equilateral triangle/i.test(text),hasCircles=(text.match(/circle|describe/gi)??[]).length>=2||/two .*circles/i.test(text),hasJoin=/draw|join/i.test(text);
    if(!hasGoal||!hasCircles||!hasJoin)return Object.freeze({status:'needs-definition',reason:'GEOMETRY_CONTRACT_INCOMPLETE'});
    const plan={op:'geometry-program',steps:[{op:'distance',from:'A',to:'B',as:'radiusAB'},{op:'circle',center:'A',radius:'radiusAB',as:'circle-A'},{op:'circle',center:'B',radius:'radiusAB',as:'circle-B'},{op:'intersection',left:'circle-A',right:'circle-B',select:'upper',as:'C'},{op:'line',from:'A',to:'B',as:'AB'},{op:'line',from:'A',to:'C',as:'AC'},{op:'line',from:'B',to:'C',as:'BC'}],constraints:[{kind:'equal',left:{kind:'length',target:'AB'},right:{kind:'length',target:'AC'}},{kind:'equal',left:{kind:'length',target:'AB'},right:{kind:'length',target:'BC'}}]};
    return Object.freeze({
      status:examples.length?'candidate':'needs-evidence',
      plan,
      contract:{inputs:['point:A','point:B'],outputs:['triangle:ABC'],constraints:['AB=AC','AB=BC'],dependencies:['distance','circle','circle-intersection','line']},
      evidence:Object.freeze(examples.map(example=>({citation:source?.citation?.()??null,condition:example.condition}))),
    });
  }
}
