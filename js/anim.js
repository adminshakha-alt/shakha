/* ============================================================
   Shakha 360 website - motion (TRIAL)
   Plain JavaScript with GSAP. Nothing here is needed for the
   page to work: if this file never loads, or the visitor has
   asked for less motion, the page shows everything as it is.
   ============================================================ */
(function () {
  "use strict";

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };

  /* ----------------------------------------------------------
     0. THE "BRANCHES" DROPDOWN
     A plain <select> opens a list drawn by Windows, in Windows'
     own font, which looks nothing like the rest of the page. The
     real select stays in the form and keeps holding the answer,
     so the e-mail the form builds is unchanged; it is only hidden
     and driven by a button and list we can style. With no script
     the ordinary select is still there and still works.
     This runs whether or not motion is wanted.
     ---------------------------------------------------------- */
  function niceSelect(sel) {
    if (!sel || sel.dataset.sxDone) return;
    sel.dataset.sxDone = "1";
    var opts = [].slice.call(sel.options).map(function (o) { return o.text; });

    var wrap = document.createElement("div");
    wrap.className = "sx-sel";
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "sx-sel-btn";
    btn.setAttribute("aria-haspopup", "listbox");
    btn.setAttribute("aria-expanded", "false");
    var lab = document.querySelector('label[for="' + sel.id + '"]');
    if (lab) { if (!lab.id) lab.id = sel.id + "L"; btn.setAttribute("aria-labelledby", lab.id + " " + sel.id + "V"); }
    btn.innerHTML = '<span id="' + sel.id + 'V">' + opts[sel.selectedIndex] + '</span>' +
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';

    var list = document.createElement("ul");
    list.className = "sx-sel-list";
    list.setAttribute("role", "listbox");
    list.hidden = true;
    if (lab) list.setAttribute("aria-labelledby", lab.id);
    opts.forEach(function (t, i) {
      var li = document.createElement("li");
      li.setAttribute("role", "option");
      li.id = sel.id + "O" + i;
      li.textContent = t;
      li.setAttribute("aria-selected", i === sel.selectedIndex ? "true" : "false");
      list.appendChild(li);
    });

    sel.parentNode.insertBefore(wrap, sel);
    wrap.appendChild(btn); wrap.appendChild(list); wrap.appendChild(sel);
    sel.classList.add("sx-sel-real");

    var open = false, at = sel.selectedIndex;
    function paint() {
      [].slice.call(list.children).forEach(function (li, i) {
        li.setAttribute("aria-selected", i === sel.selectedIndex ? "true" : "false");
        li.classList.toggle("on", i === at);
      });
      $("#" + sel.id + "V").textContent = opts[sel.selectedIndex];
    }
    function show(v) {
      open = v; list.hidden = !v;
      btn.setAttribute("aria-expanded", v ? "true" : "false");
      if (v) { at = sel.selectedIndex; paint(); list.setAttribute("aria-activedescendant", sel.id + "O" + at); }
    }
    function pick(i) {
      sel.selectedIndex = i;
      sel.dispatchEvent(new Event("change", { bubbles: true }));
      paint(); show(false); btn.focus();
    }
    btn.addEventListener("click", function () { show(!open); });
    list.addEventListener("click", function (ev) {
      var li = ev.target.closest("li"); if (!li) return;
      pick([].indexOf.call(list.children, li));
    });
    btn.addEventListener("keydown", function (ev) {
      if (ev.key === "ArrowDown" || ev.key === "ArrowUp" || ev.key === "Enter" || ev.key === " ") {
        ev.preventDefault(); show(true); list.focus();
      }
    });
    list.tabIndex = -1;
    list.addEventListener("keydown", function (ev) {
      var k = ev.key;
      if (k === "Escape" || k === "Tab") { show(false); if (k === "Escape") btn.focus(); return; }
      if (k === "ArrowDown") { ev.preventDefault(); at = Math.min(opts.length - 1, at + 1); }
      else if (k === "ArrowUp") { ev.preventDefault(); at = Math.max(0, at - 1); }
      else if (k === "Home") { ev.preventDefault(); at = 0; }
      else if (k === "End") { ev.preventDefault(); at = opts.length - 1; }
      else if (k === "Enter" || k === " ") { ev.preventDefault(); pick(at); return; }
      else return;
      list.setAttribute("aria-activedescendant", sel.id + "O" + at);
      [].slice.call(list.children).forEach(function (li, i) { li.classList.toggle("on", i === at); });
    });
    document.addEventListener("click", function (ev) { if (open && !wrap.contains(ev.target)) show(false); });
    paint();
  }

  function enhanceSelects() { $$(".fld select").forEach(niceSelect); }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", enhanceSelects);
  else enhanceSelects();

  // The page already decided whether motion is wanted (the <html> class).
  if (!document.documentElement.classList.contains("sx")) return;
  if (typeof gsap === "undefined") { document.documentElement.classList.remove("sx"); return; }

  gsap.registerPlugin(ScrollTrigger);

  /* ----------------------------------------------------------
     1. THE BRANCH IN THE HERO
     A small tree is worked out in code and drawn behind the
     headline: one stem from under the pill, splitting again and
     again, with a yellow dot on every tip - the same shape as
     the dots in the Shakha logo.
     ---------------------------------------------------------- */
  function buildBranch() {
    var host = $(".heroText");
    if (!host) return null;

    var W = 1040, H = 430;
    var segs = [], tips = [];

    // grow(x, y, angle, length, depth) - angle in radians, PI/2 points down
    function grow(x, y, ang, len, depth) {
      var x2 = x + Math.cos(ang) * len;
      var y2 = y + Math.sin(ang) * len;
      // a gentle curve rather than a straight stick
      var cx = x + Math.cos(ang - 0.22) * len * 0.6;
      var cy = y + Math.sin(ang - 0.22) * len * 0.6;
      segs.push({ x: x, y: y, cx: cx, cy: cy, x2: x2, y2: y2, depth: depth });
      if (depth >= 3) { tips.push([x2, y2]); return; }
      // left and right openings differ slightly so it is not a mirror
      var openL = [1.00, 0.76, 0.58][depth];
      var openR = [0.88, 0.86, 0.50][depth];
      var next = len * 0.70;
      grow(x2, y2, ang - openL, next, depth + 1);
      grow(x2, y2, ang + openR, next, depth + 1);
    }
    function r(n) { return Math.round(n * 10) / 10; }

    grow(W / 2, 4, Math.PI / 2, 150, 0);

    // fit the whole drawing neatly inside the box
    var xs = [], ys = [];
    segs.forEach(function (s) { xs.push(s.x, s.cx, s.x2); ys.push(s.y, s.cy, s.y2); });
    var minX = Math.min.apply(null, xs), maxX = Math.max.apply(null, xs);
    var minY = Math.min.apply(null, ys), maxY = Math.max.apply(null, ys);
    var padX = 40, padY = 10;
    H = 268;                                   // the tree keeps to the band behind the headline
    // the canopy is spread wider than it is tall, so that it reaches past the
    // headline into the empty green at the sides. Width and height are scaled
    // on their own, with the stretch capped so it still reads as a tree.
    var scY = (H - padY * 2) / Math.max(1, maxY - minY);
    var scX = Math.min((W - padX * 2) / Math.max(1, maxX - minX), scY * 2.1);
    var tx = (W - (maxX - minX) * scX) / 2 - minX * scX;
    var ty = padY - minY * scY;
    // the sizing is baked into the points, so strokes stay even, the dots stay
    // round, and the "draw me" dash length matches what is on screen
    function PX(v) { return r(tx + v * scX); }
    function PY(v) { return r(ty + v * scY); }

    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "sx-branch");
    svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    svg.setAttribute("preserveAspectRatio", "xMidYMin meet");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");

    var g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    svg.appendChild(g);

    segs.forEach(function (s) {
      var p = document.createElementNS("http://www.w3.org/2000/svg", "path");
      p.setAttribute("d", "M" + PX(s.x) + " " + PY(s.y) +
        " Q" + PX(s.cx) + " " + PY(s.cy) + " " + PX(s.x2) + " " + PY(s.y2));
      p.setAttribute("stroke-width", (3.4 * Math.pow(0.76, s.depth) + 0.8).toFixed(2));
      p.setAttribute("data-depth", s.depth);
      g.appendChild(p);
    });
    tips.forEach(function (t) {
      var c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      c.setAttribute("cx", PX(t[0]));
      c.setAttribute("cy", PY(t[1]));
      c.setAttribute("r", 5);
      c.setAttribute("class", "sx-dot");
      g.appendChild(c);
    });

    host.insertBefore(svg, host.firstChild);
    return svg;
  }

  function playBranch(svg) {
    if (!svg) return;
    var paths = $$("path", svg);
    paths.forEach(function (p) {
      var L = p.getTotalLength();
      p.style.strokeDasharray = L;
      p.style.strokeDashoffset = L;
    });
    var tl = gsap.timeline({ delay: 0.25 });
    for (var d = 0; d <= 3; d++) {
      var set = paths.filter(function (p) { return +p.getAttribute("data-depth") === d; });
      if (!set.length) continue;
      tl.to(set, {
        strokeDashoffset: 0,
        duration: 0.55 - d * 0.06,
        ease: "power1.out",
        stagger: 0.035
      }, d === 0 ? 0 : "-=0.34");
    }
    tl.fromTo($$(".sx-dot", svg),
      { opacity: 0, scale: 0, transformOrigin: "50% 50%" },
      { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(2.4)", stagger: 0.022 }, "-=0.30");
  }

  /* ----------------------------------------------------------
     1b. THE WORDS IN THE HERO ARRIVE
     ---------------------------------------------------------- */
  function heroText() {
    var bits = [".heroText .pill", ".heroText h1 span", ".heroText > p", ".heroText .heroCta", ".heroText .heroNote"]
      .map(function (s) { return $$(s); }).reduce(function (a, b) { return a.concat(b); }, []);
    if (bits.length) gsap.from(bits, { opacity: 0, y: 16, duration: 0.6, ease: "power2.out", stagger: 0.07 });
    var shot = $(".mockWrap");
    if (shot) gsap.from(shot, { opacity: 0, y: 28, duration: 0.8, ease: "power2.out", delay: 0.28 });
  }

  /* ----------------------------------------------------------
     2. HEAD OFFICE AND BRANCHES
     The lines between the boxes are drawn from where the boxes
     actually end up, so they stay right at every width.
     ---------------------------------------------------------- */
  function orgWires(org) {
    var wires = $(".sx-wires", org);
    if (!wires) return [];
    var box = org.getBoundingClientRect();
    var ho = $(".sx-node.ho", org);
    var brs = $$(".sx-row.r2 .sx-node", org);
    var sts = $$(".sx-row.r3 .sx-node", org);
    if (!ho || !brs.length) return [];

    wires.setAttribute("viewBox", "0 0 " + Math.round(box.width) + " " + Math.round(box.height));
    while (wires.firstChild) wires.removeChild(wires.firstChild);

    function mid(el) {
      var b = el.getBoundingClientRect();
      return { x: b.left - box.left + b.width / 2, t: b.top - box.top, b: b.bottom - box.top };
    }
    var h = mid(ho), out = [];
    brs.forEach(function (br, i) {
      var m = mid(br);
      var p = document.createElementNS("http://www.w3.org/2000/svg", "path");
      var midY = (h.b + m.t) / 2;
      p.setAttribute("d", "M" + h.x.toFixed(1) + " " + h.b.toFixed(1) +
        " C" + h.x.toFixed(1) + " " + midY.toFixed(1) +
        " " + m.x.toFixed(1) + " " + midY.toFixed(1) +
        " " + m.x.toFixed(1) + " " + m.t.toFixed(1));
      wires.appendChild(p); out.push(p);
      if (sts[i]) {
        var s = mid(sts[i]);
        var q = document.createElementNS("http://www.w3.org/2000/svg", "path");
        q.setAttribute("d", "M" + m.x.toFixed(1) + " " + m.b.toFixed(1) + " L" + s.x.toFixed(1) + " " + s.t.toFixed(1));
        wires.appendChild(q); out.push(q);
      }
    });
    out.forEach(function (p) {
      var L = p.getTotalLength();
      p.style.strokeDasharray = L;
      p.style.strokeDashoffset = L;
    });
    return out;
  }

  function setupOrg() {
    var org = $(".sx-org");
    if (!org) return;
    var ho = $(".sx-node.ho", org);
    var brs = $$(".sx-row.r2 .sx-node", org);
    var sts = $$(".sx-row.r3 .sx-node", org);
    var hint = $(".sx-hint", org.parentNode);
    var tl = null;

    function play() {
      if (tl) tl.kill();
      var wires = orgWires(org);
      tl = gsap.timeline();
      tl.fromTo(ho, { opacity: 0, scale: 0.86, y: -8, transformOrigin: "50% 50%" },
        { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: "back.out(2)" });
      if (wires.length) tl.to(wires, { strokeDashoffset: 0, duration: 0.5, ease: "power1.out", stagger: 0.06 }, "-=0.18");
      tl.fromTo(brs, { opacity: 0, scale: 0.84, y: 14, transformOrigin: "50% 50%" },
        { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: "back.out(2.2)", stagger: 0.1 }, "-=0.42");
      if (sts.length) tl.fromTo(sts, { opacity: 0, y: 8 },
        { opacity: 1, y: 0, duration: 0.35, ease: "power2.out", stagger: 0.07 }, "-=0.22");
      if (hint) tl.fromTo(hint, { opacity: 0 }, { opacity: 1, duration: 0.3 }, "-=0.1");
      return tl;
    }

    // hidden until it is played, but only because .sx is on
    gsap.set([ho].concat(brs, sts), { opacity: 0 });
    if (hint) gsap.set(hint, { opacity: 0 });
    orgWires(org);

    ScrollTrigger.create({ trigger: org, start: "top 82%", once: true, onEnter: play });
    org.addEventListener("click", play);
    org.addEventListener("keydown", function (ev) {
      if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); play(); }
    });
    var rt;
    window.addEventListener("resize", function () {
      clearTimeout(rt);
      rt = setTimeout(function () { if (!tl || tl.progress() === 1) { orgWires(org); gsap.set($$(".sx-wires path", org), { strokeDashoffset: 0 }); } }, 150);
    });
  }

  /* ----------------------------------------------------------
     3. SECTIONS ARRIVING AS YOU SCROLL
     ---------------------------------------------------------- */
  function reveals() {
    // The page already raises its own sections into place as you scroll
    // (the "rv" / "in" classes and its own IntersectionObserver). We leave
    // that alone - animating the same things twice left them invisible.
    // Only the big words in the facts strip get an extra touch, and that
    // is size only, never opacity, so the page's own fade still rules.
    var fb = $$(".fact b");
    if (fb.length) gsap.from(fb, {
      scale: 0.9, duration: 0.5, ease: "back.out(2)", stagger: 0.07,
      transformOrigin: "0% 50%",
      scrollTrigger: { trigger: ".facts", start: "top 86%", once: true }
    });
  }

  /* ----------------------------------------------------------
     3b. THE LAST ROW OF THE PAGE
     The page's own reveal watcher shrinks its bottom edge by 8%
     of the window. Anything that only ever reaches that last
     band therefore never counts as "seen" and stays at opacity
     0 for good - in practice the copyright line at the very
     foot, which is invisible on the live site today. This
     finishes the job for whatever the watcher leaves behind.
     (Nothing is needed when the visitor asked for less motion:
     the page then gives nothing the "rv" class in the first
     place, so it is all visible anyway.)
     ---------------------------------------------------------- */
  function revealLeftovers() {
    var queued = false;
    function sweep() {
      queued = false;
      var left = $$(".rv:not(.in)");
      left.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) el.classList.add("in");
      });
      if (!$$(".rv:not(.in)").length) window.removeEventListener("scroll", onScroll);
    }
    function onScroll() { if (!queued) { queued = true; requestAnimationFrame(sweep); } }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("load", function () { setTimeout(sweep, 350); });
    setTimeout(sweep, 1400);
  }

  /* ----------------------------------------------------------
     4. THE SCREENS VIEWER AT THE TOP
     ---------------------------------------------------------- */
  function shots() {
    var tabs = $(".shotTabs"), img = document.getElementById("shotImg");
    if (!tabs || !img) return;
    tabs.addEventListener("click", function (ev) {
      if (!ev.target.closest("[role=tab]")) return;
      // the page's own handler has already swapped the picture
      gsap.fromTo(img, { opacity: 0, y: 10, scale: 1.012 },
        { opacity: 1, y: 0, scale: 1, duration: 0.42, ease: "power2.out", overwrite: true });
    });
  }

  var NS = "http://www.w3.org/2000/svg";

  /* ----------------------------------------------------------
     6. A BRANCH RUNS DOWN THE PAGE
     A thin branch in the left margin that draws itself as you
     scroll, with a leaf opening beside each section heading.
     There is only room for it from 1440px wide; below that it is
     not built at all.
     ---------------------------------------------------------- */
  function spine() {
    var main = document.getElementById("main");
    if (!main) return;

    var marks = [];
    ["#does", ".band", "#demo", "#plans", "#faq", "#contact"].forEach(function (s) {
      var sec = $(s); if (!sec) return;
      var head = $("h2", sec); if (head) marks.push(head);
    });
    if (marks.length < 3) return;

    var host = document.createElement("div");
    host.className = "sx-spine";
    host.setAttribute("aria-hidden", "true");
    main.appendChild(host);

    var trigs = [];
    function build() {
      trigs.forEach(function (t) { t.kill(); });
      trigs = [];
      host.innerHTML = "";

      // How much room is there to the left of the words? Measure it rather
      // than guess from the window width, because display scaling and page
      // zoom both change what the window width means.
      var band = Math.round(marks[0].getBoundingClientRect().left);
      var reach = Math.min(36, (band - 20) / 2);      // how far a leaf sticks out
      if (reach < 13) { host.style.display = "none"; return; }  // genuinely no margin
      host.style.display = "";
      host.style.width = band + "px";

      var mr = main.getBoundingClientRect();
      var first = marks[0].closest("section"), last = marks[marks.length - 1].closest("section");
      var top = first.getBoundingClientRect().top - mr.top + 30;
      var H = Math.round((last.getBoundingClientRect().bottom - mr.top - 60) - top);
      if (H < 400) return;
      host.style.top = Math.round(top) + "px";
      host.style.height = H + "px";

      var W = band, cx = Math.round(band - 12 - reach), amp = Math.min(17, reach * 0.5);
      var svg = document.createElementNS(NS, "svg");
      svg.setAttribute("viewBox", "0 0 " + W + " " + H);
      svg.setAttribute("width", W); svg.setAttribute("height", H);
      host.appendChild(svg);

      // the stem: a long, slow wave so it reads as grown, not drawn with a ruler
      var step = Math.max(240, H / (marks.length * 1.25)), y = 0, dir = 1, d = "M" + cx + " 0";
      while (y < H - 1) {
        var ny = Math.min(H, y + step), h = ny - y;
        d += " C" + (cx + amp * dir) + " " + Math.round(y + h * 0.34) +
             "," + (cx + amp * dir) + " " + Math.round(y + h * 0.66) +
             "," + cx + " " + Math.round(ny);
        y = ny; dir = -dir;
      }
      var stem = document.createElementNS(NS, "path");
      stem.setAttribute("d", d);
      stem.setAttribute("class", "sx-stem");
      svg.appendChild(stem);

      var L = stem.getTotalLength();
      stem.style.strokeDasharray = L;
      stem.style.strokeDashoffset = L;
      trigs.push(ScrollTrigger.create({
        trigger: host, start: "top 72%", end: "bottom 88%", scrub: 0.6,
        animation: gsap.fromTo(stem, { strokeDashoffset: L }, { strokeDashoffset: 0, ease: "none" })
      }));

      // a leaf beside each heading, opening when that heading arrives
      marks.forEach(function (head, i) {
        // Where the heading really sits, leaving out the 24px it is lowered by
        // while it waits to be revealed. Measured with that shift, the first
        // heading's leaf was drawn only if the vine happened to be built before
        // the heading had risen; built after (a tall window, or a reload part
        // way down the page) it fell above the vine's start and was dropped.
        var shift = 0, rv = head.closest(".rv");
        if (rv) { try { shift = new DOMMatrixReadOnly(getComputedStyle(rv).transform).m42 || 0; } catch (e) {} }
        var ly = Math.max(28, Math.round(head.getBoundingClientRect().top - shift - mr.top - top + 12));
        if (ly > H - 24) return;
        var right = i % 2 === 0;
        var g = document.createElementNS(NS, "g");
        g.setAttribute("transform", "translate(" + cx + " " + ly + ") rotate(" + (right ? -20 : 160) +
          ") scale(" + (Math.round(reach / 36 * 100) / 100) + ")");
        var leaf = document.createElementNS(NS, "path");
        leaf.setAttribute("d", "M0 0 C9 -11 24 -12 34 -1 C24 11 9 11 0 0 Z");
        leaf.setAttribute("class", "sx-leaf");
        var rib = document.createElementNS(NS, "path");
        rib.setAttribute("d", "M3 0 C13 -3 24 -3 31 -1");
        rib.setAttribute("class", "sx-rib");
        g.appendChild(leaf); g.appendChild(rib);
        svg.appendChild(g);
        trigs.push(ScrollTrigger.create({
          trigger: head, start: "top 78%", once: true,
          animation: gsap.from(g, {
            scale: 0, opacity: 0, transformOrigin: "0% 50%",
            duration: 0.55, ease: "back.out(2.4)"
          })
        }));
      });
    }

    build();
    var rt;
    function later(ms) { clearTimeout(rt); rt = setTimeout(function () { build(); ScrollTrigger.refresh(); }, ms || 220); }
    window.addEventListener("resize", function () { later(260); });
    // headings move once the plan cards and the video have settled
    window.addEventListener("load", function () { later(400); });
    // opening a question makes the page taller, so the branch has to be
    // re-drawn or it stops short of where the sections now end
    $$("details").forEach(function (d) {
      d.addEventListener("toggle", function () { later(230); });
    });
    if (window.ResizeObserver) {
      var lastH = 0;
      new ResizeObserver(function () {
        var h = main.offsetHeight;
        if (Math.abs(h - lastH) > 8) { lastH = h; later(200); }
      }).observe(main);
    }
  }

  /* ----------------------------------------------------------
     7. LEAVES AND FLOWERS IN THE EMPTY CORNERS
     The same four drawings the hero already uses, placed in the
     space the lower sections leave over.
     ---------------------------------------------------------- */
  function corners() {
    [["#does", "sR", "a"], [".band", "sL", "b"], ["#plans", "sL", "c"],
     ["#faq", "sR", "d"], ["#contact", "sL", "e"]].forEach(function (c) {
      var sec = $(c[0]); if (!sec) return;
      var el = document.createElement("span");
      el.className = "shape " + c[1] + " sx-dec sx-dec-" + c[2];
      el.setAttribute("aria-hidden", "true");
      sec.insertBefore(el, sec.firstChild);
      drift(el, {
        y: c[2] === "b" || c[2] === "d" ? 16 : -16,
        rotation: c[2] === "c" ? 6 : -6,
        duration: 5.2 + Math.random() * 1.6,
        ease: "sine.inOut", repeat: -1, yoyo: true
      });
      gsap.to(el, {
        yPercent: 16, ease: "none",
        scrollTrigger: { trigger: sec, start: "top bottom", end: "bottom top", scrub: 0.8 }
      });
    });
  }

  /* ----------------------------------------------------------
     8. THE NINE ICONS DRAW THEMSELVES
     Each card's icon is a line drawing. The shared shape is
     copied into the card first, so one card's drawing does not
     move the other eight.
     ---------------------------------------------------------- */
  function cardIcons() {
    $$(".doesC .modIc .ico").forEach(function (svg) {
      var u = $("use", svg); if (!u) return;
      var id = (u.getAttribute("href") || u.getAttribute("xlink:href") || "").replace("#", "");
      var sym = id && document.getElementById(id); if (!sym) return;
      svg.setAttribute("viewBox", sym.getAttribute("viewBox") || "0 0 24 24");
      u.parentNode.removeChild(u);
      [].slice.call(sym.children).forEach(function (ch) { svg.appendChild(ch.cloneNode(true)); });
    });

    $$(".doesC").forEach(function (card) {
      var parts = $$(".modIc .ico > *", card).filter(function (p) {
        return typeof p.getTotalLength === "function";
      });
      if (!parts.length) return;
      var ok = [];
      parts.forEach(function (p) {
        var L = 0;
        try { L = p.getTotalLength(); } catch (e) { return; }
        if (!L) return;
        p.style.strokeDasharray = L;
        p.style.strokeDashoffset = L;
        ok.push(p);
      });
      if (!ok.length) return;
      gsap.to(ok, {
        strokeDashoffset: 0, duration: 0.65, ease: "power1.inOut", stagger: 0.09,
        scrollTrigger: { trigger: card, start: "top 86%", once: true }
      });
    });
  }

  /* ----------------------------------------------------------
     9. THE THREE POINTS ON THE YELLOW BAND
     ---------------------------------------------------------- */
  function bandRows() {
    $$(".own li").forEach(function (li) {
      var icon = $("span", li), txt = $("div", li);
      if (!icon || !txt) return;
      var tl = gsap.timeline({ scrollTrigger: { trigger: li, start: "top 88%", once: true } });
      tl.from(icon, { scale: 0, rotation: -40, duration: 0.5, ease: "back.out(2.2)", transformOrigin: "50% 50%" })
        .from(txt, { x: -16, opacity: 0, duration: 0.45, ease: "power2.out" }, "-=0.30");
    });
  }

  /* ----------------------------------------------------------
     5. THE LEAF, FLOWER, STAR AND SUN BREATHE
     ---------------------------------------------------------- */
  // A drift that never stops costs battery for nothing while it is off the
  // screen, so each one is paused until its own part of the page is in view.
  function drift(el, opts) {
    var tw = gsap.to(el, opts);
    tw.pause();
    ScrollTrigger.create({
      trigger: el.closest("section") || el,
      start: "top bottom", end: "bottom top",
      onToggle: function (self) { if (self.isActive) tw.play(); else tw.pause(); }
    });
    return tw;
  }

  function decorations() {
    $$(".shape").forEach(function (el, i) {
      drift(el, {
        y: i % 2 ? 16 : -16,
        rotation: i % 2 ? -4 : 4,
        duration: 4.2 + i * 0.7,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true
      });
    });
    var hero = $(".hero");
    if (!hero) return;
    $$(".hero .shape").forEach(function (el, i) {
      gsap.to(el, {
        yPercent: i % 2 ? 26 : 18,
        ease: "none",
        scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: 0.6 }
      });
    });
  }

  /* ---------------------------------------------------------- */
  function start() {
    try {
      playBranch(buildBranch());
      heroText();
      setupOrg();
      reveals();
      revealLeftovers();
      shots();
      decorations();
      corners();
      cardIcons();
      bandRows();
      spine();
      window.sxReady = true;           // tells the page's safety timer all is well
    } catch (e) {
      document.documentElement.classList.remove("sx");
      gsap.set("*", { clearProps: "opacity" });
      if (window.console) console.warn("Shakha motion stopped:", e);
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
