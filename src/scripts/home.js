// Scroll-driven flow line and reveals for the home page; the hero canvas is drawn by hero-graph.js.
import "./nav.js";
import { drawHeroGraph } from "./hero-graph.js";

const CYAN = "#7EE3E8";

function roundPath(pts, r) {
  const p = [];
  pts.forEach((q) => {
    const l = p[p.length - 1];
    if (l && Math.hypot(q.x - l.x, q.y - l.y) <= 0.5) {
      if (q.sharp) l.sharp = true;
    } else p.push({ ...q });
  });
  if (!p.length) return "";
  let d = `M${p[0].x},${p[0].y}`;
  for (let i = 1; i < p.length - 1; i++) {
    const a = p[i - 1],
      b = p[i],
      c = p[i + 1];
    const l1 = Math.hypot(b.x - a.x, b.y - a.y),
      l2 = Math.hypot(c.x - b.x, c.y - b.y);
    const cross = (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x);
    if (Math.abs(cross) < 0.01 || b.sharp) {
      d += ` L${b.x},${b.y}`;
      continue;
    }
    const rr = Math.min(r, l1 / 2, l2 / 2);
    const p1 = {
      x: b.x - ((b.x - a.x) / l1) * rr,
      y: b.y - ((b.y - a.y) / l1) * rr,
    };
    const p2 = {
      x: b.x + ((c.x - b.x) / l2) * rr,
      y: b.y + ((c.y - b.y) / l2) * rr,
    };
    d += ` L${p1.x},${p1.y} Q${b.x},${b.y} ${p2.x},${p2.y}`;
  }
  const z = p[p.length - 1];
  return d + ` L${z.x},${z.y}`;
}

class HomeFlow {
  props = {};
  setState(patch) {
    Object.assign(this.state, patch);
    this.componentDidUpdate();
  }
  state = {
    wide: true,
    productsOpen: false,
    scrolled: false,
    menuOpen: false,
    contactOpen: false,
    newsOpen: false,
    contactSent: false,
    newsSent: false,
    busy: false,
  };
  rootRef = { current: null };
  vidAnimRef = { current: null };
  svgRef = { current: null };
  trackRef = { current: null };
  lineRef = { current: null };
  dotRef = { current: null };
  haloRef = { current: null };
  subRef = { current: null };
  canvasRef = { current: null };
  structRef = { current: null };
  bgRef = { current: null };
  underlineRef = { current: null };
  heroLogoRef = { current: null };
  L = 0;
  geo = null;

  componentDidUpdate(...args) {
    this.runVidAnim();
    if (this.componentDidUpdate__x) this.componentDidUpdate__x(...args);
  }

  runVidAnim() {
    const root = this.vidAnimRef.current;
    if (!root || root.__anim || !root.animate) return;
    root.__anim = true;
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      root
        .querySelectorAll('[data-a="node"]')
        .forEach((n) => (n.style.opacity = 1));
      root
        .querySelectorAll('[data-a="edge"],[data-a="link"]')
        .forEach((p) => (p.style.strokeDashoffset = 0));
      return;
    }
    const T = 7000,
      o = { duration: T, iterations: Infinity, fill: "both" };
    const scan = root.querySelector('[data-a="scan"]');
    scan.animate(
      [
        { opacity: 0, transform: "translateY(0px)" },
        { opacity: 1, offset: 0.04 },
        {
          opacity: 1,
          transform: "translateY(182px)",
          offset: 0.34,
          easing: "ease-in-out",
        },
        { opacity: 0, transform: "translateY(182px)", offset: 0.4 },
        { opacity: 0, transform: "translateY(182px)" },
      ],
      o,
    );
    root
      .querySelector('[data-a="link"]')
      .animate(
        [
          { strokeDashoffset: 1 },
          { strokeDashoffset: 1, offset: 0.12 },
          { strokeDashoffset: 0, offset: 0.2 },
          { strokeDashoffset: 0, offset: 0.88 },
          { strokeDashoffset: 1, offset: 0.96 },
          { strokeDashoffset: 1 },
        ],
        o,
      );
    root.querySelectorAll('[data-a="node"]').forEach((n) => {
      const k = +n.dataset.k,
        a = 0.16 + k * 0.07;
      n.animate(
        [
          { opacity: 0, transform: "translateY(8px)" },
          { opacity: 0, transform: "translateY(8px)", offset: a },
          {
            opacity: 1,
            transform: "translateY(0px)",
            offset: a + 0.08,
            easing: "ease-out",
          },
          { opacity: 1, transform: "translateY(0px)", offset: 0.88 },
          { opacity: 0, transform: "translateY(0px)", offset: 0.96 },
          { opacity: 0 },
        ],
        o,
      );
    });
    root.querySelectorAll('[data-a="edge"]').forEach((p) => {
      const k = +p.dataset.k,
        a = 0.42 + k * 0.05;
      p.animate(
        [
          { strokeDashoffset: 1 },
          { strokeDashoffset: 1, offset: a },
          { strokeDashoffset: 0, offset: a + 0.07, easing: "ease-in-out" },
          { strokeDashoffset: 0, offset: 0.88 },
          { strokeDashoffset: 1, offset: 0.96 },
          { strokeDashoffset: 1 },
        ],
        o,
      );
    });
  }

  componentDidMount() {
    setTimeout(() => this.runVidAnim(), 100);
    this.reduced =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const logoSvg =
      this.heroLogoRef.current && this.heroLogoRef.current.querySelector("svg");
    if (logoSvg && logoSvg.getAnimations) {
      logoSvg.getAnimations({ subtree: true }).forEach((a) => a.cancel());
      logoSvg.querySelectorAll("[data-trace]").forEach((n) => n.remove());
      logoSvg
        .querySelectorAll("path")
        .forEach((p) => p.setAttribute("stroke", "#7EE3E8"));
      logoSvg.style.transform = "";
      logoSvg.style.filter = "";
    }
    this.onResize = () => {
      const w = window.innerWidth >= 860;
      if (w !== this.state.wide) this.setState({ wide: w });
      this.layout();
    };
    window.addEventListener("resize", this.onResize);
    this.onResize();
    if (window.ResizeObserver) {
      this.ro = new ResizeObserver(() => this.layout());
      this.ro.observe(this.rootRef.current);
    }
    setTimeout(() => this.layout(), 400);
    if (document.fonts && document.fonts.ready)
      document.fonts.ready.then(() => this.layout());
    this.raf = requestAnimationFrame(this.tick);
    setTimeout(() => {
      this.armed = true;
    }, 800);
  }
  componentWillUnmount() {
    cancelAnimationFrame(this.raf);
    clearInterval(this.poll);
    window.removeEventListener("resize", this.onResize);
    this.ro && this.ro.disconnect();
  }
  get motion() {
    return (this.props.motion ?? true) && !this.reduced;
  }

  layout() {
    const root = this.rootRef.current,
      svg = this.svgRef.current,
      line = this.lineRef.current;
    if (!root || !svg || !line) return;
    const R = root.getBoundingClientRect();
    const W = R.width,
      H = root.scrollHeight;
    svg.setAttribute("width", W);
    svg.setAttribute("height", H);
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    const c = (el) => {
      const b = el.getBoundingClientRect();
      return {
        x: b.left - R.left + b.width / 2,
        y: b.top - R.top + b.height / 2,
        top: b.top - R.top,
      };
    };
    const half = Math.min(W, 1200) / 2,
      gL = W / 2 - half + 12,
      gR = W / 2 + half - 12;
    const nodes = [...root.querySelectorAll("[data-node]")].sort(
      (a, b) => +a.dataset.node - +b.dataset.node,
    );
    if (nodes.length < 2) return;
    const pts = [c(nodes[0])];
    for (let i = 1; i < nodes.length; i++) {
      const p = c(nodes[i - 1]),
        q = c(nodes[i]);
      q.sharp = true;
      const route = nodes[i].dataset.route || (i === 1 ? "early" : "mid");
      const gut = route === "gutter-r" || route === "gutter-l";
      if (!gut && Math.abs(p.x - q.x) < 1) {
        pts.push(q);
        continue;
      }
      if (route === "end") pts.push({ x: p.x, y: q.y }, q);
      else if (route === "gutter-r" || route === "gutter-l") {
        const gx = route === "gutter-r" ? gR : gL;
        pts.push({ x: gx, y: p.y }, { x: gx, y: q.y }, q);
      } else {
        const m = route === "early" ? p.y + 100 : (p.y + q.y) / 2;
        pts.push({ x: p.x, y: m }, { x: q.x, y: m }, q);
      }
    }
    const d = roundPath(pts, 32);
    line.setAttribute("d", d);
    this.trackRef.current.setAttribute("d", d);
    const total = line.getTotalLength();
    line.setAttribute("stroke-dashoffset", 0);
    const N = Math.max(2, Math.ceil(total / 4)),
      lens = [],
      ys = [],
      xs = [];
    for (let i = 0; i <= N; i++) {
      const l = (total * i) / N,
        pt = line.getPointAtLength(l);
      lens.push(l);
      ys.push(pt.y);
      xs.push(pt.x);
    }
    for (let i = 1; i < ys.length; i++)
      if (ys[i] < ys[i - 1]) ys[i] = ys[i - 1];
    const mainNodes = nodes.map((el) => {
      const q = c(el);
      let best = 0,
        bd = 1e9;
      for (let i = 0; i < lens.length; i++) {
        const dd = (xs[i] - q.x) ** 2 + (ys[i] - q.y) ** 2;
        if (dd < bd) {
          bd = dd;
          best = lens[i];
        }
      }
      return { el, len: best, x: q.x, y: q.y };
    });
    const C = [0];
    for (let i = 1; i < lens.length; i++)
      C.push(
        C[i - 1] +
          Math.abs(ys[i] - ys[i - 1]) +
          Math.abs(xs[i] - xs[i - 1]) * 1.4,
      );
    const segs = mainNodes
      .map((n) => {
        const i = Math.round((n.len / total) * N);
        return {
          y: c(n.el).y,
          cost: C[i],
          gapEnd: n.el.dataset.gapEnd === "1",
        };
      })
      .sort((a, b) => a.cost - b.cost);
    segs.forEach((s, k) => {
      if (s.gapEnd && k > 0)
        s.y = Math.max(segs[k - 1].y + 1, s.y - window.innerHeight * 0.32);
    });
    const oy = segs.map((s) => s.y);
    for (let a = 0; a < segs.length; a++) {
      let b = a;
      while (b + 1 < segs.length && oy[b + 1] - oy[b] < 40) b++;
      if (b > a) {
        const C = segs[b].cost - segs[a].cost,
          lo = a > 0 ? segs[a - 1].y + 1 : -1e9;
        const start = Math.max(lo, oy[a] - 0.35 * C);
        for (let k = a; k <= b; k++)
          segs[k].y = start + (segs[k].cost - segs[a].cost) * 0.7;
        a = b;
      } else if (a > 0) segs[a].y = Math.max(segs[a].y, segs[a - 1].y + 1);
    }
    const g = this.subRef.current;
    while (g.firstChild) g.removeChild(g.firstChild);
    const NS = "http://www.w3.org/2000/svg",
      subs = [];
    root.querySelectorAll("[data-src]").forEach((src) => {
      const s = c(src);
      root
        .querySelectorAll(`[data-dst~="${src.dataset.src}"]`)
        .forEach((dst) => {
          const t = c(dst),
            arrow = !!dst.dataset.arrow,
            ey = arrow ? t.y - 9 : t.y,
            dy = ey - s.y;
          const isMain = nodes.includes(src);
          const my = s.y + dy / 2;
          const sd =
            src.dataset.ortho && Math.abs(t.x - s.x) >= 1
              ? roundPath(
                  [s, { x: s.x, y: my }, { x: t.x, y: my }, { x: t.x, y: ey }],
                  28,
                )
              : Math.abs(t.x - s.x) < 1
                ? `M${s.x},${s.y} L${t.x},${ey}`
                : isMain
                  ? `M${s.x},${s.y} C${s.x + (t.x - s.x) * 0.55},${s.y} ${t.x},${s.y + dy * 0.25} ${t.x},${ey}`
                  : `M${s.x},${s.y} C${s.x},${s.y + dy * 0.55} ${t.x},${ey - dy * 0.45} ${t.x},${ey}`;
          const tr = document.createElementNS(NS, "path");
          tr.setAttribute("d", sd);
          tr.setAttribute("fill", "none");
          tr.setAttribute("stroke", "rgba(255,255,255,0.07)");
          tr.setAttribute("stroke-width", "2");
          g.appendChild(tr);
          const lv = document.createElementNS(NS, "path");
          lv.setAttribute("d", sd);
          lv.setAttribute("fill", "none");
          lv.setAttribute("stroke", CYAN);
          lv.setAttribute("stroke-width", "2");
          lv.setAttribute("stroke-linecap", "round");
          g.appendChild(lv);
          const len = lv.getTotalLength();
          lv.setAttribute("stroke-dasharray", `${len} ${len + 10}`);
          lv.setAttribute("stroke-dashoffset", len);
          let ah = null;
          if (arrow) {
            ah = document.createElementNS(NS, "path");
            ah.setAttribute(
              "d",
              `M${t.x - 7},${t.y - 11} L${t.x + 7},${t.y - 11} L${t.x},${t.y + 1} Z`,
            );
            ah.setAttribute("fill", CYAN);
            ah.style.opacity = 0;
            ah.style.transition = "opacity .4s";
            g.appendChild(ah);
          }
          const mn = mainNodes.find((n) => n.el === src);
          const stopM = mainNodes.find((n) => n.el.dataset.stop === "1");
          const syncEnd =
            mn && src.dataset.sync && stopM ? stopM.len + 260 : null;
          const rev =
            mn && !src.dataset.sync
              ? [...dst.parentElement.querySelectorAll("[data-reveal]")]
              : null;
          if (mn) {
            dst.__byBranch = true;
            if (rev) rev.forEach((r) => (r.__byBranch = true));
          }
          tr.style.display = "none";
          subs.push({
            syncEnd,
            lv,
            tr: mn ? null : tr,
            len,
            y0: s.y,
            y1: t.y,
            ah,
            f: -1,
            srcLen: mn ? mn.len : null,
            dst: mn ? dst : null,
            rev,
          });
        });
    });
    const dots = [...root.querySelectorAll('[data-dot="sub"]')]
      .filter((el) => !el.__byBranch)
      .map((el) => ({ el, y: c(el).y }));
    const reveals = [...root.querySelectorAll("[data-reveal]")]
      .filter((el) => !el.__byBranch)
      .map((el) => {
        const b = el.getBoundingClientRect(),
          nd =
            el.parentElement &&
            el.parentElement.querySelector(":scope > div > [data-node]");
        return {
          el,
          top: b.top - R.top - (el.dataset.shown ? 0 : 24),
          anchor: nd ? c(nd).y : null,
        };
      });
    this.trackRef.current.style.display = "none";
    const fs = root.querySelector("#founders"),
      bg = this.bgRef.current;
    if (fs && bg) bg.style.top = fs.getBoundingClientRect().top - R.top + "px";
    const gs = mainNodes.find((n) => n.el.dataset.gapStart === "1"),
      ge = mainNodes.find((n) => n.el.dataset.gapEnd === "1"),
      dv = mainNodes.find((n) => n.el.dataset.divider === "1");
    let div = null;
    if (dv) {
      const mk = (x2) => {
        const p = document.createElementNS(NS, "path");
        p.setAttribute("d", `M${dv.x},${dv.y} L${x2},${dv.y}`);
        p.setAttribute("fill", "none");
        p.setAttribute("stroke", CYAN);
        p.setAttribute("stroke-width", "2");
        p.setAttribute("stroke-linecap", "round");
        g.appendChild(p);
        const l = Math.abs(x2 - dv.x);
        p.setAttribute("stroke-dasharray", `${l} ${l + 10}`);
        p.setAttribute("stroke-dashoffset", l);
        return { p, l };
      };
      div = { len: dv.len, parts: [mk(0), mk(W)], f: -1 };
    }
    root.querySelectorAll("[data-dot]").forEach((el) => {
      if (!el.__on) el.style.opacity = 0;
    });
    const mob = !this.state.wide;
    mainNodes.forEach((n) => {
      n.el.__mHide = mob && gs && n.len <= gs.len + 1;
      if (n.el.__mHide) {
        n.el.style.opacity = 0;
      }
    });
    subs.forEach((s) => {
      if (s.srcLen != null) s.lv.style.display = mob ? "none" : "";
    });
    this.mob = mob;
    subs.forEach((s) => {
      s.mOn = null;
    });
    const stopN = mainNodes.find((n) => n.el.dataset.stop === "1");
    this.geo = {
      gapA: gs ? gs.len : null,
      gapB: ge ? ge.len : null,
      div,
      stopLen: stopN ? stopN.len : total,
      total,
      lens,
      ys,
      C,
      segs,
      mainNodes,
      subs,
      dots,
      reveals,
    };
    const hero = this.canvasRef.current;
    if (hero) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2),
        w = hero.clientWidth,
        h = hero.clientHeight;
      hero.width = w * dpr;
      hero.height = h * dpr;
      this.cv = { w, h, dpr };
      this.drawHero(performance.now(), true);
    }
    this.update(true);
  }

  setDot(el, on, burst) {
    if (el.__mHide) {
      el.__on = on;
      el.style.opacity = 0;
      return;
    }
    if (!!el.__on === on) return;
    el.__on = on;
    if (on && burst && this.armed && this.motion) {
      const R = this.rootRef.current.getBoundingClientRect(),
        b = el.getBoundingClientRect();
      this.burst(
        b.left - R.left + b.width / 2,
        b.top - R.top + b.height / 2,
        el.dataset.shape,
      );
    }
    el.style.transition =
      "opacity .5s ease, background .6s, box-shadow .6s, border-color .6s";
    el.style.opacity = on ? 1 : 0;
    el.style.background = on ? CYAN : "#1F2130";
    el.style.borderColor = on ? CYAN : "rgba(126,227,232,0.45)";
    el.style.boxShadow = on
      ? "0 0 0 6px rgba(126,227,232,0.12), 0 0 22px rgba(126,227,232,0.55)"
      : "none";
  }

  update(snap) {
    const G = this.geo,
      root = this.rootRef.current;
    if (!G || !root) return;
    const R = root.getBoundingClientRect(),
      vh = window.innerHeight;
    const remaining = R.bottom - vh;
    const f = 0.5 + 0.5 * Math.min(1, Math.max(0, 1 - remaining / (vh * 0.7)));
    const sc = Math.max(0, -R.top);
    const S = G.segs;
    const headY = Math.max(-R.top + vh * f, sc > 4 ? S[0].y + sc * 0.6 : 0);
    let cost;
    if (headY <= S[0].y) cost = 0;
    else if (headY >= S[S.length - 1].y) cost = S[S.length - 1].cost;
    else {
      let k = 0;
      while (k < S.length - 2 && headY >= S[k + 1].y) k++;
      const fr = (headY - S[k].y) / Math.max(1, S[k + 1].y - S[k].y);
      cost = S[k].cost + fr * (S[k + 1].cost - S[k].cost);
    }
    let lo = 0,
      hi = G.C.length - 1;
    while (lo < hi) {
      const m = (lo + hi + 1) >> 1;
      if (G.C[m] <= cost) lo = m;
      else hi = m - 1;
    }
    const started = sc > 4;
    const target = started ? Math.max(1, G.lens[lo]) : 0;
    const n0 = G.mainNodes[0].el;
    if (n0.__vis !== started) {
      n0.__vis = started;
      n0.style.transition =
        "opacity .6s ease, background .6s, box-shadow .6s, border-color .6s";
      n0.style.opacity = started ? 1 : 0;
    }
    const inGap =
      G.gapA != null &&
      G.gapB != null &&
      this.L > G.gapA + 1 &&
      this.L < G.gapB - 1;
    const vis =
      (this.L > 0.5 || started) &&
      !inGap &&
      !(this.mob && G.gapA != null && this.L <= G.gapA + 1) &&
      (this.L <= G.stopLen + 1 || this.L >= G.total - 1)
        ? 1
        : 0;
    this.dotRef.current.style.opacity = vis;
    this.haloRef.current.style.opacity = vis * 0.55;
    this.L =
      (snap && this.L === 0) || !this.motion
        ? target
        : this.L + (target - this.L) * 0.085;
    if (Math.abs(target - this.L) < 0.3) this.L = target;
    const line = this.lineRef.current;
    const big = G.total * 2 + 10,
      Ld = Math.min(this.L, G.stopLen);
    if (this.mob && G.gapB != null) {
      const b = Math.max(0, Ld - G.gapB);
      line.setAttribute("stroke-dasharray", `0 ${G.gapB} ${b} ${big}`);
    } else if (G.gapA != null && G.gapB != null && Ld > G.gapA) {
      const a = G.gapA,
        b = Math.max(0, Ld - G.gapB);
      line.setAttribute(
        "stroke-dasharray",
        b > 0 ? `${a} ${G.gapB - a} ${b} ${big}` : `${a} ${big}`,
      );
    } else line.setAttribute("stroke-dasharray", `${Ld} ${big}`);
    const bgEl = this.bgRef.current;
    const bgOn = !!bgEl && -R.top + vh > parseFloat(bgEl.style.top || "1e9");
    if (bgEl && bgEl.__on !== bgOn) {
      bgEl.__on = bgOn;
      bgEl.style.transition = "opacity 3.2s ease";
      bgEl.style.opacity = bgOn ? 1 : 0;
    }
    const ul = this.underlineRef.current,
      ulOn = this.L >= G.stopLen - 3 && G.stopLen < G.total;
    if (ul && ul.__on !== ulOn) {
      ul.__on = ulOn;
      ul.style.width = ulOn ? "160px" : "0px";
    }
    if (G.div) {
      const df = Math.min(1, Math.max(0, (this.L - G.div.len) / 360));
      if (df !== G.div.f) {
        G.div.f = df;
        G.div.parts.forEach((o) =>
          o.p.setAttribute("stroke-dashoffset", o.l * (1 - df)),
        );
        if (this.bgRef.current) this.bgRef.current.style.opacity = df;
      }
    }

    const pt = line.getPointAtLength(Math.min(this.L, G.total));
    this.dotRef.current.setAttribute("cx", pt.x);
    this.dotRef.current.setAttribute("cy", pt.y);
    this.haloRef.current.setAttribute("cx", pt.x);
    this.haloRef.current.setAttribute("cy", pt.y);
    const dy = pt.y;
    G.mainNodes.forEach((n) => {
      const on = this.L >= n.len - 3 && (n.len > 5 || started);
      if (
        on &&
        !n.el.__on &&
        !n.el.__mHide &&
        this.armed &&
        this.motion &&
        n !== G.mainNodes[0] &&
        n.el.dataset.gapEnd !== "1"
      )
        this.burst(n.x, n.y, n.el.dataset.shape);
      this.setDot(n.el, on);
    });
    this.stepBursts();
    G.dots.forEach((n) => this.setDot(n.el, dy >= n.y - 1, true));
    if (this.mob) {
      G.subs.forEach((s) => {
        if (s.srcLen == null || s.syncEnd) return;
        const on = s.dst.getBoundingClientRect().top < vh * 0.88;
        if (on === s.mOn) return;
        s.mOn = on;
        this.setDot(s.dst, on, false);
        (s.rev || []).forEach((el) => {
          el.style.transition = "opacity .7s ease, transform .7s ease";
          el.style.opacity = on ? 1 : 0;
          el.style.transform = on ? "none" : "translateY(16px)";
        });
      });
    }
    G.subs.forEach((s) => {
      if (this.mob && s.srcLen != null && !s.syncEnd) return;
      const fr =
        s.srcLen != null
          ? Math.min(
              1,
              Math.max(
                0,
                (this.L - s.srcLen) /
                  Math.max(1, s.syncEnd ? s.syncEnd - s.srcLen : 420),
              ),
            )
          : Math.min(1, Math.max(0, (dy - s.y0) / Math.max(1, s.y1 - s.y0)));
      const reached = s.dst ? this.L >= s.srcLen - 3 : false;
      if (Math.abs(fr - s.f) < 0.0005 && reached === s.rc) return;
      s.f = fr;
      s.rc = reached;
      if (s.dst) {
        if (s.dst.dataset.dot) this.setDot(s.dst, fr > 0.97, true);
      }
      if (s.rev)
        s.rev.forEach((el, j) => {
          const q = Math.min(1, Math.max(0, (fr - 0.1 - j * 0.15) / 0.6));
          el.style.transition = "none";
          el.style.opacity = q;
          el.style.transform =
            q >= 1 ? "none" : `translateY(${(1 - q) * 20}px)`;
        });
      s.lv.setAttribute("stroke-dashoffset", s.len * (1 - fr));
      if (s.ah) s.ah.style.opacity = fr > 0.97 ? 1 : 0;
    });
    G.reveals.forEach((r) => {
      const p =
        this.L >= G.total - 1
          ? 1
          : r.anchor != null
            ? Math.min(1, Math.max(0, (dy - (r.anchor - 360)) / 360))
            : Math.min(1, Math.max(0, (dy - (r.top - 320)) / 240));
      const q = Math.round(p * 100) / 100;
      if (q === r.el.__p) return;
      r.el.__p = q;
      r.el.dataset.shown = q > 0 ? "1" : "";
      r.el.style.transition = "none";
      r.el.style.opacity = q;
      r.el.style.transform = q >= 1 ? "none" : `translateY(${(1 - q) * 28}px)`;
    });
  }

  burst(x, y, shape) {
    const g = this.subRef.current;
    if (!g) return;
    const NS = "http://www.w3.org/2000/svg",
      els = [];
    const dia = shape === "diamond";
    const ring = document.createElementNS(NS, dia ? "path" : "circle");
    if (!dia) {
      ring.setAttribute("cx", x);
      ring.setAttribute("cy", y);
    }
    ring.setAttribute("stroke-linejoin", "round");
    ring.setAttribute("fill", "none");
    ring.setAttribute("stroke", CYAN);
    ring.setAttribute("stroke-width", "8");
    g.appendChild(ring);
    els.push({ el: ring, ring: true, dia });
    const n = 0;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + Math.random() * 0.3,
        sp = 40 + Math.random() * 40;
      const p = document.createElementNS(NS, "circle");
      p.setAttribute("fill", i % 3 ? CYAN : "#E6FBFC");
      g.appendChild(p);
      els.push({ el: p, a, sp, r: 1.4 + Math.random() * 1.6 });
    }
    this.bursts = (this.bursts || []).concat([
      { x, y, t0: performance.now(), els },
    ]);
  }

  stepBursts() {
    if (!this.bursts || !this.bursts.length) return;
    const now = performance.now();
    this.bursts = this.bursts.filter((b) => {
      const k = Math.min(1, (now - b.t0) / 1500),
        e = 1 - Math.pow(1 - k, 3);
      b.els.forEach((o) => {
        if (o.ring) {
          const rr = 11 + e * 30;
          if (o.dia) {
            const q = rr * 1.25;
            o.el.setAttribute(
              "d",
              `M${b.x},${b.y - q} L${b.x + q},${b.y} L${b.x},${b.y + q} L${b.x - q},${b.y} Z`,
            );
          } else o.el.setAttribute("r", rr);
          o.el.setAttribute("stroke-width", 8 - k * 5);
          o.el.setAttribute("opacity", (1 - k) * 0.2);
        } else {
          o.el.setAttribute("cx", b.x + Math.cos(o.a) * o.sp * e);
          o.el.setAttribute("cy", b.y + Math.sin(o.a) * o.sp * e);
          o.el.setAttribute("r", o.r * (1 - k * 0.6));
          o.el.setAttribute("opacity", 1 - k);
        }
      });
      if (k >= 1) {
        b.els.forEach((o) => o.el.remove());
        return false;
      }
      return true;
    });
  }

  heroCenter() {
    const cvs = this.canvasRef.current,
      lg = this.heroLogoRef.current;
    if (!cvs || !lg) return { x: this.cv.w / 2, y: this.cv.h * 0.4 };
    const a = cvs.getBoundingClientRect(),
      b = lg.getBoundingClientRect();
    return {
      x: b.left - a.left + b.width / 2,
      y: b.top - a.top + b.height / 2,
    };
  }

  drawHero(t) {
    const canvas = this.canvasRef.current;
    if (canvas && this.cv)
      drawHeroGraph(canvas, this.cv, this.heroCenter(), t, !this.motion);
  }

  tick = (t) => {
    this.raf = requestAnimationFrame(this.tick);
    const sc =
      (window.scrollY || document.documentElement.scrollTop || 0) > 12 ||
      (this.rootRef.current &&
        this.rootRef.current.getBoundingClientRect().top < -12);
    if (sc !== this.state.scrolled) this.setState({ scrolled: sc });
    this.update(false);
    const root = this.rootRef.current;
    if (
      this.motion &&
      root &&
      root.getBoundingClientRect().top > -window.innerHeight * 1.1
    )
      this.drawHero(t, false);
  };
}

const flow = new HomeFlow();
for (const key of Object.keys(flow)) {
  if (key.endsWith("Ref"))
    flow[key].current = document.querySelector(
      `[data-ref="${key.slice(0, -3)}"]`,
    );
}
const applyRoute = () => {
  const wide = window.innerWidth >= 860;
  document.querySelectorAll("[data-route-narrow]").forEach((el) => {
    el.dataset.routeWide ??= el.dataset.route;
    el.dataset.route = wide ? el.dataset.routeWide : el.dataset.routeNarrow;
  });
};
applyRoute();
window.addEventListener("resize", applyRoute);
flow.state.wide = window.innerWidth >= 860;
flow.componentDidMount();
