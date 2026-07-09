/* ============ the Clearing @ Fugue Gallery — shared behavior ============ */
(function(){
  const motionOK = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.body.classList.add("js");
  const $ = (s,r)=> (r||document).querySelector(s);
  const $$ = (s,r)=> [...(r||document).querySelectorAll(s)];

  /* ---------- events data ---------- */
  const EVENTS = [
    {date:"2026-07-05", kind:"session", time:"11am–4pm", sound:"Sha Frasier & David Feigelson", theme:"five biomes — tundra, forest, city, desert, coastline", extra:["Tea — William Hu"], recap:"clearing-session-1.html"},
    {date:"2026-07-12", kind:"session", time:"11am–4pm", sound:"Sha Frasier & Otis Gordon", theme:"", extra:[]},
    {date:"2026-07-19", kind:"session", time:"11am–4pm", sound:"Sha Frasier", theme:"", extra:["Teaching — Tina Scepanovica · Making sculpture with clay (12–2pm)"]},
    {date:"2026-07-26", kind:"session", time:"11am–4pm", sound:"Aedi Records", theme:"", extra:["Movement — Etai Atula"]},
    {date:"2026-08-02", kind:"session", time:"11am–4pm", sound:"", theme:"", extra:[]},
    {date:"2026-08-09", kind:"session", time:"11am–4pm", sound:"", theme:"", extra:[]},
    {date:"2026-08-16", kind:"session", time:"11am–4pm", sound:"", theme:"", extra:[]},
    {date:"2026-08-23", kind:"session", time:"11am–4pm", sound:"", theme:"", extra:[]},
    {date:"2026-08-30", kind:"session", time:"11am–4pm", sound:"", theme:"", extra:[]},
  ];
  const MONTHS=["January","February","March","April","May","June","July","August","September","October","November","December"];
  const byDate = Object.fromEntries(EVENTS.map(e=>[e.date,e]));
  const fmtLong = iso=>{const [y,m,d]=iso.split("-").map(Number); return new Date(y,m-1,d).toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"});};
  const roleLine = s=>{ const i=s.indexOf(" — "); return i<0 ? s : `<b>${s.slice(0,i)}</b>${s.slice(i)}`; };

  /* ---------- persistent magical-realism state ---------- */
  let spinDir = 1;
  try{ if(localStorage.getItem("fugueReserved")==="1"){ document.body.classList.add("reserved"); spinDir = -1; } }catch(e){}

  /* ---------- spinning asterisk (constant everywhere; faster only while scrolling) ---------- */
  const star = $(".logo-star");
  if(star && motionOK){
    let a = 0, lastY = window.scrollY, boost = 0;
    (function loop(){
      const y = window.scrollY;
      const vel = Math.abs(y - lastY); lastY = y;
      boost = Math.max(boost * 0.9, Math.min(vel * 0.25, 6));
      a += spinDir * 0.25 * (1 + boost);
      star.style.transform = "rotate("+a+"deg)";
      requestAnimationFrame(loop);
    })();
  }

  /* ---------- nav: solid on scroll (always solid where there's no hero) ---------- */
  const nav = $("#nav");
  const hero = $("header.hero");
  if(nav){
    if(!hero){ nav.classList.add("scrolled"); }
    else {
      const onScroll = ()=> nav.classList.toggle("scrolled", window.scrollY > window.innerHeight*0.7);
      window.addEventListener("scroll", onScroll, {passive:true}); onScroll();
    }
  }

  /* ---------- soft scroll reveals ---------- */
  const io = new IntersectionObserver((es)=>es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add("in"); io.unobserve(e.target);} }), {rootMargin:"0px 0px -8% 0px", threshold:.06});
  $$(".reveal").forEach(el=>io.observe(el));

  const veil = $("#veil");
  function reveal(){ if(veil) veil.classList.add("gone"); document.body.classList.add("go"); }
  $$("[data-placeholder]").forEach(a=> a.addEventListener("click", e=> e.preventDefault()));

  /* ---------- footer push-down panels (one open at a time, accordion) ---------- */
  const panelOf = name => $("#panel-"+name);
  function collapse(name){
    const p=panelOf(name); if(!p || !p.classList.contains("open")) return;
    p.style.maxHeight = p.scrollHeight+"px"; void p.offsetHeight;   // pin height, then collapse
    p.classList.remove("open"); p.style.maxHeight = "0px"; p.setAttribute("aria-hidden","true");
    const t=$('[data-panel="'+name+'"]'); if(t) t.setAttribute("aria-expanded","false");
  }
  function openPanel(name, focus){
    const p=panelOf(name); if(!p) return;
    const fresh = !document.querySelector(".panel.open");   // nothing open yet => this is a first open
    $$("[data-panel]").forEach(t=>{ const n=t.dataset.panel; if(n!==name) collapse(n); });   // accordion
    if(name==="reserve") populateSessions();
    p.classList.add("open"); p.style.maxHeight = motionOK ? p.scrollHeight+"px" : "none"; p.setAttribute("aria-hidden","false");
    const t=$('[data-panel="'+name+'"]'); if(t) t.setAttribute("aria-expanded","true");
    setTimeout(()=>{
      // only scroll into view on a first open; when switching between already-open panels, stay
      // put (the links above don't move; the content just swaps below) so the page doesn't jump
      if(fresh) p.scrollIntoView({behavior: motionOK?"smooth":"auto", block:"nearest"});
      if(focus){ const f = p.querySelector("input,select"); if(f){ try{ f.focus({preventScroll:true}); }catch(_){ } } }
    }, 110);
  }
  // when open, lift the height pin so dynamic content (month change, confirm message) can't clip
  $$(".panel").forEach(p=> p.addEventListener("transitionend", e=>{ if(e.propertyName==="max-height" && p.classList.contains("open")) p.style.maxHeight="none"; }));
  $$("[data-panel]").forEach(btn=> btn.addEventListener("click", e=>{ e.preventDefault();
    const name=btn.dataset.panel, p=panelOf(name); (p && p.classList.contains("open")) ? collapse(name) : openPanel(name,true); }));
  document.addEventListener("keydown", e=>{ if(e.key==="Escape") $$("[data-panel]").forEach(t=> collapse(t.dataset.panel)); });

  function populateSessions(){
    const sel = $("#r-date"); if(!sel) return;
    const today=new Date(new Date().toDateString());
    const up = EVENTS.filter(e=>{const [y,m,d]=e.date.split("-").map(Number); return new Date(y,m-1,d)>=today;});
    sel.innerHTML=(up.length?up:EVENTS).map(e=>`<option value="${e.date}">${fmtLong(e.date)}${e.sound?" — "+e.sound:""}</option>`).join("");
  }

  /* deep link (#calendar / #reserve / #contact) — open after arrival */
  (function(){
    const name = location.hash.replace(/^#(panel-)?/, "");
    if(!name || !panelOf(name)) return;
    const go = ()=> setTimeout(()=> openPanel(name, true), 350);
    if(document.body.classList.contains("go")) go();
    else { const obs=new MutationObserver(()=>{ if(document.body.classList.contains("go")){ obs.disconnect(); go(); } }); obs.observe(document.body,{attributes:true,attributeFilter:["class"]}); }
  })();

  /* ---------- calendar render ---------- */
  function renderCalendar(){
    const host = $("#events"); if(!host) return;
    const detailed = EVENTS.filter(e=>e.sound);
    host.innerHTML = detailed.map(e=>{
      const roles = [ e.sound?`<b>Sound</b> — ${e.sound}`:"" , ...(e.extra||[]).map(roleLine) ].filter(Boolean).map(r=>`<div>${r}</div>`).join("");
      const recap = e.recap?`<a class="ev-recap" href="${e.recap}">tracklist &amp; recap →</a>`:"";
      return `<div class="event-card" data-date="${e.date}"><div class="date">${fmtLong(e.date)} · ${e.time}</div>${e.theme?`<div class="etitle">${e.theme}</div>`:""}<div class="roles">${roles}</div>${recap}</div>`;
    }).join("");
    let vy=2026, vm=7;
    function highlight(d){ if(!d) return; clear(); $$(`[data-date="${d}"]`).forEach(el=>{ if(el.classList.contains("day")||el.classList.contains("event-card")) el.classList.add("is-active"); }); }
    function clear(){ $$(".is-active").forEach(el=>el.classList.remove("is-active")); }
    function month(){
      $("#mname").textContent = `${MONTHS[vm-1]} ${vy}`;
      const first=new Date(vy,vm-1,1).getDay(), days=new Date(vy,vm,0).getDate(); let cells=[];
      for(let i=0;i<first;i++) cells.push(`<td><div class="day empty">·</div></td>`);
      for(let d=1;d<=days;d++){ const iso=`${vy}-${String(vm).padStart(2,"0")}-${String(d).padStart(2,"0")}`; const ev=byDate[iso];
        cells.push(`<td><div class="${ev?`day event ${ev.kind}`:"day"}" data-date="${ev?iso:""}">${d}</div></td>`); }
      while(cells.length%7) cells.push(`<td><div class="day empty">·</div></td>`);
      let rows=""; for(let i=0;i<cells.length;i+=7) rows+=`<tr>${cells.slice(i,i+7).join("")}</tr>`;
      const body=$("#calbody"); body.innerHTML=rows;
      $$(".day.event",body).forEach(el=>{ el.addEventListener("mouseenter",()=>highlight(el.dataset.date)); el.addEventListener("mouseleave",clear);
        el.addEventListener("click",()=>{ const c=$(`.event-card[data-date="${el.dataset.date}"]`); if(c){ c.scrollIntoView({behavior:"smooth",block:"center"}); highlight(el.dataset.date);} }); });
    }
    $("#prev").onclick=()=>{ vm--; if(vm<1){vm=12;vy--;} month(); };
    $("#next").onclick=()=>{ vm++; if(vm>12){vm=1;vy++;} month(); };
    $$(".event-card",host).forEach(c=>{ c.addEventListener("mouseenter",()=>highlight(c.dataset.date)); c.addEventListener("mouseleave",clear); });
    month();
  }
  renderCalendar();

  /* ---------- reserve: party dots + slide to reserve + confirmation ---------- */
  const reserve = $("#panel-reserve");
  if(reserve){
    const sel = $("#r-date", reserve);
    const dots = $$(".dot", reserve);
    dots.forEach((d,i)=> d.addEventListener("click", ()=>{ dots.forEach((x,j)=>x.classList.toggle("on", j<=i)); }));
    dots.forEach((x,j)=>x.classList.toggle("on", j<1));   // default: party of 1
    populateSessions();

    /* slide to reserve — a circular dial. Drag the dot counter-clockwise from 12 o'clock,
       a full turn back to 12, to confirm. Progress is tracked in degrees CCW from the top. */
    const circ=$(".rcirc", reserve);
    if(circ){
      const svg=$("svg", circ), prog=$(".rc-prog", circ), thumb=$(".rc-thumb", circ), label=$(".rc-label", circ);
      const CX=74, CY=74, R=58;
      let dragging=false, progress=0, prevAng=0, done=false, raf=0;
      const rad=d=> d*Math.PI/180;
      const ptAt=p=>{ const a=rad(p); return [CX - R*Math.sin(a), CY - R*Math.cos(a)]; };       // p° CCW from top
      function angOf(e){ const r=svg.getBoundingClientRect();
        const sx=(e.clientX-r.left)/r.width*148, sy=(e.clientY-r.top)/r.height*148;
        return [(Math.atan2(-(sx-CX), -(sy-CY))*180/Math.PI+360)%360, Math.hypot(sx-CX, sy-CY)]; }
      function arcPath(p){ if(p<=0.5) return ""; const [sx,sy]=ptAt(0), [ex,ey]=ptAt(Math.min(p,359.99));
        return "M "+sx+" "+sy+" A "+R+" "+R+" 0 "+(p>180?1:0)+" 0 "+ex+" "+ey; }
      function paint(){ const [tx,ty]=ptAt(progress); thumb.setAttribute("cx",tx); thumb.setAttribute("cy",ty); prog.setAttribute("d", arcPath(progress)); }
      function setP(p){ progress=Math.max(0, Math.min(360, p)); paint(); }
      function complete(){ if(done) return; done=true; circ.classList.add("done"); setP(360); if(label) label.style.opacity="0"; startConfirm(); }
      function onDown(e){ if(done) return; const [a,dist]=angOf(e); if(dist < R*0.45) return;          // ignore presses near the center
        dragging=true; prevAng=a; cancelAnimationFrame(raf); try{circ.setPointerCapture(e.pointerId);}catch(_){} e.preventDefault(); }
      function onMove(e){ if(!dragging) return; const a=angOf(e)[0]; let d=a-prevAng;
        if(d>180) d-=360; else if(d<-180) d+=360; prevAng=a; setP(progress+d);                       // CCW travel accumulates; CW backs it off
        if(progress>=358){ dragging=false; complete(); } }
      function onUp(){ if(!dragging) return; dragging=false; if(progress>=345) complete(); else glideBack(); }
      function glideBack(){ const start=progress, t0=performance.now(); cancelAnimationFrame(raf);
        (function step(now){ const k=Math.min(1,(now-t0)/420), e=1-Math.pow(1-k,3); setP(start*(1-e)); if(k<1) raf=requestAnimationFrame(step); })(performance.now()); }
      paint();
      circ.addEventListener("pointerdown", onDown);
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", ()=>{ if(!dragging) return; dragging=false; glideBack(); });   // iOS/edge-gesture safety: a cancelled drag must not stay armed
      circ.addEventListener("keydown", e=>{ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); complete(); } });
    }

    /* confirmation: black screen + typewriter + elevator sketch */
    const confirmEl=$("#confirm"), cin=$(".confirm-inner");
    const ELEVATOR = '<svg class="elevator" viewBox="0 0 120 162" aria-hidden="true"><rect x="44" y="4" width="32" height="11"/><path d="M54 11 l6 -6 l6 6"/><rect x="12" y="24" width="96" height="134"/><line x1="60" y1="24" x2="60" y2="158"/><line x1="24" y1="40" x2="24" y2="142"/><line x1="96" y1="40" x2="96" y2="142"/></svg>';
    function drawElevator(){ $$("#confirm .elevator *").forEach((el,i)=>{ let len; try{len=el.getTotalLength();}catch(_){len=180;} el.style.strokeDasharray=len; el.style.strokeDashoffset=len; el.style.transition="stroke-dashoffset .8s ease"; el.style.transitionDelay=(i*0.16)+"s"; setTimeout(()=>{ el.style.strokeDashoffset=0; }, 40); }); }
    function typeLines(lines, after){
      let li=0;
      (function nextLine(){
        if(li>=lines.length){ after&&after(); return; }
        const spec=lines[li];
        if(spec.svg){ cin.insertAdjacentHTML("beforeend", spec.svg); drawElevator(); li++; setTimeout(nextLine, spec.wait||1500); return; }
        const p=document.createElement("p"); p.className="cl"+(spec.big?" big":"");
        cin.appendChild(p);
        const cap=document.createElement("span"); cap.className="cap";
        const txt=spec.text; let ci=0;
        (function typeChar(){
          p.textContent=txt.slice(0,ci); p.appendChild(cap);
          if(ci<txt.length){ ci++; setTimeout(typeChar, spec.speed|| (motionOK?34:0)); }
          else { cap.remove(); li++; setTimeout(nextLine, spec.pause||600); }
        })();
      })();
    }
    /* stopgap so reservations aren't lost before the email backend exists — capture locally.
       TODO: POST to the reservations endpoint + send an email confirmation once the shared
       email backend exists (the Worker being built for the bringrecords newsletter). */
    function captureReservation(date){
      const party = $$(".dot.on", reserve).length;
      const rec = { date, dateLabel: fmtLong(date), party,
        name:(($("#r-name",reserve)||{}).value||"").trim(),
        email:(($("#r-email",reserve)||{}).value||"").trim(),
        note:(($("#r-note",reserve)||{}).value||"").trim(),
        at:new Date().toISOString() };
      try{ const all=JSON.parse(localStorage.getItem("fugueReservations")||"[]"); all.push(rec); localStorage.setItem("fugueReservations", JSON.stringify(all)); }catch(_){}
      console.info("[reserve] captured locally — no email backend yet:", rec);
    }
    function startConfirm(){
      const date = sel.value || EVENTS[0].date;
      captureReservation(date);
      cin.innerHTML="";
      confirmEl.style.transition="";              // (fast CSS fade-in; finishReserve slows the fade-out)
      confirmEl.style.display="flex";
      setTimeout(()=> confirmEl.classList.add("show"), 30);
      const lines = [
        {text: fmtLong(date)+" · 11am–4pm", big:true, speed:52, pause:550},
        {text:"132 Mulberry St #4C, New York, NY 10013", speed:20, pause:750},
        {svg: ELEVATOR, wait:1700},
        {text:"Look for the laser-cut ✱ sign beside the elevator.", speed:24, pause:600},
        {text:"Take the elevator to the fourth floor.", speed:24, pause:600},
        {text:"Come with an open heart.", speed:34, pause:750},
        {text:"We look forward to seeing you soon.", speed:34, pause:1400},
      ];
      typeLines(lines, ()=> setTimeout(finishReserve, 1300));
    }
    function finishReserve(){
      try{ localStorage.setItem("fugueReserved","1"); }catch(_){}
      document.body.classList.add("reserved");
      spinDir = -1;                               // the asterisk now turns the other way
      collapse("reserve");
      const fl=$(".flinks .flink"); if(fl){ try{ fl.focus({preventScroll:true}); }catch(_){ } }   // don't orphan keyboard focus when the dial is removed
      confirmEl.style.display="flex";             // keep painted while it fades
      confirmEl.style.transition = motionOK ? "opacity 2.4s ease" : "none";   // slow, gradual return — but honor reduced motion
      void confirmEl.offsetHeight;                // commit the transition before the fade starts
      confirmEl.classList.remove("show");
      setTimeout(()=>{ confirmEl.style.display="none"; confirmEl.style.transition=""; cin.innerHTML=""; }, motionOK ? 2600 : 60);
    }
  }

  /* ---------- contact (first pass: opens your mail client) ---------- */
  const cForm = $(".c-form");
  if(cForm){
    cForm.addEventListener("submit", e=>{
      e.preventDefault();
      const name=(($("#c-name")||{}).value||"").trim(), email=(($("#c-email")||{}).value||"").trim(), message=(($("#c-msg")||{}).value||"").trim();
      const subject = "the Clearing — a note" + (name?(" from "+name):"");
      const body = (message?message+"\n\n":"") + "— " + (name||"") + (email?(" ("+email+")"):"");
      window.location.href = "mailto:frasier.sha@gmail.com?subject="+encodeURIComponent(subject)+"&body="+encodeURIComponent(body);
    });
  }

  /* ---------- arrival choreography / loader ---------- */
  const loader = $("#loader");
  let played=false; try{ played = sessionStorage.getItem("fugueLoaded")==="1"; }catch(_){}

  if(loader && motionOK && !played){
    try{ sessionStorage.setItem("fugueLoaded","1"); }catch(_){}
    if(veil) veil.classList.add("gone");          // loader does the reveal, not the veil
    runLoader();
  } else {
    if(loader) loader.style.display="none";
    setTimeout(reveal, 40);
  }

  function runLoader(){
   try{
    const svg = $("#loader svg");
    const W = window.innerWidth, H = window.innerHeight;
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    const rnd=(a,b)=>a+Math.random()*(b-a);
    // a jittered grid so the strokes cover the ENTIRE screen, filled in scattered order
    const cols=Math.max(7, Math.round(W/175)), rows=Math.max(6, Math.round(H/150));
    const cw=W/cols, ch=H/rows, cells=[];
    for(let r=0;r<rows;r++) for(let c=0;c<cols;c++) cells.push([c,r]);
    for(let i=cells.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); const t=cells[i]; cells[i]=cells[j]; cells[j]=t; }
    const frag = [];
    cells.forEach(([c,r])=>{
      const x=(c+rnd(.12,.88))*cw, y=(r+rnd(.12,.88))*ch, s=rnd(38, Math.min(cw,ch)*1.15), dir=Math.random()<.5?1:-1;
      const d = `M ${x} ${y} c ${dir*s*.5} ${-s*.7}, ${dir*s*1.1} ${-s*.2}, ${dir*s*1.3} ${s*.35} s ${-dir*s*.3} ${s*.8}, ${-dir*s*.1} ${s*1.05}`;
      frag.push(`<path class="note" d="${d}"/>`);
      if(Math.random()<.7){ const rr=rnd(4,9); frag.push(`<ellipse class="note" cx="${x}" cy="${y}" rx="${rr*1.3}" ry="${rr}" transform="rotate(${rnd(-25,25)} ${x} ${y})"/>`); }
    });
    svg.innerHTML = frag.join("");
    const notes = $$("#loader .note");
    notes.forEach(el=>{ let len; try{len=el.getTotalLength();}catch(_){len=420;} if(!len||len<1) len=420; el.style.strokeDasharray=len; el.style.strokeDashoffset=len; });
    svg.getBoundingClientRect();   // force a layout flush so the draws animate
    const STEP=13;  // ms between each stroke beginning to draw
    notes.forEach((el,i)=>{ el.style.transition="stroke-dashoffset "+rnd(.16,.26).toFixed(2)+"s ease "+(i*STEP/1000).toFixed(3)+"s"; el.style.strokeDashoffset=0; });
    const allDrawn = notes.length*STEP + 300;
    setTimeout(()=> loader.classList.add("fill"), Math.max(900, allDrawn-250));
    setTimeout(()=> reveal(), allDrawn+450);
    setTimeout(()=> loader.classList.add("done"), allDrawn+520);
    setTimeout(()=>{ loader.style.display="none"; }, allDrawn+1150);
   }catch(e){ if(loader) loader.style.display="none"; reveal(); }
  }
})();
