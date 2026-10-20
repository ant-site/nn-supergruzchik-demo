// Кольцо: фраза стоит на кольце вокруг планеты, дальняя половина зеркальная и бледная, ближняя с тенью-экструзией; от прокрутки кольцо крутится.
(() => {
  const sec = document.querySelector('.ring'); if (!sec) return;
  const cv = sec.querySelector('.ring__cv'), ctx = cv.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const PHRASE = 'СУПЕРГРУЗЧИК РФ · ЦЕНА КАК В ЗАЯВКЕ · ';
  const FONT = '800 {s}px "Golos Text",Arial,sans-serif';
  const TILT = 0.36; // сплющивание кольца при взгляде сверху
  const INK = '#1b2432', EXT = '#8b94a3', TEAL = '#23b7c9', GREEN = '#17b26a';
  let W = 0, H = 0, dpr = 1, R = 200, fs = 40, chars = [], p = reduce ? 0.3 : 0, t0 = performance.now(), visible = true, raf = 0;
  const stars = [[.17, .3, 22, 0], [.84, .56, 16, 1.7], [.9, .24, 11, 3.1], [.1, .66, 12, 4.4], [.67, .16, 9, 2.2]];

  function layout() {
    const r = cv.getBoundingClientRect(); dpr = Math.min(devicePixelRatio || 1, 2);
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    R = Math.min(W * (W < 640 ? 0.4 : 0.31), H * 0.56, 380);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.font = FONT.replace('{s}', 100);
    const ws = [...PHRASE].map(c => ctx.measureText(c).width), total = ws.reduce((a, b) => a + b, 0);
    fs = 100 * (2 * Math.PI * R) / total;
    let acc = 0; chars = [...PHRASE].map((c, i) => { const mid = acc + ws[i] / 2; acc += ws[i]; return { c, a: mid / total * 2 * Math.PI }; });
  }
  function star(x, y, s, a) {
    ctx.save(); ctx.translate(x, y); ctx.globalAlpha = a; ctx.fillStyle = GREEN; ctx.beginPath();
    for (let i = 0; i < 8; i++) { const ang = i * Math.PI / 4 - Math.PI / 2, rr = i % 2 ? s * 0.16 : s; ctx.lineTo(Math.cos(ang) * rr, Math.sin(ang) * rr); }
    ctx.closePath(); ctx.fill(); ctx.restore();
  }
  function orbit(cx, cy, front) {
    ctx.save(); ctx.lineWidth = 1; ctx.strokeStyle = '#5b6b86';
    for (let i = 0; i < 7; i++) {
      const rr = R * (0.5 + i * 0.075); ctx.globalAlpha = 0.16 - i * 0.012; ctx.beginPath();
      ctx.ellipse(cx, cy, rr, rr * TILT, 0, front ? 0 : Math.PI, front ? Math.PI : Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
  }
  function planet(cx, cy, rot) {
    const r = R * 0.4;
    const g = ctx.createRadialGradient(cx, cy, r * 0.9, cx, cy, r * 2.4); g.addColorStop(0, 'rgba(29,78,216,.22)'); g.addColorStop(1, 'rgba(29,78,216,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r * 2.4, 0, 7); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.clip();
    ctx.fillStyle = '#1b46c4'; ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    const bands = [[-.78, .14, TEAL], [-.5, .1, '#7fd6e3'], [-.2, .2, TEAL], [.18, .12, '#cfeef3'], [.42, .16, TEAL], [.72, .1, '#4a86f0']];
    bands.forEach(([y0, th, col], k) => {
      const n = 28, yy = i => y0 * r + Math.sin(i * 0.55 + rot * 2 + k * 1.3) * r * 0.05;
      ctx.fillStyle = col; ctx.globalAlpha = .9; ctx.beginPath();
      for (let i = 0; i <= n; i++) { const x = -r + (i / n) * 2 * r; ctx.lineTo(cx + x, cy + yy(i) - th * r / 2); }
      for (let i = n; i >= 0; i--) { const x = -r + (i / n) * 2 * r; ctx.lineTo(cx + x, cy + yy(i) + th * r / 2); }
      ctx.closePath(); ctx.fill();
    });
    ctx.globalAlpha = 1;
    const sh = ctx.createRadialGradient(cx - r * .38, cy - r * .42, r * .1, cx, cy, r * 1.05);
    sh.addColorStop(0, 'rgba(255,255,255,.35)'); sh.addColorStop(.45, 'rgba(255,255,255,0)'); sh.addColorStop(1, 'rgba(8,20,70,.62)');
    ctx.fillStyle = sh; ctx.fillRect(cx - r, cy - r, r * 2, r * 2); ctx.restore();
  }
  function glyphs(cx, cy, rot, front) {
    const h = fs * 0.35, d1 = Math.sqrt(1 - TILT * TILT);
    for (const k of chars) {
      const a = k.a + rot, ca = Math.cos(a), sa = Math.sin(a);
      if ((ca >= 0) !== front) continue;
      const x = cx + R * sa, y = cy + R * ca * TILT; // ближе к камере – ниже
      const a1 = ca, b1 = -sa * TILT * 0.9;
      ctx.save(); ctx.font = FONT.replace('{s}', fs); ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      if (front) {
        const depth = Math.round(fs * 0.07);
        ctx.fillStyle = EXT;
        for (let i = depth; i >= 1; i--) { ctx.setTransform(dpr * a1, dpr * b1, 0, dpr * d1, dpr * (x + i * 0.9), dpr * (y + i * 0.9 + h)); ctx.fillText(k.c, 0, 0); }
        ctx.setTransform(dpr * a1, dpr * b1, 0, dpr * d1, dpr * x, dpr * (y + h)); ctx.fillStyle = INK; ctx.fillText(k.c, 0, 0);
      } else {
        ctx.globalAlpha = 0.3 * (0.4 + 0.6 * Math.abs(ca)); ctx.fillStyle = '#4b5667';
        ctx.setTransform(dpr * a1, dpr * b1, 0, dpr * d1, dpr * x, dpr * (y + h)); ctx.fillText(k.c, 0, 0);
      }
      ctx.restore();
    }
  }
  function draw(time) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    const cx = W / 2, cy = H * (W < 640 ? 0.46 : 0.5) - R * 0.05, rot = (reduce ? 0 : time * 0.00007) + p * Math.PI * 2 * 1.1 - 0.4;
    stars.forEach(([sx, sy, s, ph]) => star(sx * W, sy * H, s * (W < 640 ? 0.7 : 1), 0.55 + 0.45 * Math.sin(time * 0.0015 + ph)));
    orbit(cx, cy, false); glyphs(cx, cy, rot, false);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); planet(cx, cy, rot);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); orbit(cx, cy, true); glyphs(cx, cy, rot, true);
  }
  function onScroll() {
    const r = sec.getBoundingClientRect(), span = r.height - innerHeight;
    p = span > 0 ? clamp(-r.top / span) : 0.3;
  }
  function loop(now) { raf = 0; if (visible) { draw(now - t0); if (!reduce) raf = requestAnimationFrame(loop); } }
  function kick() { if (!raf) raf = requestAnimationFrame(loop); }
  new IntersectionObserver(e => { visible = e[0].isIntersecting; if (visible) kick(); }).observe(sec);
  addEventListener('scroll', () => { onScroll(); if (reduce) kick(); }, { passive: true });
  addEventListener('resize', () => { layout(); onScroll(); kick(); });
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(() => { layout(); onScroll(); kick(); });
  layout(); onScroll(); kick();
})();
