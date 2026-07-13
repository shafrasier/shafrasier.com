/* ─────────────────────────────────────────────────────────────────────────
   the Woodshed — MAP theory sound engine v2 (labs prototype)
   Hand-rolled Web Audio, no dependencies. One engine, five widget types,
   every widget mounted from a declarative spec — the shape a THEORY note
   would author in a fenced block for the production transformer.

     Woodshed.mount(el, spec)      spec.widget: groove | beatlab | scalebench
                                                | traderow | palette
     Woodshed.taste(id, onstop)    headless 2–12 bar loop for landing chips
     Woodshed.demos                the six specs for the existing notes
   ───────────────────────────────────────────────────────────────────────── */
window.Woodshed = (() => {

  // ── music math ──────────────────────────────────────────────────────────
  const NOTES = ["C","C♯","D","E♭","E","F","F♯","G","A♭","A","B♭","B"];
  const KEYS  = { E:40, F:41, "F♯":42, G:43, "A♭":44, A:45, "B♭":46, B:47,
                  C:48, "C♯":49, D:50, "E♭":51 };
  // roman numeral → [semitones above tonic, quality]
  const RN = {
    "I":[0,"maj"],  "ii":[2,"min"],  "iii":[4,"min"], "IV":[5,"maj"],
    "V":[7,"maj"],  "vi":[9,"min"],  "vii°":[11,"dim"],
    "i":[0,"min"],  "ii°":[2,"dim"], "♭III":[3,"maj"], "iv":[5,"min"],
    "v":[7,"min"],  "♭VI":[8,"maj"], "♭VII":[10,"maj"],
  };
  const TRIAD = { maj:[0,4,7], min:[0,3,7], dim:[0,3,6] };
  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const pcName = (m) => NOTES[((m % 12) + 12) % 12];

  function parseBars(list) {
    return list.map(b => {
      const rn = typeof b === "string" ? b : b.rn;
      const [off, q] = RN[rn];
      return { rn, off, q,
        borrowed: (typeof b === "object" && b.borrowed) || rn.includes("♭") || false,
        label: (typeof b === "object" && b.label) || null };
    });
  }
  function chordLabel(key, bar, seventh) {
    const name = pcName(KEYS[key] + bar.off);
    return name + (bar.q === "min" ? "m" : bar.q === "dim" ? "°" : "") + (seventh ? "7" : "");
  }

  // ── audio core ──────────────────────────────────────────────────────────
  let AC = null;
  let MUTED = false;
  try { MUTED = localStorage.getItem("woodshed.muted") === "1"; } catch (e) {}
  const ac = () => AC || (AC = new (window.AudioContext || window.webkitAudioContext)());
  const wake = () => { if (ac().state === "suspended") ac().resume(); };
  const master = () => {
    if (!ac()._master) {
      const g = ac().createGain(); g.gain.value = MUTED ? 0 : 0.32; g.connect(ac().destination);
      const comp = ac().createDynamicsCompressor(); comp.connect(g);
      ac()._master = comp; ac()._masterGain = g;
    }
    return ac()._master;
  };
  function setMuted(m) {
    MUTED = !!m;
    try { localStorage.setItem("woodshed.muted", MUTED ? "1" : "0"); } catch (e) {}
    if (AC && AC._masterGain) AC._masterGain.gain.value = MUTED ? 0 : 0.32;
    document.querySelectorAll(".ws-mute").forEach(b => {
      b.classList.toggle("toggled", MUTED);
      b.textContent = MUTED ? "Muted" : "Mute";
    });
  }

  // ── the sampled piano: Salamander Grand (Alexander Holm, CC BY 3.0) ─────
  // Nine samples a tritone apart, C2–C6; every note pitch-shifts from its
  // nearest neighbor (≤3 semitones, inaudible). Loads eagerly on mount;
  // until the buffers land, the synth voice below covers.
  const Sampler = {
    files: { 36:"C2", 42:"Fs2", 48:"C3", 54:"Fs3", 60:"C4", 66:"Fs4", 72:"C5", 78:"Fs5", 84:"C6" },
    base: (document.currentScript && document.currentScript.src || "").replace(/[^/]*$/, "") + "piano/",
    buffers: new Map(), loading: false, ready: false,
    load() {
      if (this.loading) return; this.loading = true;
      const entries = Object.entries(this.files);
      let done = 0;
      entries.forEach(([midi, name]) => {
        fetch(this.base + name + ".mp3")
          .then(r => { if (!r.ok) throw new Error(String(r.status)); return r.arrayBuffer(); })
          .then(buf => ac().decodeAudioData(buf))
          .then(audio => {
            this.buffers.set(+midi, audio);
            if (++done === entries.length) this.ready = true;
          })
          .catch(() => {}); // any miss → stay on the synth voice
      });
    },
  };
  function sampleNote(m, t, dur, vel, out) {
    const c = ac();
    let near = 60, best = 128;
    Sampler.buffers.forEach((_, midi) => {
      const d = Math.abs(m - midi);
      if (d < best) { best = d; near = midi; }
    });
    const src = c.createBufferSource();
    src.buffer = Sampler.buffers.get(near);
    src.playbackRate.value = Math.pow(2, (m - near) / 12);
    const g = c.createGain();
    g.gain.setValueAtTime(vel * 1.1, t);
    g.gain.setValueAtTime(vel * 1.1, t + Math.max(0.02, dur - 0.04));
    g.gain.exponentialRampToValueAtTime(0.001, t + dur + 0.15);
    src.connect(g); g.connect(out || master());
    src.start(t); src.stop(t + dur + 0.25);
  }
  function pianoNote(m, t, dur, vel = 0.5, out) {
    if (Sampler.ready) return sampleNote(m, t, dur, vel, out);
    const c = ac(), g = c.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vel, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    const lp = c.createBiquadFilter(); lp.type = "lowpass";
    lp.frequency.setValueAtTime(2600, t);
    lp.frequency.exponentialRampToValueAtTime(900, t + dur);
    lp.connect(g); g.connect(out || master());
    [["triangle", 0], ["sine", 3]].forEach(([type, det]) => {
      const o = c.createOscillator(); o.type = type;
      o.frequency.value = mtof(m); o.detune.value = det;
      o.connect(lp); o.start(t); o.stop(t + dur + 0.05);
    });
  }
  // a note that BENDS — for the blue-note demo
  function glideNote(m1, m2, t, dur, vel = 0.42, out) {
    const c = ac(), g = c.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vel, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    const lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 2200;
    lp.connect(g); g.connect(out || master());
    const o = c.createOscillator(); o.type = "triangle";
    o.frequency.setValueAtTime(mtof(m1), t);
    o.frequency.setValueAtTime(mtof(m1), t + dur * 0.15);
    o.frequency.linearRampToValueAtTime(mtof(m2), t + dur * 0.75);
    o.connect(lp); o.start(t); o.stop(t + dur + 0.05);
  }
  // a kill-switch bus for pre-scheduled one-shot runs (scale runs, tastes):
  // route notes through it, then ramp to silence when the run must die early
  function runBus() {
    const c = ac(), g = c.createGain();
    g.gain.value = 1; g.connect(master());
    return { node: g, kill() {
      const t = c.currentTime;
      g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t);
      g.gain.linearRampToValueAtTime(0, t + 0.08);
      setTimeout(() => g.disconnect(), 250);
    } };
  }
  function bassNote(m, t, dur, vel = 0.6) {
    const c = ac(), g = c.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vel, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    const lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 700;
    lp.connect(g); g.connect(master());
    const o = c.createOscillator(); o.type = "triangle"; o.frequency.value = mtof(m - 12);
    const o2 = c.createOscillator(); o2.type = "sine"; o2.frequency.value = mtof(m - 24);
    o.connect(lp); o2.connect(lp);
    o.start(t); o.stop(t + dur); o2.start(t); o2.stop(t + dur);
  }
  function noiseBuf() {
    const c = ac();
    if (!c._noise) {
      const b = c.createBuffer(1, c.sampleRate * 0.4, c.sampleRate);
      const d = b.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      c._noise = b;
    }
    return c._noise;
  }
  function burst(t, { type = "bandpass", freq = 1800, q = 0.8, vel = 0.3, decay = 0.1 }) {
    const c = ac(), src = c.createBufferSource(); src.buffer = noiseBuf();
    const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = c.createGain();
    g.gain.setValueAtTime(vel, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + decay);
    src.connect(f); f.connect(g); g.connect(master());
    src.start(t); src.stop(t + decay + 0.05);
  }
  function hat(t, vel = 0.12)  { burst(t, { type:"highpass", freq:7500, vel, decay:0.05 }); }
  function tamb(t, acc=false)  { burst(t, { type:"highpass", freq:8600, vel: acc?0.17:0.10, decay:0.05 });
                                 burst(t+0.02, { type:"highpass", freq:9200, vel: acc?0.10:0.06, decay:0.04 }); }
  function clap(t, vel = 0.26) { burst(t, { freq:1150, q:1.1, vel, decay:0.07 });
                                 burst(t+0.013, { freq:1350, q:1.1, vel:vel*0.7, decay:0.09 }); }
  function snare(t, vel = 0.35) {
    burst(t, { freq:1800, q:0.8, vel, decay:0.14 });
    const c = ac(), o = c.createOscillator(); o.type = "triangle"; o.frequency.value = 190;
    const og = c.createGain(); og.gain.setValueAtTime(vel * 0.5, t);
    og.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    o.connect(og); og.connect(master()); o.start(t); o.stop(t + 0.1);
  }
  function kick(t, vel = 0.5) {
    const c = ac(), o = c.createOscillator(), g = c.createGain();
    o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.09);
    g.gain.setValueAtTime(vel, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    o.connect(g); g.connect(master()); o.start(t); o.stop(t + 0.25);
  }
  // sustained drone (scale bench) — returns a handle with stop()
  function padStart(midis, vel = 0.10) {
    const c = ac(); wake();
    const g = c.createGain(); g.gain.setValueAtTime(0, c.currentTime);
    g.gain.linearRampToValueAtTime(vel, c.currentTime + 0.5);
    const lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 1300;
    lp.connect(g); g.connect(master());
    const oscs = midis.map(m => {
      const o = c.createOscillator(); o.type = "triangle"; o.frequency.value = mtof(m);
      o.connect(lp); o.start(); return o;
    });
    return { stop() {
      const t = c.currentTime;
      g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t);
      g.gain.linearRampToValueAtTime(0, t + 0.35);
      oscs.forEach(o => o.stop(t + 0.45));
    } };
  }
  function strumChord(rootMidi, tones, t, vel = 0.2, dur = 1.5) {
    tones.forEach((iv, i) => pianoNote(rootMidi + iv, t + i * 0.02, dur, vel));
  }

  // ── transport: one player at a time, page-wide ──────────────────────────
  const Transport = {
    active: null,
    claim(inst) { if (this.active && this.active !== inst) this.active.stop(); this.active = inst; },
    release(inst) { if (this.active === inst) this.active = null; },
    stopAll() { if (this.active) this.active.stop(); },
  };

  // beat-based clock; patterns subdivide each beat themselves
  function makeClock(getBpm, scheduleBeat) {
    let timer = null, beat = 0, nextTime = 0;
    return {
      start(fromBeat = 0) {
        wake(); beat = fromBeat; nextTime = ac().currentTime + 0.08;
        clearInterval(timer);
        timer = setInterval(() => {
          while (nextTime < ac().currentTime + 0.12) {
            scheduleBeat(beat, nextTime);
            beat++; nextTime += 60 / getBpm();
          }
        }, 25);
      },
      stop() { clearInterval(timer); timer = null; },
      running: () => timer !== null,
    };
  }

  const beatDur = (S) => 60 / S.bpm;
  // the two 8th positions of a beat (or three, in 12/8)
  function subdiv(t, S) {
    const b = beatDur(S);
    if (S.feel === "triplet") return [t, t + b / 3, t + 2 * b / 3];
    if (S.feel === "swing")   return [t, t + b * 2 / 3];
    return [t, t + b / 2];
  }
  const paintAt = (t, fn) => setTimeout(fn, Math.max(0, (t - ac().currentTime) * 1000));

  // ── pattern library (named, composable — future notes pick by name) ─────
  const COMPS = {
    blues(t, beat, ch, S) {           // lazy stabs: 1, and-of-2, 3
      const stab = (tt, dur) => ch.tones.forEach((iv, i) =>
        pianoNote(ch.root + 12 + iv, tt + i * 0.004, dur, 0.16));
      if (beat === 0 || beat === 2) stab(t, beatDur(S) * 2.2);
      if (beat === 1) stab(subdiv(t, S)[1], beatDur(S) * 1.4);
    },
    doowop(t, beat, ch, S) {          // the "Heart and Soul" triplet roll
      const seq = [ch.tones[0], ch.tones[1], ch.tones[2]];
      const times = S.feel === "triplet" ? subdiv(t, S)
                  : [t, t + beatDur(S) / 3, t + 2 * beatDur(S) / 3];
      times.forEach((tt, i) => pianoNote(ch.root + 12 + seq[i], tt, 0.4, 0.15));
    },
    strum(t, beat, ch, S) {           // rolled chord on 1 and 3
      if (beat === 0 || beat === 2)
        strumChord(ch.root + 12, ch.tones, t, 0.17, beatDur(S) * 2.1);
    },
    stabs(t, beat, ch, S) {           // gospel push: 2 and 4
      if (beat === 1 || beat === 3)
        ch.tones.forEach((iv, i) => pianoNote(ch.root + 12 + iv, t + i * 0.004, 0.5, 0.15));
    },
  };
  const BASSES = {
    boogie(t, beat, ch, S) {          // 1 3 5 6 b7 6 5 3, swung 8ths
      const third = ch.q === "min" ? 3 : 4;
      const line = [0, third, 7, 9, 10, 9, 7, third];
      subdiv(t, S).slice(0, 2).forEach((tt, i) =>
        bassNote(ch.root + line[beat * 2 + i], tt, beatDur(S) * 0.8, 0.5));
    },
    rootfive(t, beat, ch, S) {        // ballad: root on 1, fifth on 3
      if (beat === 0) bassNote(ch.root, t, beatDur(S) * 1.8, 0.55);
      if (beat === 2) bassNote(ch.root + 7 - 12, t, beatDur(S) * 1.8, 0.5);
    },
    pulse(t, beat, ch, S) { bassNote(ch.root, t, beatDur(S) * 0.85, 0.45); },
    root(t, beat, ch, S)  { if (beat === 0) bassNote(ch.root, t, beatDur(S) * 3.6, 0.55); },
  };
  const DRUMS = {
    backbeat(t, beat, S) {            // kick 1·3, snare 2·4, hats on the 8ths
      if (beat === 0 || beat === 2) kick(t); else snare(t);
      subdiv(t, S).forEach(tt => hat(tt));
    },
    march(t, beat, S) {               // the OTHER world: accents on 1 and 3
      if (beat === 0 || beat === 2) { kick(t); clap(t, 0.3); }
      hat(t);
    },
    motown(t, beat, S) {              // four-on-the-floor + stacked 2 & 4
      kick(t);
      if (beat === 1 || beat === 3) { snare(t); clap(t); }
      subdiv(t, S).forEach((tt, i) => tamb(tt, (beat === 1 || beat === 3) && i === 0));
    },
    ballad(t, beat, S) {              // soft brush feel for the 12/8 ballads
      if (beat === 0 || beat === 2) kick(t, 0.32);
      if (beat === 1 || beat === 3) snare(t, 0.13);
      subdiv(t, S).forEach(tt => hat(tt, 0.06));
    },
    claps(t, beat, S) { if (beat === 1 || beat === 3) clap(t); },
  };

  // ── groove core: bars + patterns → sound (shared by widget & tastes) ────
  function grooveCore(S, onBeat) {
    const chordOf = (bar) => {
      const tones = TRIAD[bar.q].slice();
      if (S.seventh) tones.push(10);
      return { root: KEYS[S.key] + bar.off, tones, q: bar.q };
    };
    return (globalBeat, t) => {
      const nBars = S.bars.length;
      const barIdx = Math.floor(globalBeat / 4) % nBars;
      const beat = globalBeat % 4;
      const ch = chordOf(S.bars[barIdx]);
      if (S.voices.drums && S.drums) DRUMS[S.drums](t, beat, S);
      if (S.voices.bass  && S.bass)  BASSES[S.bass](t, beat, ch, S);
      if (S.voices.piano && S.comp)  COMPS[S.comp](t, beat, ch, S);
      if (onBeat) paintAt(t, () => onBeat(barIdx, beat, ch));
    };
  }

  // ── tiny DOM helpers ─────────────────────────────────────────────────────
  const h = (tag, cls, html) => {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    if (html != null) el.innerHTML = html;
    return el;
  };
  const chipRow = (parent, cls = "ws-controls") => { const r = h("div", cls); parent.appendChild(r); return r; };

  function makeButton(row, label, cls = "") {
    const b = h("button", cls, label); row.appendChild(b); return b;
  }
  function makeToggle(row, label, on, fn) {
    const b = makeButton(row, label, on ? "toggled" : "");
    b.addEventListener("click", () => { const v = fn(); b.classList.toggle("toggled", v); });
    return b;
  }
  function makeSelect(row, label, options, value, fn) {
    const wrap = h("div", "ws-ctl", `<label>${label}</label>`);
    const s = document.createElement("select");
    options.forEach(o => { const op = document.createElement("option"); op.textContent = o; s.appendChild(op); });
    s.value = value;
    s.addEventListener("change", () => fn(s.value));
    wrap.appendChild(s); row.appendChild(wrap); return s;
  }
  function makeTempo(row, S, range = [60, 160]) {
    const wrap = h("div", "ws-ctl", `<label>Tempo</label>`);
    const r = document.createElement("input"); r.type = "range";
    r.min = range[0]; r.max = range[1]; r.value = S.bpm;
    const n = h("span", "ws-bpm", String(S.bpm));
    r.addEventListener("input", () => { S.bpm = +r.value; n.textContent = r.value; });
    wrap.appendChild(r); wrap.appendChild(n); row.appendChild(wrap);
  }

  // ── keyboard component ───────────────────────────────────────────────────
  function buildKeyboard(parent, { octaves = 2, onTap = null } = {}) {
    const kb = h("div", "ws-kb");
    const WHITE = [0,2,4,5,7,9,11], BLACK = {0:1, 1:3, 3:6, 4:8, 5:10};
    const els = [];
    const nWhite = 7 * octaves;
    let guard = null; // Set of allowed pcs, or null = all
    for (let oct = 0; oct < octaves; oct++) {
      WHITE.forEach(pc => {
        const w = h("div", "wk", `<span class="nm">${NOTES[pc]}</span>`);
        w.dataset.pc = pc;
        const midi = 60 + oct * 12 + pc;
        w.addEventListener("pointerdown", () => tap(midi, w));
        kb.appendChild(w); els.push(w);
      });
    }
    Object.entries(BLACK).forEach(([wIdx, pc]) => {
      for (let oct = 0; oct < octaves; oct++) {
        const b = h("div", "bk"); b.dataset.pc = pc;
        b.style.left = (((+wIdx + 1 + oct * 7) / nWhite) * 100 - 2.2) + "%";
        const midi = 60 + oct * 12 + +pc;
        b.addEventListener("pointerdown", (e) => { e.stopPropagation(); tap(midi, b); });
        kb.appendChild(b); els.push(b);
      }
    });
    function tap(midi, el) {
      if (guard && !guard.has(midi % 12)) return;   // guardrails: no wrong notes
      wake(); pianoNote(midi, ac().currentTime, 0.9, 0.4);
      if (onTap) onTap(midi);
      el.classList.add("pressed"); setTimeout(() => el.classList.remove("pressed"), 180);
    }
    parent.appendChild(kb);
    return {
      el: kb,
      lit(pcs) { els.forEach(el => el.classList.toggle("lit", pcs.includes(+el.dataset.pc))); },
      mark(pc, cls) { els.forEach(el => el.classList.toggle(cls, +el.dataset.pc === pc)); },
      setGuard(pcs) {
        guard = pcs ? new Set(pcs) : null;
        els.forEach(el => el.classList.toggle("dim", !!guard && !guard.has(+el.dataset.pc)));
      },
      flash(midi) {
        const pc = midi % 12;
        els.filter(el => +el.dataset.pc === pc).forEach(el => {
          el.classList.add("pressed"); setTimeout(() => el.classList.remove("pressed"), 160);
        });
      },
    };
  }

  /* ══════════════════════ WIDGET 1 · groove ═══════════════════════════════
     A chord-cycle player: any form, any patterns. Powers Twelve-bar blues,
     I–vi–IV–V, and the Modal-interchange preset loops. */
  function groove(el, spec) {
    const S = {
      bpm: spec.tempo || 96,
      feel: spec.feel || (spec.swing ? "swing" : "straight"),
      key: spec.key || spec.keys[0],
      seventh: !!spec.seventh,
      voices: { piano: true, bass: true, drums: true },
      bars: parseBars(spec.bars || spec.forms[0].bars),
      comp: spec.comp, bass: spec.bass, drums: spec.drums,
      abOn: false, formIdx: 0,
    };
    const inst = { stop: null };

    // grid
    const gridEl = h("div", "ws-gridwrap"); el.appendChild(gridEl);
    let barEls = [];
    function renderGrid() {
      gridEl.innerHTML = ""; barEls = [];
      const perRow = 4;
      for (let r = 0; r < Math.ceil(S.bars.length / perRow); r++) {
        const row = h("div", "ws-row" + (spec.phraseLabels ? " labeled" : ""));
        if (spec.phraseLabels) row.appendChild(h("div", "ws-rowlabel", spec.phraseLabels[r] || ""));
        S.bars.slice(r * perRow, r * perRow + perRow).forEach((bar, i) => {
          const idx = r * perRow + i;
          const d = h("div", "ws-bar" + (bar.borrowed ? " borrowed" : ""));
          d.innerHTML = `<div class="rn">${bar.rn}</div><div class="ch"></div>` +
            (bar.label ? `<div class="sub">${bar.label}</div>` : "") +
            `<div class="beats"><i></i><i></i><i></i><i></i></div>`;
          d.addEventListener("click", () => { play(idx * 4); });
          row.appendChild(d); barEls.push(d);
        });
        gridEl.appendChild(row);
      }
      paintChordNames();
    }
    function paintChordNames() {
      barEls.forEach((d, i) => d.querySelector(".ch").textContent = chordLabel(S.key, S.bars[i], S.seventh));
    }
    function paintPlayhead(barIdx, beat, ch) {
      if (!clockOn) return;
      barEls.forEach((d, i) => {
        d.classList.toggle("now", i === barIdx);
        d.querySelectorAll(".beats i").forEach((dot, j) => dot.classList.toggle("on", i === barIdx && j <= beat));
      });
      if (kb) {
        kb.lit(ch.tones.map(iv => (ch.root + iv) % 12));
        chordName.textContent = chordLabel(S.key, S.bars[barIdx], S.seventh);
      }
    }

    // controls
    const ctl = chipRow(el);
    const playBtn = makeButton(ctl, "Play", "primary");
    if (spec.keys) makeSelect(ctl, "Key", spec.keys, S.key, v => { S.key = v; paintChordNames(); });
    makeTempo(ctl, S, spec.tempoRange);
    if (spec.swingToggle) makeToggle(ctl, "Shuffle", S.feel === "swing",
      () => { S.feel = S.feel === "swing" ? "straight" : "swing"; return S.feel === "swing"; });
    if (spec.seventhToggle) makeToggle(ctl, "7th chords", S.seventh,
      () => { S.seventh = !S.seventh; paintChordNames(); return S.seventh; });

    // form variants (e.g. standard vs quick-change) and A/B comparisons
    let hintEl = null;
    if (spec.forms || spec.ab) {
      const row = chipRow(el, "ws-controls ws-chips");
      if (spec.forms) {
        const chips = spec.forms.map((f, i) => {
          const b = makeButton(row, f.label, i === 0 ? "toggled" : "");
          b.addEventListener("click", () => {
            S.formIdx = i; S.abOn = false;
            chips.forEach((c, j) => c.classList.toggle("toggled", j === i));
            if (abChip) abChip.classList.remove("toggled");
            S.bars = parseBars(spec.forms[i].bars); renderGrid(); setHint(spec.forms[i].hint);
          });
          return b;
        });
      }
      var abChip = null;
      if (spec.ab) {
        abChip = makeButton(row, spec.ab.label, "amber");
        abChip.addEventListener("click", () => {
          S.abOn = !S.abOn;
          abChip.classList.toggle("toggled", S.abOn);
          S.bars = parseBars(S.abOn ? spec.ab.bars
                   : (spec.forms ? spec.forms[S.formIdx].bars : spec.bars));
          renderGrid(); setHint(S.abOn ? spec.ab.hint : null);
        });
      }
      hintEl = h("div", "ws-hint"); el.appendChild(hintEl);
    }
    function setHint(text) { if (hintEl) hintEl.textContent = text || ""; }

    // voices
    const vr = chipRow(el, "ws-voices");
    [["piano","Piano"],["bass","Bass"],["drums","Drums"]].forEach(([k, lab]) => {
      if ((k === "piano" && !S.comp) || (k === "bass" && !S.bass) || (k === "drums" && !S.drums)) return;
      makeToggle(vr, lab, true, () => (S.voices[k] = !S.voices[k]));
    });

    // keyboard
    let kb = null, chordName = null;
    if (spec.keyboard !== false) {
      const wrap = h("div", "ws-kbwrap");
      const lab = h("div", "ws-kblabel", `<span>The chord under the playhead</span>`);
      chordName = h("span", "ws-chordname"); lab.appendChild(chordName);
      wrap.appendChild(lab); el.appendChild(wrap);
      kb = buildKeyboard(wrap);
    }

    // transport
    let clockOn = false;
    const schedule = grooveCore(S, paintPlayhead);
    const clock = makeClock(() => S.bpm, schedule);
    function play(fromBeat = 0) {
      Transport.claim(inst); clockOn = true;
      clock.start(fromBeat); playBtn.textContent = "Stop";
    }
    inst.stop = () => {
      clockOn = false; clock.stop(); Transport.release(inst);
      playBtn.textContent = "Play";
      barEls.forEach(d => { d.classList.remove("now"); });
      if (kb) { kb.lit([]); chordName.textContent = ""; }
    };
    playBtn.addEventListener("click", () => clockOn ? inst.stop() : play());

    renderGrid();
    return inst;
  }

  /* ══════════════════════ WIDGET 2 · beatlab ══════════════════════════════
     An editable one-bar drum grid seeded by presets — march vs backbeat vs
     the Motown stack. Powers the Backbeat note. */
  function beatlab(el, spec) {
    const ROWS = [["kick","Kick"],["snare","Snare"],["clap","Claps"],["tamb","Tambourine"],["hat","Hi-hat"]];
    const PLAY = { kick: t => kick(t), snare: t => snare(t), clap: t => clap(t),
                   tamb: t => tamb(t), hat: t => hat(t) };
    const S = { bpm: spec.tempo || 104, feel: "straight", band: true,
                grid: Object.fromEntries(ROWS.map(([k]) => [k, new Set()])) };
    const inst = { stop: null };

    // count header + cells
    const gridEl = h("div", "bl-grid"); el.appendChild(gridEl);
    gridEl.appendChild(h("div", "bl-corner"));
    const COUNT = ["1","&","2","&","3","&","4","&"];
    const countEls = COUNT.map((c, i) => {
      const d = h("div", "bl-count" + (i % 2 === 0 ? " q" : ""), c);
      gridEl.appendChild(d); return d;
    });
    const cellEls = {};
    ROWS.forEach(([k, lab]) => {
      gridEl.appendChild(h("div", "bl-lab", lab));
      cellEls[k] = [];
      for (let p = 0; p < 8; p++) {
        const c = h("button", "bl-cell" + (p % 2 === 0 ? " q" : ""));
        c.addEventListener("click", () => {
          wake();
          if (S.grid[k].has(p)) { S.grid[k].delete(p); c.classList.remove("on"); }
          else { S.grid[k].add(p); c.classList.add("on"); PLAY[k](ac().currentTime); }
          presetChips.forEach(ch => ch.classList.remove("toggled"));
        });
        gridEl.appendChild(c); cellEls[k].push(c);
      }
    });
    function applyGrid(g) {
      ROWS.forEach(([k]) => {
        S.grid[k] = new Set(g[k] || []);
        cellEls[k].forEach((c, p) => c.classList.toggle("on", S.grid[k].has(p)));
      });
    }

    // presets
    const noteEl = h("div", "ws-hint"); // preset explainer
    const pr = chipRow(el, "ws-controls ws-chips");
    const presetChips = (spec.presets || []).map((p, i) => {
      const b = makeButton(pr, p.label, i === spec.presetDefault ? "toggled" : "");
      b.addEventListener("click", () => {
        applyGrid(p.grid); noteEl.textContent = p.note || "";
        presetChips.forEach(c => c.classList.toggle("toggled", c === b));
      });
      return b;
    });
    el.appendChild(noteEl);

    // controls
    const ctl = chipRow(el);
    const playBtn = makeButton(ctl, "Play", "primary");
    makeTempo(ctl, S, spec.tempoRange || [70, 150]);
    makeToggle(ctl, "The band", S.band, () => (S.band = !S.band));

    // band: an A7 vamp so the accents read as FEEL, not just drums
    const bandBeat = (t, beat) => {
      const root = KEYS.A;
      bassNote(root + [0, 0, 7, 0][beat], t, beatDur(S) * 0.85, 0.4);
      if (beat === 0) [0,4,7,10].forEach((iv, i) => pianoNote(root + 12 + iv, t + i * 0.004, beatDur(S) * 1.6, 0.11));
      if (beat === 2) [0,4,7,10].forEach((iv, i) => pianoNote(root + 12 + iv, subdiv(t, S)[1] + i * 0.004, beatDur(S) * 0.9, 0.09));
    };
    function scheduleBeat(globalBeat, t) {
      const beat = globalBeat % 4;
      [0, 1].forEach(i => {
        const pos = beat * 2 + i, tt = subdiv(t, S)[i];
        ROWS.forEach(([k]) => { if (S.grid[k].has(pos)) PLAY[k](tt); });
        paintAt(tt, () => { if (running) countEls.forEach((c, j) => c.classList.toggle("now", j === pos)); });
      });
      if (S.band) bandBeat(t, beat);
    }

    let running = false;
    const clock = makeClock(() => S.bpm, scheduleBeat);
    inst.stop = () => {
      running = false; clock.stop(); Transport.release(inst);
      playBtn.textContent = "Play"; countEls.forEach(c => c.classList.remove("now"));
    };
    playBtn.addEventListener("click", () => {
      if (running) return inst.stop();
      Transport.claim(inst); running = true; clock.start(); playBtn.textContent = "Stop";
    });

    if (spec.presets && spec.presetDefault != null) {
      applyGrid(spec.presets[spec.presetDefault].grid);
      noteEl.textContent = spec.presets[spec.presetDefault].note || "";
    }
    return inst;
  }

  /* ══════════════════════ WIDGET 3 · scalebench ═══════════════════════════
     Scale explorer: major → pentatonic → blues, guardrails, a drone to
     noodle over, and the blue note that has to bend. */
  function scalebench(el, spec) {
    const SCALES = spec.scales;
    const S = { root: spec.root || "A", scale: SCALES[spec.scaleDefault || 0], guard: false };
    const inst = { stop: () => { stopDrone(); stopRun(); } };

    // controls
    const ctl = chipRow(el);
    makeSelect(ctl, "Root", spec.roots, S.root, v => { S.root = v; refresh(); });
    const chips = chipRow(el, "ws-controls ws-chips");
    const scaleChips = SCALES.map((sc, i) => {
      const b = makeButton(chips, sc.label, sc === S.scale ? "toggled" : "");
      b.addEventListener("click", () => {
        S.scale = sc; scaleChips.forEach((c, j) => c.classList.toggle("toggled", SCALES[j] === sc));
        refresh();
      });
      return b;
    });

    const cap = h("div", "ws-cap"); el.appendChild(cap);

    // keyboard
    const wrap = h("div", "ws-kbwrap"); el.appendChild(wrap);
    const kb = buildKeyboard(wrap);

    // action row
    const act = chipRow(el);
    const runBtn = makeButton(act, "▶ Run the scale");
    let drone = null;
    const droneBtn = makeToggle(act, "Drone", false, () => {
      if (drone) { stopDrone(); return false; }
      Transport.claim(inst); // another player starting will silence the drone
      const m = KEYS[S.root];
      drone = padStart([m - 12, m - 5, m + (S.scale.minor ? 3 : 4) + 12], 0.09);
      return true;
    });
    makeToggle(act, "Can't-miss keys", false, () => { S.guard = !S.guard; refresh(); return S.guard; });

    // blue-note demo row (blues scale only)
    const blueRow = chipRow(el, "ws-controls ws-bluerow");
    blueRow.appendChild(h("span", "ws-bluelab", "The ♭5 — the blue note:"));
    const straightBtn = makeButton(blueRow, "Play it straight");
    const bendBtn = makeButton(blueRow, "Bend through it", "amber");

    function stopDrone() { if (drone) { drone.stop(); drone = null; droneBtn.classList.remove("toggled"); } }
    let runTimer = null, run = null;
    function stopRun() {
      if (runTimer) { clearTimeout(runTimer); runTimer = null; }
      if (run) { run.kill(); run = null; }   // silences any pre-scheduled notes
    }

    function pcs() { return S.scale.formula.map(iv => (KEYS[S.root] + iv) % 12); }
    function refresh() {
      kb.lit(pcs());
      kb.setGuard(S.guard ? pcs() : null);
      // amber-mark the blue note when the blues scale is up
      const bluePc = S.scale.blue != null ? (KEYS[S.root] + S.scale.blue) % 12 : -1;
      [...wrap.querySelectorAll(".wk,.bk")].forEach(k =>
        k.classList.toggle("blue", +k.dataset.pc === bluePc));
      blueRow.style.display = S.scale.blue != null ? "" : "none";
      cap.textContent = S.scale.caption;
      if (drone) { stopDrone(); droneBtn.classList.add("toggled");
        const m = KEYS[S.root];
        drone = padStart([m - 12, m - 5, m + (S.scale.minor ? 3 : 4) + 12], 0.09); }
    }

    runBtn.addEventListener("click", () => {
      wake(); Transport.claim(inst); stopRun();
      const bus = runBus(); run = bus;
      const root = 60 + (KEYS[S.root] % 12);
      const seq = [...S.scale.formula, 12];
      const step = 0.28;
      const t0 = ac().currentTime + 0.05;
      seq.forEach((iv, i) => {
        pianoNote(root + iv, t0 + i * step, 0.5, 0.38, bus.node);
        paintAt(t0 + i * step, () => { if (run === bus) kb.flash(root + iv); });
      });
      runTimer = setTimeout(() => { runTimer = null; run = null; }, seq.length * step * 1000 + 400);
    });
    straightBtn.addEventListener("click", () => {
      wake(); const root = 60 + (KEYS[S.root] % 12), t0 = ac().currentTime + 0.05;
      [5, 6, 7].forEach((iv, i) => {
        pianoNote(root + iv, t0 + i * 0.3, i === 2 ? 0.9 : 0.32, 0.4);
        paintAt(t0 + i * 0.3, () => kb.flash(root + iv));
      });
    });
    bendBtn.addEventListener("click", () => {
      wake(); const root = 60 + (KEYS[S.root] % 12), t0 = ac().currentTime + 0.05;
      pianoNote(root + 5, t0, 0.3, 0.4);
      glideNote(root + 5, root + 7, t0 + 0.32, 0.8, 0.42);
      paintAt(t0, () => kb.flash(root + 5));
      paintAt(t0 + 0.5, () => kb.flash(root + 6));
      paintAt(t0 + 0.9, () => kb.flash(root + 7));
    });

    refresh();
    return inst;
  }

  /* ══════════════════════ WIDGET 4 · traderow ═════════════════════════════
     Call and response: the engine calls; the group answers — or YOU do,
     on a keyboard locked to notes that can't miss. */
  function traderow(el, spec) {
    const PENT = [0, 3, 5, 7, 10]; // C minor pentatonic
    const CALL_A = [[0,0],[3,.5],[5,1],[3,1.5],[0,2]];
    const CALL_B = [[7,0],[10,.5],[7,1],[5,1.5],[3,2]];
    const ANSWER = [[10,0],[7,.5],[5,1],[3,1.5],[0,2]];
    const S = { bpm: spec.tempo || 100, feel: "straight", mode: "answer", claps: true };
    const inst = { stop: null };

    // lanes
    const lanes = h("div", "tr-lanes"); el.appendChild(lanes);
    lanes.appendChild(h("div", "tr-lab", "The call"));
    const topBlocks = [0,1,2,3].map(i => {
      const b = h("div", "tr-blk" + (i % 2 === 0 ? " call" : " empty"));
      if (i % 2 === 0) b.textContent = i === 0 ? "call" : "call (varied)";
      lanes.appendChild(b); return b;
    });
    const laneLab2 = h("div", "tr-lab", "The answer"); lanes.appendChild(laneLab2);
    const botBlocks = [0,1,2,3].map(i => {
      const b = h("div", "tr-blk" + (i % 2 === 1 ? " grp" : " empty"));
      if (i % 2 === 1) b.textContent = "answer";
      lanes.appendChild(b); return b;
    });

    // modes
    const mr = chipRow(el, "ws-controls ws-chips");
    const modes = [["echo","Echo"],["answer","Answer"],["you","You answer"]];
    const modeChips = modes.map(([k, lab]) => {
      const b = makeButton(mr, lab, k === S.mode ? "toggled" : "");
      b.addEventListener("click", () => {
        S.mode = k; modeChips.forEach((c, j) => c.classList.toggle("toggled", modes[j][0] === k));
        botBlocks.forEach((blk, i) => {
          if (i % 2 === 1) {
            blk.classList.toggle("you", k === "you");
            blk.textContent = k === "you" ? "your turn" : "answer";
          }
        });
        hint.textContent = spec.modeHints[k] || "";
      });
      return b;
    });
    const hint = h("div", "ws-hint", spec.modeHints[S.mode] || ""); el.appendChild(hint);

    // controls
    const ctl = chipRow(el);
    const playBtn = makeButton(ctl, "Play", "primary");
    makeTempo(ctl, S, [80, 130]);
    makeToggle(ctl, "Claps on 2 & 4", S.claps, () => (S.claps = !S.claps));

    // keyboard, locked to the pentatonic so the answer can't miss
    const wrap = h("div", "ws-kbwrap");
    wrap.appendChild(h("div", "ws-kblabel",
      `<span>Your keys — locked to the C minor pentatonic</span>`));
    el.appendChild(wrap);
    const kb = buildKeyboard(wrap);
    kb.lit(PENT); kb.setGuard(PENT);

    // a pentatonic 4th below — safe gospel harmony inside the scale
    const harmonyOf = (deg) => {
      const i = PENT.indexOf(deg);
      return i >= 2 ? PENT[i - 2] : PENT[i + 3] - 12;
    };
    function phrase(notes, t, harmonized) {
      notes.forEach(([deg, beat]) => {
        const tt = t + beat * beatDur(S);
        pianoNote(72 + deg, tt, 0.5, 0.38);
        if (harmonized) pianoNote(72 + harmonyOf(deg), tt, 0.5, 0.2);
        paintAt(tt, () => running && kb.flash(72 + deg));
      });
    }
    function scheduleBeat(globalBeat, t) {
      const bar = Math.floor(globalBeat / 4) % 4, beat = globalBeat % 4;
      // backing
      if (beat === 0 || beat === 2) kick(t, 0.35);
      if (S.claps && (beat === 1 || beat === 3)) clap(t);
      bassNote(48, t, beatDur(S) * 0.85, 0.32);
      // phrases at bar starts
      if (beat === 0) {
        if (bar % 2 === 0) phrase(bar === 0 ? CALL_A : CALL_B, t, false);
        else if (S.mode === "echo") phrase(bar === 1 ? CALL_A : CALL_B, t, true);
        else if (S.mode === "answer") phrase(ANSWER, t, true);
        // "you" mode: silence — the gap is yours
      }
      paintAt(t, () => {
        if (!running) return;
        topBlocks.forEach((b, i) => b.classList.toggle("now", i === bar && bar % 2 === 0));
        botBlocks.forEach((b, i) => b.classList.toggle("now", i === bar && bar % 2 === 1));
        wrap.classList.toggle("yourturn", S.mode === "you" && bar % 2 === 1);
      });
    }

    let running = false;
    const clock = makeClock(() => S.bpm, scheduleBeat);
    inst.stop = () => {
      running = false; clock.stop(); Transport.release(inst);
      playBtn.textContent = "Play";
      [...topBlocks, ...botBlocks].forEach(b => b.classList.remove("now"));
      wrap.classList.remove("yourturn");
    };
    playBtn.addEventListener("click", () => {
      if (running) return inst.stop();
      Transport.claim(inst); running = true; clock.start(); playBtn.textContent = "Stop";
    });
    return inst;
  }

  /* ══════════════════════ WIDGET 5 · palette ══════════════════════════════
     Modal interchange: the key's seven chords on one shelf, the parallel
     minor's seven next door. Tap to hear; run the famous borrowings and
     flip them back to diatonic. */
  function palette(el, spec) {
    const S = { bpm: spec.tempo || 84, feel: "straight", key: spec.key || "C",
                seventh: false, voices: { piano: true, bass: true, drums: false },
                comp: "strum", bass: "root", drums: null,
                bars: [], loop: null, diatonic: false };
    const inst = { stop: null };
    const FAMOUS = new Set(["♭III", "iv", "♭VI", "♭VII"]);

    function shelf(title, rns, borrowed) {
      const sh = h("div", "pl-shelf");
      sh.appendChild(h("div", "pl-title", title));
      const tiles = h("div", "pl-tiles"); sh.appendChild(tiles);
      rns.forEach(rn => {
        const [off, q] = RN[rn];
        const tile = h("button", "tile" + (borrowed ? " borrowed" : "") + (FAMOUS.has(rn) && borrowed ? " famous" : ""));
        tile.innerHTML = `<span class="trn">${rn}</span><span class="tnm">${chordLabel(S.key, {off, q}, false)}</span>`;
        tile.addEventListener("click", () => {
          wake(); Transport.stopAll();
          const root = KEYS[S.key] + off;
          strumChord(root + 12, TRIAD[q], ac().currentTime, 0.2, 1.6);
          kb.lit(TRIAD[q].map(iv => (root + iv) % 12));
          tile.classList.add("ping"); setTimeout(() => tile.classList.remove("ping"), 700);
          setTimeout(() => { if (!running) kb.lit([]); }, 1400);
        });
        tiles.appendChild(tile);
      });
      el.appendChild(sh);
    }
    shelf(spec.shelfLabels[0], ["I","ii","iii","IV","V","vi","vii°"], false);
    shelf(spec.shelfLabels[1], ["i","ii°","♭III","iv","v","♭VI","♭VII"], true);
    el.appendChild(h("div", "ws-cap", spec.shelfCaption || ""));

    // the famous borrowings, loopable
    el.appendChild(h("div", "pl-title pl-loophead", "Run a famous borrowing"));
    const lr = chipRow(el, "ws-controls ws-chips");
    let loopChips = [];
    const cells = h("div", "pl-cells"); el.appendChild(cells);
    const hint = h("div", "ws-hint"); el.appendChild(hint);
    let cellEls = [];
    function setLoop(loop) {
      S.loop = loop; S.diatonic = false; diaChip.classList.remove("toggled");
      renderCells(); hint.textContent = loop.hint || "";
      loopChips.forEach(c => c.classList.toggle("toggled", c._loop === loop));
    }
    function renderCells() {
      const rns = S.diatonic ? S.loop.swap : S.loop.bars;
      S.bars = parseBars(rns);
      cells.innerHTML = ""; cellEls = [];
      S.bars.forEach(bar => {
        const c = h("div", "plc" + (bar.borrowed && !S.diatonic ? " borrowed" : ""));
        c.innerHTML = `<div class="rn">${bar.rn}</div><div class="ch">${chordLabel(S.key, bar, false)}</div>`;
        cells.appendChild(c); cellEls.push(c);
      });
    }
    spec.loops.forEach((loop, i) => {
      const b = makeButton(lr, loop.label, i === 0 ? "toggled" : "");
      b._loop = loop;
      b.addEventListener("click", () => setLoop(loop));
      loopChips.push(b);
    });

    const ctl = chipRow(el);
    const playBtn = makeButton(ctl, "Play the loop", "primary");
    makeTempo(ctl, S, [60, 120]);
    const diaChip = makeButton(ctl, "Play it diatonic", "amber");
    diaChip.addEventListener("click", () => {
      S.diatonic = !S.diatonic; diaChip.classList.toggle("toggled", S.diatonic);
      renderCells();
      hint.textContent = S.diatonic ? (S.loop.swapHint || "") : (S.loop.hint || "");
    });

    const wrap = h("div", "ws-kbwrap"); el.appendChild(wrap);
    const kb = buildKeyboard(wrap);

    let running = false;
    const schedule = grooveCore(S, (barIdx, beat, ch) => {
      if (!running) return;
      cellEls.forEach((c, i) => c.classList.toggle("now", i === barIdx));
      kb.lit(ch.tones.map(iv => (ch.root + iv) % 12));
    });
    const clock = makeClock(() => S.bpm, schedule);
    inst.stop = () => {
      running = false; clock.stop(); Transport.release(inst);
      playBtn.textContent = "Play the loop";
      cellEls.forEach(c => c.classList.remove("now")); kb.lit([]);
    };
    playBtn.addEventListener("click", () => {
      if (running) return inst.stop();
      Transport.claim(inst); running = true; clock.start(); playBtn.textContent = "Stop";
    });

    setLoop(spec.loops[0]);
    return inst;
  }

  // ── the six specs (what each THEORY note would author) ──────────────────
  const TWELVE_STD  = ["I","I","I","I","IV","IV","I","I","V","IV","I",{rn:"V",label:"turnaround"}];
  const TWELVE_QC   = ["I","IV","I","I","IV","IV","I","I","V","IV","I",{rn:"V",label:"turnaround"}];
  const FIFTIES     = ["I","vi","IV","V"];

  const demos = {
    backbeat: {
      widget: "beatlab", tempo: 104, presetDefault: 1,
      presets: [
        { label: "March (1 & 3)", note: "The old world: weight on one and three. March to it — your left foot knows where to land.",
          grid: { kick:[0,4], clap:[0,4], hat:[0,2,4,6] } },
        { label: "Backbeat (2 & 4)", note: "Earl Palmer's move: the snare takes two and four, loud. The body stops marching and starts moving.",
          grid: { kick:[0,4], snare:[2,6], hat:[0,1,2,3,4,5,6,7] } },
        { label: "The Motown stack", note: "Hitsville redundancy: snare, claps, and tambourine all piled on two and four so the message survives a transistor radio.",
          grid: { kick:[0,2,4,6], snare:[2,6], clap:[2,6], tamb:[0,1,2,3,4,5,6,7], hat:[] } },
      ],
    },
    callresponse: {
      widget: "traderow", tempo: 100,
      modeHints: {
        echo: "The group repeats the call back, harmonized — the ring-shout form.",
        answer: "The group answers with its own line that resolves home — the gospel form.",
        you: "The response bars are YOURS. Play anything while the lane pulses — the keys are locked to notes that can't miss.",
      },
    },
    twelvebar: {
      widget: "groove", tempo: 96, key: "E", keys: ["E","A","G","C","D","B♭"],
      swing: true, swingToggle: true, seventh: true, seventhToggle: true,
      comp: "blues", bass: "boogie", drums: "backbeat",
      phraseLabels: ["A — statement", "A — repeated", "B — the answer"],
      forms: [
        { label: "Standard", bars: TWELVE_STD },
        { label: "Quick-change", bars: TWELVE_QC, hint: "Bar 2 jumps to IV early — the lift arrives before you expect it. Most rock & roll runs this way." },
      ],
    },
    pentatonic: {
      widget: "scalebench", roots: ["A","C","D","E","G"], root: "A", scaleDefault: 2,
      scales: [
        { label: "Major scale", formula: [0,2,4,5,7,9,11],
          caption: "All seven notes. The 4th and the 7th are the restless ones — they pull toward their neighbors. Find them; feel the itch." },
        { label: "Major pentatonic", formula: [0,2,4,7,9],
          caption: "Cut the 4th and the 7th and nothing is left that can clash. This is the scale of folk songs everywhere — the black keys are this scale in F♯." },
        { label: "Minor pentatonic", formula: [0,3,5,7,10], minor: true,
          caption: "The same five-note idea rotated dark: 1, ♭3, 4, 5, ♭7. The scale blues and rock guitarists live inside." },
        { label: "Blues scale", formula: [0,3,5,6,7,10], minor: true, blue: 6,
          caption: "The minor pentatonic plus one deliberately wrong note — the ♭5, in amber. Played straight it clashes; bent through, it's the blues." },
      ],
    },
    fifties: {
      widget: "groove", tempo: 72, key: "C", keys: ["C","G","F","E♭","B♭"],
      feel: "triplet", comp: "doowop", bass: "rootfive", drums: "ballad",
      bars: FIFTIES, tempoRange: [56, 132],
      ab: { label: "Skip the vi", bars: ["I","I","IV","V"],
            hint: "Same three destinations, but the shadow is gone — it walks straight home. The vi is where the yearning lives." },
    },
    modal: {
      widget: "palette", key: "C", tempo: 84,
      shelfLabels: ["In the key — C major's seven chords", "Next door — borrowed from C minor"],
      shelfCaption: "Same tonic, different weather. The amber-dotted four are the borrowings pop reaches for most.",
      loops: [
        { label: "The 'Hey Jude' exhale (♭VII)", bars: ["I","♭VII","IV","I"], swap: ["I","V","IV","I"],
          hint: "I–♭VII–IV–I, the coda's loop (played here in C; the record is in F). The ♭VII is the harmony breathing out.",
          swapHint: "With V in its place the loop tightens back up — dutiful, pointed home. The exhale is gone." },
        { label: "The iv shadow", bars: ["I","IV",{rn:"iv",borrowed:true},"I"], swap: ["I","IV","IV","I"],
          hint: "IV turning to iv: warmth, then dusk falls on the same chord. A shadow that passes in one bar.",
          swapHint: "Straight IV both times — pleasant, and flat. Nothing crosses the sun." },
        { label: "The ♭VI door", bars: ["I","♭VI","♭VII","I"], swap: ["I","IV","V","I"],
          hint: "♭VI has no cousin in the major key at all — a door to somewhere foreign that still walks you home.",
          swapHint: "The diatonic IV–V version: the trip home, without ever leaving the yard." },
      ],
    },
  };

  // ── tastes: headless loops for the landing chips ────────────────────────
  function loopTaste(cfg, onstop) {
    const S = Object.assign({ voices: { piano: true, bass: true, drums: true }, seventh: false }, cfg,
                            { bars: parseBars(cfg.bars) });
    const inst = {};
    const clock = makeClock(() => S.bpm, grooveCore(S, null));
    inst.stop = () => { clock.stop(); Transport.release(inst); if (onstop) onstop(); };
    Transport.claim(inst); clock.start();
    return inst;
  }
  function crTaste(onstop) {
    const S = { bpm: 100, feel: "straight" };
    const PENT = [0,3,5,7,10];
    const CALL = [[0,0],[3,.5],[5,1],[3,1.5],[0,2]], ANS = [[10,0],[7,.5],[5,1],[3,1.5],[0,2]];
    const harm = (d) => { const i = PENT.indexOf(d); return i >= 2 ? PENT[i-2] : PENT[i+3] - 12; };
    const inst = {};
    const clock = makeClock(() => S.bpm, (gb, t) => {
      const bar = Math.floor(gb / 4) % 2, beat = gb % 4;
      if (beat === 0 || beat === 2) kick(t, 0.35);
      if (beat === 1 || beat === 3) clap(t);
      bassNote(48, t, 0.5, 0.32);
      if (beat === 0) (bar === 0 ? CALL : ANS).forEach(([d, b]) => {
        pianoNote(72 + d, t + b * beatDur(S), 0.5, 0.38);
        if (bar === 1) pianoNote(72 + harm(d), t + b * beatDur(S), 0.5, 0.2);
      });
    });
    inst.stop = () => { clock.stop(); Transport.release(inst); if (onstop) onstop(); };
    Transport.claim(inst); clock.start();
    return inst;
  }
  function runTaste(onstop) {
    wake();
    const bus = runBus();
    let done = false, tid = null;
    const inst = { stop: () => {
      if (done) return; done = true;
      clearTimeout(tid); bus.kill();
      Transport.release(inst); if (onstop) onstop();
    } };
    Transport.claim(inst);
    const root = 69; // A
    const seq = [0,3,5,7,10,12];
    const t0 = ac().currentTime + 0.05, step = 0.24;
    seq.forEach((iv, i) => pianoNote(root - 9 + 12 + iv, t0 + i * step, 0.45, 0.38, bus.node));
    const tb = t0 + seq.length * step + 0.1;
    pianoNote(72 + 5, tb, 0.3, 0.4, bus.node);
    glideNote(72 + 5, 72 + 7, tb + 0.3, 0.8, 0.42, bus.node);
    tid = setTimeout(() => inst.stop(), (tb - t0 + 1.4) * 1000);
    return inst;
  }
  const TASTES = {
    backbeat:     (cb) => loopTaste({ bars: ["I"], key: "A", seventh: true, drums: "backbeat", bass: "pulse", comp: null, bpm: 108, feel: "straight" }, cb),
    callresponse: (cb) => crTaste(cb),
    twelvebar:    (cb) => loopTaste({ bars: TWELVE_STD, key: "E", seventh: true, drums: "backbeat", bass: "boogie", comp: "blues", bpm: 116, feel: "swing" }, cb),
    pentatonic:   (cb) => runTaste(cb),
    fifties:      (cb) => loopTaste({ bars: FIFTIES, key: "C", drums: "ballad", bass: "rootfive", comp: "doowop", bpm: 76, feel: "triplet" }, cb),
    modal:        (cb) => loopTaste({ bars: ["I","♭VII","IV","I"], key: "C", drums: null, bass: "root", comp: "strum", bpm: 84, feel: "straight" }, cb),
  };

  // ── public API ───────────────────────────────────────────────────────────
  const WIDGETS = { groove, beatlab, scalebench, traderow, palette };
  // a fixed speaker chip any page can install (state persists per browser)
  function installMuteChip() {
    const b = document.createElement("button");
    b.className = "ws-mute" + (MUTED ? " toggled" : "");
    b.textContent = MUTED ? "Muted" : "Mute";
    b.title = "Silence the Woodshed";
    b.addEventListener("click", () => setMuted(!MUTED));
    document.body.appendChild(b);
    return b;
  }
  return {
    mount(el, spec) { Sampler.load(); return WIDGETS[spec.widget](el, spec); },
    taste(id, onstop) { Sampler.load(); return TASTES[id](onstop); },
    pianoReady: () => Sampler.ready,
    stopAll() { Transport.stopAll(); },
    setMuted, muted: () => MUTED, installMuteChip,
    debug: () => ({ state: AC ? AC.state : "no-ctx", time: AC ? AC.currentTime : 0 }),
    demos,
  };
})();
