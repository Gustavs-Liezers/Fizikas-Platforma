(() => {
  // DOM
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");

  const freq = document.getElementById("freq");   // MHz
  const amp = document.getElementById("amp");
  const speed = document.getElementById("speed"); // m/s

  const fOut = document.getElementById("fOut");
  const ampOut = document.getElementById("ampOut");
  const vOut = document.getElementById("vOut");

  const formulaBox = document.getElementById("formulaBox");

  const toggleBtn = document.getElementById("toggleBtn");
  const resetBtn = document.getElementById("resetBtn");

  let running = true;
  let time = 0;

  // resize
  function fitCanvas() {
    const r = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.floor(r.width * dpr));
    canvas.height = Math.max(1, Math.floor(r.height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // === “ķēdes stila” formulu atjaunošana (viena formula-box) ===
  function fmt(n, digits = 3) {
    if (!isFinite(n)) return "—";
    const a = Math.abs(n);
    if (a !== 0 && (a < 0.001 || a >= 100000)) return n.toExponential(digits);
    return n.toFixed(digits).replace(/\.?0+$/, "");
  }

  function setLetters() {
    formulaBox.innerHTML =
      "T = 1 / f<br><br>" +
      "λ = v / f<br><br>" +
      "λ = v · T";
  }

  function updateFormulas() {
    const fMHz = +freq.value;
    const fHz = fMHz * 1e6;
    const v = +speed.value;

    fOut.textContent = fMHz.toFixed(0);
    ampOut.textContent = (+amp.value).toFixed(1);
    vOut.textContent = (isFinite(v) && v > 0) ? fmt(v, 2) : "—";

    if (!(fHz > 0) || !(v > 0)) {
      setLetters();
      return;
    }

    const T = 1 / fHz;
    const lamVF = v / fHz;
    const lamVT = v * T;

    // Tieši kā ķēdes slēgumā: rezultāts = aizstāšana (vienā kastē)
    formulaBox.innerHTML =
      `${fmt(T)} = 1 / ${fmt(fHz)}<br><br>` +
      `${fmt(lamVF)} = ${fmt(v)} / ${fmt(fHz)}<br><br>` +
      `${fmt(lamVT)} = ${fmt(v)} · ${fmt(T)}`;
  }

  // === 3D math helpers (oriģinālā viļņa kods) ===
  const v3 = (x, y, z) => ({ x, y, z });
  const sub = (a, b) => v3(a.x - b.x, a.y - b.y, a.z - b.z);
  const dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;
  const cross = (a, b) => v3(
    a.y * b.z - a.z * b.y,
    a.z * b.x - a.x * b.z,
    a.x * b.y - a.y * b.x
  );
  const len = (a) => Math.hypot(a.x, a.y, a.z);
  const norm = (a) => {
    const L = len(a) || 1;
    return v3(a.x / L, a.y / L, a.z / L);
  };
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

  function makeCamera(W, H) {
    const aspect = W / H;

    const camPos = v3(-6.8, 4.9, 13.6);
    const lookAt = v3(13.5, 0.0, 0.0);
    const upHint = v3(0, 1, 0);

    const forward = norm(sub(lookAt, camPos));
    const right = norm(cross(forward, upHint));
    const up = norm(cross(right, forward));

    const fov = 42 * Math.PI / 180;
    const f = 1 / Math.tan(fov / 2);

    const scale = Math.min(W, H) * 0.60;

    return { camPos, forward, right, up, f, aspect, scale, cx: W * 0.50, cy: H * 0.60 };
  }

  function project(cam, P) {
    const rel = sub(P, cam.camPos);
    const x = dot(rel, cam.right);
    const y = dot(rel, cam.up);
    const z = dot(rel, cam.forward);
    if (z <= 0.05) return null;

    const ndcX = (x * cam.f / cam.aspect) / z;
    const ndcY = (y * cam.f) / z;

    return { x: cam.cx + ndcX * cam.scale, y: cam.cy - ndcY * cam.scale };
  }

  function strokePoly(pts, color, w = 2, dashed = false) {
    if (!pts || pts.length < 2) return;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = w;
    if (dashed) ctx.setLineDash([7, 7]);
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.stroke();
    ctx.restore();
  }

  function fillPoly(pts, fill) {
    if (!pts || pts.length < 3) return;
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.closePath();
    ctx.fill();
  }

  function arrow2D(x1, y1, x2, y2, color, w = 1.1) {
    const head = 7;
    const dx = x2 - x1, dy = y2 - y1;
    const a = Math.atan2(dy, dx);

    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = w;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - head * Math.cos(a - Math.PI / 7), y2 - head * Math.sin(a - Math.PI / 7));
    ctx.lineTo(x2 - head * Math.cos(a + Math.PI / 7), y2 - head * Math.sin(a + Math.PI / 7));
    ctx.closePath();
    ctx.fill();
  }

  function drawPlane(cam, x0, x1, z0, z1, y = 0) {
    const p00 = project(cam, v3(x0, y, z0));
    const p10 = project(cam, v3(x1, y, z0));
    const p11 = project(cam, v3(x1, y, z1));
    const p01 = project(cam, v3(x0, y, z1));
    if (!p00 || !p10 || !p11 || !p01) return;

    fillPoly([p00, p10, p11, p01], "rgba(255,255,255,0.03)");
    strokePoly([p00, p10, p11, p01, p00], "rgba(255,255,255,0.12)", 1.5, false);
  }

  function buildRibbon(cam, { x0, x1, step, yFunc, zFunc, dyBack, dzBack }) {
    const front = [];
    const back = [];
    for (let x = x0; x <= x1; x += step) {
      const y = yFunc(x);
      const z = zFunc(x);

      const pf = project(cam, v3(x, y, z));
      const pb = project(cam, v3(x, y - dyBack, z + dzBack));
      if (pf && pb) { front.push(pf); back.push(pb); }
    }
    return { front, back };
  }

  function drawRibbon(front, back, fillRGBA, hatchRGBA, edgeRGBA, backEdgeRGBA) {
    if (front.length < 2 || back.length < 2) return;

    const poly = front.concat([...back].reverse());
    fillPoly(poly, fillRGBA);

    ctx.strokeStyle = hatchRGBA;
    ctx.lineWidth = 1;
    for (let i = 0; i < front.length; i += 8) {
      ctx.beginPath();
      ctx.moveTo(front[i].x, front[i].y);
      ctx.lineTo(back[i].x, back[i].y);
      ctx.stroke();
    }

    strokePoly(front, edgeRGBA, 3, false);
    strokePoly(back, backEdgeRGBA, 2, true);
  }

  function frame() {
    const W = canvas.getBoundingClientRect().width;
    const H = canvas.getBoundingClientRect().height;

    ctx.clearRect(0, 0, W, H);

    // Atjaunojam formulas (dzīvajā)
    updateFormulas();

    const fMHz = +freq.value;
    const fHz = fMHz * 1e6;
    const v = +speed.value;
    const Aui = +amp.value;

    // viļņa garums (m)
    const lam = (fHz > 0 && v > 0) ? (v / fHz) : 1;

    // shematisks λ mērogs uz ekrāna
    // pieņemam: pie ~10 MHz lam ~30 m, pie ~300 MHz lam ~1 m
    const lamWorld = clamp(
      4.2 + (lam - 1) / (30 - 1) * (10.5 - 4.2),
      4.2, 10.5
    );

    const cam = makeCamera(W, H);

    // fons
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "rgba(255,255,255,0.02)");
    bg.addColorStop(1, "rgba(0,0,0,0.35)");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // world params
    const x0 = 0, x1 = 24, step = 0.16;
    const k = (2 * Math.PI) / lamWorld;
    const phase = time * (fMHz / 60) * 1.35;

    // amplitūdas (saistītas)
    const A = 1.25 + Aui * 0.20;
    const eAmp = A;
    const bAmp = A * 0.85;

    drawPlane(cam, x0, x1, -2.8, 2.8, 0);

    // ass
    const A0 = project(cam, v3(x0, 0, 0));
    const A1 = project(cam, v3(x1, 0, 0));
    if (A0 && A1) {
      ctx.strokeStyle = "rgba(0,0,0,0.60)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(A0.x, A0.y);
      ctx.lineTo(A1.x, A1.y);
      ctx.stroke();
    }

    // B lente
    const B = buildRibbon(cam, {
      x0, x1, step,
      yFunc: (_) => -0.15,
      zFunc: (x) => bAmp * Math.sin(k * x - phase),
      dyBack: 0.75,
      dzBack: 2.10
    });

    drawRibbon(
      B.front, B.back,
      "rgba(125,115,255,0.14)",
      "rgba(125,115,255,0.22)",
      "rgba(125,115,255,1)",
      "rgba(125,115,255,0.55)"
    );

    for (let i = 0; i < B.front.length; i += 14) {
      arrow2D(B.front[i].x, B.front[i].y, B.back[i].x, B.back[i].y, "rgba(125,115,255,0.60)", 1.1);
    }

    // E lente
    const E = buildRibbon(cam, {
      x0, x1, step,
      yFunc: (x) => eAmp * Math.sin(k * x - phase),
      zFunc: (_) => 0,
      dyBack: 0.75,
      dzBack: 2.10
    });

    drawRibbon(
      E.front, E.back,
      "rgba(0,229,255,0.12)",
      "rgba(0,229,255,0.18)",
      "rgba(0,229,255,1)",
      "rgba(0,229,255,0.50)"
    );

    for (let x = x0 + 0.9; x <= x1 - 0.9; x += 1.25) {
      const pBase = project(cam, v3(x, 0, 0));
      const pTip = project(cam, v3(x, eAmp * Math.sin(k * x - phase), 0));
      if (pBase && pTip) arrow2D(pBase.x, pBase.y, pTip.x, pTip.y, "rgba(0,229,255,0.55)", 1.05);
    }

    if (running) time += 0.02;
    requestAnimationFrame(frame);
  }

  // events
  freq.addEventListener("input", updateFormulas);
  amp.addEventListener("input", updateFormulas);
  speed.addEventListener("input", updateFormulas);

  toggleBtn.addEventListener("click", () => {
    running = !running;
    toggleBtn.textContent = running ? "Pauze" : "Turpināt";
  });

  resetBtn.addEventListener("click", () => {
    freq.value = 60;
    amp.value = 5;
    speed.value = 300000000;

    running = true;
    time = 0;
    toggleBtn.textContent = "Pauze";

    setLetters();
    updateFormulas();
  });

  // start
  fitCanvas();
  window.addEventListener("resize", fitCanvas);

  setLetters();
  updateFormulas();
  requestAnimationFrame(frame);
})();
