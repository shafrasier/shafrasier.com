/* ============ The Clearing @ Fugue Gallery — shared behavior ============ */
(function(){
  const motionOK = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.body.classList.add("js");
  const $ = (s,r)=> (r||document).querySelector(s);
  const $$ = (s,r)=> [...(r||document).querySelectorAll(s)];

  /* ---------- events data ---------- */
  const EVENTS = [
    {date:"2026-07-05", kind:"session", time:"11am–4pm", sound:"Sha Frasier", theme:"Tracing a 40-year history of reggae and dub", extra:["Tea — William Hu"]},
    {date:"2026-07-12", kind:"session", time:"11am–4pm", sound:"Joseph Branciforte with Greyfade", theme:"Deep listening with 20 strings", extra:["Movement — Etai Atula · Introduction to Transcendental Meditation (12–2pm)"]},
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
      const vel = Math.abs(y - lastY); lastY = y;             // px scrolled this frame (up or down)
      boost = Math.max(boost * 0.9, Math.min(vel * 0.25, 6)); // spikes with scroll speed, eases back to 0
      a += spinDir * 0.25 * (1 + boost);                      // 0.25 = constant base rate everywhere
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

  /* ---------- page-transition veil ---------- */
  const veil = $("#veil");
  function fadeTo(url){ if(veil) veil.classList.remove("gone"); setTimeout(()=>{ window.location.href=url; }, 540); }
  $$("[data-nav]").forEach(a=> a.addEventListener("click", e=>{ e.preventDefault(); fadeTo(a.getAttribute("data-nav")); }));
  $$("[data-placeholder]").forEach(a=> a.addEventListener("click", e=> e.preventDefault()));

  /* ---------- newsletter: a quiet inline expansion (not a popup) ---------- */
  const nl = $("#newsletter");
  const nlToggle = $("[data-newsletter]");
  if(nl && nlToggle){
    const setAria = open=>{ nlToggle.setAttribute("aria-expanded", open?"true":"false"); nl.setAttribute("aria-hidden", open?"false":"true"); };
    function openNl(focus){
      nl.classList.add("open");
      nl.style.maxHeight = motionOK ? nl.scrollHeight + "px" : "none";
      setAria(true);
      setTimeout(()=>{ nl.scrollIntoView({behavior: motionOK?"smooth":"auto", block:"center"}); if(focus) $("#nl-email", nl).focus({preventScroll:true}); }, 90);
    }
    function closeNl(){
      nl.style.maxHeight = nl.scrollHeight + "px"; void nl.offsetHeight;   // pin current height, then collapse
      nl.classList.remove("open"); nl.style.maxHeight = "0px"; setAria(false);
    }
    nl.addEventListener("transitionend", e=>{ if(e.propertyName==="max-height" && nl.classList.contains("open")) nl.style.maxHeight = "none"; });
    nlToggle.addEventListener("click", e=>{ e.preventDefault(); nl.classList.contains("open") ? closeNl() : openNl(true); });
    // deep link (#newsletter): wait for the loader/arrival to finish, then open into view
    if(location.hash === "#newsletter"){
      if(document.body.classList.contains("go")) openNl(true);
      else{
        const obs = new MutationObserver(()=>{ if(document.body.classList.contains("go")){ obs.disconnect(); setTimeout(()=> openNl(true), 350); } });
        obs.observe(document.body, {attributes:true, attributeFilter:["class"]});
      }
    }

    /* Backend: set NEWSLETTER.endpoint to your Cloudflare Worker's /subscribe URL to go
       live (see newsletter/ in the repo for the Worker, schema, and deploy guide). It
       accepts the JSON record below. Until an endpoint is set, this runs in CONCEPT
       mode: it validates and captures to localStorage (key "fugueNewsletter") so
       nothing is lost. */
    const NEWSLETTER = { endpoint:"" };
    const form = $(".nl-form", nl), msg = $(".nl-msg", nl);
    const slide = $(".nl-slide", nl), dot = $(".nl-dot", nl), word = $(".nl-word", nl);
    // setting a message also lifts the height pin so the panel can't clip it mid-animation
    const say = (t,cls)=>{ msg.textContent = t; msg.className = "nl-msg" + (cls?" "+cls:""); if(nl.classList.contains("open")) nl.style.maxHeight = "none"; };
    function subscribe(rec){
      if(!NEWSLETTER.endpoint){
        try{ const all = JSON.parse(localStorage.getItem("fugueNewsletter")||"[]"); all.push(rec); localStorage.setItem("fugueNewsletter", JSON.stringify(all)); }catch(e){}
        console.info("[newsletter] concept mode — no endpoint set; captured locally:", rec);
        return new Promise(r=> setTimeout(r, 600));
      }
      return fetch(NEWSLETTER.endpoint, {method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(rec)})
        .then(r=>{ if(!r.ok) throw new Error("HTTP "+r.status); });
    }

    /* slide to subscribe — drag the dot to the right end (the serif "subscribe") */
    let dragging=false, originX=0, x=0, maxX=0, done=false;
    const measure = ()=>{ maxX = slide.clientWidth - dot.offsetWidth; };
    function place(v){ x = Math.max(0, Math.min(maxX, v)); dot.style.transform = "translateX("+x+"px)";
      if(word){ const p = maxX ? x/maxX : 0; word.style.opacity = String(Math.max(0, 1 - p*1.5)); } }
    function resetSlide(){ done=false; slide.classList.remove("done"); dot.style.transition=""; place(0); if(word) word.style.opacity=""; }
    function onDown(e){ if(done) return; measure(); dragging=true; dot.style.transition="none"; originX = e.clientX - x;
      if(e.pointerId!=null && dot.setPointerCapture){ try{ dot.setPointerCapture(e.pointerId); }catch(_){ } } e.preventDefault(); }
    function onMove(e){ if(!dragging) return; place(e.clientX - originX); }
    function onUp(){ if(!dragging) return; dragging=false; dot.style.transition=""; if(x >= maxX-2) complete(); else place(0); }
    function complete(){ if(done) return; done=true; slide.classList.add("done"); measure(); place(maxX); fire(); }
    function fire(){
      const email = $("#nl-email", nl).value.trim(), firstName = $("#nl-first", nl).value.trim(), lastName = $("#nl-last", nl).value.trim();
      if($(".nl-hp", nl).value){ say("Please see your email to confirm receipt.", "ok"); return; }   // honeypot: feign success
      if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){ resetSlide(); say("Please enter your email above first.", "err"); $("#nl-email", nl).focus(); return; }
      say("One moment…");
      subscribe({ email, firstName, lastName, source:"fugue-concept", subscribedAt:new Date().toISOString(), page:location.pathname })
        .then(()=> say("Please see your email to confirm receipt.", "ok"))
        .catch(err=>{ console.error("[newsletter] subscribe failed:", err); resetSlide(); say("Something went wrong. Please try again.", "err"); });
    }
    dot.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    slide.addEventListener("keydown", e=>{ if(e.key==="Enter" || e.key===" "){ e.preventDefault(); complete(); } });
    form.addEventListener("submit", e=>{ e.preventDefault(); complete(); });   // Enter in a field also subscribes
    window.addEventListener("resize", ()=>{ if(!dragging && !done){ measure(); place(x); } });
  }

  /* ---------- calendar (calendar page) ---------- */
  function renderCalendar(){
    const host = $("#events"); if(!host) return;
    const detailed = EVENTS.filter(e=>e.sound);
    host.innerHTML = detailed.map(e=>{
      const roles = [ e.sound?`<b>Sound</b> — ${e.sound}`:"" , ...(e.extra||[]).map(roleLine) ].filter(Boolean).map(r=>`<div>${r}</div>`).join("");
      return `<div class="event-card" data-date="${e.date}"><div class="date">${fmtLong(e.date)} · ${e.time}</div>${e.theme?`<div class="etitle">${e.theme}</div>`:""}<div class="roles">${roles}</div></div>`;
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

  /* ---------- reserve panel ---------- */
  const reserve = $("#reserve");
  if(reserve){
    const sel = $("#r-date");
    let party = 1;
    const dots = $$(".dot");
    dots.forEach((d,i)=> d.addEventListener("click", ()=>{ party=i+1; dots.forEach((x,j)=>x.classList.toggle("on", j<=i)); }));
    function setParty(n){ party=n; dots.forEach((x,j)=>x.classList.toggle("on", j<n)); }
    setParty(1);

    function openReserve(){
      const today=new Date(new Date().toDateString());
      const up = EVENTS.filter(e=>{const [y,m,d]=e.date.split("-").map(Number); return new Date(y,m-1,d)>=today;});
      sel.innerHTML=(up.length?up:EVENTS).map(e=>`<option value="${e.date}">${fmtLong(e.date)}${e.sound?" — "+e.sound:""}</option>`).join("");
      reserve.classList.add("open"); document.body.style.overflow="hidden";
    }
    function closeReserve(){ reserve.classList.remove("open"); document.body.style.overflow=""; }
    $$("[data-reserve]").forEach(b=> b.addEventListener("click", e=>{ e.preventDefault(); openReserve(); }));
    $$("[data-rclose]").forEach(b=> b.addEventListener("click", e=>{ e.preventDefault(); closeReserve(); }));
    document.addEventListener("keydown", e=>{ if(e.key==="Escape" && reserve.classList.contains("open")) closeReserve(); });

    /* slide to reserve */
    const slide=$(".slide"), thumb=$(".slide-thumb"), fillEl=$(".slide-fill");
    let dragging=false, sx=0, x=0, done=false;
    const maxX=()=> slide.clientWidth - thumb.offsetWidth;
    function paint(){ thumb.style.left=x+"px"; fillEl.style.width=(x+thumb.offsetWidth)+"px"; }
    function complete(){ if(done) return; done=true; slide.classList.add("done"); x=maxX(); paint(); startConfirm(); }
    if(thumb){
      thumb.addEventListener("pointerdown", e=>{ if(done) return; dragging=true; sx=e.clientX-x; try{thumb.setPointerCapture(e.pointerId);}catch(_){}});
      window.addEventListener("pointermove", e=>{ if(!dragging) return; x=Math.max(0, Math.min(maxX(), e.clientX-sx)); paint(); });
      window.addEventListener("pointerup", ()=>{ if(!dragging) return; dragging=false; if(x>=maxX()*0.9) complete(); else { x=0; paint(); } });
      thumb.setAttribute("tabindex","0");
      thumb.addEventListener("keydown", e=>{ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); complete(); } });
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

    function startConfirm(){
      const date = sel.value || EVENTS[0].date;
      cin.innerHTML="";
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
      closeReserve();
      confirmEl.style.display="flex";             // keep painted while it fades
      confirmEl.classList.remove("show");
      setTimeout(()=>{ confirmEl.style.display="none"; cin.innerHTML=""; }, 900);
    }
  }

  /* ---------- arrival choreography / loader ---------- */
  function reveal(){ if(veil) veil.classList.add("gone"); document.body.classList.add("go"); }
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
    // pass 1 — hide each stroke (undrawn)
    notes.forEach(el=>{ let len; try{len=el.getTotalLength();}catch(_){len=420;} if(!len||len<1) len=420; el.style.strokeDasharray=len; el.style.strokeDashoffset=len; });
    svg.getBoundingClientRect();   // FORCE a layout flush so the draws actually animate
    // pass 2 — sketch them out one at a time, rapidly, until they take over the whole screen
    const STEP=13;  // ms between each stroke beginning to draw
    notes.forEach((el,i)=>{ el.style.transition="stroke-dashoffset "+rnd(.16,.26).toFixed(2)+"s ease "+(i*STEP/1000).toFixed(3)+"s"; el.style.strokeDashoffset=0; });
    const allDrawn = notes.length*STEP + 300;   // when the last stroke finishes
    setTimeout(()=> loader.classList.add("fill"), Math.max(900, allDrawn-250));  // less and less black, washing to pure white
    setTimeout(()=> reveal(), allDrawn+450);
    setTimeout(()=> loader.classList.add("done"), allDrawn+520);
    setTimeout(()=>{ loader.style.display="none"; }, allDrawn+1150);
   }catch(e){ if(loader) loader.style.display="none"; reveal(); }
  }
})();
