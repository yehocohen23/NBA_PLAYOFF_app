import { useState, useMemo, useEffect, useRef } from "react";
import { createClient } from '@supabase/supabase-js';

// ─── TEAMS ──────────────────────────────────────────────────────────────────
const T={
  ATL:{n:"Atlanta Hawks",      a:"ATL",c:"#E03A3E",b:"#C1D32F",e:"atl"},
  BOS:{n:"Boston Celtics",     a:"BOS",c:"#007A33",b:"#BA9653",e:"bos"},
  BKN:{n:"Brooklyn Nets",      a:"BKN",c:"#FFFFFF",b:"#000000",e:"bkn"},
  CHA:{n:"Charlotte Hornets",  a:"CHA",c:"#00788C",b:"#1D1160",e:"cha"},
  CHI:{n:"Chicago Bulls",      a:"CHI",c:"#CE1141",b:"#000000",e:"chi"},
  CLE:{n:"Cleveland Cavaliers",a:"CLE",c:"#860038",b:"#FDBB30",e:"cle"},
  DAL:{n:"Dallas Mavericks",   a:"DAL",c:"#00538C",b:"#002B5E",e:"dal"},
  DEN:{n:"Denver Nuggets",     a:"DEN",c:"#FEC524",b:"#0E2240",e:"den"},
  DET:{n:"Detroit Pistons",    a:"DET",c:"#C8102E",b:"#002D62",e:"det"},
  GSW:{n:"Golden State Warriors",a:"GSW",c:"#1D428A",b:"#FFC72C",e:"gs"},
  HOU:{n:"Houston Rockets",    a:"HOU",c:"#CE1141",b:"#000000",e:"hou"},
  IND:{n:"Indiana Pacers",     a:"IND",c:"#002D62",b:"#FDBB30",e:"ind"},
  LAC:{n:"LA Clippers",        a:"LAC",c:"#C8102E",b:"#1D428A",e:"lac"},
  LAL:{n:"Los Angeles Lakers", a:"LAL",c:"#552583",b:"#FDB927",e:"lal"},
  MEM:{n:"Memphis Grizzlies",  a:"MEM",c:"#5D76A9",b:"#12173F",e:"mem"},
  MIA:{n:"Miami Heat",         a:"MIA",c:"#98002E",b:"#F9A01B",e:"mia"},
  MIL:{n:"Milwaukee Bucks",    a:"MIL",c:"#00471B",b:"#EEE1C6",e:"mil"},
  MIN:{n:"Minnesota T-Wolves", a:"MIN",c:"#236192",b:"#9EA1A2",e:"min"},
  NOP:{n:"New Orleans Pelicans",a:"NOP",c:"#0C2340",b:"#C8102E",e:"no"},
  NYK:{n:"NY Knicks",          a:"NYK",c:"#006BB6",b:"#F58426",e:"ny"},
  OKC:{n:"OKC Thunder",        a:"OKC",c:"#007AC1",b:"#EF3B24",e:"okc"},
  ORL:{n:"Orlando Magic",      a:"ORL",c:"#0077C0",b:"#000000",e:"orl"},
  PHI:{n:"Philadelphia 76ers", a:"PHI",c:"#006BB6",b:"#ED174C",e:"phi"},
  PHX:{n:"Phoenix Suns",       a:"PHX",c:"#E56020",b:"#1D1160",e:"phx"},
  POR:{n:"Portland Trail Blazers",a:"POR",c:"#E03A3E",b:"#000000",e:"por"},
  SAC:{n:"Sacramento Kings",   a:"SAC",c:"#5A2D81",b:"#63727A",e:"sac"},
  SAS:{n:"San Antonio Spurs",  a:"SAS",c:"#C4CED4",b:"#000000",e:"sa"},
  TOR:{n:"Toronto Raptors",    a:"TOR",c:"#CE1141",b:"#000000",e:"tor"},
  UTA:{n:"Utah Jazz",          a:"UTA",c:"#002B5C",b:"#F9A01B",e:"utah"},
  WAS:{n:"Washington Wizards", a:"WAS",c:"#002B5C",b:"#E31837",e:"wsh"},
};
const EAST_ABBRS=["ATL","BKN","BOS","CHA","CHI","CLE","DET","IND","MIA","MIL","NYK","ORL","PHI","TOR","WAS"];
const WEST_ABBRS=["DAL","DEN","GSW","HOU","LAC","LAL","MEM","MIN","NOP","OKC","PHX","POR","SAC","SAS","UTA"];

// ─── MVP CANDIDATES ─────────────────────────────────────────────────────────
const MVPS=[
  {id:"SGA", n:"Shai Gilgeous-Alexander",t:"OKC"},
  {id:"WEMB",n:"Victor Wembanyama",       t:"SAS"},
  {id:"JB",  n:"Jaylen Brown",            t:"BOS"},
  {id:"JT",  n:"Jayson Tatum",            t:"BOS"},
  {id:"JOK", n:"Nikola Jokić",            t:"DEN"},
  {id:"CC",  n:"Cade Cunningham",         t:"DET"},
  {id:"BRUN",n:"Jalen Brunson",           t:"NYK"},
  {id:"DM",  n:"Donovan Mitchell",        t:"CLE"},
  {id:"ANT", n:"Anthony Edwards",         t:"MIN"},
  {id:"KD",  n:"Kevin Durant",            t:"HOU"},
  {id:"AD",  n:"Anthony Davis",           t:"LAL"},
  {id:"LBJ", n:"LeBron James",            t:"LAL"},
  {id:"DEF", n:"De'Aaron Fox",            t:"SAS"},
  {id:"KAT", n:"Karl-Anthony Towns",      t:"NYK"},
  {id:"CH",  n:"Chet Holmgren",           t:"OKC"},
];

// ─── PLAY-IN ────────────────────────────────────────────────────────────────
const PLAYIN=[
  {id:"pi_e78", conf:"East",label:"East #7 vs #8",  teams:["PHI","ORL"],desc:"Winner → #7 seed"},
  {id:"pi_e910",conf:"East",label:"East #9 vs #10", teams:["CHA","MIA"],desc:"Winner plays for #8"},
  {id:"pi_elo", conf:"East",label:"East Loser Game",teams:["",""],      desc:"G1 loser vs G2 winner → #8 seed"},
  {id:"pi_w78", conf:"West",label:"West #7 vs #8",  teams:["PHX","POR"],desc:"Winner → #7 seed"},
  {id:"pi_w910",conf:"West",label:"West #9 vs #10", teams:["LAC","GSW"],desc:"Winner plays for #8"},
  {id:"pi_wlo", conf:"West",label:"West Loser Game",teams:["",""],      desc:"G1 loser vs G2 winner → #8 seed"},
];

// ─── ROUNDS ─────────────────────────────────────────────────────────────────
const ROUNDS=[
  {k:"r1",   l:"Round 1",        s:"R1", pts:{exact:4, correct:2,wrong:1}},
  {k:"r2",   l:"Semifinals",     s:"R2", pts:{exact:6, correct:3,wrong:1}},
  {k:"r3",   l:"Conf. Finals",   s:"R3", pts:{exact:8, correct:4,wrong:1}},
  {k:"finals",l:"NBA Finals",    s:"F",  pts:{exact:10,correct:5,wrong:1}},
];
const ROUND_KEYS=ROUNDS.map(r=>r.k);

const SERIES=[
  {id:"r1_e1",r:"r1",conf:"E",t1:"DET",t2:"E8"},{id:"r1_e2",r:"r1",conf:"E",t1:"BOS",t2:"E7"},
  {id:"r1_e3",r:"r1",conf:"E",t1:"NYK",t2:"ATL"},{id:"r1_e4",r:"r1",conf:"E",t1:"CLE",t2:"TOR"},
  {id:"r1_w1",r:"r1",conf:"W",t1:"OKC",t2:"W8"},{id:"r1_w2",r:"r1",conf:"W",t1:"SAS",t2:"W7"},
  {id:"r1_w3",r:"r1",conf:"W",t1:"DEN",t2:"MIN"},{id:"r1_w4",r:"r1",conf:"W",t1:"LAL",t2:"HOU"},
  {id:"r2_e1",r:"r2",conf:"E",t1:"E1W",t2:"E4W"},{id:"r2_e2",r:"r2",conf:"E",t1:"E2W",t2:"E3W"},
  {id:"r2_w1",r:"r2",conf:"W",t1:"W1W",t2:"W4W"},{id:"r2_w2",r:"r2",conf:"W",t1:"W2W",t2:"W3W"},
  {id:"r3_e", r:"r3",conf:"E",t1:"ES1",t2:"ES2"},{id:"r3_w", r:"r3",conf:"W",t1:"WS1",t2:"WS2"},
  {id:"finals",r:"finals",conf:"F",t1:"ECF",t2:"WCF"},
];
const LABELS={E8:"E #8",E7:"E #7",W8:"W #8",W7:"W #7",E1W:"E1/E8 W",E4W:"E4/E5 W",E2W:"E2/E7 W",E3W:"E3/E6 W",W1W:"W1/W8 W",W4W:"W4/W5 W",W2W:"W2/W7 W",W3W:"W3/W6 W",ES1:"E Semi W1",ES2:"E Semi W2",WS1:"W Semi W1",WS2:"W Semi W2",ECF:"East Champ",WCF:"West Champ"};
const sn=(k)=>T[k]?.n||LABELS[k]||k;

// Resolve Play-In placeholder seeds (E7/E8/W7/W8) to actual team abbrs
function resolveTeam(abbr,res){
  if(T[abbr]) return abbr;
  const pi=res?.pi||{};
  if(abbr==='E7') return pi.pi_e78?.w||null;
  if(abbr==='E8') return pi.pi_elo?.w||null;
  if(abbr==='W7') return pi.pi_w78?.w||null;
  if(abbr==='W8') return pi.pi_wlo?.w||null;
  return null;
}

// ─── AI PICKS ────────────────────────────────────────────────────────────────
const AI={
  id:"__ai__",name:"Claude AI 🤖",isAI:true,photo:null,
  po:{r1_e1:{w:"DET",g:5},r1_e2:{w:"BOS",g:6},r1_e3:{w:"NYK",g:5},r1_e4:{w:"CLE",g:6},
      r1_w1:{w:"OKC",g:4},r1_w2:{w:"SAS",g:7},r1_w3:{w:"DEN",g:6},r1_w4:{w:"HOU",g:7},
      r2_e1:{w:"DET",g:6},r2_e2:{w:"BOS",g:5},r2_w1:{w:"OKC",g:5},r2_w2:{w:"SAS",g:6},
      r3_e:{w:"BOS",g:6},r3_w:{w:"OKC",g:5},finals:{w:"OKC",g:6}},
  pi:{pi_e78:{w:"PHI"},pi_e910:{w:"CHA"},pi_elo:{w:"PHI"},
      pi_w78:{w:"PHX"},pi_w910:{w:"LAC"},pi_wlo:{w:"PHX"}},
  champ:"OKC", mvp:"SGA",
};

// ─── SCORING ────────────────────────────────────────────────────────────────
function scoreS(pred,real,pts){
  if(!real?.w||!pred?.w) return {p:0,t:"pending"};
  if(pred.w===real.w && pred.g===real.g) return {p:pts.exact,t:"exact"};
  if(pred.w===real.w) return {p:pts.correct,t:"correct"};
  return {p:pts.wrong,t:"wrong"};
}
function scoreUser(u,res,cfg){
  const po=u.isAI?u.po:u.po||{};
  const pi=u.isAI?u.pi:u.pi||{};
  let total=0; const bd={};
  if(cfg.rPi){
    for(const m of PLAYIN){
      const real=res.pi?.[m.id]; const pred=pi[m.id]||{};
      const s=!real?.w||!pred?.w?{p:0,t:"pending"}:pred.w===real.w?{p:3,t:"exact"}:{p:1,t:"wrong"};
      bd[m.id]=s; total+=s.p;
    }
  }
  if(cfg.rPo){
    for(const s of SERIES){
      const pts=ROUNDS.find(r=>r.k===s.r).pts;
      const rawPred=po[s.id];
      // Resolve placeholder team IDs (E7/E8/W7/W8) so picks match actual results
      const resolvedPred=rawPred?.w
        ?{...rawPred,w:resolveTeam(rawPred.w,res)||rawPred.w}
        :rawPred;
      const sc=scoreS(resolvedPred,res.po?.[s.id],pts);
      bd[s.id]=sc; total+=sc.p;
    }
    if(res.champ){const p=(u.isAI?u.champ:u.champ)===res.champ?10:0;bd.champ={p,t:p?"exact":"wrong"};total+=p;}
    if(res.mvp){const mv=u.isAI?u.mvp:u.mvp;const p=mv===res.mvp?8:0;bd.mvp={p,t:p?"exact":"wrong"};total+=p;}
  }
  return {total,bd};
}

// ─── SUPABASE ────────────────────────────────────────────────────────────────
const SUPABASE_URL=import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY=import.meta.env.VITE_SUPABASE_ANON_KEY;
const sb=createClient(SUPABASE_URL,SUPABASE_ANON_KEY);

// ─── PERSIST (session only — local) ─────────────────────────────────────────
const ld=(k,d)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):d;}catch{return d;}};
const sv=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch{}};

// ─── COLORS ─────────────────────────────────────────────────────────────────
const C={
  bg0:"#04080f",bg1:"#090f1c",bg2:"#0f1829",bg3:"#162034",bg4:"#1c2840",
  acc:"#f97316",aD:"rgba(249,115,22,.12)",
  bd:"#1c2a3e",bdL:"#243347",
  t1:"#eef2f7",t2:"#8fa3b8",t3:"#3d5166",
  ok:"#34d399",okB:"rgba(52,211,153,.1)",
  wn:"#fbbf24",wnB:"rgba(251,191,36,.08)",
  er:"#f87171",erB:"rgba(248,113,113,.08)",
  ai:"#38bdf8",
  gold:"#FFD700",silver:"#C0C0C0",bronze:"#CD7F32",
};
const BG={exact:{c:C.ok,bg:C.okB},correct:{c:C.wn,bg:C.wnB},wrong:{c:C.er,bg:C.erB},pending:{c:C.t3,bg:"transparent"}};
const PC=["#f97316","#a78bfa","#34d399","#60a5fa","#f472b6","#facc15","#4ade80","#e879f9","#38bdf8","#fb923c","#c084fc","#86efac"];
const pcol=(u,i)=>u?.isAI?C.ai:PC[i%PC.length];

// ─── ESPN / NBA SCHEDULE API ─────────────────────────────────────────────────
const ESPN_SB='https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard';
// Hardcoded playoff cutoff — Play-In starts April 14; any game on/after this is post-season
const PLAYOFF_START=new Date('2026-04-14T00:00:00');
async function fetchPlayoffGames(){
  const today=new Date();
  // Never look back before April 13 (avoids regular season bleed-in)
  const startMs=Math.max(new Date('2026-04-13').getTime(),today.getTime()-3*86400000);
  const s=new Date(startMs);
  const e=new Date(today);e.setDate(today.getDate()+21);
  const fmt=d=>`${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
  try{
    const r=await fetch(`${ESPN_SB}?dates=${fmt(s)}-${fmt(e)}&limit=200`);
    if(r.ok){const j=await r.json();if((j.events||[]).length>0)return j.events;}
  }catch{}
  // Fallback: one call per day from April 13 onwards
  const all=[];const tasks=[];
  const days=Math.ceil((e-s)/86400000);
  for(let i=0;i<=days;i++){
    const d=new Date(s.getTime()+i*86400000);const ds=fmt(d);
    tasks.push(fetch(`${ESPN_SB}?dates=${ds}`).then(r=>r.ok?r.json():{events:[]}).then(j=>j.events||[]).catch(()=>[]));
  }
  const res=await Promise.all(tasks);res.forEach(arr=>all.push(...arr));
  return all;
}
// ESPN numeric team IDs (for injuries API)
const ESPN_IDS={DET:8,BOS:2,NYK:18,CLE:5,TOR:28,ATL:1,OKC:25,SAS:24,DEN:7,LAL:13,HOU:10,MIN:16,ORL:19,PHX:21,LAC:12,GSW:9};
// Compute current series win totals from ESPN completed games (date-based filter, not season type)
async function fetchSeriesScores(){
  const evts=await fetchPlayoffGames();
  const done=evts.filter(e=>
    e.competitions?.[0]?.status?.type?.completed&&new Date(e.date)>=PLAYOFF_START);
  const map={};
  done.forEach(ev=>{
    const cs=ev.competitions?.[0]?.competitors||[];if(cs.length<2)return;
    const key=[cs[0].team?.abbreviation,cs[1].team?.abbreviation].sort().join('|');
    if(!map[key])map[key]={wins:{},games:0};
    map[key].games++;
    cs.forEach(c=>{if(c.winner)map[key].wins[c.team.abbreviation]=(map[key].wins[c.team.abbreviation]||0)+1;});
  });
  return map;}
// Fetch game stats (leaders + team stats) from ESPN summary endpoint
async function fetchGameStats(eventId){
  try{
    const r=await fetch(`https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary?event=${eventId}`);
    if(!r.ok)return null;
    const j=await r.json();
    // Extract top leaders per team
    const leaders=(j.leaders||[]).map(tl=>({
      teamAbbr:tl.team?.abbreviation,
      pts:tl.leaders?.find(l=>l.name==="points")?.leaders?.[0],
      reb:tl.leaders?.find(l=>l.name==="rebounds")?.leaders?.[0],
      ast:tl.leaders?.find(l=>l.name==="assists")?.leaders?.[0],
    }));
    // Extract team box score stats
    const teams=(j.boxscore?.teams||[]).map(bt=>({
      teamAbbr:bt.team?.abbreviation,
      stats:Object.fromEntries((bt.statistics||[]).map(s=>[s.name,s.displayValue])),
    }));
    return {leaders,teams};
  }catch{return null;}
}

// ─── COUNTDOWN ───────────────────────────────────────────────────────────────
function Countdown({deadline,label}){
  const [left,setLeft]=useState(null);
  useEffect(()=>{
    if(!deadline){setLeft(null);return;}
    const tick=()=>setLeft(Math.max(0,new Date(deadline)-new Date()));
    tick();const id=setInterval(tick,1000);return()=>clearInterval(id);
  },[deadline]);
  if(!deadline||left===null)return null;
  if(left===0)return <span style={{color:C.er,fontWeight:800,fontSize:12}}>🔒 Betting closed</span>;
  const d=Math.floor(left/86400000),h=Math.floor((left%86400000)/3600000),
    m=Math.floor((left%3600000)/60000),sec=Math.floor((left%60000)/1000);
  return <span style={{fontWeight:700,fontSize:12,color:C.t2}}>
    ⏰{label&&<span style={{color:C.t3}}> {label}:</span>}
    {" "}<span style={{fontFamily:"monospace",color:C.acc}}>
      {d>0?`${d}d `:""}{String(h).padStart(2,'0')}:{String(m).padStart(2,'0')}:{String(sec).padStart(2,'0')}
    </span>{" "}left to bet
  </span>;
}

// ─── SHARED UI ───────────────────────────────────────────────────────────────
function Logo({abbr,size=36}){
  const [err,setErr]=useState(false);
  const t=T[abbr];
  if(!t||err||!t.e) return(
    <div style={{width:size,height:size,borderRadius:size*.2,flexShrink:0,
      background:t?.b||C.bg3,display:"flex",alignItems:"center",justifyContent:"center",
      fontSize:size*.34,fontWeight:900,color:t?.c||C.t2}}>{t?.a?.slice(0,2)||"?"}</div>
  );
  return <img src={`https://a.espncdn.com/i/teamlogos/nba/500/${t.e}.png`}
    width={size} height={size} style={{objectFit:"contain",flexShrink:0}}
    onError={()=>setErr(true)} alt={abbr}/>;
}

function Avatar({user,size=36,idx=0}){
  if(user?.photo) return <img src={user.photo} width={size} height={size}
    style={{borderRadius:"50%",objectFit:"cover",flexShrink:0,border:`2px solid ${C.bd}`}} alt=""/>;
  const col=PC[Math.abs(((user?.id||"").split("").reduce((h,c)=>(h*31+c.charCodeAt(0))|0,0)))%PC.length]||PC[idx%PC.length];
  const init=(user?.name||"?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
  return <div style={{width:size,height:size,borderRadius:"50%",flexShrink:0,
    background:col+"28",border:`2px solid ${col}66`,display:"flex",alignItems:"center",
    justifyContent:"center",fontSize:size*.36,fontWeight:800,color:col}}>{init}</div>;
}

const inp={width:"100%",padding:"10px 13px",border:`1px solid ${C.bd}`,borderRadius:9,
  background:C.bg0,color:C.t1,fontSize:14,boxSizing:"border-box",outline:"none",fontFamily:"inherit"};
const sel={padding:"8px 10px",border:`1px solid ${C.bd}`,borderRadius:8,
  background:C.bg0,color:C.t1,fontSize:13,cursor:"pointer",outline:"none"};
const btn={
  p:{padding:"10px 20px",border:"none",borderRadius:10,background:"linear-gradient(135deg,#f97316,#dc6004)",color:"#fff",fontWeight:800,cursor:"pointer",fontSize:14},
  s:{padding:"10px 20px",border:"none",borderRadius:10,background:"linear-gradient(135deg,#34d399,#059669)",color:"#fff",fontWeight:800,cursor:"pointer",fontSize:14},
  w:{padding:"10px 18px",border:"1px solid rgba(251,191,36,.4)",borderRadius:10,background:"rgba(251,191,36,.08)",color:"#fbbf24",fontWeight:800,cursor:"pointer",fontSize:13},
  g:{padding:"8px 14px",border:`1px solid ${C.bd}`,borderRadius:9,background:"transparent",color:C.t2,fontWeight:700,cursor:"pointer",fontSize:13},
  a:{padding:"8px 14px",border:`1px solid #f97316`,borderRadius:8,background:"rgba(249,115,22,.12)",color:"#f97316",fontWeight:700,cursor:"pointer",fontSize:13},
  danger:{padding:"6px 12px",border:"1px solid rgba(248,113,113,.4)",borderRadius:8,background:"rgba(248,113,113,.08)",color:"#f87171",fontWeight:700,cursor:"pointer",fontSize:12},
};

// ─── APP ROOT ────────────────────────────────────────────────────────────────
const DEFAULT_ADMIN_PW = "nba2026admin";

export default function App(){
  const [users,setUsers]     =useState([]);
  const [res,setRes]         =useState({po:{},pi:{},champ:null,mvp:null});
  const [cfg,setCfgRaw]      =useState({
    rPi:false, rPo:false, rPiPicks:false, openR:"r1",
    deadline:null, adminPw:null,
    prizes:{p1:"TBD by admin",p2:"TBD by admin",p3:"TBD by admin"},
    leagueName:"NBA Playoffs 2026",
  });
  const [sess,setSess]       =useState(()=>ld("n26s",null));
  const [loading,setLoading] =useState(true);

  // ── Session → localStorage only ──────────────────────────────────────────
  useEffect(()=>sv("n26s",sess),[sess]);

  // ── Load from Supabase + Realtime subscriptions ───────────────────────────
  useEffect(()=>{
    let resCh, cfgCh, usersCh;
    (async()=>{
      const [uRes,rRes,cRes]=await Promise.all([
        sb.from('users').select('*'),
        sb.from('results').select('data').eq('id',1).single(),
        sb.from('app_config').select('data').eq('id',1).single(),
      ]);
      // Debug: log Supabase errors so we can diagnose in browser console
      if(uRes.error) console.error('❌ USERS load error:', uRes.error.code, uRes.error.message);
      else console.log('✅ USERS loaded:', uRes.data?.length ?? 0, 'rows');
      if(rRes.error) console.error('❌ RESULTS load error:', rRes.error.message);
      if(cRes.error) console.error('❌ CONFIG load error:', cRes.error.message);

      if(uRes.data?.length) setUsers(uRes.data.map(u=>({...u,photo:u.photo_url,po:u.po||{},pi:u.pi||{}})));
      if(rRes.data?.data) setRes(rRes.data.data);
      if(cRes.data?.data) setCfgRaw(cRes.data.data);
      setLoading(false);
    })();

    resCh=sb.channel('results_rt')
      .on('postgres_changes',{event:'UPDATE',schema:'public',table:'results'},
        p=>{if(p.new?.data) setRes(p.new.data);})
      .subscribe();

    cfgCh=sb.channel('config_rt')
      .on('postgres_changes',{event:'UPDATE',schema:'public',table:'app_config'},
        p=>{if(p.new?.data) setCfgRaw(p.new.data);})
      .subscribe();

    // Realtime for user picks (pi/po updates from any device)
    usersCh=sb.channel('users_rt')
      .on('postgres_changes',{event:'UPDATE',schema:'public',table:'users'},
        p=>{if(p.new) setUsers(prev=>prev.map(u=>u.id===p.new.id?{...p.new,photo:p.new.photo_url,po:p.new.po||{},pi:p.new.pi||{}}:u));})
      .subscribe();

    return ()=>{sb.removeChannel(resCh);sb.removeChannel(cfgCh);sb.removeChannel(usersCh);};
  },[]);

  const all=[...users,AI];
  const me=sess?.uid?users.find(u=>u.id===sess.uid):null;
  const adminPw=cfg.adminPw||DEFAULT_ADMIN_PW;
  const bettingOpen=!cfg.deadline||new Date()<new Date(cfg.deadline);

  // ── Auth ──────────────────────────────────────────────────────────────────
  const reg=async(name,email,pw)=>{
    const normalEmail=email.trim().toLowerCase();
    if(normalEmail==="admin") return "That email is reserved";
    if(users.find(u=>u.email?.toLowerCase()===normalEmail)) return "Email already in use";
    const u={id:Date.now()+"",name,email:normalEmail,password:pw,photo_url:null,po:{},pi:{},champ:null,mvp:null};
    const {error}=await sb.from('users').insert(u);
    if(error) return "Registration error: "+error.message;
    setUsers(p=>[...p,{...u,photo:null}]);
    setSess({uid:u.id}); return null;
  };
  const login=(email,pw)=>{
    const emailLC=email.trim().toLowerCase();
    if(emailLC==="admin"){
      if(pw===adminPw){setSess({admin:true});return null;}
      return "Wrong admin password";
    }
    // Optional chaining (?.) prevents crash if a user has a null/undefined email
    const u=users.find(u=>u.email?.toLowerCase()===emailLC&&u.password===pw);
    if(!u) return "Wrong email or password";
    setSess({uid:u.id}); return null;
  };
  const logout=()=>setSess(null);

  // ── User picks ────────────────────────────────────────────────────────────
  const savePO=async(uid,po,champ,mvp)=>{
    await sb.from('users').update({po,champ,mvp}).eq('id',uid);
    setUsers(p=>p.map(u=>u.id===uid?{...u,po,champ,mvp}:u));
  };
  const savePI=async(uid,pi)=>{
    await sb.from('users').update({pi}).eq('id',uid);
    setUsers(p=>p.map(u=>u.id===uid?{...u,pi}:u));
  };
  const savePhoto=async(uid,photo)=>{
    await sb.from('users').update({photo_url:photo}).eq('id',uid);
    setUsers(p=>p.map(u=>u.id===uid?{...u,photo}:u));
  };
  const removeUser=async(uid)=>{
    await sb.from('users').delete().eq('id',uid);
    setUsers(p=>p.filter(u=>u.id!==uid));
  };

  // ── Results (admin) → Supabase + realtime ─────────────────────────────────
  const updateRes=(updater)=>{
    setRes(prev=>{
      const next=typeof updater==="function"?updater(prev):updater;
      sb.from('results').update({data:next}).eq('id',1);
      return next;
    });
  };
  const setPoR=(sid,w,g)=>updateRes(p=>({...p,po:{...p.po,[sid]:{w,g:parseInt(g)||null}}}));
  const setPiR=(mid,w)=>updateRes(p=>({...p,pi:{...p.pi,[mid]:{w}}}));
  const setChamp=(c)=>updateRes(p=>({...p,champ:c}));
  const setMvp=(m)=>updateRes(p=>({...p,mvp:m}));

  // ── Config (admin) → Supabase + realtime ──────────────────────────────────
  const setCfg=(updater)=>{
    setCfgRaw(prev=>{
      const next=typeof updater==="function"?updater(prev):updater;
      sb.from('app_config').update({data:next}).eq('id',1);
      return next;
    });
  };

  // ── Loading screen ────────────────────────────────────────────────────────
  if(loading) return(
    <div style={{minHeight:"100vh",background:C.bg0,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16}}>
      <div style={{fontSize:52}}>🏀</div>
      <div style={{color:C.t2,fontSize:15,fontWeight:700}}>Loading league data…</div>
      <div style={{color:C.t3,fontSize:12}}>Connecting to database</div>
    </div>
  );

  if(!sess) return <Auth onLogin={login} onReg={reg} leagueName={cfg.leagueName}/>;
  if(sess.admin) return <Admin users={all} res={res} cfg={cfg} adminPw={adminPw}
    setPoR={setPoR} setPiR={setPiR} setChamp={setChamp} setMvp={setMvp}
    setCfg={setCfg} logout={logout} removeUser={removeUser}/>;
  if(me) return <Main me={me} all={all} res={res} cfg={cfg} bettingOpen={bettingOpen}
    savePO={savePO} savePI={savePI} savePhoto={savePhoto} logout={logout}/>;
  return <Auth onLogin={login} onReg={reg} leagueName={cfg.leagueName}/>;
}


// ─── AUTH ────────────────────────────────────────────────────────────────────
function Auth({onLogin,onReg,leagueName}){
  const [mode,setMode]=useState("login");
  const [name,setName]=useState(""); const [email,setEmail]=useState(""); const [pw,setPw]=useState(""); const [err,setErr]=useState("");
  const go=()=>{setErr("");const e=mode==="reg"?onReg(name.trim(),email.trim(),pw):onLogin(email.trim(),pw);if(e)setErr(e);};
  return(
    <div style={{minHeight:"100vh",background:C.bg0,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:C.bg1,border:`1px solid ${C.bd}`,borderRadius:22,padding:"40px 36px",width:"100%",maxWidth:380,boxShadow:"0 32px 80px #000b"}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{fontSize:48,marginBottom:8}}>🏀</div>
          <h1 style={{margin:0,fontSize:26,fontWeight:900,color:C.t1,fontFamily:"Georgia,serif",letterSpacing:"-1px"}}>{leagueName||"NBA Playoffs 2026"}</h1>
          <p style={{margin:"4px 0 0",color:C.t3,fontSize:11,letterSpacing:"2.5px",textTransform:"uppercase"}}>Prediction League</p>
        </div>
        <div style={{display:"flex",background:C.bg0,borderRadius:10,padding:4,marginBottom:20}}>
          {[["login","Sign In"],["reg","Join League"]].map(([k,l])=>(
            <button key={k} onClick={()=>{setMode(k);setErr("");}} style={{flex:1,padding:"9px",border:"none",cursor:"pointer",borderRadius:8,fontWeight:700,fontSize:14,background:mode===k?C.bg3:"transparent",color:mode===k?C.t1:C.t3}}>{l}</button>
          ))}
        </div>
        {mode==="reg"&&<input style={{...inp,marginBottom:12}} placeholder="Your name" value={name} onChange={e=>setName(e.target.value)}/>}
        <input style={{...inp,marginBottom:12}} placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)}/>
        <input style={{...inp,marginBottom:err?8:16}} type="password" placeholder="Password" value={pw} onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==="Enter"&&go()}/>
        {err&&<p style={{color:C.er,fontSize:13,margin:"0 0 12px",textAlign:"center"}}>{err}</p>}
        <button onClick={go} style={{...btn.p,width:"100%",padding:13,fontSize:15}}>{mode==="login"?"Enter the League →":"Create Account →"}</button>
        <p style={{textAlign:"center",color:C.t3,fontSize:11,marginTop:16}}>Are you the admin? Use email <code style={{color:C.acc}}>admin</code></p>
      </div>
    </div>
  );
}

// ─── MAIN USER SHELL ─────────────────────────────────────────────────────────
function Main({me,all,res,cfg,bettingOpen,savePO,savePI,savePhoto,logout}){
  const [tab,setTab]=useState("picks");
  const scores=useMemo(()=>all.map(u=>({...u,...scoreUser(u,res,cfg)})).sort((a,b)=>b.total-a.total),[all,res,cfg]);
  const myS=scores.find(s=>s.id===me.id);
  const myR=scores.findIndex(s=>s.id===me.id)+1;
  // Finals MVP only visible when Finals round is open
  const finalsOpen=ROUND_KEYS.indexOf(cfg.openR||"r1")>=ROUND_KEYS.indexOf("finals");
  // Per-round deadline helpers
  const getRoundDeadline=(roundKey)=>{
    const d=cfg.deadlines?.[roundKey];
    if(d)return d;
    if(roundKey==='r1'||roundKey==='pi')return cfg.deadline||null;
    return null;
  };
  const roundBettingOpen=(roundKey)=>{
    const d=getRoundDeadline(roundKey);
    return !d||new Date()<new Date(d);
  };
  const TABS=[
    {k:"picks",i:"🏀",l:"My Picks"},
    {k:"playin",i:"⚡",l:"Play-In"},
    {k:"games",i:"📅",l:"Games"},
    {k:"teams",i:"📊",l:"Teams"},
    {k:"rules",i:"📋",l:"Rules"},
    {k:"prizes",i:"🎁",l:"Prizes"},
    {k:"board",i:"🏅",l:"Standings"},
    {k:"profile",i:"👤",l:"Profile"},
    ...((cfg.rPo||cfg.rPiPicks)?[{k:"all",i:"👀",l:"All Picks"}]:[]),
  ];
  return(
    <div style={{minHeight:"100vh",background:C.bg0,color:C.t1,fontFamily:"'DM Sans','Segoe UI',sans-serif"}}>
      <header style={{background:C.bg1,borderBottom:`1px solid ${C.bd}`,padding:"10px 18px",display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,flexWrap:"wrap",position:"sticky",top:0,zIndex:50}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:24}}>🏆</span>
          <div><div style={{fontWeight:900,fontSize:15,fontFamily:"Georgia,serif"}}>NBA Playoffs 2026</div><div style={{fontSize:9,color:C.t3,letterSpacing:"2px",textTransform:"uppercase"}}>Prediction League</div></div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <Avatar user={me} size={30} idx={scores.findIndex(s=>s.id===me.id)}/>
          <div style={{textAlign:"right"}}><div style={{fontWeight:700,fontSize:13}}>{me.name}</div><div style={{fontSize:11}}><span style={{color:C.acc,fontWeight:800}}>{myS?.total??0}</span><span style={{color:C.t3}}> pts · #{myR}/{scores.length}</span></div></div>
          <button onClick={logout} style={btn.g}>← Exit</button>
        </div>
      </header>
      <nav style={{display:"flex",background:C.bg1,borderBottom:`1px solid ${C.bd}`,overflowX:"auto"}}>
        {TABS.map(t=><button key={t.k} onClick={()=>setTab(t.k)} style={{padding:"10px 14px",border:"none",background:"transparent",color:tab===t.k?C.acc:C.t3,cursor:"pointer",fontSize:12,fontWeight:700,borderBottom:`2px solid ${tab===t.k?C.acc:"transparent"}`,whiteSpace:"nowrap"}}>{t.i} {t.l}</button>)}
      </nav>
      {!bettingOpen&&<div style={{background:"rgba(248,113,113,.1)",borderBottom:"1px solid rgba(248,113,113,.3)",padding:"8px 18px",textAlign:"center",color:C.er,fontSize:12,fontWeight:700}}>🔒 Betting is closed — predictions are locked</div>}
      <main style={{maxWidth:980,margin:"0 auto",padding:"20px 14px 70px"}}>
        {tab==="picks"   &&<Picks   me={me} res={res} cfg={cfg} onSave={savePO} bettingOpen={bettingOpen} finalsOpen={finalsOpen} getRoundDeadline={getRoundDeadline} roundBettingOpen={roundBettingOpen}/>}
        {tab==="playin"  &&<Playin  me={me} res={res} cfg={cfg} onSave={savePI} bettingOpen={bettingOpen} piDeadline={getRoundDeadline('pi')} roundBettingOpen={roundBettingOpen}/>}
        {tab==="games"   &&<Games/>}
        {tab==="teams"   &&<Teams res={res}/>}
        {tab==="rules"   &&<Rules/>}
        {tab==="prizes"  &&<Prizes cfg={cfg}/>}
        {tab==="board"   &&<Board   scores={scores} myId={me.id} cfg={cfg}/>}
        {tab==="profile" &&<Profile me={me} onSavePhoto={savePhoto}/>}
        {tab==="all"     &&<AllPicks all={all} res={res} cfg={cfg}/>}
      </main>
    </div>
  );
}

// ─── PICKS ───────────────────────────────────────────────────────────────────
function Picks({me,res,cfg,onSave,bettingOpen,finalsOpen,getRoundDeadline,roundBettingOpen}){
  const [draft,setDraft]=useState({...me.po});
  const [champ,setChamp]=useState(me.champ||"");
  const [mvp,setMvp]=useState(me.mvp||"");
  const [saved,setSaved]=useState(false);
  const [saveErr,setSaveErr]=useState("");
  const [activeR,setActiveR]=useState(cfg.openR||"r1");
  const openIdx=ROUND_KEYS.indexOf(cfg.openR||"r1");
  // Per-round deadline
  const activeDeadline=getRoundDeadline?getRoundDeadline(activeR):null;
  const activeBettingOpen=bettingOpen&&(roundBettingOpen?roundBettingOpen(activeR):true);

  // Split series by conference for current round
  const allRoundSeries=SERIES.filter(s=>s.r===activeR);
  const eastSeries=allRoundSeries.filter(s=>s.conf==="E");
  const westSeries=allRoundSeries.filter(s=>s.conf==="W");
  const finalsSeries=allRoundSeries.filter(s=>s.conf==="F");
  const roundPts=ROUNDS.find(r=>r.k===activeR).pts;

  const setPred=(sid,field,val)=>{setSaveErr("");setDraft(p=>({...p,[sid]:{...(p[sid]||{}),[field]:field==="g"?parseInt(val):val}}));};
  const doSave=()=>{
    // Validate: every series with a winner must also have a game count
    const allOpenSeries=SERIES.filter(s=>ROUND_KEYS.indexOf(s.r)<=openIdx);
    const incomplete=allOpenSeries.filter(s=>draft[s.id]?.w&&!draft[s.id]?.g);
    if(incomplete.length>0){
      setSaveErr(`⚠️ נא לבחור גם כמה משחקים ב-${incomplete.length} סדרה${incomplete.length>1?"ות":""} (${incomplete.map(s=>sn(resolveTeam(s.t1,res)||s.t1)+" vs "+sn(resolveTeam(s.t2,res)||s.t2)).join(", ")})`);
      return;
    }
    setSaveErr("");
    onSave(me.id,draft,champ||null,mvp||null);
    setSaved(true);
    setTimeout(()=>setSaved(false),2500);
  };

  const SeriesCard=({s})=>{
    const pred=draft[s.id]||{};
    const real=res.po?.[s.id];
    // Resolve pred for scoring (E8 → actual team if Play-In done)
    const resolvedPred=pred?.w?{...pred,w:resolveTeam(pred.w,res)||pred.w}:pred;
    const sc=scoreS(resolvedPred,real,roundPts);
    const bg=BG[sc.t];
    return(
      <div style={{background:sc.t!=="pending"?bg.bg:C.bg2,border:`1px solid ${sc.t!=="pending"?bg.c:C.bdL}`,borderRadius:14,padding:16}}>
        <div style={{display:"flex",background:C.bg3,borderRadius:10,overflow:"hidden",marginBottom:10}}>
          {[{k:s.t1},{k:s.t2}].map(({k},idx)=>{
            const rk=resolveTeam(k,res)||k; // resolved for display (logo + name)
            const isSel=pred.w===k;
            return <button key={k} onClick={()=>setPred(s.id,"w",k)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",padding:"10px 6px",border:"none",cursor:"pointer",background:isSel?`linear-gradient(${idx===0?"135deg":"225deg"},rgba(249,115,22,.2),transparent)`:"transparent",outline:isSel?`2px solid ${C.acc}`:"none",outlineOffset:-2,position:"relative"}}>
              <Logo abbr={rk} size={40}/>
              <div style={{fontSize:10,fontWeight:700,color:isSel?C.acc:C.t2,marginTop:5,textAlign:"center",lineHeight:1.2}}>{sn(rk)}</div>
              {isSel&&<div style={{fontSize:9,color:C.acc,fontWeight:800}}>✓ PICKED</div>}
              {idx===0&&<div style={{position:"absolute",right:0,top:"50%",transform:"translateY(-50%)",fontSize:9,color:C.t3,fontWeight:700}}>vs</div>}
            </button>;
          })}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:5}}>
          <span style={{fontSize:11,color:C.t3,marginRight:2}}>Games:</span>
          {[4,5,6,7].map(g=><button key={g} onClick={()=>setPred(s.id,"g",g)} style={{width:30,height:30,border:`1px solid ${pred.g===g?C.acc:C.bd}`,borderRadius:7,background:pred.g===g?C.aD:"transparent",color:pred.g===g?C.acc:C.t3,fontWeight:700,cursor:"pointer",fontSize:12}}>{g}</button>)}
        </div>
        {cfg.rPo&&real?.w&&<div style={{marginTop:8,background:C.bg4,borderRadius:7,padding:"6px 10px",display:"flex",justifyContent:"space-between"}}>
          <span style={{fontSize:11,color:C.ok,fontWeight:700}}>✓ {sn(real.w)} in {real.g}</span>
          <span style={{color:bg.c,fontWeight:900,fontSize:14}}>+{sc.p}</span>
        </div>}
      </div>
    );
  };

  return(
    <div>
      <h2 style={{margin:"0 0 4px",fontWeight:900,fontFamily:"Georgia,serif",fontSize:22}}>My Playoff Picks</h2>
      <p style={{margin:"0 0 18px",color:C.t3,fontSize:13}}>Each round unlocks after the previous one ends.</p>

      {/* Round tabs */}
      <div style={{display:"flex",gap:6,marginBottom:activeDeadline?10:20,flexWrap:"wrap"}}>
        {ROUNDS.map((r,i)=>{
          const isOpen=i<=openIdx, isAct=activeR===r.k;
          return <button key={r.k} onClick={()=>isOpen&&setActiveR(r.k)} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 14px",border:`1px solid ${isAct?C.acc:C.bd}`,borderRadius:10,background:isAct?C.aD:isOpen?C.bg2:"transparent",color:isAct?C.acc:isOpen?C.t2:C.t3,fontWeight:700,cursor:isOpen?"pointer":"not-allowed",fontSize:12,opacity:isOpen?1:0.4}}>
            {!isOpen&&"🔒"}{r.l}<span style={{fontSize:10,color:C.t3,background:C.bg4,borderRadius:5,padding:"1px 5px"}}>{r.pts.exact}/{r.pts.correct}/{r.pts.wrong}</span>
          </button>;
        })}
      </div>
      {activeDeadline&&activeBettingOpen&&(
        <div style={{background:"rgba(249,115,22,.07)",border:"1px solid rgba(249,115,22,.2)",borderRadius:9,padding:"7px 14px",marginBottom:16,display:"inline-flex",alignItems:"center"}}>
          <Countdown deadline={activeDeadline} label={ROUNDS.find(r=>r.k===activeR)?.l}/>
        </div>
      )}

      {/* Finals: single centered series */}
      {activeR==="finals"&&finalsSeries.length>0&&(
        <div style={{maxWidth:340,margin:"0 auto 24px"}}>
          <div style={{fontSize:10,fontWeight:800,color:C.acc,textTransform:"uppercase",letterSpacing:"1.5px",marginBottom:10,textAlign:"center"}}>🏆 NBA Finals</div>
          {finalsSeries.map(s=><SeriesCard key={s.id} s={s}/>)}
        </div>
      )}

      {/* East / West two-column layout */}
      {activeR!=="finals"&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:24}}>
          {/* East */}
          <div>
            <div style={{fontSize:10,fontWeight:800,color:"#60a5fa",textTransform:"uppercase",letterSpacing:"1.5px",marginBottom:10,display:"flex",alignItems:"center",gap:6}}>
              <span style={{background:"rgba(96,165,250,.15)",border:"1px solid rgba(96,165,250,.3)",borderRadius:5,padding:"2px 7px"}}>Eastern Conference</span>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {eastSeries.map(s=><SeriesCard key={s.id} s={s}/>)}
            </div>
          </div>
          {/* West */}
          <div>
            <div style={{fontSize:10,fontWeight:800,color:"#f97316",textTransform:"uppercase",letterSpacing:"1.5px",marginBottom:10,display:"flex",alignItems:"center",gap:6}}>
              <span style={{background:"rgba(249,115,22,.12)",border:"1px solid rgba(249,115,22,.3)",borderRadius:5,padding:"2px 7px"}}>Western Conference</span>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {westSeries.map(s=><SeriesCard key={s.id} s={s}/>)}
            </div>
          </div>
        </div>
      )}

      {/* Champion - all 30 teams with logos */}
      <div style={{background:`rgba(249,115,22,.07)`,border:`1px solid rgba(249,115,22,.25)`,borderRadius:16,padding:20,marginBottom:16}}>
        <div style={{textAlign:"center",marginBottom:16}}>
          <div style={{fontSize:32,marginBottom:4}}>🏆</div>
          <div style={{fontWeight:900,fontSize:17}}>NBA Champion Pick</div>
          <div style={{color:C.t3,fontSize:12,marginTop:2}}>+10 pts · pick the team that lifts the trophy</div>
          {champ&&<div style={{marginTop:10,display:"inline-flex",alignItems:"center",gap:8,background:C.aD,border:`1px solid ${C.acc}`,borderRadius:10,padding:"7px 14px"}}>
            <Logo abbr={champ} size={28}/><span style={{color:C.acc,fontWeight:900,fontSize:14}}>🏆 {T[champ]?.n}</span>
          </div>}
        </div>
        {[{label:"Eastern Conference",abbrs:EAST_ABBRS},{label:"Western Conference",abbrs:WEST_ABBRS}].map(({label,abbrs})=>(
          <div key={label} style={{marginBottom:16}}>
            <div style={{fontSize:10,fontWeight:800,color:C.t3,textTransform:"uppercase",letterSpacing:"1.5px",marginBottom:8}}>{label}</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(72px,1fr))",gap:6}}>
              {abbrs.map(abbr=>{
                const sel=champ===abbr;
                return <button key={abbr} onClick={()=>setChamp(sel?"":abbr)}
                  style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,padding:"10px 6px",
                    border:`2px solid ${sel?C.acc:C.bd}`,borderRadius:10,
                    background:sel?C.aD:C.bg2,cursor:"pointer",
                    boxShadow:sel?`0 0 12px rgba(249,115,22,.3)`:"none"}}>
                  <Logo abbr={abbr} size={32}/>
                  <div style={{fontSize:9,fontWeight:sel?900:600,color:sel?C.acc:C.t3,textAlign:"center",lineHeight:1.1}}>{T[abbr]?.a}</div>
                  {sel&&<div style={{fontSize:8,color:C.acc}}>✓</div>}
                </button>;
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Finals MVP — only visible when Finals round is open */}
      {finalsOpen?(
        <div style={{background:`rgba(56,189,248,.07)`,border:`1px solid rgba(56,189,248,.25)`,borderRadius:16,padding:20,marginBottom:24}}>
          <div style={{textAlign:"center",marginBottom:14}}><div style={{fontSize:28,marginBottom:4}}>⭐</div><div style={{fontWeight:900,fontSize:16}}>Finals MVP Pick</div><div style={{color:C.t3,fontSize:12}}>+8 pts if correct</div></div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6,justifyContent:"center"}}>
            {MVPS.map(m=>{
              const isSel=mvp===m.id;
              return <button key={m.id} onClick={()=>setMvp(isSel?"":m.id)} style={{display:"flex",alignItems:"center",gap:7,padding:"7px 12px",border:`2px solid ${isSel?C.ai:C.bd}`,borderRadius:10,background:isSel?"rgba(56,189,248,.12)":C.bg2,cursor:"pointer",color:isSel?C.ai:C.t2,fontWeight:isSel?800:500,fontSize:12}}>
                <Logo abbr={m.t} size={20}/>
                <div style={{textAlign:"left"}}><div style={{fontWeight:700,lineHeight:1.1}}>{m.n}</div><div style={{fontSize:10,color:isSel?C.ai:C.t3}}>{T[m.t]?.a}</div></div>
                {isSel&&<span>⭐</span>}
              </button>;
            })}
          </div>
          {mvp&&<div style={{textAlign:"center",color:C.ai,fontWeight:700,fontSize:13,marginTop:8}}>⭐ {MVPS.find(m=>m.id===mvp)?.n}</div>}
        </div>
      ):(
        <div style={{background:C.bg2,border:`1px solid ${C.bdL}`,borderRadius:16,padding:18,marginBottom:24,textAlign:"center"}}>
          <div style={{fontSize:22,marginBottom:6}}>⭐</div>
          <div style={{fontWeight:700,fontSize:14,color:C.t2}}>Finals MVP Pick</div>
          <div style={{color:C.t3,fontSize:12,marginTop:4}}>🔒 Unlocks when the NBA Finals round opens</div>
        </div>
      )}

      <div style={{textAlign:"center"}}>
        {activeBettingOpen
          ?<>
            <button onClick={doSave} style={{...btn.p,padding:"13px 44px",fontSize:15}}>{saved?"✓ Picks Saved!":"Save My Predictions"}</button>
            {saveErr&&<div style={{background:"rgba(248,113,113,.1)",border:"1px solid rgba(248,113,113,.35)",borderRadius:10,padding:"10px 16px",marginTop:10,color:C.er,fontWeight:700,fontSize:13,textAlign:"right",direction:"rtl"}}>{saveErr}</div>}
            {!saveErr&&<p style={{color:C.t3,fontSize:11,marginTop:8}}>Predictions lock at the deadline set by admin.</p>}
          </>
          :<div style={{background:"rgba(248,113,113,.1)",border:"1px solid rgba(248,113,113,.3)",borderRadius:12,padding:"14px 18px",color:C.er,fontWeight:700,fontSize:14}}>🔒 Betting is closed — predictions are locked</div>
        }
      </div>
    </div>
  );
}

// ─── PLAY-IN ─────────────────────────────────────────────────────────────────
function Playin({me,res,cfg,onSave,bettingOpen,piDeadline,roundBettingOpen}){
  const [draft,setDraft]=useState({...me.pi});
  const [saved,setSaved]=useState(false);
  const piBettingOpen=bettingOpen&&(roundBettingOpen?roundBettingOpen('pi'):true);
  const doSave=()=>{onSave(me.id,draft);setSaved(true);setTimeout(()=>setSaved(false),2500);};
  const east=PLAYIN.filter(m=>m.conf==="East"), west=PLAYIN.filter(m=>m.conf==="West");
  return(
    <div>
      <div style={{display:"inline-flex",alignItems:"center",gap:6,background:"rgba(249,115,22,.1)",border:"1px solid rgba(249,115,22,.3)",borderRadius:7,padding:"3px 10px",fontSize:10,fontWeight:800,color:C.acc,textTransform:"uppercase",letterSpacing:"1px",marginBottom:10}}>⚡ Play-In · April 14–17</div>
      <h2 style={{margin:"0 0 4px",fontWeight:900,fontFamily:"Georgia,serif",fontSize:22}}>Play-In Picks</h2>
      <p style={{margin:"0 0 10px",color:C.t3,fontSize:13}}>Pick the winner of each game. No series length needed.</p>
      {piDeadline&&piBettingOpen&&(
        <div style={{background:"rgba(249,115,22,.07)",border:"1px solid rgba(249,115,22,.2)",borderRadius:9,padding:"7px 14px",marginBottom:14,display:"inline-flex",alignItems:"center"}}>
          <Countdown deadline={piDeadline} label="Play-In"/>
        </div>
      )}
      <div style={{background:C.bg2,border:`1px solid ${C.bdL}`,borderRadius:12,padding:14,marginBottom:20,fontSize:12,color:C.t2}}>
        🎯 <strong style={{color:C.ok}}>+3 pts</strong> correct · ❌ <strong style={{color:C.er}}>+1 pt</strong> wrong
      </div>
      {[{label:"Eastern Conference",games:east},{label:"Western Conference",games:west}].map(({label,games})=>(
        <div key={label} style={{marginBottom:24}}>
          <div style={{fontSize:10,fontWeight:800,color:C.t3,textTransform:"uppercase",letterSpacing:"2px",marginBottom:10}}>{label}</div>
          {games.map(m=>{
            const picked=draft[m.id]?.w;
            const real=res.pi?.[m.id]?.w;
            const correct=cfg.rPi&&real&&picked&&picked===real;
            const wrong=cfg.rPi&&real&&picked&&picked!==real;
            const hasTeams=m.teams[0]&&m.teams[1];
            return(
              <div key={m.id} style={{background:correct?C.okB:wrong?C.erB:C.bg2,border:`1px solid ${correct?C.ok:wrong?C.er:C.bdL}`,borderRadius:12,marginBottom:8,overflow:"hidden"}}>
                <div style={{background:C.bg3,padding:"8px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:6}}>
                  <div><div style={{fontWeight:800,fontSize:13}}>{m.label}</div><div style={{fontSize:11,color:C.t3}}>{m.desc}</div></div>
                  {cfg.rPi&&real&&<span style={{color:C.ok,fontWeight:700,fontSize:11}}>✓ {T[real]?.n||real} advances</span>}
                </div>
                {hasTeams?(
                  <div style={{display:"flex"}}>
                    {m.teams.map((tk,idx)=>{
                      const isSel=picked===tk;
                      return <button key={tk} onClick={()=>setDraft(p=>({...p,[m.id]:{w:tk}}))} style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"14px 10px",border:"none",cursor:"pointer",background:isSel?`linear-gradient(${idx===0?"to right":"to left"},rgba(249,115,22,.2),transparent)`:"transparent",borderRight:idx===0?`1px solid ${C.bd}`:"none",outline:isSel?`2px inset ${C.acc}`:"none"}}>
                        <Logo abbr={tk} size={44}/>
                        <div><div style={{fontWeight:700,fontSize:13,color:isSel?C.acc:C.t1}}>{T[tk]?.n||tk}</div>{isSel&&<div style={{fontSize:10,color:C.acc,fontWeight:800}}>✓ Your pick</div>}</div>
                      </button>;
                    })}
                  </div>
                ):(
                  <div style={{padding:"12px 14px",color:C.t3,fontSize:12}}>Results from previous games needed first</div>
                )}
              </div>
            );
          })}
        </div>
      ))}
      <div style={{textAlign:"center"}}>
        {piBettingOpen
          ?<button onClick={doSave} style={{...btn.p,padding:"12px 44px",fontSize:14}}>{saved?"✓ Saved!":"Save Play-In Picks"}</button>
          :<div style={{background:"rgba(248,113,113,.1)",border:"1px solid rgba(248,113,113,.3)",borderRadius:12,padding:"12px 16px",color:C.er,fontWeight:700,fontSize:13}}>🔒 Play-In betting is closed</div>
        }
      </div>
    </div>
  );
}

// ─── TEAMS ───────────────────────────────────────────────────────────────────
const TDATA={
  DET:{seed:"E1",rec:"60-22",odds:"+2200",stars:["Cade Cunningham","Paul Reed"],info:"First 60-win season since 1988. Defense-first identity. Cunningham finally healthy.",q:"Enough offense beyond Cunningham?"},
  BOS:{seed:"E2",rec:"58-24",odds:"+550",stars:["Jaylen Brown","Jayson Tatum"],info:"Tatum back from Achilles. 12th straight playoff. Elite offense and defense.",q:"Tatum still shaking off rust. Pritchard inconsistency risk."},
  NYK:{seed:"E3",rec:"53-29",odds:"+1800",stars:["Jalen Brunson","Karl-Anthony Towns"],info:"3rd straight top-3 seed. Same core, better bench. Beat BOS 3 times this season.",q:"KAT must deliver in big moments."},
  CLE:{seed:"E4",rec:"51-31",odds:"+1100",stars:["Donovan Mitchell","James Harden"],info:"Superstar backcourt. Harden's first season in Cleveland brings veteran IQ.",q:"Two ball-dominant stars sharing the floor under pressure."},
  TOR:{seed:"E5",rec:"48-34",odds:"+4000",stars:["Scottie Barnes","Immanuel Quickley"],info:"Snuck into #5 on final day. Young, athletic, high ceiling.",q:"Playoff experience gap. Barnes must play like a star."},
  ATL:{seed:"E6",rec:"46-36",odds:"+5000",stars:["Jalen Johnson","Trae Young"],info:"Finished 19-5! First top-6 berth in 5 years. R1 vs NYK is tough draw.",q:"Can they bottle the late-season momentum?"},
  OKC:{seed:"W1",rec:"64-18",odds:"+125",stars:["Shai Gilgeous-Alexander","Chet Holmgren"],info:"Best record in NBA. Defending champs. 18 months of dominance.",q:"Can they handle being the hunted? Spurs went 4-1 vs them."},
  SAS:{seed:"W2",rec:"57-25",odds:"+550",stars:["Victor Wembanyama","De'Aaron Fox"],info:"First playoffs since 2019. Wemby's playoff debut at 22. Went 4-1 vs OKC.",q:"Wemby has rib contusion (Apr 6). If healthy, beware."},
  DEN:{seed:"W3",rec:"52-30",odds:"+1100",stars:["Nikola Jokić","Jamal Murray"],info:"8th straight playoff. Jokić arguably the world's best player.",q:"Murray health is decisive for a deep run."},
  LAL:{seed:"W4",rec:"50-32",odds:"+2500",stars:["LeBron James","Anthony Davis"],info:"LeBron's 19th postseason at 41. First matchup with two 75k+ pts players.",q:"LeBron endurance. AD injury history looms."},
  HOU:{seed:"W5",rec:"49-33",odds:"+1400",stars:["Kevin Durant","Alperen Şengün"],info:"KD's 14th postseason, first with HOU. Ended season on a 10-1 run.",q:"KD must be unleashed. Şengün dominating the paint is key."},
  MIN:{seed:"W6",rec:"47-35",odds:"+2000",stars:["Anthony Edwards","Rudy Gobert"],info:"3rd straight deep West run. Ant Edwards top-5 player in the world.",q:"Can they finally get past the second round?"},
};

async function fetchAllInjuries(){
  const playoffTeams=['DET','BOS','NYK','CLE','TOR','ATL','OKC','SAS','DEN','LAL','HOU','MIN'];
  const map={};
  await Promise.all(playoffTeams.map(async abbr=>{
    try{
      // Primary: ESPN dedicated injuries endpoint (most accurate & up-to-date)
      const tid=ESPN_IDS[abbr];
      if(tid){
        const r=await fetch(`https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba/teams/${tid}/injuries?limit=25`);
        if(r.ok){
          const j=await r.json();
          const injured=(j.items||[]).map(item=>({
            name:item.athlete?.displayName||item.athlete?.shortName||"?",
            status:item.type?.description||item.injury?.status||"Out",
            detail:item.injury?.shortComment||item.injury?.longComment||"",
            pos:item.athlete?.position?.abbreviation||"",
          })).filter(a=>a.name&&a.name!=="?");
          map[abbr]=injured;return;
        }
      }
      // Fallback: roster endpoint filtered by non-active status
      const espn=T[abbr]?.e||abbr.toLowerCase();
      const r2=await fetch(`https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/${espn}/roster`);
      if(!r2.ok)return;
      const j2=await r2.json();
      const injured2=(j2.athletes||[]).flatMap(g=>g.items||[]).filter(a=>{
        const st=(a.status?.type?.name||"").toLowerCase();
        return st&&st!=="active";
      }).map(a=>({name:a.displayName||a.shortName||"?",status:a.status?.type?.name||"Out",detail:"",pos:a.position?.abbreviation||""}));
      map[abbr]=injured2;
    }catch{}
  }));
  return map;
}

function Teams({res}){
  const [injuries,setInjuries]=useState({});
  const [injLoading,setInjLoading]=useState(false);
  const [expanded,setExpanded]=useState(null);
  const [seriesScores,setSeriesScores]=useState({});

  const loadInjuries=()=>{
    setInjLoading(true);
    fetchAllInjuries().then(m=>{setInjuries(m);setInjLoading(false);});
  };
  useEffect(()=>{
    loadInjuries();
    fetchSeriesScores().then(setSeriesScores);
  },[]);

  // Seed label helper
  const seedLabel=(abbr,placeholder)=>{
    const d=TDATA[abbr];
    if(d?.seed) return `#${d.seed.slice(1)} ${d.seed[0]==="E"?"East":"West"}`;
    if(placeholder==="E7"||placeholder==="W7") return placeholder==="E7"?"#7 East":"#7 West";
    if(placeholder==="E8"||placeholder==="W8") return placeholder==="E8"?"#8 East":"#8 West";
    return "";
  };

  const MatchupCard=({s})=>{
    const rt1=s.t1; // always a real team
    const rt2=resolveTeam(s.t2,res)||s.t2; // resolve E7/E8/W7/W8
    const d1=TDATA[rt1]||{};
    const d2=TDATA[rt2]||{};
    const inj1=injuries[rt1]||[];
    const inj2=injuries[rt2]||[];
    const isExp=expanded===s.id;
    const result=res?.po?.[s.id];
    const resolved2=T[rt2]; // true if Play-In resolved

    const seriesKey=[rt1,rt2].sort().join('|');
    const sd=seriesScores[seriesKey];
    const sw1=sd?.wins?.[rt1]||0,sw2=sd?.wins?.[rt2]||0;
    const liveLeader=sw1>sw2?rt1:sw2>sw1?rt2:null;

    const TeamCol=({abbr,placeholder,d,inj,seriesWins})=>(
      <div style={{flex:1,padding:"14px 10px",display:"flex",flexDirection:"column",alignItems:"center",gap:5,textAlign:"center"}}>
        <Logo abbr={abbr} size={52}/>
        <div style={{fontWeight:900,fontSize:13,lineHeight:1.2,color:C.t1}}>{T[abbr]?.n||(placeholder?LABELS[placeholder]:abbr)||abbr}</div>
        <div style={{fontSize:10,color:C.t3}}>{d.rec||""}{d.seed?` · ${d.seed}`:(placeholder&&!T[abbr]?` · ${LABELS[placeholder]||placeholder}`:"")}</div>
        {d.odds&&<div style={{fontSize:10,color:C.acc,fontWeight:800}}>{d.odds}</div>}
        {seriesWins>0&&<div style={{background:"rgba(52,211,153,.12)",border:"1px solid rgba(52,211,153,.3)",borderRadius:6,padding:"3px 8px",fontSize:10,color:C.ok,fontWeight:800}}>{seriesWins} W</div>}
        {inj.length>0&&<div style={{background:"rgba(248,113,113,.12)",border:"1px solid rgba(248,113,113,.3)",borderRadius:6,padding:"3px 8px",fontSize:9,color:C.er,fontWeight:700}}>{inj.length} injured</div>}
      </div>
    );

    return(
      <div style={{background:C.bg2,border:`1px solid ${result?.w?C.ok+"44":liveLeader?C.acc+"33":C.bdL}`,borderRadius:14,marginBottom:10,overflow:"hidden"}}>
        {/* Series progress bar (shown when games have been played) */}
        {(sd?.games>0)&&!result?.w&&(
          <div style={{background:C.bg3,borderBottom:`1px solid ${C.bdL}`,padding:"4px 12px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:10,color:liveLeader===rt1?C.ok:C.t3,fontWeight:liveLeader===rt1?800:600}}>{T[rt1]?.a} {sw1}</span>
            <span style={{fontSize:9,color:C.t3,fontWeight:700}}>Series · {sd.games} game{sd.games>1?"s":""} played</span>
            <span style={{fontSize:10,color:liveLeader===rt2?C.ok:C.t3,fontWeight:liveLeader===rt2?800:600}}>{sw2} {T[rt2]?.a}</span>
          </div>
        )}
        {result?.w&&(
          <div style={{background:"rgba(52,211,153,.06)",borderBottom:`1px solid ${C.ok}33`,padding:"4px 12px",display:"flex",justifyContent:"center",gap:6,alignItems:"center"}}>
            <Logo abbr={result.w} size={14}/>
            <span style={{fontSize:10,color:C.ok,fontWeight:800}}>{T[result.w]?.n} wins series in {result.g} games</span>
          </div>
        )}
        {/* Main row */}
        <div style={{display:"flex",alignItems:"stretch"}}>
          <TeamCol abbr={rt1} placeholder={null} d={d1} inj={inj1} seriesWins={sw1}/>
          {/* Center */}
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"10px 6px",gap:4,minWidth:44}}>
            {sd?.games>0&&!result?.w
              ?<div style={{textAlign:"center"}}>
                  <div style={{fontSize:16,fontWeight:900,color:C.t1,lineHeight:1}}>{sw1}–{sw2}</div>
                  {liveLeader&&<div style={{fontSize:8,color:C.ok,fontWeight:800,marginTop:1}}>{T[liveLeader]?.a} leads</div>}
                </div>
              :<div style={{fontSize:10,fontWeight:700,color:C.t3}}>VS</div>
            }
            <button onClick={()=>setExpanded(isExp?null:s.id)}
              style={{background:"transparent",border:`1px solid ${C.bdL}`,borderRadius:5,color:C.t3,fontSize:9,cursor:"pointer",padding:"2px 5px",marginTop:2}}>
              {isExp?"▲":"▼"}
            </button>
          </div>
          <TeamCol abbr={rt2} placeholder={T[rt2]?null:s.t2} d={d2} inj={inj2} seriesWins={sw2}/>
        </div>

        {/* Expanded details */}
        {isExp&&(
          <div style={{borderTop:`1px solid ${C.bdL}`,padding:14}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
              {[{abbr:rt1,d:d1,inj:inj1},{abbr:rt2,d:d2,inj:inj2}].map(({abbr,d,inj})=>(
                <div key={abbr}>
                  <div style={{fontWeight:800,fontSize:12,marginBottom:8,color:C.t2,display:"flex",alignItems:"center",gap:6}}>
                    <Logo abbr={abbr} size={18}/>{T[abbr]?.a||abbr}
                  </div>
                  {d.stars?.length>0&&<div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:8}}>
                    {d.stars.map(s=><span key={s} style={{background:C.bg4,border:`1px solid ${C.bdL}`,borderRadius:5,padding:"2px 7px",fontSize:10,color:C.t2}}>⭐ {s}</span>)}
                  </div>}
                  {d.info&&<p style={{color:C.t2,fontSize:11,lineHeight:1.5,margin:"0 0 8px"}}>{d.info}</p>}
                  {d.q&&<div style={{background:C.bg3,borderRadius:7,padding:"7px 10px",marginBottom:8}}>
                    <div style={{fontSize:8,color:C.t3,fontWeight:800,textTransform:"uppercase",letterSpacing:"1px",marginBottom:2}}>❓ Key Question</div>
                    <div style={{fontSize:11,color:C.wn}}>{d.q}</div>
                  </div>}
                  {inj.length>0&&(
                    <div style={{background:"rgba(248,113,113,.07)",border:"1px solid rgba(248,113,113,.2)",borderRadius:8,padding:"8px 10px"}}>
                      <div style={{fontSize:8,fontWeight:800,color:C.er,textTransform:"uppercase",letterSpacing:"1px",marginBottom:6}}>🏥 Injury Report</div>
                      {inj.map((p,i)=>(
                        <div key={i} style={{display:"flex",alignItems:"center",gap:6,marginBottom:i<inj.length-1?4:0}}>
                          <span style={{fontSize:8,background:"rgba(248,113,113,.2)",color:C.er,borderRadius:4,padding:"1px 5px",fontWeight:700,whiteSpace:"nowrap"}}>{p.status}</span>
                          <span style={{fontSize:11,color:C.t2}}>{p.name}</span>
                          {p.pos&&<span style={{fontSize:9,color:C.t3}}>{p.pos}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                  {inj.length===0&&!injLoading&&<div style={{fontSize:10,color:C.ok}}>✓ No injuries reported</div>}
                  {!d.info&&<div style={{color:C.t3,fontSize:11}}>Details not available yet</div>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const r1Series=SERIES.filter(s=>s.r==="r1");
  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6,flexWrap:"wrap",gap:8}}>
        <div>
          <h2 style={{margin:"0 0 3px",fontWeight:900,fontFamily:"Georgia,serif",fontSize:22}}>Playoff Matchups</h2>
          <p style={{margin:0,color:C.t3,fontSize:12}}>Tap ▼ for team details, scouting report & live injury status</p>
        </div>
        <button onClick={loadInjuries} disabled={injLoading} style={{...btn.g,fontSize:12}}>
          {injLoading?"⏳ Loading…":"🔄 Refresh Injuries"}
        </button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:20}}>
        <div>
          <div style={{fontSize:10,fontWeight:800,color:"#60a5fa",textTransform:"uppercase",letterSpacing:"2px",marginBottom:10,paddingBottom:5,borderBottom:`1px solid ${C.bdL}`}}>Eastern Conference</div>
          {r1Series.filter(s=>s.conf==="E").map(s=><MatchupCard key={s.id} s={s}/>)}
        </div>
        <div>
          <div style={{fontSize:10,fontWeight:800,color:C.acc,textTransform:"uppercase",letterSpacing:"2px",marginBottom:10,paddingBottom:5,borderBottom:`1px solid ${C.bdL}`}}>Western Conference</div>
          {r1Series.filter(s=>s.conf==="W").map(s=><MatchupCard key={s.id} s={s}/>)}
        </div>
      </div>
    </div>
  );
}

// ─── RULES ───────────────────────────────────────────────────────────────────
function Rules(){
  return(
    <div>
      <h2 style={{margin:"0 0 6px",fontWeight:900,fontFamily:"Georgia,serif",fontSize:22}}>Scoring Rules</h2>
      <p style={{margin:"0 0 20px",color:C.t3,fontSize:13}}>The more precise your prediction, the more points you earn.</p>
      <div style={{background:"rgba(249,115,22,.08)",border:"1px solid rgba(249,115,22,.25)",borderRadius:13,padding:16,marginBottom:12}}>
        <div style={{fontWeight:900,fontSize:14,marginBottom:8}}>⚡ Play-In Tournament</div>
        <div style={{display:"flex",gap:16,fontSize:13}}><span>✓ Correct: <strong style={{color:C.ok}}>+3 pts</strong></span><span>✗ Wrong: <strong style={{color:C.er}}>+1 pt</strong></span></div>
        <div style={{fontSize:11,color:C.t3,marginTop:6}}>Just pick the winner — no game count needed.</div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))",gap:9,marginBottom:12}}>
        {ROUNDS.map(({k,l,pts})=>(
          <div key={k} style={{background:C.bg2,border:`1px solid ${C.bdL}`,borderRadius:13,padding:16}}>
            <div style={{fontWeight:900,fontSize:13,marginBottom:10}}>{l}</div>
            {[["🎯","Exact score",pts.exact,C.ok],["✅","Right winner",pts.correct,C.wn],["❌","Wrong",pts.wrong,C.er]].map(([ic,lb,pt,cl])=>(
              <div key={lb} style={{display:"flex",alignItems:"center",gap:7,marginBottom:6}}><span>{ic}</span><span style={{flex:1,color:C.t2,fontSize:12}}>{lb}</span><span style={{color:cl,fontWeight:900,fontSize:15}}>+{pt}</span></div>
            ))}
          </div>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginBottom:20}}>
        <div style={{background:"rgba(249,115,22,.07)",border:"1px solid rgba(249,115,22,.3)",borderRadius:13,padding:16}}>
          <div style={{fontWeight:900,fontSize:14,marginBottom:4}}>🏆 Champion Pick</div>
          <div style={{color:C.t3,fontSize:11,marginBottom:8}}>All 30 teams</div>
          <div style={{display:"flex",justifyContent:"space-between"}}><span style={{color:C.t2,fontSize:13}}>Correct</span><span style={{color:C.acc,fontWeight:900,fontSize:18}}>+10</span></div>
        </div>
        <div style={{background:"rgba(56,189,248,.07)",border:"1px solid rgba(56,189,248,.3)",borderRadius:13,padding:16}}>
          <div style={{fontWeight:900,fontSize:14,marginBottom:4}}>⭐ Finals MVP</div>
          <div style={{color:C.t3,fontSize:11,marginBottom:8}}>Pick the MVP</div>
          <div style={{display:"flex",justifyContent:"space-between"}}><span style={{color:C.t2,fontSize:13}}>Correct</span><span style={{color:C.ai,fontWeight:900,fontSize:18}}>+8</span></div>
        </div>
      </div>
      <div style={{background:C.bg2,border:`1px solid ${C.bd}`,borderRadius:12,overflow:"hidden"}}>
        <div style={{padding:"10px 14px",borderBottom:`1px solid ${C.bd}`,fontWeight:800,fontSize:13}}>Quick Reference</div>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead><tr style={{borderBottom:`1px solid ${C.bd}`}}>
              <th style={{padding:"8px 12px",textAlign:"left",color:C.t3}}>Stage</th>
              <th style={{padding:"8px 12px",textAlign:"center",color:C.ok}}>🎯 Exact</th>
              <th style={{padding:"8px 12px",textAlign:"center",color:C.wn}}>✅ Winner</th>
              <th style={{padding:"8px 12px",textAlign:"center",color:C.er}}>❌ Wrong</th>
            </tr></thead>
            <tbody>
              <tr style={{borderBottom:`1px solid ${C.bd}`}}><td style={{padding:"8px 12px",fontWeight:600}}>⚡ Play-In</td><td style={{padding:"8px 12px",textAlign:"center",color:C.ok,fontWeight:800}}>3</td><td style={{padding:"8px 12px",textAlign:"center",color:C.t3}}>—</td><td style={{padding:"8px 12px",textAlign:"center",color:C.er,fontWeight:800}}>1</td></tr>
              {ROUNDS.map(({k,l,pts})=><tr key={k} style={{borderBottom:`1px solid ${C.bd}`}}><td style={{padding:"8px 12px",fontWeight:600}}>{l}</td><td style={{padding:"8px 12px",textAlign:"center",color:C.ok,fontWeight:800}}>{pts.exact}</td><td style={{padding:"8px 12px",textAlign:"center",color:C.wn,fontWeight:800}}>{pts.correct}</td><td style={{padding:"8px 12px",textAlign:"center",color:C.er,fontWeight:800}}>{pts.wrong}</td></tr>)}
              <tr style={{borderBottom:`1px solid ${C.bd}`}}><td style={{padding:"8px 12px",fontWeight:600}}>🏆 Champion</td><td style={{padding:"8px 12px",textAlign:"center",color:C.acc,fontWeight:800}}>10</td><td colSpan={2} style={{padding:"8px 12px",textAlign:"center",color:C.t3}}>—</td></tr>
              <tr><td style={{padding:"8px 12px",fontWeight:600}}>⭐ Finals MVP</td><td style={{padding:"8px 12px",textAlign:"center",color:C.ai,fontWeight:800}}>8</td><td colSpan={2} style={{padding:"8px 12px",textAlign:"center",color:C.t3}}>—</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── PRIZES ──────────────────────────────────────────────────────────────────
function Prizes({cfg}){
  const ps=[{r:1,m:"🥇",t:"Champion",c:C.gold},{r:2,m:"🥈",t:"Runner-Up",c:C.silver},{r:3,m:"🥉",t:"Third Place",c:C.bronze}];
  return(
    <div>
      <div style={{textAlign:"center",marginBottom:28}}><div style={{fontSize:44,marginBottom:8}}>🏆</div><h2 style={{margin:"0 0 4px",fontWeight:900,fontFamily:"Georgia,serif",fontSize:26}}>Prizes</h2><p style={{margin:0,color:C.t3,fontSize:13}}>Top 3 finishers take home the glory.</p></div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:14,marginBottom:28}}>
        {ps.map(p=><div key={p.r} style={{background:`${p.c}10`,border:`1px solid ${p.c}44`,borderRadius:18,padding:22,textAlign:"center"}}>
          <div style={{fontSize:44,marginBottom:8}}>{p.m}</div>
          <div style={{fontWeight:900,fontSize:20,color:p.c,marginBottom:4}}>{p.t}</div>
          <div style={{fontSize:11,color:C.t3,marginBottom:14}}>#{p.r} place</div>
          <div style={{background:C.bg1,border:`1px solid ${p.c}44`,borderRadius:10,padding:"12px 14px"}}><div style={{fontSize:9,color:C.t3,textTransform:"uppercase",letterSpacing:"1px",marginBottom:3}}>Prize</div><div style={{fontWeight:800,fontSize:16,color:p.c}}>{cfg.prizes?.[`p${p.r}`]||"TBD by Admin"}</div></div>
        </div>)}
      </div>
      <div style={{background:C.bg2,border:`1px solid ${C.bdL}`,borderRadius:14,padding:18}}>
        <div style={{fontWeight:800,fontSize:14,marginBottom:10}}>💡 Tips to Win</div>
        {["🎯 Exact series scores are worth double — always pick a game count","⚡ Never skip Play-In picks — easy 3 pts","🏆 Champion bonus (+10) can flip entire standings at the end","⭐ Finals MVP (+8) is usually the best player on the winning team","📅 Later rounds pay more — stay engaged all the way","🤖 Claude AI is competing too — can you outsmart it?"].map(t=><div key={t} style={{background:C.bg3,borderRadius:7,padding:"7px 11px",marginBottom:5,fontSize:12,color:C.t2}}>{t}</div>)}
      </div>
    </div>
  );
}

// ─── BOARD ───────────────────────────────────────────────────────────────────
function Board({scores,myId,cfg}){
  const rev=cfg.rPo||cfg.rPi;
  const [gold,silver,bronze]=scores;
  const podium=[silver,gold,bronze].filter(Boolean);
  const podiumH=[140,190,110];
  const podiumRanks=[2,1,3];
  const medalEmoji=["🥇","🥈","🥉"];
  const medalC=[C.gold,C.silver,C.bronze];
  const rPts=(u,r)=>SERIES.filter(s=>s.r===r).reduce((sum,s)=>sum+(u.bd?.[s.id]?.p||0),0);
  const piPts=(u)=>PLAYIN.reduce((sum,m)=>sum+(u.bd?.[m.id]?.p||0),0);
  return(
    <div>
      {!rev&&<div style={{background:C.bg2,border:`1px solid ${C.bdL}`,borderRadius:10,padding:"12px 16px",marginBottom:20,textAlign:"center",color:C.t3,fontSize:13}}>🔒 Scores reveal when admin opens the playoffs</div>}
      {scores.length>=2&&rev&&<div style={{marginBottom:28}}>
        <div style={{fontSize:10,fontWeight:800,color:C.t3,textTransform:"uppercase",letterSpacing:"2px",marginBottom:16,textAlign:"center"}}>🏆 Podium</div>
        <div style={{display:"flex",alignItems:"flex-end",justifyContent:"center",gap:8}}>
          {podium.map((s,vi)=>{
            const rr=podiumRanks[vi]; const col=medalC[rr-1];
            return <div key={s.id} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:5}}>
              <Avatar user={s} size={vi===1?52:40} idx={scores.indexOf(s)}/>
              <div style={{fontSize:vi===1?32:24}}>{medalEmoji[rr-1]}</div>
              <div style={{fontSize:10,fontWeight:800,color:col,textAlign:"center",maxWidth:80,lineHeight:1.2}}>{s.name}{s.id===myId?" (you)":""}</div>
              <div style={{fontSize:vi===1?18:14,fontWeight:900,color:col}}>{s.total}</div>
              <div style={{width:vi===1?88:70,height:podiumH[vi],background:`linear-gradient(to top,${col}28,${col}0a)`,border:`2px solid ${col}44`,borderRadius:"8px 8px 0 0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,color:col}}>{rr}</div>
            </div>;
          })}
        </div>
      </div>}
      <div style={{display:"flex",flexDirection:"column",gap:7}}>
        {scores.map((s,i)=>{
          const isMe=s.id===myId, isTop=i<3;
          const col=s.isAI?C.ai:PC[i%PC.length];
          const mCol=isTop?medalC[i]:null;
          return <div key={s.id} style={{background:isMe?"rgba(249,115,22,.07)":isTop?`${mCol}08`:C.bg2,border:`1px solid ${isMe?C.acc:isTop?mCol+"44":C.bdL}`,borderLeft:`4px solid ${isTop?mCol:col}`,borderRadius:11,padding:"11px 14px",display:"flex",alignItems:"center",gap:11,flexWrap:"wrap",boxShadow:isTop?`0 0 20px ${mCol}15`:"none"}}>
            <div style={{fontSize:isTop?18:14,minWidth:28,textAlign:"center",fontWeight:900}}>{isTop?medalEmoji[i]:`#${i+1}`}</div>
            <Avatar user={s} size={34} idx={i}/>
            <div style={{flex:1,minWidth:80}}>
              <div style={{fontWeight:800,fontSize:14,color:s.isAI?C.ai:isMe?C.acc:isTop?mCol:C.t1}}>{s.name}{isMe?" (you)":""}</div>
              {rev&&<div style={{display:"flex",gap:4,marginTop:4,flexWrap:"wrap"}}>
                <MiniPt l="⚡" v={piPts(s)}/>
                {ROUNDS.map(r=><MiniPt key={r.k} l={r.s} v={rPts(s,r.k)}/>)}
                <MiniPt l="🏆" v={s.bd?.champ?.p||0} gold/>
                <MiniPt l="⭐" v={s.bd?.mvp?.p||0} ai/>
              </div>}
            </div>
            <div style={{fontSize:isTop?24:18,fontWeight:900,color:isTop?mCol:col}}>{rev?s.total:"—"}</div>
          </div>;
        })}
      </div>
    </div>
  );
}
function MiniPt({l,v,gold,ai}){
  const c=gold?C.gold:ai?C.ai:C.t2;
  return <div style={{background:gold?`${C.gold}10`:ai?`${C.ai}10`:C.bg3,border:`1px solid ${gold?C.gold+"30":ai?C.ai+"30":C.bd}`,borderRadius:5,padding:"2px 6px",textAlign:"center"}}>
    <div style={{fontSize:8,color:C.t3,letterSpacing:"0.5px"}}>{l}</div>
    <div style={{fontSize:11,fontWeight:700,color:c}}>{v}</div>
  </div>;
}

// ─── PROFILE ─────────────────────────────────────────────────────────────────
function Profile({me,onSavePhoto}){
  const ref=useRef();
  const [preview,setPreview]=useState(me.photo||null);
  const [saved,setSaved]=useState(false);
  const handleFile=(e)=>{
    const f=e.target.files?.[0]; if(!f) return;
    const r=new FileReader();
    r.onload=ev=>{setPreview(ev.target.result);setSaved(false);};
    r.readAsDataURL(f);
  };
  return(
    <div style={{maxWidth:380,margin:"0 auto"}}>
      <h2 style={{margin:"0 0 6px",fontWeight:900,fontFamily:"Georgia,serif",fontSize:22}}>My Profile</h2>
      <p style={{margin:"0 0 24px",color:C.t3,fontSize:13}}>Your photo appears next to your name on the leaderboard.</p>
      <div style={{background:C.bg2,border:`1px solid ${C.bdL}`,borderRadius:18,padding:28,textAlign:"center"}}>
        <div style={{marginBottom:18,display:"flex",justifyContent:"center"}}>
          {preview?<img src={preview} width={96} height={96} style={{borderRadius:"50%",objectFit:"cover",border:`3px solid ${C.acc}`}} alt="avatar"/>:<Avatar user={me} size={96}/>}
        </div>
        <div style={{fontWeight:800,fontSize:17,marginBottom:2}}>{me.name}</div>
        <div style={{color:C.t3,fontSize:12,marginBottom:22}}>{me.email}</div>
        <input ref={ref} type="file" accept="image/*" style={{display:"none"}} onChange={handleFile}/>
        <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}>
          <button onClick={()=>ref.current?.click()} style={btn.p}>📷 {preview?"Change Photo":"Upload Photo"}</button>
          {preview&&<button onClick={()=>{setPreview(null);onSavePhoto(me.id,null);}} style={{...btn.g,color:C.er,borderColor:C.er+"44"}}>Remove</button>}
        </div>
        {preview&&!saved&&<button onClick={()=>{onSavePhoto(me.id,preview);setSaved(true);}} style={{...btn.s,width:"100%",marginTop:14}}>Save Photo</button>}
        {saved&&<div style={{color:C.ok,fontWeight:700,marginTop:14}}>✓ Photo saved!</div>}
      </div>
    </div>
  );
}

// ─── ALL PICKS ────────────────────────────────────────────────────────────────
function AllPicks({all,res,cfg}){
  const [view,setView]=useState(cfg.rPiPicks?"playin":cfg.rPo?"playoff":"playin");
  const [rnd,setRnd]=useState("r1");
  return(
    <div>
      <h2 style={{margin:"0 0 6px",fontWeight:900,fontFamily:"Georgia,serif",fontSize:22}}>All Predictions</h2>
      <p style={{margin:"0 0 16px",color:C.t3,fontSize:13}}>Revealed now that playoffs have started!</p>
      <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>
        {cfg.rPiPicks&&<button onClick={()=>setView("playin")} style={view==="playin"?btn.a:btn.g}>⚡ Play-In</button>}
        {cfg.rPo&&<button onClick={()=>setView("playoff")} style={view==="playoff"?btn.a:btn.g}>🏀 Playoffs</button>}
      </div>
      {view==="playin"&&PLAYIN.filter(m=>m.teams[0]&&m.teams[1]).map(m=>{
        const real=res.pi?.[m.id];
        return <div key={m.id} style={{background:C.bg2,border:`1px solid ${C.bdL}`,borderRadius:11,marginBottom:9,overflow:"hidden"}}>
          <div style={{background:C.bg3,padding:"9px 13px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:6}}>
            <div style={{fontWeight:700,fontSize:13}}>{m.label} <span style={{fontSize:10,color:C.t3}}>({m.conf})</span></div>
            {real?.w?<span style={{color:C.ok,fontWeight:700,fontSize:11}}>✓ {T[real.w]?.n||real.w}</span>:<span style={{color:C.t3,fontSize:11}}>Not played</span>}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(120px,1fr))",gap:7,padding:9}}>
            {all.map((u,pi)=>{
              const picks=u.isAI?u.pi:u.pi||{}; const pred=picks[m.id];
              const ok=real&&pred?.w&&pred.w===real.w; const ko=real&&pred?.w&&pred.w!==real.w;
              const bg=!real||!pred?.w?BG.pending:ok?BG.exact:BG.wrong;
              return <div key={u.id} style={{background:bg.bg,border:`1px solid ${bg.c}`,borderRadius:9,padding:"8px 10px"}}>
                <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:3}}><Avatar user={u} size={18} idx={pi}/><div style={{fontSize:10,fontWeight:800,color:pcol(u,pi)}}>{u.name}</div></div>
                <div style={{fontSize:11,color:C.t2,marginBottom:2}}>{pred?.w?(T[pred.w]?.n||pred.w):<span style={{color:C.t3}}>—</span>}</div>
                <div style={{fontWeight:900,fontSize:13,color:bg.c}}>{!real||!pred?.w?"—":ok?"+3":"+1"}</div>
              </div>;
            })}
          </div>
        </div>;
      })}
      {view==="playoff"&&<div>
        <div style={{display:"flex",gap:5,marginBottom:14,flexWrap:"wrap"}}>
          {ROUNDS.map(r=><button key={r.k} onClick={()=>setRnd(r.k)} style={rnd===r.k?btn.a:btn.g}>{r.l}</button>)}
        </div>
        {SERIES.filter(s=>s.r===rnd).map(s=>{
          const real=res.po?.[s.id]; const rpts=ROUNDS.find(r=>r.k===s.r).pts;
          return <div key={s.id} style={{background:C.bg2,border:`1px solid ${C.bdL}`,borderRadius:11,marginBottom:9,overflow:"hidden"}}>
            <div style={{background:C.bg3,padding:"9px 13px",display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
              <Logo abbr={s.t1} size={24}/><span style={{fontWeight:700,fontSize:13,flex:1}}>{sn(s.t1)} vs {sn(s.t2)}</span><Logo abbr={s.t2} size={24}/>
              {real?.w?<span style={{color:C.ok,fontWeight:700,fontSize:11}}>✓ {sn(real.w)} in {real.g}</span>:<span style={{color:C.t3,fontSize:11}}>Not played</span>}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:7,padding:9}}>
              {all.map((u,pi)=>{
                const preds=u.isAI?u.po:u.po||{}; const pred=preds[s.id];
                const sc=scoreS(pred,real,rpts); const bg=BG[sc.t];
                return <div key={u.id} style={{background:bg.bg,border:`1px solid ${bg.c}`,borderRadius:9,padding:"8px 10px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:3}}><Avatar user={u} size={18} idx={pi}/><div style={{fontSize:10,fontWeight:800,color:pcol(u,pi)}}>{u.name}</div></div>
                  <div style={{fontSize:11,color:C.t2,marginBottom:2}}>{pred?.w?<><strong>{sn(pred.w)}</strong> in {pred.g}</>:<span style={{color:C.t3}}>—</span>}</div>
                  <div style={{fontWeight:900,fontSize:13,color:bg.c}}>{sc.t==="pending"?"—":`+${sc.p}`}</div>
                </div>;
              })}
            </div>
          </div>;
        })}
      </div>}
    </div>
  );
}

// ─── GAMES / SCHEDULE ────────────────────────────────────────────────────────
// Sport5 broadcasts all NBA playoff games in Israel. Helper: Israel time (Asia/Jerusalem = UTC+2 winter / UTC+3 summer)
const ilTime=dt=>new Date(dt).toLocaleTimeString('en',{timeZone:'Asia/Jerusalem',hour:'2-digit',minute:'2-digit',hour12:false});
const ilDate=dt=>new Date(dt).toLocaleDateString('he-IL',{timeZone:'Asia/Jerusalem',weekday:'short',day:'numeric',month:'numeric'});

function Games(){
  const [events,setEvents]=useState([]);
  const [loading,setLoading]=useState(true);
  const [tick,setTick]=useState(0);
  const [subTab,setSubTab]=useState("schedule");// "schedule" | "results"
  useEffect(()=>{
    setLoading(true);
    fetchPlayoffGames().then(evts=>{setEvents(evts);setLoading(false);});
  },[tick]);

  // Keep only Play-In + Playoff games: use date >= April 14 (reliable, avoids season-type guessing)
  const playoffEvents=events.filter(ev=>new Date(ev.date)>=PLAYOFF_START);
  const sorted=[...playoffEvents].sort((a,b)=>new Date(a.date)-new Date(b.date));
  const past=[...sorted].filter(e=>e.competitions?.[0]?.status?.type?.completed).reverse();
  const upcoming=sorted.filter(e=>!e.competitions?.[0]?.status?.type?.completed);

  const dayKey=dt=>dt.toLocaleDateString('en-US',{weekday:'long',month:'short',day:'numeric'});
  const isToday=dt=>{const t=new Date();return dt.toDateString()===t.toDateString();};
  const isTomorrow=dt=>{const t=new Date();t.setDate(t.getDate()+1);return dt.toDateString()===t.toDateString();};
  const dayLabel=dt=>isToday(dt)?"Today 🔥":isTomorrow(dt)?"Tomorrow":dayKey(dt);

  const grouped=upcoming.reduce((acc,ev)=>{
    const dt=new Date(ev.date);const label=dayLabel(dt);
    if(!acc[label])acc[label]=[];acc[label].push(ev);return acc;
  },{});

  const GCard=({ev})=>{
    const comp=ev.competitions?.[0];if(!comp)return null;
    const cs=comp.competitors||[];
    const away=cs.find(c=>c.homeAway==="away")||cs[0];
    const home=cs.find(c=>c.homeAway==="home")||cs[1];
    if(!away||!home)return null;
    const done=comp.status?.type?.completed;
    const live=!done&&comp.status?.type?.id!=="1";
    const dt=new Date(ev.date);
    const series=comp.series?.summary;
    const ilT=ilTime(ev.date);
    const ilD=ilDate(ev.date);
    const [showStats,setShowStats]=useState(false);
    const [stats,setStats]=useState(null);
    const [statsLoading,setStatsLoading]=useState(false);
    const toggleStats=()=>{
      if(!showStats&&!stats){
        setStatsLoading(true);
        fetchGameStats(ev.id).then(s=>{setStats(s);setStatsLoading(false);});
      }
      setShowStats(p=>!p);
    };
    return(
      <div style={{background:C.bg2,border:`1px solid ${live?C.er+"55":C.bdL}`,borderRadius:13,overflow:"hidden",boxShadow:live?"0 0 14px rgba(248,113,113,.15)":"none"}}>
        {/* Top info bar */}
        <div style={{background:C.bg3,borderBottom:`1px solid ${C.bdL}`,padding:"5px 12px",fontSize:10,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:4}}>
          <span style={{color:C.t2,fontWeight:700}}>{series?"🏀 "+series:"🏀 Playoff"}</span>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            {!done&&!live&&<span style={{color:C.acc,fontWeight:800,fontSize:11}}>{ilT} 🇮🇱 <span style={{color:C.t3,fontWeight:600,fontSize:9}}>{ilD}</span></span>}
            {live&&<span style={{color:C.er,fontWeight:800,fontSize:10}}>🔴 LIVE · {comp.status?.displayClock}</span>}
            {done&&<span style={{color:C.ok,fontWeight:700}}>✓ FINAL</span>}
          </div>
        </div>
        <div style={{padding:"10px 14px",display:"flex",alignItems:"center",gap:10}}>
          {/* Away */}
          <div style={{flex:1,display:"flex",alignItems:"center",gap:8}}>
            <Logo abbr={away.team?.abbreviation} size={34}/>
            <div style={{flex:1}}>
              <div style={{fontWeight:done&&away.winner?900:600,color:done&&away.winner?C.t1:C.t2,fontSize:13}}>{away.team?.displayName||away.team?.abbreviation}</div>
              <div style={{fontSize:10,color:C.t3}}>Away</div>
            </div>
            {(done||live)&&<div style={{fontSize:22,fontWeight:900,color:away.winner?C.ok:C.t2,minWidth:28,textAlign:"right"}}>{away.score}</div>}
          </div>
          {/* Center */}
          <div style={{textAlign:"center",padding:"0 6px",color:C.t3,minWidth:32}}>
            {!done&&!live&&<div>
              <div style={{fontSize:10,fontWeight:800,color:C.t2}}>{dt.toLocaleDateString('en',{month:'short',day:'numeric'})}</div>
              <div style={{fontSize:10,color:C.t3,marginTop:1}}>vs</div>
            </div>}
            {live&&<div style={{color:C.er,fontWeight:900,fontSize:11}}>LIVE</div>}
            {done&&<div style={{color:C.t3,fontSize:13}}>—</div>}
          </div>
          {/* Home */}
          <div style={{flex:1,display:"flex",alignItems:"center",gap:8,flexDirection:"row-reverse"}}>
            <Logo abbr={home.team?.abbreviation} size={34}/>
            <div style={{flex:1,textAlign:"right"}}>
              <div style={{fontWeight:done&&home.winner?900:600,color:done&&home.winner?C.t1:C.t2,fontSize:13}}>{home.team?.displayName||home.team?.abbreviation}</div>
              <div style={{fontSize:10,color:C.t3}}>Home</div>
            </div>
            {(done||live)&&<div style={{fontSize:22,fontWeight:900,color:home.winner?C.ok:C.t2,minWidth:28,textAlign:"left"}}>{home.score}</div>}
          </div>
        </div>
        {/* Stats toggle for completed games */}
        {done&&(
          <div>
            <button onClick={toggleStats} style={{width:"100%",background:"transparent",border:"none",borderTop:`1px solid ${C.bdL}`,padding:"6px",color:C.t3,fontSize:10,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
              📊 {showStats?"Hide Stats":"Show Stats"} {statsLoading?"⏳":""}
            </button>
            {showStats&&(
              <div style={{borderTop:`1px solid ${C.bdL}`,padding:"10px 14px",background:C.bg3}}>
                {statsLoading&&<div style={{textAlign:"center",color:C.t3,fontSize:11,padding:8}}>Loading stats…</div>}
                {!statsLoading&&stats&&(
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                    {[away,home].map((side,si)=>{
                      const abbr=side.team?.abbreviation;
                      const tl=stats.leaders?.find(l=>l.teamAbbr===abbr);
                      const ts=stats.teams?.find(t=>t.teamAbbr===abbr);
                      const fg=ts?.stats?.fieldGoalPct||ts?.stats?.fieldGoalsAttempted;
                      const threePct=ts?.stats?.threePointFieldGoalPct;
                      const reb=ts?.stats?.totalRebounds||ts?.stats?.rebounds;
                      const ast=ts?.stats?.assists;
                      const tov=ts?.stats?.turnovers;
                      return(
                        <div key={abbr} style={{textAlign:si===1?"right":"left"}}>
                          <div style={{fontWeight:800,fontSize:11,color:C.t2,marginBottom:5,display:"flex",alignItems:"center",gap:4,flexDirection:si===1?"row-reverse":"row"}}>
                            <Logo abbr={abbr} size={14}/>{T[abbr]?.a||abbr}
                          </div>
                          {tl?.pts&&<div style={{fontSize:11,color:C.t1,marginBottom:2}}>🏀 <b>{tl.pts.displayValue}</b> — {tl.pts.athlete?.displayName?.split(' ').pop()||"pts"}</div>}
                          {tl?.reb&&<div style={{fontSize:10,color:C.t2,marginBottom:2}}>🔄 <b>{tl.reb.displayValue}</b> REB — {tl.reb.athlete?.displayName?.split(' ').pop()||""}</div>}
                          {tl?.ast&&<div style={{fontSize:10,color:C.t2,marginBottom:4}}>🎯 <b>{tl.ast.displayValue}</b> AST — {tl.ast.athlete?.displayName?.split(' ').pop()||""}</div>}
                          <div style={{fontSize:9,color:C.t3,display:"flex",gap:8,flexWrap:"wrap",flexDirection:si===1?"row-reverse":"row"}}>
                            {fg&&<span>FG {fg}</span>}
                            {threePct&&<span>3P {threePct}</span>}
                            {reb&&<span>{reb} REB</span>}
                            {ast&&<span>{ast} AST</span>}
                            {tov&&<span>{tov} TOV</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {!statsLoading&&!stats&&<div style={{textAlign:"center",color:C.t3,fontSize:11}}>Stats unavailable for this game.</div>}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const tabSt=(k)=>({
    padding:"7px 16px",borderRadius:20,fontWeight:700,fontSize:12,cursor:"pointer",border:"none",
    background:subTab===k?C.acc:"transparent",color:subTab===k?"#fff":C.t2,transition:"all .15s"
  });

  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8,flexWrap:"wrap",gap:8}}>
        <div>
          <h2 style={{margin:"0 0 2px",fontWeight:900,fontFamily:"Georgia,serif",fontSize:22}}>Playoff Schedule</h2>
          <p style={{margin:0,color:C.t3,fontSize:12}}>Live scores via ESPN · Game times shown in 🇮🇱 Israeli time</p>
        </div>
        <button onClick={()=>setTick(t=>t+1)} style={btn.g} disabled={loading}>{loading?"⏳ Loading…":"🔄 Refresh"}</button>
      </div>
      {/* Sport5 broadcast note */}
      <a href="https://www.sport5.co.il/" target="_blank" rel="noreferrer"
        style={{display:"inline-flex",alignItems:"center",gap:6,background:"#0f2040",border:"1px solid #2563eb44",borderRadius:8,padding:"5px 12px",fontSize:11,color:"#93c5fd",fontWeight:700,textDecoration:"none",marginBottom:14}}>
        📺 Check sport5.co.il for broadcast channels & times
        <span style={{fontSize:9,color:"#60a5fa",opacity:.8}}>↗</span>
      </a>

      {/* Sub-tabs */}
      <div style={{display:"flex",gap:4,background:C.bg2,borderRadius:22,padding:3,marginBottom:18,width:"fit-content"}}>
        <button style={tabSt("schedule")} onClick={()=>setSubTab("schedule")}>📅 Schedule {upcoming.length>0?`(${upcoming.length})`:""}</button>
        <button style={tabSt("results")} onClick={()=>setSubTab("results")}>📋 Results {past.length>0?`(${past.length})`:""}</button>
      </div>

      {loading&&<div style={{textAlign:"center",color:C.t3,padding:40}}>🏀 Loading schedule…</div>}

      {/* ── Schedule tab ── */}
      {!loading&&subTab==="schedule"&&(
        <>
          {Object.keys(grouped).length>0?(
            <div>
              {Object.entries(grouped).map(([day,evs])=>(
                <div key={day} style={{marginBottom:20}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                    <div style={{fontSize:12,fontWeight:900,color:day.startsWith("Today")?"#f97316":day.startsWith("Tomorrow")?"#fbbf24":C.t2}}>{day}</div>
                    <div style={{flex:1,height:1,background:C.bdL}}/>
                    <div style={{fontSize:10,color:C.t3,fontWeight:700}}>{evs.length} game{evs.length>1?"s":""}</div>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {evs.map(ev=><GCard key={ev.id} ev={ev}/>)}
                  </div>
                </div>
              ))}
            </div>
          ):(
            <div style={{textAlign:"center",color:C.t3,padding:40,background:C.bg2,borderRadius:14}}>
              <div style={{fontSize:36,marginBottom:8}}>📅</div>
              <div>No upcoming games found. Check back soon or hit Refresh.</div>
            </div>
          )}
        </>
      )}

      {/* ── Results tab ── */}
      {!loading&&subTab==="results"&&(
        <>
          {past.length>0?(
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {past.slice(0,30).map(ev=><GCard key={ev.id} ev={ev}/>)}
            </div>
          ):(
            <div style={{textAlign:"center",color:C.t3,padding:40,background:C.bg2,borderRadius:14}}>
              <div style={{fontSize:36,marginBottom:8}}>📋</div>
              <div>No completed games yet. Results will appear here after games finish.</div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── NBA SYNC (admin) ─────────────────────────────────────────────────────────
function NBASync({res,setPoR,setPiR}){
  const [events,setEvents]=useState([]);
  const [loading,setLoading]=useState(false);
  const [applied,setApplied]=useState({});
  const load=()=>{setLoading(true);fetchPlayoffGames().then(evts=>{setEvents(evts);setLoading(false);});};
  useEffect(()=>{load();},[]);

  // All completed playoff/play-in games (date-based filter)
  const completedEvts=events.filter(e=>e.competitions?.[0]?.status?.type?.completed&&new Date(e.date)>=PLAYOFF_START);

  // Helper: find ESPN event by two team abbreviations
  const findGame=(t1,t2)=>completedEvts.find(ev=>{
    const cs=ev.competitions?.[0]?.competitors||[];
    const abbrs=cs.map(c=>c.team?.abbreviation);
    return abbrs.includes(t1)&&abbrs.includes(t2);
  });
  const gameWinner=(ev)=>{
    if(!ev)return null;
    const cs=ev.competitions?.[0]?.competitors||[];
    return cs.find(c=>c.winner)?.team?.abbreviation||null;
  };

  // ── PLAY-IN matches ──────────────────────────────────────────────────────
  const piMatches=PLAYIN.filter(m=>m.teams[0]&&m.teams[1]&&T[m.teams[0]]&&T[m.teams[1]]).map(m=>{
    const ev=findGame(m.teams[0],m.teams[1]);
    return {m,ev,winner:gameWinner(ev)};
  });

  // ── PLAYOFF SERIES matches ───────────────────────────────────────────────
  // Build series win map
  const seriesMap={};
  completedEvts.forEach(ev=>{
    const comp=ev.competitions?.[0];
    const cs=comp.competitors||[];if(cs.length<2)return;
    const [c1,c2]=cs;
    const key=[c1.team?.abbreviation,c2.team?.abbreviation].sort().join('|');
    if(!seriesMap[key])seriesMap[key]={wins:{},total:0};
    seriesMap[key].total++;
    if(c1.winner)seriesMap[key].wins[c1.team.abbreviation]=(seriesMap[key].wins[c1.team.abbreviation]||0)+1;
    if(c2.winner)seriesMap[key].wins[c2.team.abbreviation]=(seriesMap[key].wins[c2.team.abbreviation]||0)+1;
  });
  const poMatches=SERIES.map(s=>{
    const t1=T[s.t1]?s.t1:null,t2=T[s.t2]?s.t2:null;
    if(!t1||!t2)return null;
    const key=[t1,t2].sort().join('|');
    const data=seriesMap[key];
    return data?{s,data}:null;
  }).filter(Boolean);

  const totalFound=piMatches.filter(p=>p.ev).length+poMatches.length;

  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:8}}>
        <div>
          <div style={{fontWeight:900,fontSize:16}}>🔄 NBA Auto-Sync</div>
          <div style={{color:C.t3,fontSize:12,marginTop:2}}>Fetch real results and apply with one click. Covers Play-In + Playoffs.</div>
        </div>
        <button onClick={load} style={loading?btn.g:btn.p} disabled={loading}>{loading?"⏳ Loading…":"🔄 Refresh from NBA"}</button>
      </div>

      {!loading&&totalFound===0&&(
        <div style={{background:C.bg2,border:`1px solid ${C.bdL}`,borderRadius:12,padding:20,textAlign:"center",color:C.t3}}>
          No completed games found yet. Click Refresh after games finish.
        </div>
      )}

      {/* ── PLAY-IN section ── */}
      {piMatches.some(p=>p.ev)&&(
        <div style={{marginBottom:20}}>
          <div style={{fontSize:10,fontWeight:800,color:C.acc,textTransform:"uppercase",letterSpacing:"1.5px",marginBottom:8}}>⚡ Play-In Results</div>
          <div style={{display:"flex",flexDirection:"column",gap:7}}>
            {piMatches.filter(p=>p.ev).map(({m,winner})=>{
              const current=res.pi?.[m.id];
              const isApplied=applied[m.id]||current?.w===winner;
              return(
                <div key={m.id} style={{background:C.bg2,border:`1px solid ${winner?C.ok+"44":C.bdL}`,borderRadius:11,padding:"11px 14px",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
                  <Logo abbr={m.teams[0]} size={24}/>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700,fontSize:13}}>{m.label}</div>
                    <div style={{fontSize:11,color:C.t3,marginTop:1}}>{m.desc}
                      {current?.w&&<span style={{color:C.ok,marginLeft:8}}>· App: {T[current.w]?.a}</span>}
                    </div>
                  </div>
                  <Logo abbr={m.teams[1]} size={24}/>
                  {winner?(
                    <button onClick={()=>{setPiR(m.id,winner);setApplied(p=>({...p,[m.id]:true}));}}
                      style={{...isApplied?btn.g:btn.s,fontSize:11,padding:"6px 12px"}} disabled={isApplied}>
                      {isApplied?`✓ ${T[winner]?.a} wins`:`Apply: ${T[winner]?.a} wins`}
                    </button>
                  ):(
                    <span style={{background:C.bg3,borderRadius:7,padding:"4px 9px",fontSize:11,color:C.t3}}>Not finished</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── PLAYOFFS section ── */}
      {poMatches.length>0&&(
        <div>
          <div style={{fontSize:10,fontWeight:800,color:C.t3,textTransform:"uppercase",letterSpacing:"1.5px",marginBottom:8}}>🏀 Playoff Series</div>
          <div style={{display:"flex",flexDirection:"column",gap:7}}>
            {poMatches.map(({s,data})=>{
              const wins=data.wins;
              const w1=wins[s.t1]||0,w2=wins[s.t2]||0;
              const winner=w1>=4?s.t1:w2>=4?s.t2:null;
              const totalGames=w1+w2;
              const current=res.po?.[s.id];
              const isApplied=applied[s.id]||current?.w===winner;
              return(
                <div key={s.id} style={{background:C.bg2,border:`1px solid ${winner?C.ok+"44":C.bdL}`,borderRadius:11,padding:"11px 14px",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
                  <Logo abbr={s.t1} size={24}/>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700,fontSize:13}}>{sn(s.t1)} vs {sn(s.t2)}</div>
                    <div style={{fontSize:11,color:C.t3,marginTop:1}}>
                      {T[s.t1]?.a}: {w1} · {T[s.t2]?.a}: {w2}
                      {current?.w&&<span style={{color:C.ok,marginLeft:8}}>· App: {T[current.w]?.a} in {current.g}</span>}
                    </div>
                  </div>
                  <Logo abbr={s.t2} size={24}/>
                  {winner?(
                    <button onClick={()=>{setPoR(s.id,winner,totalGames);setApplied(p=>({...p,[s.id]:true}));}}
                      style={{...isApplied?btn.g:btn.s,fontSize:11,padding:"6px 12px"}} disabled={isApplied}>
                      {isApplied?`✓ ${T[winner]?.a} in ${totalGames}`:`Apply: ${T[winner]?.a} in ${totalGames}`}
                    </button>
                  ):(
                    <span style={{background:C.bg3,borderRadius:7,padding:"4px 9px",fontSize:11,color:C.t3}}>
                      In progress ({w1}-{w2})
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
      {loading&&<div style={{textAlign:"center",color:C.t3,padding:20}}>⏳ Fetching games from ESPN…</div>}
    </div>
  );
}

// ─── ADMIN ───────────────────────────────────────────────────────────────────
function Admin({users,res,cfg,adminPw,setPoR,setPiR,setChamp,setMvp,setCfg,logout,removeUser}){
  const [tab,setTab]=useState("rounds");
  const [editSid,setEditSid]=useState(null);
  const [ew,setEw]=useState("");
  const [eg,setEg]=useState("");
  const [champIn,setChampIn]=useState(res.champ||"");
  const [mvpIn,setMvpIn]=useState(res.mvp||"");
  const [confirmRemove,setConfirmRemove]=useState(null);
  // Settings state
  const [newPw,setNewPw]=useState(""); const [newPw2,setNewPw2]=useState(""); const [pwMsg,setPwMsg]=useState("");
  const [deadline,setDeadline]=useState(cfg.deadline?cfg.deadline.slice(0,16):"");
  const [deadlines,setDeadlines]=useState({
    pi:cfg.deadlines?.pi?new Date(cfg.deadlines.pi).toISOString().slice(0,16):"",
    r1:cfg.deadlines?.r1?new Date(cfg.deadlines.r1).toISOString().slice(0,16):(cfg.deadline?cfg.deadline.slice(0,16):""),
    r2:cfg.deadlines?.r2?new Date(cfg.deadlines.r2).toISOString().slice(0,16):"",
    r3:cfg.deadlines?.r3?new Date(cfg.deadlines.r3).toISOString().slice(0,16):"",
    finals:cfg.deadlines?.finals?new Date(cfg.deadlines.finals).toISOString().slice(0,16):"",
  });
  const [leagueName,setLeagueName]=useState(cfg.leagueName||"NBA Playoffs 2026");
  // Sync local settings state if cfg changes externally (e.g. another device saves)
  useEffect(()=>{
    setDeadlines({
      pi:cfg.deadlines?.pi?new Date(cfg.deadlines.pi).toISOString().slice(0,16):"",
      r1:cfg.deadlines?.r1?new Date(cfg.deadlines.r1).toISOString().slice(0,16):(cfg.deadline?cfg.deadline.slice(0,16):""),
      r2:cfg.deadlines?.r2?new Date(cfg.deadlines.r2).toISOString().slice(0,16):"",
      r3:cfg.deadlines?.r3?new Date(cfg.deadlines.r3).toISOString().slice(0,16):"",
      finals:cfg.deadlines?.finals?new Date(cfg.deadlines.finals).toISOString().slice(0,16):"",
    });
    setLeagueName(cfg.leagueName||"NBA Playoffs 2026");
    setChampIn(res.champ||"");
    setMvpIn(res.mvp||"");
  },[cfg,res]);
  const [prizes,setPrizes]=useState({p1:cfg.prizes?.p1||"",p2:cfg.prizes?.p2||"",p3:cfg.prizes?.p3||""});
  const [settingsSaved,setSettingsSaved]=useState(false);

  const openIdx=ROUND_KEYS.indexOf(cfg.openR||"r1");
  const editS=editSid?SERIES.find(s=>s.id===editSid):null;
  const scores=useMemo(()=>users.map(u=>({...u,...scoreUser(u,res,{rPi:true,rPo:true,openR:"finals"})})).sort((a,b)=>b.total-a.total),[users,res]);

  const saveSettings=()=>{
    const parsedDeadlines={};
    Object.entries(deadlines).forEach(([k,v])=>{parsedDeadlines[k]=v?new Date(v).toISOString():null;});
    setCfg(p=>({...p,
      deadline:deadlines.r1?new Date(deadlines.r1).toISOString():null, // backward compat
      deadlines:parsedDeadlines,
      leagueName:leagueName.trim()||"NBA Playoffs 2026",
      prizes:{p1:prizes.p1||"TBD",p2:prizes.p2||"TBD",p3:prizes.p3||"TBD"},
    }));
    setSettingsSaved(true); setTimeout(()=>setSettingsSaved(false),2500);
  };
  const changeAdminPw=()=>{
    if(newPw.length<4){setPwMsg("Min 4 characters");return;}
    if(newPw!==newPw2){setPwMsg("Passwords don't match");return;}
    setCfg(p=>({...p,adminPw:newPw}));
    setNewPw(""); setNewPw2(""); setPwMsg("✓ Password changed!");
    setTimeout(()=>setPwMsg(""),3000);
  };

  return(
    <div style={{minHeight:"100vh",background:C.bg0,color:C.t1,fontFamily:"'DM Sans','Segoe UI',sans-serif"}}>
      <header style={{background:C.bg1,borderBottom:`1px solid ${C.bd}`,padding:"12px 18px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:22}}>⚙️</span><div><div style={{fontWeight:900,fontSize:16,fontFamily:"Georgia,serif"}}>Admin Panel</div><div style={{fontSize:9,color:C.t3,letterSpacing:"2px",textTransform:"uppercase"}}>{cfg.leagueName||"NBA Playoffs 2026"}</div></div></div>
        <div style={{display:"flex",gap:7,alignItems:"center",flexWrap:"wrap"}}>
          <button onClick={()=>setCfg(p=>({...p,rPi:!p.rPi}))} style={cfg.rPi?btn.s:btn.w}>{cfg.rPi?"⚡ Scores On":"⚡ Show Scores"}</button>
          <button onClick={()=>setCfg(p=>({...p,rPiPicks:!p.rPiPicks}))} style={cfg.rPiPicks?btn.s:btn.w}>{cfg.rPiPicks?"👀 PI Picks Shown":"👀 Show PI Picks"}</button>
          <button onClick={()=>setCfg(p=>({...p,rPo:!p.rPo}))} style={cfg.rPo?btn.s:btn.w}>{cfg.rPo?"🔓 Playoffs Shown":"🔒 Show Playoffs"}</button>
          <button onClick={logout} style={btn.g}>← Exit</button>
        </div>
      </header>
      <nav style={{display:"flex",background:C.bg1,borderBottom:`1px solid ${C.bd}`,overflowX:"auto"}}>
        {[["rounds","🏀 Rounds"],["playin","⚡ Play-In"],["results","📋 Results"],["sync","🔄 Sync"],["bonuses","🏆 Bonuses"],["players","👥 Players"],["scores","🏅 Scores"],["settings","⚙️ Settings"]].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)} style={{padding:"10px 14px",border:"none",background:"transparent",color:tab===k?C.acc:C.t3,fontWeight:700,cursor:"pointer",fontSize:12,whiteSpace:"nowrap",borderBottom:`2px solid ${tab===k?C.acc:"transparent"}`}}>{l}</button>
        ))}
      </nav>
      <main style={{maxWidth:940,margin:"0 auto",padding:"20px 14px"}}>

        {tab==="rounds"&&<div>
          <h3 style={{fontWeight:900,marginBottom:16}}>Round Unlock Control</h3>
          <div style={{display:"flex",flexDirection:"column",gap:9}}>
            {ROUNDS.map((r,i)=>{
              const isOpen=i<=openIdx, isCur=i===openIdx;
              return <div key={r.k} style={{background:isOpen?C.okB:C.bg2,border:`1px solid ${isOpen?C.ok:C.bdL}`,borderRadius:11,padding:"12px 15px",display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
                <span style={{fontSize:18}}>{isOpen?"✅":"🔒"}</span>
                <div style={{flex:1}}><div style={{fontWeight:700,fontSize:14}}>{r.l}</div><div style={{fontSize:11,color:C.t3}}>Pts: {r.pts.exact} / {r.pts.correct} / {r.pts.wrong}</div></div>
                {isCur&&<span style={{background:C.aD,color:C.acc,fontSize:11,fontWeight:800,padding:"2px 8px",borderRadius:5}}>CURRENT</span>}
                {!isOpen&&i===openIdx+1&&<button onClick={()=>setCfg(p=>({...p,openR:r.k}))} style={{...btn.p,fontSize:12,padding:"7px 14px"}}>Unlock</button>}
              </div>;
            })}
          </div>
        </div>}

        {tab==="playin"&&<div>
          <h3 style={{fontWeight:900,marginBottom:14}}>Play-In Results</h3>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {PLAYIN.filter(m=>m.teams[0]&&m.teams[1]).map(m=>{
              const real=res.pi?.[m.id];
              return <div key={m.id} style={{background:C.bg2,border:`1px solid ${C.bdL}`,borderRadius:10,padding:"11px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:9}}>
                <div><div style={{fontSize:9,color:C.t3}}>{m.conf}</div><div style={{fontWeight:700,fontSize:13}}>{m.label}</div>{real?.w&&<div style={{color:C.ok,fontSize:11,marginTop:2}}>✓ {T[real.w]?.n||real.w}</div>}</div>
                <select value={real?.w||""} onChange={e=>setPiR(m.id,e.target.value)} style={{...sel,maxWidth:190}}>
                  <option value="">— not played —</option>
                  {m.teams.filter(tk=>T[tk]).map(tk=><option key={tk} value={tk}>{T[tk].n}</option>)}
                </select>
              </div>;
            })}
          </div>
        </div>}

        {tab==="results"&&<div>
          {ROUNDS.map(r=>(
            <div key={r.k} style={{marginBottom:18}}>
              <div style={{fontSize:10,fontWeight:800,color:C.t3,textTransform:"uppercase",letterSpacing:"1.5px",marginBottom:7,paddingBottom:5,borderBottom:`1px solid ${C.bd}`}}>{r.l}</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))",gap:7}}>
                {SERIES.filter(s=>s.r===r.k).map(s=>{
                  const real=res.po?.[s.id];
                  return <div key={s.id} style={{background:C.bg2,border:`1px solid ${C.bdL}`,borderRadius:9,padding:"9px 13px",display:"flex",justifyContent:"space-between",alignItems:"center",gap:7,flexWrap:"wrap"}}>
                    <div style={{flex:1}}>
                      <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:3}}><Logo abbr={s.t1} size={18}/><span style={{fontSize:11,color:C.t3}}>vs</span><Logo abbr={s.t2} size={18}/></div>
                      <div style={{fontWeight:600,fontSize:12}}>{sn(s.t1)} vs {sn(s.t2)}</div>
                      {real?.w&&<div style={{color:C.ok,fontSize:10,marginTop:1}}>✓ {sn(real.w)} in {real.g}</div>}
                    </div>
                    <button onClick={()=>{setEditSid(s.id);setEw(real?.w||"");setEg(real?.g?.toString()||"");}} style={btn.g}>Edit</button>
                  </div>;
                })}
              </div>
            </div>
          ))}
        </div>}

        {tab==="sync"&&<NBASync res={res} setPoR={setPoR} setPiR={setPiR}/>}

        {tab==="bonuses"&&<div>
          <h3 style={{fontWeight:900,marginBottom:18}}>Set Bonus Results</h3>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,maxWidth:560}}>
            <div style={{background:C.bg2,border:`1px solid ${C.bdL}`,borderRadius:13,padding:18}}>
              <div style={{fontWeight:800,fontSize:14,marginBottom:10}}>🏆 NBA Champion</div>
              <select value={champIn} onChange={e=>setChampIn(e.target.value)} style={{...sel,width:"100%",marginBottom:9,display:"block"}}>
                <option value="">— not decided —</option>
                {[...EAST_ABBRS,...WEST_ABBRS].sort((a,b)=>T[a].n.localeCompare(T[b].n)).map(k=><option key={k} value={k}>{T[k].n}</option>)}
              </select>
              <button onClick={()=>setChamp(champIn)} style={{...btn.p,width:"100%"}}>Save</button>
              {res.champ&&<p style={{color:C.ok,marginTop:7,fontSize:11,fontWeight:700}}>✓ {T[res.champ]?.n}</p>}
            </div>
            <div style={{background:C.bg2,border:`1px solid ${C.bdL}`,borderRadius:13,padding:18}}>
              <div style={{fontWeight:800,fontSize:14,marginBottom:10}}>⭐ Finals MVP</div>
              <select value={mvpIn} onChange={e=>setMvpIn(e.target.value)} style={{...sel,width:"100%",marginBottom:9,display:"block"}}>
                <option value="">— not decided —</option>
                {MVPS.map(m=><option key={m.id} value={m.id}>{m.n} ({T[m.t]?.a})</option>)}
              </select>
              <button onClick={()=>setMvp(mvpIn)} style={{...btn.p,width:"100%"}}>Save</button>
              {res.mvp&&<p style={{color:C.ok,marginTop:7,fontSize:11,fontWeight:700}}>✓ {MVPS.find(m=>m.id===res.mvp)?.n}</p>}
            </div>
          </div>
        </div>}

        {tab==="players"&&<div>
          <div style={{fontSize:10,fontWeight:800,color:C.t3,textTransform:"uppercase",letterSpacing:"2px",marginBottom:12}}>Players ({users.filter(u=>!u.isAI).length})</div>
          <div style={{display:"flex",flexDirection:"column",gap:7}}>
            {users.filter(u=>!u.isAI).map((u,i)=>{
              const pf=Object.values(u.po||{}).filter(p=>p?.w).length;
              const pif=Object.values(u.pi||{}).filter(p=>p?.w).length;
              const isConfirm=confirmRemove===u.id;
              return <div key={u.id} style={{background:C.bg2,border:`1px solid ${isConfirm?"rgba(248,113,113,.4)":C.bdL}`,borderLeft:`4px solid ${isConfirm?C.er:PC[i%PC.length]}`,borderRadius:9,padding:"11px 14px",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
                <Avatar user={u} size={38} idx={i}/>
                <div style={{flex:1}}><div style={{fontWeight:700,fontSize:14}}>{u.name}</div><div style={{color:C.t3,fontSize:11}}>{u.email}</div></div>
                <div style={{textAlign:"right",fontSize:11,color:C.t2}}>
                  <div>Playoffs: {pf}/{SERIES.length}</div><div>Play-In: {pif}/{PLAYIN.filter(m=>m.teams[0]).length}</div>
                  {u.champ&&<div style={{color:C.acc}}>🏆 {T[u.champ]?.a}</div>}
                  {u.mvp&&<div style={{color:C.ai}}>⭐ {MVPS.find(m=>m.id===u.mvp)?.n?.split(" ")[0]}</div>}
                </div>
                {isConfirm?(
                  <div style={{display:"flex",gap:6,alignItems:"center"}}>
                    <span style={{fontSize:11,color:C.er,fontWeight:700}}>Remove?</span>
                    <button onClick={()=>{removeUser(u.id);setConfirmRemove(null);}} style={{...btn.danger,fontWeight:800}}>Yes</button>
                    <button onClick={()=>setConfirmRemove(null)} style={btn.g}>No</button>
                  </div>
                ):(
                  <button onClick={()=>setConfirmRemove(u.id)} style={btn.danger}>🗑 Remove</button>
                )}
              </div>;
            })}
            <div style={{background:C.bg2,border:`1px solid ${C.bdL}`,borderLeft:`4px solid ${C.ai}`,borderRadius:9,padding:"11px 14px",display:"flex",alignItems:"center",gap:10}}>
              <Avatar user={AI} size={38}/>
              <div><div style={{fontWeight:700,color:C.ai}}>Claude AI 🤖</div><div style={{color:C.t3,fontSize:11}}>AI Competitor · All picks pre-set</div></div>
            </div>
          </div>
        </div>}

        {tab==="scores"&&<div>
          <div style={{fontSize:10,fontWeight:800,color:C.t3,textTransform:"uppercase",letterSpacing:"2px",marginBottom:12}}>Live Standings</div>
          <div style={{display:"flex",flexDirection:"column",gap:7}}>
            {scores.map((s,i)=><div key={s.id} style={{background:C.bg2,border:`1px solid ${C.bdL}`,borderLeft:`4px solid ${s.isAI?C.ai:PC[i%PC.length]}`,borderRadius:9,padding:"10px 14px",display:"flex",alignItems:"center",gap:10}}>
              <Avatar user={s} size={30} idx={i}/>
              <span style={{fontSize:15,minWidth:26}}>{i===0?"🥇":i===1?"🥈":i===2?"🥉":`#${i+1}`}</span>
              <span style={{flex:1,fontWeight:700,color:s.isAI?C.ai:C.t1}}>{s.name}</span>
              <span style={{fontWeight:900,fontSize:18,color:s.isAI?C.ai:PC[i%PC.length]}}>{s.total}</span>
            </div>)}
          </div>
        </div>}

        {tab==="settings"&&<div>
          <h3 style={{fontWeight:900,marginBottom:20}}>League Settings</h3>
          <Section title="🏆 League Name">
            <input value={leagueName} onChange={e=>setLeagueName(e.target.value)} style={{...inp,marginBottom:0}} placeholder="NBA Playoffs 2026"/>
          </Section>
          <Section title="⏰ Betting Deadlines Per Stage">
            <p style={{color:C.t3,fontSize:12,margin:"0 0 12px"}}>Set when betting closes for each stage. Leave empty for no deadline.</p>
            {[["pi","⚡ Play-In"],["r1","🏀 Round 1"],["r2","🏀 Semifinals"],["r3","🏀 Conf. Finals"],["finals","🏆 NBA Finals"]].map(([k,label])=>(
              <div key={k} style={{marginBottom:12}}>
                <div style={{fontSize:11,color:C.t2,marginBottom:4,fontWeight:700}}>{label}</div>
                <input type="datetime-local" value={deadlines[k]} onChange={e=>setDeadlines(p=>({...p,[k]:e.target.value}))}
                  style={{...inp,marginBottom:0,colorScheme:"dark"}}/>
                {deadlines[k]&&<div style={{marginTop:4,display:"flex",alignItems:"center",gap:8}}>
                  <span style={{color:C.wn,fontSize:10}}>⏰ {new Date(deadlines[k]).toLocaleString()}</span>
                  <Countdown deadline={deadlines[k]?new Date(deadlines[k]).toISOString():null}/>
                </div>}
              </div>
            ))}
          </Section>
          <Section title="🎁 Prize Descriptions">
            <p style={{color:C.t3,fontSize:12,margin:"0 0 10px"}}>These appear on the Prizes page for all users.</p>
            {[["p1","🥇 1st Place"],["p2","🥈 2nd Place"],["p3","🥉 3rd Place"]].map(([k,label])=>(
              <div key={k} style={{marginBottom:10}}>
                <div style={{fontSize:11,color:C.t3,marginBottom:4,fontWeight:700}}>{label}</div>
                <input value={prizes[k]} onChange={e=>setPrizes(p=>({...p,[k]:e.target.value}))}
                  style={{...inp,marginBottom:0}} placeholder={`Prize for ${label}...`}/>
              </div>
            ))}
          </Section>
          <button onClick={saveSettings} style={{...btn.p,marginBottom:12}}>
            {settingsSaved?"✓ Settings Saved!":"Save Settings"}
          </button>
          <Section title="🔑 Change Admin Password">
            <p style={{color:C.t3,fontSize:12,margin:"0 0 10px"}}>Only you know this. Make it something only you'd guess.</p>
            <input type="password" value={newPw} onChange={e=>setNewPw(e.target.value)}
              style={{...inp,marginBottom:8}} placeholder="New password"/>
            <input type="password" value={newPw2} onChange={e=>setNewPw2(e.target.value)}
              style={{...inp,marginBottom:8}} placeholder="Confirm new password"
              onKeyDown={e=>e.key==="Enter"&&changeAdminPw()}/>
            {pwMsg&&<p style={{color:pwMsg.startsWith("✓")?C.ok:C.er,fontSize:12,margin:"0 0 8px"}}>{pwMsg}</p>}
            <button onClick={changeAdminPw} style={btn.p}>Change Password</button>
            <p style={{color:C.t3,fontSize:11,marginTop:8}}>Current password: <span style={{color:C.t2}}>{adminPw}</span></p>
          </Section>
        </div>}

      </main>

      {/* Edit Modal */}
      {editSid&&editS&&<div style={{position:"fixed",inset:0,background:"#000c",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:16}} onClick={()=>setEditSid(null)}>
        <div style={{background:C.bg1,border:`1px solid ${C.bd}`,borderRadius:18,padding:26,maxWidth:320,width:"100%"}} onClick={e=>e.stopPropagation()}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}><Logo abbr={editS.t1} size={26}/><span style={{color:C.t3,fontSize:12}}>vs</span><Logo abbr={editS.t2} size={26}/></div>
          <h3 style={{margin:"6px 0 16px",fontWeight:900,fontSize:15}}>{sn(editS.t1)} vs {sn(editS.t2)}</h3>
          <div style={{fontSize:10,color:C.t3,fontWeight:800,textTransform:"uppercase",letterSpacing:"1px",marginBottom:5}}>Winner</div>
          <select value={ew} onChange={e=>setEw(e.target.value)} style={{...sel,width:"100%",marginBottom:12,display:"block"}}>
            <option value="">— not played —</option>
            {[editS.t1,editS.t2].map(k=><option key={k} value={k}>{sn(k)}</option>)}
          </select>
          <div style={{fontSize:10,color:C.t3,fontWeight:800,textTransform:"uppercase",letterSpacing:"1px",marginBottom:5}}>Total Games</div>
          <select value={eg} onChange={e=>setEg(e.target.value)} style={{...sel,width:"100%",marginBottom:18,display:"block"}}>
            <option value="">—</option>
            {[4,5,6,7].map(g=><option key={g} value={g}>{g}</option>)}
          </select>
          {(!ew||!eg)&&<p style={{color:C.er,fontSize:12,margin:"0 0 10px",textAlign:"center",fontWeight:700}}>⚠️ חובה לבחור קבוצה + מספר משחקים</p>}
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>{setPoR(editSid,ew,eg);setEditSid(null);}} disabled={!ew||!eg} style={{...btn.p,flex:1,opacity:(!ew||!eg)?0.35:1,cursor:(!ew||!eg)?"not-allowed":"pointer"}}>Save</button>
            <button onClick={()=>setEditSid(null)} style={{...btn.g,flex:1}}>Cancel</button>
          </div>
        </div>
      </div>}
    </div>
  );
}

function Section({title,children}){
  return <div style={{background:C.bg2,border:`1px solid ${C.bdL}`,borderRadius:14,padding:18,marginBottom:14}}>
    <div style={{fontWeight:800,fontSize:14,marginBottom:12}}>{title}</div>
    {children}
  </div>;
}
