// Hero animation: a system map that grows out of the logo, stops at the headline,
// then stays alive with traffic on its edges and modules drifting a few pixels.
const RGB = "126,227,232";
const clamp = (x) => Math.min(1, Math.max(0, x));
const smooth = (a, b, x) => {
  const k = clamp((x - a) / (b - a));
  return k * k * (3 - 2 * k);
};
const ease = (x) => {
  const k = clamp(x);
  return k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
};
const rng = (seed) => () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const cyan = (a) => `rgba(${RGB},${Math.max(0, a).toFixed(3)})`;
const QUIET = { edge: 0.13, node: 0.2, core: 0.5, packet: 0.55, flash: 0.35 };

// A module box. `cover` hides whatever passes underneath it.
const drawModule = (ctx, x, y, w, h, a, flash, cover) => {
  ctx.beginPath();
  ctx.roundRect(x - w / 2, y - h / 2, w, h, 6);
  if (cover > 0) {
    ctx.fillStyle = `rgba(31,33,48,${cover.toFixed(3)})`;
    ctx.fill();
  }
  ctx.fillStyle = `rgba(43,45,60,${(0.6 * a).toFixed(3)})`;
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = cyan((QUIET.node + QUIET.flash * flash) * a);
  ctx.stroke();
  ctx.fillStyle = cyan(QUIET.core * a);
  ctx.beginPath();
  ctx.arc(x - w / 2 + 8, y, 1.8, 0, 6.29);
  ctx.fill();
  ctx.fillStyle = `rgba(255,255,255,${(0.12 * a).toFixed(3)})`;
  ctx.fillRect(x - w / 2 + 14, y - 1, w - 22, 2);
};

const lineLen = (pts) =>
  pts.reduce(
    (v, p, n) =>
      n ? v + Math.hypot(p.x - pts[n - 1].x, p.y - pts[n - 1].y) : 0,
    0,
  );
const pointAt = (pts, L, f) => {
  let left = L * f;
  for (let n = 1; n < pts.length; n++) {
    const A = pts[n - 1],
      B = pts[n],
      d = Math.hypot(B.x - A.x, B.y - A.y);
    if (left <= d)
      return {
        x: A.x + (B.x - A.x) * (left / d),
        y: A.y + (B.y - A.y) * (left / d),
      };
    left -= d;
  }
  return pts[pts.length - 1];
};
const logoSize = (cv) => Math.min(130, cv.h * 0.15) * 0.94;
const inView = (cv, x, y, pad = 30) =>
  x > -pad && x < cv.w + pad && y > -pad && y < cv.h + pad;
// Right-angled route between two points, with softly rounded corners.
const orthoRoute = (ax, ay, bx, by, radius = 8) => {
  const across = Math.abs(bx - ax) >= Math.abs(by - ay);
  const corners = across
    ? [
        { x: (ax + bx) / 2, y: ay },
        { x: (ax + bx) / 2, y: by },
      ]
    : [
        { x: ax, y: (ay + by) / 2 },
        { x: bx, y: (ay + by) / 2 },
      ];
  if (Math.abs(bx - ax) < 0.5 || Math.abs(by - ay) < 0.5)
    return [
      { x: ax, y: ay },
      { x: bx, y: by },
    ];
  const raw = [{ x: ax, y: ay }, ...corners, { x: bx, y: by }],
    pts = [raw[0]];
  for (let i = 1; i < raw.length - 1; i++) {
    const p = raw[i - 1],
      q = raw[i],
      n = raw[i + 1];
    const r = Math.min(
      radius,
      Math.hypot(q.x - p.x, q.y - p.y) / 2,
      Math.hypot(n.x - q.x, n.y - q.y) / 2,
    );
    const d1 = Math.hypot(q.x - p.x, q.y - p.y) || 1,
      d2 = Math.hypot(n.x - q.x, n.y - q.y) || 1;
    const from = {
        x: q.x - ((q.x - p.x) / d1) * r,
        y: q.y - ((q.y - p.y) / d1) * r,
      },
      to = { x: q.x + ((n.x - q.x) / d2) * r, y: q.y + ((n.y - q.y) / d2) * r };
    for (let k = 0; k <= 4; k++) {
      const u = k / 4,
        v = 1 - u;
      pts.push({
        x: v * v * from.x + 2 * v * u * q.x + u * u * to.x,
        y: v * v * from.y + 2 * v * u * q.y + u * u * to.y,
      });
    }
  }
  pts.push(raw[raw.length - 1]);
  return pts;
};

const cvsTop = () => {
  const el = document.querySelector('[data-ref="canvas"]');
  return el ? el.getBoundingClientRect().top : 0;
};

/* Branches grow from the logo at their own pace, stop at the headline, then keep carrying traffic. */
const radialTree = {
  build(cv, c) {
    const narrow = cv.w < 860,
      r0 = logoSize(cv),
      gap = narrow ? 74 : 98,
      nodes = [],
      edges = [];
    const headline = document.querySelector("h1"),
      floorY = headline
        ? headline.getBoundingClientRect().bottom - cvsTop()
        : cv.h;
    const w = narrow ? 42 : 54,
      h = narrow ? 17 : 20;
    // Each side grows from its own random stream and rules, so the two halves never mirror each other.
    const LEFT = {
      rnd: rng(5807),
      gap: gap * 1.0,
      jitter: 0.3,
      fork: narrow ? 120 : 170,
      triple: 0.25,
      keep: 0.95,
    };
    const RIGHT = {
      rnd: rng(86243),
      gap: gap * 1.2,
      jitter: 0.2,
      fork: narrow ? 150 : 210,
      triple: 0.1,
      keep: 0.96,
    };
    const pace = (side, depth) =>
      ((narrow ? 0.1 : 0.135) * (0.75 + side.rnd() * 0.6)) / (1 + depth * 0.07);
    const branch = (
      side,
      parent,
      parentR,
      px,
      py,
      depth,
      from,
      to,
      startAt,
    ) => {
      const rnd = side.rnd,
        R = parentR + side.gap * (0.8 + rnd() * 0.45),
        room = (to - from) * R;
      const count =
        room > side.fork && depth < 9 ? 2 + (rnd() < side.triple ? 1 : 0) : 1;
      const cuts = [from];
      for (let i = 1; i < count; i++)
        cuts.push(from + ((to - from) * (i + (rnd() - 0.5) * 0.5)) / count);
      cuts.push(to);
      for (let i = 0; i < count; i++) {
        const lo = cuts[i],
          hi = cuts[i + 1],
          ang = lo + (hi - lo) * (0.5 + (rnd() - 0.5) * side.jitter * 2);
        const reach = R * (1 + (rnd() - 0.5) * 0.14);
        let x = c.x + reach * Math.cos(ang),
          y = c.y + reach * Math.sin(ang);
        // Nearly aligned neighbours get a straight edge rather than a tiny jog.
        if (Math.abs(x - px) >= Math.abs(y - py)) {
          if (Math.abs(y - py) < 18) y = py;
        } else if (Math.abs(x - px) < 18) x = px;
        if (!inView(cv, x, y, 60) || y + h / 2 > floorY) continue;
        if (
          nodes.some(
            (o) => Math.abs(o.x - x) < w + 12 && Math.abs(o.y - y) < h + 10,
          )
        )
          continue;
        const node = {
          x,
          y,
          hx: x,
          hy: y,
          depth,
          kind: "box",
          w,
          h,
          links: [],
          lockX: false,
          lockY: false,
          move: null,
        };
        if (Math.abs(y - py) < 0.5) {
          node.lockY = true;
          if (parent) parent.lockY = true;
        }
        if (Math.abs(x - px) < 0.5) {
          node.lockX = true;
          if (parent) parent.lockX = true;
        }
        // The route runs centre to centre with at most two turns: open modules sit on top and hide its ends.
        const pts = orthoRoute(px, py, x, y);
        const len = lineLen(pts),
          wait =
            startAt + 60 + rnd() * 260 + (rnd() < 0.14 ? 500 + rnd() * 900 : 0),
          dur = len / pace(side, depth);
        node.born = wait + dur;
        const edge = {
          pts,
          len,
          start: wait,
          dur,
          born: node.born,
          flow: rnd() < 0.5,
          off: rnd(),
          period: 3400 + rnd() * 3200,
          ax: px,
          ay: py,
          from: parent,
          to: node,
        };
        edges.push(edge);
        node.links.push(edge);
        if (parent) parent.links.push(edge);
        nodes.push(node);
        if (rnd() < side.keep || depth < 5)
          branch(side, node, R, x, y, depth + 1, lo, hi, node.born);
      }
    };
    for (let i = 0; i < 6; i++) {
      const ang = -Math.PI / 2 + (i * Math.PI) / 3,
        side = Math.cos(ang) < -0.01 || i === 3 ? LEFT : RIGHT;
      branch(
        side,
        null,
        r0,
        c.x + r0 * Math.cos(ang),
        c.y + r0 * Math.sin(ang),
        1,
        ang - Math.PI / 6,
        ang + Math.PI / 6,
        side.rnd() * 700,
      );
    }
    return {
      nodes,
      edges,
      last: nodes.reduce((m, n) => Math.max(m, n.born), 0),
    };
  },
  // Every 1.5-3 seconds a random group of open modules drifts up to 10px from its place; their edges follow.
  nudge(s, T) {
    if (s.nextNudge === undefined)
      s.nextNudge = T + 1500 + Math.random() * 1500;
    if (T >= s.nextNudge) {
      s.nextNudge = T + 1500 + Math.random() * 1500;
      const share = 0.2 + Math.random() * 0.15;
      s.nodes.forEach((n) => {
        if (n.move || T <= n.born + 600 || Math.random() > share) return;
        const dist = 5 + Math.random() * 5,
          ang = Math.random() * Math.PI * 2,
          sign = Math.random() < 0.5 ? -1 : 1;
        // Keep straight edges straight where possible: slide along them instead of across.
        const alongX = n.lockY && (!n.lockX || Math.random() < 0.5),
          alongY = n.lockX && !alongX;
        n.move = {
          x0: n.x,
          y0: n.y,
          x1: n.hx + (alongX ? sign * dist : alongY ? 0 : Math.cos(ang) * dist),
          y1: n.hy + (alongY ? sign * dist : alongX ? 0 : Math.sin(ang) * dist),
          start: T + Math.random() * 500,
          dur: 1100 + Math.random() * 800,
        };
      });
    }
    const dirty = new Set();
    s.nodes.forEach((n) => {
      if (!n.move || T < n.move.start) return;
      const k = ease((T - n.move.start) / n.move.dur);
      n.x = n.move.x0 + (n.move.x1 - n.move.x0) * k;
      n.y = n.move.y0 + (n.move.y1 - n.move.y0) * k;
      n.links.forEach((e) => dirty.add(e));
      if (k >= 1) n.move = null;
    });
    dirty.forEach((e) => {
      e.pts = orthoRoute(
        e.from ? e.from.x : e.ax,
        e.from ? e.from.y : e.ay,
        e.to.x,
        e.to.y,
      );
      e.len = lineLen(e.pts);
    });
  },
  draw(ctx, cv, c, t, s, dt, mask, still) {
    const T = still ? s.last + 1000 : t;
    if (!still) radialTree.nudge(s, T);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    s.edges.forEach((e) => {
      const raw = (T - e.start) / e.dur;
      if (raw <= 0) return;
      const end = e.pts[e.pts.length - 1],
        a = Math.min(mask(e.pts[0].x, e.pts[0].y), mask(end.x, end.y));
      if (a < 0.01) return;
      const f = Math.min(1, raw);
      ctx.lineWidth = 1;
      ctx.strokeStyle = cyan(QUIET.edge * a);
      ctx.beginPath();
      ctx.moveTo(e.pts[0].x, e.pts[0].y);
      let left = e.len * f;
      for (let n = 1; n < e.pts.length && left > 0; n++) {
        const A = e.pts[n - 1],
          B = e.pts[n],
          d = Math.hypot(B.x - A.x, B.y - A.y),
          k = Math.min(1, left / d);
        ctx.lineTo(A.x + (B.x - A.x) * k, A.y + (B.y - A.y) * k);
        left -= d;
      }
      ctx.stroke();
      if (f < 1) {
        const tip = pointAt(e.pts, e.len, f);
        ctx.fillStyle = cyan(0.12 * a);
        ctx.beginPath();
        ctx.arc(tip.x, tip.y, 4, 0, 6.29);
        ctx.fill();
        ctx.fillStyle = cyan(0.65 * a);
        ctx.beginPath();
        ctx.arc(tip.x, tip.y, 1.5, 0, 6.29);
        ctx.fill();
      } else if (e.flow) {
        // A dot travels the edge and passes under the module at its end, then waits before the next one.
        const phase = (T / e.period + e.off) % 1,
          travel = 0.42;
        if (phase < travel) {
          const u = phase / travel,
            p = pointAt(e.pts, e.len, u),
            soft = smooth(0, 0.08, u) * (1 - smooth(0.97, 1, u));
          ctx.fillStyle = cyan(QUIET.packet * a * soft);
          ctx.beginPath();
          ctx.arc(p.x, p.y, 1.5, 0, 6.29);
          ctx.fill();
        }
      }
    });
    s.nodes.forEach((n) => {
      const age = T - n.born;
      if (age <= 0) return;
      const open = ease(age / 520),
        a = mask(n.x, n.y) * open;
      if (a < 0.01) return;
      const grow = 0.82 + 0.18 * open;
      drawModule(
        ctx,
        n.x,
        n.y,
        n.w * grow,
        n.h * grow,
        a,
        1 - clamp(age / 1400),
        ease(age / 120),
      );
    });
  },
};

// Keeps the headline readable: strong at the edges and around the logo, faint behind text and the header.
const makeMask = (cv, c) => {
  const floor = cv.w < 860 ? 0.24 : 0.14,
    textW = Math.min(cv.w, 1180) * 0.5,
    logoR = Math.min(170, cv.h * 0.2);
  return (x, y) => {
    const side = smooth(
      0.6,
      1.02,
      Math.hypot((x - cv.w / 2) / textW, (y - cv.h * 0.58) / (cv.h * 0.52)),
    );
    const around =
      y < c.y + logoR * 0.7
        ? 1 - smooth(logoR * 1.1, logoR * 3.2, Math.hypot(x - c.x, y - c.y))
        : 0;
    return (
      Math.max(floor + (1 - floor) * side, around * 0.8) *
      smooth(0, cv.h * 0.14, cv.h - y) *
      (0.25 + 0.75 * smooth(46, 76, y))
    );
  };
};

let state = null,
  stateKey = "",
  startedAt = 0;

export function drawHeroGraph(canvas, cv, c, t, still) {
  const ctx = canvas.getContext("2d");
  ctx.setTransform(cv.dpr, 0, 0, cv.dpr, 0, 0);
  ctx.clearRect(0, 0, cv.w, cv.h);
  const heading = document.querySelector("h1");
  const key = `${cv.w}|${cv.h}|${Math.round(c.x)}|${Math.round(c.y)}|${heading ? Math.round(heading.offsetTop + heading.offsetHeight) : 0}`;
  if (key !== stateKey) {
    stateKey = key;
    state = radialTree.build(cv, c);
    startedAt = t;
  }
  radialTree.draw(
    ctx,
    cv,
    c,
    still ? 9000 : t - startedAt,
    state,
    0,
    makeMask(cv, c),
    still,
  );
}
