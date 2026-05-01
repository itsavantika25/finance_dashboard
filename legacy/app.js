// ===================== FIREBASE =====================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
  getAuth, GoogleAuthProvider, signInWithPopup,
  onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import { 
  getFirestore, collection, addDoc, getDocs,
  deleteDoc, doc, query, orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDa69BMdPqvwMqvW2YQlMis1NrRmPhINBA",
  authDomain: "kwitter-website10.firebaseapp.com",
  projectId: "kwitter-website10",
  storageBucket: "kwitter-website10.firebasestorage.app",
  messagingSenderId: "178419559592",
  appId: "1:178419559592:web:d924b3904d27e96686669d"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ===================== STATE =====================
const CURRENCIES = {
  INR:{sym:'₹',name:'INR'},USD:{sym:'$',name:'USD'},
  EUR:{sym:'€',name:'EUR'},GBP:{sym:'£',name:'GBP'},
  JPY:{sym:'¥',name:'JPY'},AED:{sym:'د.إ',name:'AED'}
};

const CATS = {
  Food:{icon:'utensils',color:'#ff86c3'},
  Entertainment:{icon:'gamepad-2',color:'#ac8aff'},
  Transport:{icon:'bus',color:'#5bf4de'},
  Shopping:{icon:'shopping-bag',color:'#fbbf24'},
  Health:{icon:'heart-pulse',color:'#34d399'},
  Education:{icon:'book-open',color:'#60a5fa'},
  Subscriptions:{icon:'smartphone',color:'#f87171'},
  Work:{icon:'briefcase',color:'#a78bfa'},
  Gift:{icon:'gift',color:'#fb923c'},
  Other:{icon:'sparkles',color:'#94a3b8'}
};

function getLocalDate(){
  return new Date().toLocaleDateString('en-CA');
}

let state = {user:null,entries:[],currency:'INR',entryType:'income'};
let charts = {};
let chartMode = 'week';
let filterMode = 'all';
let searchQ = '';

function save(){
  localStorage.setItem('wiw_v2',JSON.stringify({
    currency:state.currency
  }));
}

function load(){
  try{
    const d=JSON.parse(localStorage.getItem('wiw_v2')||'{}');
    if(d.currency) state.currency=d.currency;
  }catch(e){}
}

function sym(){return CURRENCIES[state.currency]?.sym||'₹';}
function fmt(n){return sym()+Math.abs(n).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2});}
function fmtShort(n){
  const s=sym();
  if(n>=100000) return s+(n/100000).toFixed(1)+'L';
  if(n>=1000) return s+(n/1000).toFixed(1)+'k';
  return s+Math.round(n);
}

// ===================== AUTH =====================
async function googleLogin(){
  const provider = new GoogleAuthProvider();
  try{
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    state.user = {
      name: user.displayName,
      email: user.email,
      avatar: user.displayName ? user.displayName[0].toUpperCase() : 'A',
      uid: user.uid
    };

    enterApp();
  }catch(err){
    showToast("Login failed","error");
  }
}

function enterApp(){
  document.getElementById('auth-page').classList.remove('visible');
  document.getElementById('app').style.display='flex';
  document.getElementById('app-avatar').textContent=state.user.avatar||'A';
  document.getElementById('currency-select').value=state.currency;
  lucide.createIcons();
}

async function logout(){
  await signOut(auth);
  state.user=null;
  state.entries=[];
  document.getElementById('app').style.display='none';
  document.getElementById('landing').style.display='block';
  document.getElementById('features').style.display='block';
}

// ===================== FIRESTORE =====================
async function loadEntriesFromFirebase(){
  const q = query(collection(db, "users", state.user.uid, "entries"), orderBy("date","desc"));
  const snap = await getDocs(q);

  state.entries = snap.docs.map(d=>({
    id: d.id,
    ...d.data()
  }));
}

async function submitEntry(){
  const amount=parseFloat(document.getElementById('m-amount').value);
  const cat=document.getElementById('m-category').value;
  const date=document.getElementById('m-date').value;
  const note=document.getElementById('m-note').value.trim();

  if(!amount||amount<=0||!date){
    showToast('Please enter valid data','error');
    return;
  }

  const newEntry = {
    type: modalType,
    amount,
    category: cat,
    date,
    note,
    currency: state.currency
  };

  const docRef = await addDoc(
    collection(db,"users",state.user.uid,"entries"),
    newEntry
  );

  state.entries.unshift({
    id: docRef.id,
    ...newEntry
  });

  document.getElementById('m-amount').value='';
  document.getElementById('m-note').value='';
  closeModal();
  showToast('Entry logged!');
  renderAll();
}

async function deleteEntry(id){
  await deleteDoc(doc(db,"users",state.user.uid,"entries",id));
  state.entries=state.entries.filter(e=>e.id!==id);
  renderAll();
  showToast('Entry deleted.');
}

// ===================== AUTO LOGIN =====================
onAuthStateChanged(auth, async (user)=>{
  if(user){
    state.user = {
      name: user.displayName,
      email: user.email,
      avatar: user.displayName ? user.displayName[0].toUpperCase() : 'A',
      uid: user.uid
    };

    document.getElementById('landing').style.display='none';
    document.getElementById('features').style.display='none';

    enterApp();
    await loadEntriesFromFirebase();
    renderAll();
  }
});


// ===================== CURRENCY =====================
function setCurrency(c){
  state.currency=c;
  document.getElementById('m-currency-sym').textContent=sym();
  save(); renderAll();
}

// ===================== NAVIGATION =====================
function showAppPage(p){
  document.querySelectorAll('.app-page').forEach(el=>el.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(el=>el.classList.remove('active'));
  document.getElementById('page-'+p).classList.add('active');
  document.getElementById('nav-'+p).classList.add('active');
  renderAll();
}

// ===================== MODAL =====================
let modalType='income';
function openModal(t){
  if(t) setModalType(t);
  document.getElementById('modal-overlay').classList.add('open');
  document.getElementById('m-date').value=getLocalDate();
  document.getElementById('m-amount').focus();
}
function closeModal(){document.getElementById('modal-overlay').classList.remove('open');}
function setModalType(t){
  modalType=t;
  document.getElementById('m-inc').classList.toggle('active',t==='income');
  document.getElementById('m-exp').classList.toggle('active',t==='expense');
  if(t==='income') document.getElementById('m-category').value='Work';
  else document.getElementById('m-category').value='Food';
}

// ===================== TOAST =====================
function showToast(msg,type){
  const t=document.getElementById('toast');
  document.getElementById('toast-msg').textContent=msg;
  t.classList.add('show');
  if(type==='error') t.style.borderColor='rgba(255,113,113,0.25)';
  else t.style.borderColor='rgba(91,244,222,0.25)';
  setTimeout(()=>t.classList.remove('show'),2500);
}

// ===================== DATA HELPERS =====================
function isThisWeek(ds){
  const now=new Date();
  const day = (now.getDay() + 6) % 7; // makes Monday = 0
  const start=new Date(now);
  start.setDate(now.getDate()-day);
  start.setHours(0,0,0,0);

  const end=new Date(start);
  end.setDate(start.getDate()+6);
  end.setHours(23,59,59,999);

  const d=new Date(ds+'T00:00:00');
  return d>=start && d<=end;
}
function isThisMonth(ds){const now=new Date(),d=new Date(ds+'T00:00:00');return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();}

// ===================== RENDER =====================
function renderAll(){
  renderDashboard();
  renderHistory();
  renderAnalytics();
  renderInsights();
}

function renderDashboard(){
  const totalIn=state.entries.filter(e=>e.type==='income').reduce((a,e)=>a+e.amount,0);
  const totalOut=state.entries.filter(e=>e.type==='expense').reduce((a,e)=>a+e.amount,0);
  const balance=totalIn-totalOut;
  const weekIn=state.entries.filter(e=>e.type==='income'&&isThisWeek(e.date)).reduce((a,e)=>a+e.amount,0);
  const weekOut=state.entries.filter(e=>e.type==='expense'&&isThisWeek(e.date)).reduce((a,e)=>a+e.amount,0);
  const rate=weekIn>0?Math.round(((weekIn-weekOut)/weekIn)*100):0;

  document.getElementById('d-balance').textContent=fmtShort(Math.abs(balance));
  document.getElementById('d-balance').style.color=balance>=0?'var(--on-surface)':'var(--tertiary)';
  document.getElementById('d-growth').textContent=(rate>=0?'+':'')+rate+'%';
  document.getElementById('d-growth').parentElement.style.color=rate>=0?'var(--primary)':'var(--tertiary)';

  renderRecentTxns();
  renderDonut();
  renderInsightCard();
  renderWeeklyChart();
}

function renderRecentTxns(){
  const list=document.getElementById('recent-txn-list');
  let entries = state.entries;
if(searchQ){
  entries = entries.filter(e =>
    (e.note||'').toLowerCase().includes(searchQ) ||
    e.category.toLowerCase().includes(searchQ)
  );
}
const recent = entries.slice(0,6);
  if(!recent.length){list.innerHTML='<div style="padding:32px;text-align:center;color:var(--on-surface-var);font-size:14px">No transactions yet.</div>';return;}
  list.innerHTML=recent.map(e=>txnHTML(e,false)).join('');
  lucide.createIcons();
}

function toggleNotifications(){
  showToast("No new notifications yet.");
}

function toggleProfileMenu(){
  showToast("Profile settings coming soon.");
}

function txnHTML(e,showDelete=true){
  const cat=CATS[e.category]||CATS.Other;
  const isInc=e.type==='income';
  const spark=isInc?'var(--primary)':'var(--tertiary)';
  const fillW=isInc?Math.min(100,Math.round(e.amount/100))+'%':'30%';
  return`<div class="txn-item">
    <div class="txn-icon-wrap" style="background:${cat.color}18;color:${cat.color}">
      <i data-lucide="${cat.icon}"></i>
    </div>
    <div style="flex:1">
      <div class="txn-name">${e.note||e.category}</div>
      <div class="txn-meta">${e.category} &bull; ${new Date(e.date+'T00:00:00').toLocaleDateString('en-IN',{month:'short',day:'numeric'})}</div>
    </div>
    <div style="text-align:right">
      <div class="txn-amount ${isInc?'pos':'neg'}">${isInc?'+':'-'}${fmt(e.amount)}</div>
      <div class="txn-sparkline" style="background:${cat.color}20;margin-left:auto"><div class="txn-sparkline-fill" style="width:${fillW};background:${spark}"></div></div>
    </div>
    ${showDelete?`<button class="delete-btn" onclick="deleteEntry(${e.id})"><i data-lucide="trash-2"></i></button>`:''}
  </div>`;
}


function renderDonut(){
  const expenses=state.entries.filter(e=>e.type==='expense'&&isThisMonth(e.date));
  const total=expenses.reduce((a,e)=>a+e.amount,0);
  document.getElementById('donut-total').textContent=fmtShort(total);
  const byCat={};
  expenses.forEach(e=>{byCat[e.category]=(byCat[e.category]||0)+e.amount;});
  const sorted=Object.entries(byCat).sort((a,b)=>b[1]-a[1]).slice(0,4);
  const colors=['#5bf4de','#ff86c3','#ac8aff','#48e5d0'];
  const segs=['donut-s1','donut-s2','donut-s3','donut-s4'];

  let offset=0;
  segs.forEach((id,i)=>{
    const el=document.getElementById(id);
    if(!el) return;
    if(i>=sorted.length||total===0){el.setAttribute('stroke-dasharray','0 100');return;}
    const pct=Math.round((sorted[i][1]/total)*100);
    el.setAttribute('stroke-dasharray',`${pct} 100`);
    el.setAttribute('stroke-dashoffset',`${-offset}`);
    el.setAttribute('stroke',colors[i]);
    offset+=pct;
  });

  const legend=document.getElementById('cat-legend');
  if(!sorted.length){legend.innerHTML='<div style="font-size:13px;color:var(--on-surface-var)">No expenses this month.</div>';return;}
  legend.innerHTML=sorted.map((c,i)=>{
    const pct=Math.round((c[1]/total)*100);
    return`<div class="cat-item">
      <div class="cat-dot" style="background:${colors[i]}"></div>
      <div class="cat-name">${c[0]}</div>
      <div class="cat-pct">${pct}%</div>
    </div>`;
  }).join('');
}

function renderInsightCard(){
  const expenses=state.entries.filter(e=>e.type==='expense'&&isThisMonth(e.date));
  const total=expenses.reduce((a,e)=>a+e.amount,0);
  const byCat={};
  expenses.forEach(e=>{byCat[e.category]=(byCat[e.category]||0)+e.amount;});
  const sorted=Object.entries(byCat).sort((a,b)=>b[1]-a[1]);

  const headline=document.getElementById('insight-headline');
  const body=document.getElementById('insight-body');
  const badge=document.getElementById('insight-badge');

  if(!sorted.length){
    headline.textContent='Log some entries to get insights.';
    body.textContent='Once you start tracking, we\'ll generate personalised budgeting suggestions here.';
    badge.style.display='none';return;
  }
  const top=sorted[0];
  const pct=Math.round((top[1]/total)*100);
  headline.textContent=`You spent ${pct}% of your budget on ${top[0]}.`;
  body.textContent=`Based on your entries this month, ${top[0]} is your top spending category at ${fmt(top[1])}. Consider setting a monthly cap to stay on track.`;
  badge.style.display='flex';
  document.getElementById('insight-pct').textContent=pct+'%';
  document.getElementById('insight-donut').setAttribute('stroke-dasharray',`${pct} 100`);
  document.getElementById('insight-badge-title').textContent=top[0];
  document.getElementById('insight-badge-sub').textContent='Top category this month';
}

// ===================== CHARTS =====================
function renderWeeklyChart(){
  const tc='rgba(163,170,196,0.7)';
  const gc='rgba(255,255,255,0.04)';
  let labels,inData,outData;

  if(chartMode==='week'){
    const days=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    const now=new Date();
    const weekStart=new Date(now);weekStart.setDate(now.getDate()-now.getDay());weekStart.setHours(0,0,0,0);
    labels=days;
    inData=days.map((_,i)=>{
      const d=new Date(weekStart);d.setDate(weekStart.getDate()+i);
      const ds=d.toISOString().split('T')[0];
      return state.entries.filter(e=>e.type==='income'&&e.date===ds).reduce((a,e)=>a+e.amount,0);
    });
    outData=days.map((_,i)=>{
      const d=new Date(weekStart);d.setDate(weekStart.getDate()+i);
      const ds=d.toISOString().split('T')[0];
      return state.entries.filter(e=>e.type==='expense'&&e.date===ds).reduce((a,e)=>a+e.amount,0);
    });
  } else {
    const months=[];
    for(let i=6;i>=0;i--){const d=new Date();d.setDate(1);d.setMonth(d.getMonth()-i);months.push(d);}
    labels=months.map(m=>m.toLocaleString('default',{month:'short'}));
    inData=months.map(m=>state.entries.filter(e=>e.type==='income'&&new Date(e.date+'T00:00:00').getMonth()===m.getMonth()&&new Date(e.date+'T00:00:00').getFullYear()===m.getFullYear()).reduce((a,e)=>a+e.amount,0));
    outData=months.map(m=>state.entries.filter(e=>e.type==='expense'&&new Date(e.date+'T00:00:00').getMonth()===m.getMonth()&&new Date(e.date+'T00:00:00').getFullYear()===m.getFullYear()).reduce((a,e)=>a+e.amount,0));
  }

  if(charts.weekly) charts.weekly.destroy();
  const ctx=document.getElementById('weeklyChart');
  if(!ctx) return;
  charts.weekly=new Chart(ctx,{
    type:'bar',
    data:{labels,datasets:[
      {label:'Income',data:inData,backgroundColor:'rgba(91,244,222,0.7)',borderRadius:8,borderSkipped:false,barPercentage:.5},
      {label:'Spending',data:outData,backgroundColor:'rgba(255,134,195,0.6)',borderRadius:8,borderSkipped:false,barPercentage:.5}
    ]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{
      x:{ticks:{color:tc,font:{family:'Inter',size:11}},grid:{color:gc}},
      y:{ticks:{color:tc,font:{family:'Inter',size:11},callback:v=>fmtShort(v)},grid:{color:gc}}
    }}
  });
}

function setChartMode(m){
  chartMode=m;
  document.getElementById('tog-week').classList.toggle('active',m==='week');
  document.getElementById('tog-month').classList.toggle('active',m==='month');
  renderWeeklyChart();
}

function renderAnalyticsCharts(){
  const tc='rgba(163,170,196,0.7)';
  const gc='rgba(255,255,255,0.04)';

  const months=[];
  for(let i=5;i>=0;i--){const d=new Date();d.setDate(1);d.setMonth(d.getMonth()-i);months.push(d);}
  const mLabels=months.map(m=>m.toLocaleString('default',{month:'short'}));
  const mIn=months.map(m=>state.entries.filter(e=>e.type==='income'&&new Date(e.date+'T00:00:00').getMonth()===m.getMonth()&&new Date(e.date+'T00:00:00').getFullYear()===m.getFullYear()).reduce((a,e)=>a+e.amount,0));
  const mOut=months.map(m=>state.entries.filter(e=>e.type==='expense'&&new Date(e.date+'T00:00:00').getMonth()===m.getMonth()&&new Date(e.date+'T00:00:00').getFullYear()===m.getFullYear()).reduce((a,e)=>a+e.amount,0));

  if(charts.monthly) charts.monthly.destroy();
  const mc=document.getElementById('monthlyChart');
  if(mc) charts.monthly=new Chart(mc,{type:'line',data:{labels:mLabels,datasets:[
    {label:'Income',data:mIn,borderColor:'#5bf4de',backgroundColor:'rgba(91,244,222,0.08)',tension:.4,fill:true,pointBackgroundColor:'#5bf4de',pointRadius:4,pointHoverRadius:6},
    {label:'Spending',data:mOut,borderColor:'#ff86c3',backgroundColor:'rgba(255,134,195,0.08)',tension:.4,fill:true,pointBackgroundColor:'#ff86c3',pointRadius:4,pointHoverRadius:6}
  ]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{ticks:{color:tc,font:{family:'Inter',size:11}},grid:{color:gc}},y:{ticks:{color:tc,font:{family:'Inter',size:11},callback:v=>fmtShort(v)},grid:{color:gc}}}}});

  const allByCat={};
  state.entries.filter(e=>e.type==='expense').forEach(e=>{allByCat[e.category]=(allByCat[e.category]||0)+e.amount;});
  const allCats=Object.entries(allByCat).sort((a,b)=>b[1]-a[1]);
  if(charts.doughnut) charts.doughnut.destroy();
  const dc=document.getElementById('doughnutChart');
  if(dc){
    if(!allCats.length){
      charts.doughnut=new Chart(dc,{type:'doughnut',data:{labels:['No data'],datasets:[{data:[1],backgroundColor:['rgba(255,255,255,0.06)']}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}}}});
    } else {
      charts.doughnut=new Chart(dc,{type:'doughnut',data:{labels:allCats.map(c=>c[0]),datasets:[{data:allCats.map(c=>c[1]),backgroundColor:allCats.map(c=>CATS[c[0]]?.color||'#888'),borderWidth:0,hoverOffset:4}]},options:{responsive:true,maintainAspectRatio:false,cutout:'65%',plugins:{legend:{position:'right',labels:{color:tc,font:{family:'Inter',size:11},padding:10,boxWidth:10,boxHeight:10}}}}});
    }
  }
}

// ===================== ANALYTICS PAGE =====================
function renderAnalytics(){
  const monthExp=state.entries.filter(e=>e.type==='expense'&&isThisMonth(e.date)).reduce((a,e)=>a+e.amount,0);
  document.getElementById('a-month-spend').textContent=fmt(monthExp);
  const allByCat={};
  state.entries.filter(e=>e.type==='expense').forEach(e=>{allByCat[e.category]=(allByCat[e.category]||0)+e.amount;});
  const sorted=Object.entries(allByCat).sort((a,b)=>b[1]-a[1]);
  if(sorted.length){document.getElementById('a-top-cat').textContent=sorted[0][0];document.getElementById('a-top-cat-amt').textContent=fmt(sorted[0][1])+' total';}
  const cutoff=new Date();cutoff.setDate(cutoff.getDate()-30);
  const r30=state.entries.filter(e=>e.type==='expense'&&new Date(e.date+'T00:00:00')>=cutoff).reduce((a,e)=>a+e.amount,0);
  document.getElementById('a-daily-avg').textContent=fmt(r30/30);
  renderSuggestions();
  renderAnalyticsCharts();
}

function renderSuggestions(){
  const container=document.getElementById('suggestions-grid');
  const total=state.entries.filter(e=>e.type==='expense').reduce((a,e)=>a+e.amount,0);
  const byCat={};
  state.entries.filter(e=>e.type==='expense').forEach(e=>{byCat[e.category]=(byCat[e.category]||0)+e.amount;});
  if(!total){container.innerHTML='<div style="grid-column:1/-1;padding:32px;text-align:center;color:var(--on-surface-var);font-size:14px">Log some transactions to get personalised suggestions.</div>';return;}

  const sug=buildSuggestions(byCat,total);
  container.innerHTML=sug.map(s=>`
    <div class="suggestion-card" style="border-left-color:${s.color}">
      <div style="font-size:18px;margin-bottom:8px;color:${s.color};display:flex;align-items:center;gap:8px"><i data-lucide="${s.lucide}" style="width:20px;height:20px"></i></div>
      <div class="sug-title">${s.title}</div>
      <div class="sug-body">${s.body}</div>
    </div>`).join('');
  lucide.createIcons();
}

function buildSuggestions(byCat,total){
  const sug=[];
  const income=state.entries.filter(e=>e.type==='income').reduce((a,e)=>a+e.amount,0);
  const foodPct=((byCat.Food||0)/total)*100;
  const entPct=((byCat.Entertainment||0)/total)*100;
  const subPct=((byCat.Subscriptions||0)/total)*100;
  const shopPct=((byCat.Shopping||0)/total)*100;

  if(foodPct>30) sug.push({lucide:'utensils',color:'#ff86c3',title:'Food spending is high',body:`Food is ${Math.round(foodPct)}% of expenses. Meal prepping could save you ${fmtShort((byCat.Food||0)*0.25)}/month.`});
  else if(foodPct>0) sug.push({lucide:'check-circle',color:'#5bf4de',title:'Food spending looks healthy',body:`At ${Math.round(foodPct)}%, your food spending is balanced. Nice work.`});
  if(entPct>20) sug.push({lucide:'gamepad-2',color:'#ac8aff',title:'Entertainment over budget',body:`${Math.round(entPct)}% on entertainment. Try setting a weekly cap of ${fmtShort((byCat.Entertainment||0)/4)}.`});
  if(subPct>15) sug.push({lucide:'smartphone',color:'#f87171',title:'Audit your subscriptions',body:`Subscriptions are ${Math.round(subPct)}% of spending. Cancel anything you haven't used in 2 weeks.`});
  if(shopPct>25) sug.push({lucide:'shopping-bag',color:'#fbbf24',title:'Shopping habit check',body:`${Math.round(shopPct)}% on shopping. Try the 24-hour rule before buying anything non-essential.`});
  if(income>0){
    const rate=((income-total)/income)*100;
    if(rate<10) sug.push({lucide:'piggy-bank',color:'#5bf4de',title:'Boost your savings rate',body:`You're saving ${Math.round(rate)}%. Try the 50/30/20 rule: needs, wants, savings.`});
    else sug.push({lucide:'trending-up',color:'#34d399',title:'Strong savings rate!',body:`Saving ${Math.round(rate)}% is excellent. Set a goal to stay motivated.`});
  }
  if(!sug.length) sug.push({lucide:'sparkles',color:'#5bf4de',title:'All looking balanced!',body:'Your spending habits look healthy. Keep logging for deeper insights over time.'});
  return sug;
}

// ===================== HISTORY =====================
function filterTxns(mode,el){
  filterMode=mode;
  document.querySelectorAll('.filter-chip').forEach(c=>c.classList.remove('active'));
  el.classList.add('active');
  renderHistory();
}
function searchTxns(q){
  searchQ = q.toLowerCase();
  renderAll();
}
function renderHistory(){
  const list=document.getElementById('all-txn-list');
  let entries=state.entries;
  if(filterMode==='income') entries=entries.filter(e=>e.type==='income');
  else if(filterMode==='expense') entries=entries.filter(e=>e.type==='expense');
  else if(filterMode!=='all') entries=entries.filter(e=>e.category===filterMode);
  if(searchQ) entries=entries.filter(e=>(e.note||'').toLowerCase().includes(searchQ)||e.category.toLowerCase().includes(searchQ));
  if(!entries.length){list.innerHTML='<div style="padding:32px;text-align:center;color:var(--on-surface-var);font-size:14px">No entries found.</div>';return;}
  list.innerHTML=entries.map(e=>txnHTML(e,true)).join('');
  lucide.createIcons();
}

// ===================== INSIGHTS FULL =====================
function renderInsights(){
  const total=state.entries.filter(e=>e.type==='expense').reduce((a,e)=>a+e.amount,0);
  const byCat={};
  state.entries.filter(e=>e.type==='expense').forEach(e=>{byCat[e.category]=(byCat[e.category]||0)+e.amount;});
  const container=document.getElementById('insights-full-grid');
  if(!total){container.innerHTML='<div style="grid-column:1/-1;padding:48px;text-align:center;color:var(--on-surface-var);font-size:15px">Log transactions to see personalised insights.</div>';return;}
  const sug=buildSuggestions(byCat,total);
  container.innerHTML=sug.map(s=>`
    <div class="glass" style="padding:28px;border-left:3px solid ${s.color}">
      <div style="color:${s.color};margin-bottom:12px;display:flex;align-items:center;gap:8px"><i data-lucide="${s.lucide}" style="width:22px;height:22px"></i><span style="font-size:13px;font-weight:700;font-family:'Plus Jakarta Sans',sans-serif;letter-spacing:.05em;text-transform:uppercase">${s.title}</span></div>
      <div style="font-size:14px;color:var(--on-surface-var);line-height:1.7">${s.body}</div>
    </div>`).join('');
  lucide.createIcons();
}

// ===================== 3D PARALLAX =====================
document.addEventListener('mousemove',e=>{
  const scene=document.getElementById('scene-inner');
  if(!scene) return;
  const x=(e.clientX/window.innerWidth-0.5)*18;
  const y=(e.clientY/window.innerHeight-0.5)*12;
  scene.style.transform=`rotateY(${x}deg) rotateX(${-y}deg)`;
});

// ===================== INIT =====================
load();
document.getElementById('m-date').value=new Date().toISOString().split('T')[0];
document.getElementById('currency-select').value=state.currency;
lucide.createIcons();

if(state.user){
  document.getElementById('landing').style.display='none';
  document.getElementById('features').style.display='none';
  enterApp();
} else {
  document.getElementById('landing').style.display='block';
  document.getElementById('features').style.display='block';
}
