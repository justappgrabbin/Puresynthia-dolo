import{u as E,r as d,f as D,k as H,j as e,l as S,n as L,U as M,o as U,W as O,e as P,p as B}from"./index-DaMQNKZC.js";const N=`Hello! I'm Claude, your AI assistant in Synth OS. I can help with coding, file analysis, and more.

Type /help for commands.`,C={"/help":()=>`Commands:
/help - Show help
/clear - Clear chat
/files - List files
/analyze <file> - Analyze file`,"/clear":()=>"__CLEAR__","/files":()=>`Files:
- README.md
- hello.py
- config.json
- index.html`};function K(i){const p=i.toLowerCase();if(C[i])return{content:C[i]()};if(p.includes("hello")||p.includes("hi"))return{content:"Hello! How can I help you today?"};if(p.includes("who are you"))return{content:"I'm Claude, an AI assistant in Synth OS. I help with coding, analysis, and more."};if(p.includes("write a function"))return{content:`Here's a utility function:

\`\`\`typescript
function debounce<T extends (...args: any[]) => any>(fn: T, delay: number): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
\`\`\``};if(p.includes("analyze")||p.includes("read")){const c=i.match(/([\w-]+\.\w+)/);if(c){const n=D("/home/user/"+c[1]);if(n?.content)return{content:`**${c[1]}** Analysis:
- Type: ${n.language}
- Size: ${n.content.length} chars
- Lines: ${n.content.split(`
`).length}

\`\`\`
${n.content.slice(0,400)}${n.content.length>400?"...":""}
\`\`\``,tools:[{name:"read_file",result:`${n.content.length} bytes`}]}}}return{content:`Interesting question about "${i.slice(0,40)}${i.length>40?"...":""}". I can help you explore this further. Try /files to see available files, or ask me to write code.`}}function F(){const{launchApp:i}=E(),[p,c]=d.useState([{id:"0",role:"assistant",content:N,timestamp:Date.now()}]),[n,m]=d.useState(""),[l,g]=d.useState(!1),[_,T]=d.useState(!1),[j,v]=d.useState(-1),[h,$]=d.useState([]),b=d.useRef(null);d.useEffect(()=>{b.current&&(b.current.scrollTop=b.current.scrollHeight)},[p]);const I=d.useCallback(s=>{s?.preventDefault();const a=n.trim();if(!a||_)return;if(m(""),$(r=>[...r,a]),v(-1),a==="claude"&&!l){g(!0);return}if(a==="exit"&&l){g(!1);return}if(l){const r={id:Date.now().toString(),role:"user",content:a,timestamp:Date.now()};c(x=>[...x,r]),T(!0);const u=K(a);if(u.content==="__CLEAR__"){c([{id:"0",role:"assistant",content:"Chat cleared. How can I help?",timestamp:Date.now()}]),T(!1);return}const w=(Date.now()+1).toString();c(x=>[...x,{id:w,role:"assistant",content:"",timestamp:Date.now(),tools:u.tools}]);let A=0;const z=setInterval(()=>{A+=3,A>=u.content.length?(clearInterval(z),c(x=>x.map(f=>f.id===w?{...f,content:u.content}:f)),T(!1)):c(x=>x.map(f=>f.id===w?{...f,content:u.content.slice(0,A)}:f))},12);return}const y={id:Date.now().toString(),role:"user",content:a,timestamp:Date.now()};c(r=>[...r,y]);let t="";const o=a.split(" "),k=o[0];switch(k){case"help":t=`Commands:
  ls [path]       List files
  cd <path>       Change dir
  cat <file>      Show file
  pwd             Print dir
  echo <text>     Print
  mkdir <name>    Create dir
  touch <name>    Create file
  rm <name>       Remove
  clear           Clear
  whoami          User
  date            Date/time
  claude          AI REPL
  code <file>     Open in editor
  neofetch        System info
  theme <name>    Change theme
  history         Command history`;break;case"clear":c([]),m("");return;case"whoami":t="synth";break;case"date":t=new Date().toString();break;case"pwd":t="/home/user";break;case"ls":t="README.md  hello.py  config.json  index.html";break;case"echo":t=o.slice(1).join(" ");break;case"mkdir":t=o[1]?`Created ${o[1]}`:"Usage: mkdir <name>";break;case"touch":t=o[1]?`Created ${o[1]}`:"Usage: touch <name>";break;case"rm":t=o[1]?`Removed ${o[1]}`:"Usage: rm <name>";break;case"cat":{t=D("/home/user/"+(o[1]||""))?.content||`cat: ${o[1]}: No such file`;break}case"claude":g(!0),t="Claude Code: REPL activated. Type /help or ask anything. Type exit to return.";break;case"code":o[1]?(t=`Opening ${o[1]}...`,setTimeout(()=>i("vscode"),300)):t="Usage: code <file>";break;case"neofetch":t=`   _____ _           _     ____   _____ 
  / ____| |         | |   / __ \\ / ____|
 | (___ | |_   _ ___| | _| |  | | (___  
  \\___ \\| | | | / __| |/ / |  | |\\___ \\ 
  ____) | | |_| \\__ \\   <| |__| |____) |
 |_____/|_|\\__, |___/_|_|_\\____/|_____/ 
            __/ |
           |___/     v1.0.0

OS: Synth OS
Kernel: synth-5.15.0
Shell: synth-sh 1.0
CPU: Neural Cortex-9
Memory: 32GB HBM4
Storage: 2TB Quantum SSD`;break;case"theme":{const r=o[1];r==="void"||r==="daylight"||r==="high-contrast"?t=`Theme: ${r}`:t="Usage: theme <void|daylight|high-contrast>";break}case"history":t=h.map((r,u)=>`${(u+1).toString().padStart(3)} ${r}`).join(`
`);break;default:t=`${k}: not found. Type "help"`}H("terminal-history",{id:Date.now().toString(),input:a,output:t,timestamp:Date.now(),cwd:"/home/user"}),c(r=>[...r,{id:(Date.now()+1).toString(),role:"system",content:t,timestamp:Date.now()}])},[n,_,l,h,i]),R=s=>{if(s.key==="ArrowUp"){s.preventDefault();const a=j+1;a<h.length&&(v(a),m(h[h.length-1-a]))}else if(s.key==="ArrowDown"){s.preventDefault();const a=j-1;a>=0?(v(a),m(h[h.length-1-a])):(v(-1),m(""))}else if(s.key==="Tab"){s.preventDefault();const y=["ls","cat","help","clear","claude","code","echo","mkdir","neofetch","theme"].find(t=>t.startsWith(n.toLowerCase()));y&&m(y)}};return e.jsxs("div",{"code-path":"src/apps/TerminalApp.tsx:83:5",className:"w-full h-full flex flex-col",style:{background:l?"var(--bg-base)":"var(--bg-void)",fontFamily:"JetBrains Mono, monospace",fontSize:12},children:[e.jsxs("div",{"code-path":"src/apps/TerminalApp.tsx:84:7",className:"h-8 flex items-center justify-between px-3 shrink-0",style:{background:"var(--bg-surface)",borderBottom:"1px solid var(--border-subtle)"},children:[e.jsxs("div",{"code-path":"src/apps/TerminalApp.tsx:85:9",className:"flex items-center gap-2",children:[l&&e.jsx(S,{"code-path":"src/apps/TerminalApp.tsx:85:65",size:14,className:"text-[var(--accent-cyan)]"}),e.jsx("span",{"code-path":"src/apps/TerminalApp.tsx:85:121",className:"text-[10px] font-medium",style:{color:"var(--text-secondary)"},children:l?"Claude Code: REPL":"Terminal"})]}),e.jsxs("div",{"code-path":"src/apps/TerminalApp.tsx:86:9",className:"flex items-center gap-1",children:[l&&e.jsx("button",{"code-path":"src/apps/TerminalApp.tsx:86:66",onClick:()=>c([{id:"0",role:"assistant",content:N,timestamp:Date.now()}]),className:"w-6 h-6 flex items-center justify-center rounded hover:bg-[var(--bg-elevated)]",title:"Clear",children:e.jsx(L,{"code-path":"src/apps/TerminalApp.tsx:86:276",size:10,style:{color:"var(--text-muted)"}})}),e.jsx("button",{"code-path":"src/apps/TerminalApp.tsx:86:346",onClick:()=>g(!l),className:"px-2 py-0.5 rounded text-[9px] transition-colors",style:{color:l?"var(--accent-magenta)":"var(--accent-cyan)",border:"1px solid var(--border-subtle)"},children:l?"exit":"claude"})]})]}),e.jsxs("div",{"code-path":"src/apps/TerminalApp.tsx:88:7",ref:b,className:"flex-1 overflow-y-auto p-3 space-y-3",children:[p.map(s=>e.jsxs("div",{"code-path":"src/apps/TerminalApp.tsx:89:25",className:"flex gap-2",children:[s.role==="user"&&e.jsx("div",{"code-path":"src/apps/TerminalApp.tsx:90:33",className:"w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5",style:{background:"var(--bg-elevated)"},children:e.jsx(M,{"code-path":"src/apps/TerminalApp.tsx:90:165",size:10,className:"text-[var(--accent-cyan)]"})}),s.role==="assistant"&&e.jsx("div",{"code-path":"src/apps/TerminalApp.tsx:91:38",className:"w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5",style:{background:"var(--accent-cyan)"},children:e.jsx(U,{"code-path":"src/apps/TerminalApp.tsx:91:170",size:10,className:"text-[var(--bg-void)]"})}),e.jsxs("div",{"code-path":"src/apps/TerminalApp.tsx:92:11",className:"flex-1 min-w-0",children:[s.tools&&s.tools.length>0&&e.jsx("div",{"code-path":"src/apps/TerminalApp.tsx:93:48",className:"mb-1.5 space-y-1",children:s.tools.map((a,y)=>e.jsxs("div",{"code-path":"src/apps/TerminalApp.tsx:93:107",className:"flex items-center gap-1.5 px-2 py-1 rounded text-[10px]",style:{background:"var(--bg-elevated)",border:"1px solid var(--border-subtle)"},children:[e.jsx(O,{"code-path":"src/apps/TerminalApp.tsx:93:275",size:10,className:"text-[var(--accent-yellow)]"}),e.jsx("span",{"code-path":"src/apps/TerminalApp.tsx:93:335",className:"text-[var(--accent-yellow)]",children:a.name}),e.jsx("span",{"code-path":"src/apps/TerminalApp.tsx:93:397",className:"text-[var(--accent-green)]",children:a.result})]},y))}),e.jsx("div",{"code-path":"src/apps/TerminalApp.tsx:94:13",className:"whitespace-pre-wrap break-words leading-relaxed",style:{color:s.role==="system"?"var(--text-secondary)":"var(--text-primary)"},children:s.content})]})]},s.id)),_&&e.jsxs("div",{"code-path":"src/apps/TerminalApp.tsx:96:24",className:"flex items-center gap-1",children:[e.jsx("div",{"code-path":"src/apps/TerminalApp.tsx:96:65",className:"w-1.5 h-1.5 rounded-full bg-[var(--accent-cyan)] animate-pulse"}),e.jsx("div",{"code-path":"src/apps/TerminalApp.tsx:96:147",className:"w-1.5 h-1.5 rounded-full bg-[var(--accent-cyan)] animate-pulse",style:{animationDelay:"0.2s"}}),e.jsx("div",{"code-path":"src/apps/TerminalApp.tsx:96:264",className:"w-1.5 h-1.5 rounded-full bg-[var(--accent-cyan)] animate-pulse",style:{animationDelay:"0.4s"}})]})]}),e.jsx("div",{"code-path":"src/apps/TerminalApp.tsx:98:7",className:"shrink-0 px-3 py-2",style:{borderTop:"1px solid var(--border-subtle)",background:"var(--bg-surface)"},children:e.jsxs("form",{"code-path":"src/apps/TerminalApp.tsx:99:9",onSubmit:I,className:"flex items-center gap-2",children:[l?e.jsx(S,{"code-path":"src/apps/TerminalApp.tsx:100:25",size:12,className:"text-[var(--accent-cyan)] shrink-0"}):e.jsx(P,{"code-path":"src/apps/TerminalApp.tsx:100:92",size:12,className:"text-[var(--accent-green)] shrink-0"}),e.jsx("input",{"code-path":"src/apps/TerminalApp.tsx:101:11",type:"text",value:n,onChange:s=>m(s.target.value),onKeyDown:R,placeholder:l?"Ask Claude...":"Type command...",className:"flex-1 bg-transparent outline-none",style:{color:"var(--text-primary)"},disabled:_}),e.jsx("button",{"code-path":"src/apps/TerminalApp.tsx:102:11",type:"submit",disabled:!n.trim()||_,className:"w-6 h-6 flex items-center justify-center rounded transition-all",style:{background:n.trim()?"var(--accent-cyan)":"var(--bg-elevated)"},children:e.jsx(B,{"code-path":"src/apps/TerminalApp.tsx:102:230",size:10,className:n.trim()?"text-[var(--bg-void)]":"text-[var(--text-muted)]"})})]})})]})}export{F as default};
