const numberWords = Object.freeze({one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10});
const numeric = text => { const match=String(text).toLowerCase().match(/\b(?:by|times?)\s+(-?\d+(?:\.\d+)?|one|two|three|four|five|six|seven|eight|nine|ten)\b/);if(!match)return null;return Number.isFinite(Number(match[1]))?Number(match[1]):numberWords[match[1]]; };
const input={op:'input'};
export class ExamplePlanLearner {
  infer(sourceText, examples=[]) {
    const text=String(sourceText),constant=numeric(text);
    const operation=/\b(multiply|times|double|triple)\b/i.test(text)?'multiply':/\b(add|increase|plus)\b/i.test(text)?'add':/\b(subtract|decrease|minus)\b/i.test(text)?'subtract':/\b(divide|quotient)\b/i.test(text)?'divide':null;
    const amount=/\bdouble\b/i.test(text)?2:/\btriple\b/i.test(text)?3:constant;
    if(!operation||amount===null)return Object.freeze({status:'needs-definition',reason:'NO_SUPPORTED_PRIMITIVE_CONTRACT'});
    const plan={op:operation,left:input,right:{op:'constant',value:amount}};
    const fn=x=>operation==='multiply'?x*amount:operation==='add'?x+amount:operation==='subtract'?x-amount:x/amount;
    const evidence=examples.map(example=>({input:example.input,expected:example.output,actual:fn(example.input),passed:Object.is(fn(example.input),example.output)}));
    return Object.freeze({status:evidence.length&&evidence.every(item=>item.passed)?'candidate':'needs-evidence',plan,contract:{inputs:['number'],outputs:['number'],constraints:[`${operation}:${amount}`]},evidence:Object.freeze(evidence)});
  }
}
