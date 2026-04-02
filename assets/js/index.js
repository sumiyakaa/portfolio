/* ========================================
   index.js — AKASHIKI Portfolio
   スプラッシュ / FV / Works / 料金
   ======================================== */

(function () {
  'use strict';

  var EASE_MECH = 'cubic-bezier(0.16, 1, 0.3, 1)';

  /* ========================================
     Splash Screen
     ======================================== */
  function playSplash(onComplete) {
    var splash = document.getElementById('splash');
    if (!splash) { onComplete(); return; }

    // 再訪問時スキップ
    if (sessionStorage.getItem('akashiki-splash')) {
      splash.remove();
      onComplete();
      return;
    }

    document.body.classList.add('is-locked');

    var line = splash.querySelector('.splash__line');
    var text = splash.querySelector('.splash__text');

    var tl = gsap.timeline({
      onComplete: function () {
        splash.remove();
        document.body.classList.remove('is-locked');
        sessionStorage.setItem('akashiki-splash', '1');
        if (window.lenis) window.lenis.start();
        onComplete();
      }
    });

    tl
      // 1. 垂直ライン伸長
      .fromTo(line,
        { height: 0 },
        { height: '40vh', duration: 0.8, ease: 'power2.out' }
      )
      // 2. テキスト出現（letter-spacing + opacity）— scaleX(1.15)は維持
      .fromTo(text,
        { letterSpacing: '1em', opacity: 0, scaleX: 1.15 },
        { letterSpacing: '0.25em', opacity: 1, scaleX: 1.15, duration: 1.0, ease: EASE_MECH },
        '-=0.4'
      )
      // 3. 全体フェードアウト
      .to(splash, {
        opacity: 0,
        duration: 0.6,
        delay: 0.8
      })
      // 4. clip-pathで収束
      .fromTo(splash,
        { clipPath: 'inset(0)' },
        { clipPath: 'inset(50% 0)', duration: 0.6, ease: 'power2.inOut' },
        '-=0.3'
      );
  }

  /* ========================================
     FV — revealAndBind
     ======================================== */
  function revealAndBind() {
    gsap.registerPlugin(ScrollTrigger);

    var mainText = document.querySelector('.fv__main-text');
    var letters  = document.querySelectorAll('.fv__letter');
    var sub      = document.querySelector('.fv__sub');
    var hr       = document.querySelector('.fv__hr');
    var edgeBl   = document.querySelector('.fv__edge--bl');
    var edgeBr   = document.querySelector('.fv__edge--br');
    var corners  = document.querySelector('.fv__corners');
    var cornerLines = document.querySelectorAll('.fv__corner');

    // Step 1: gsap.set — visibility:visible + opacity:0
    var allElements = [mainText, sub, hr, edgeBl, edgeBr, corners];
    allElements.forEach(function (el) {
      if (el) gsap.set(el, { visibility: 'visible', opacity: 0 });
    });

    // Step 2: entrance timeline
    var entrance = gsap.timeline({
      onComplete: function () {
        bindScroll();
        initCornerBreathing();
      }
    });

    // Main letters — stagger
    entrance.fromTo(letters,
      { opacity: 0, y: 20 },
      {
        opacity: 1, y: 0,
        duration: 1.4,
        stagger: 0.08,
        ease: EASE_MECH
      }
    );

    // Main text container opacity
    entrance.fromTo(mainText,
      { opacity: 0 },
      { opacity: 1, duration: 0.01 },
      0
    );

    // Sub copy
    entrance.fromTo(sub,
      { opacity: 0, y: 15 },
      { opacity: 1, y: 0, duration: 1.2, ease: EASE_MECH },
      0.3
    );

    // Horizontal rule
    entrance.fromTo(hr,
      { opacity: 0, scaleX: 0 },
      { opacity: 1, scaleX: 1, duration: 0.8, ease: EASE_MECH, transformOrigin: 'left' },
      0.6
    );

    // Edge text
    entrance.fromTo([edgeBl, edgeBr],
      { opacity: 0 },
      { opacity: 1, duration: 1.0, ease: 'power2.out' },
      0.8
    );

    // Corner frames (SVG stroke-dashoffset)
    entrance.fromTo(cornerLines,
      { strokeDashoffset: 80, opacity: 0 },
      { strokeDashoffset: 0, opacity: 1, duration: 1.0, ease: EASE_MECH, stagger: 0.1 },
      1.0
    );

    // Ensure corners container is visible
    entrance.fromTo(corners,
      { opacity: 0 },
      { opacity: 1, duration: 0.01 },
      1.0
    );
  }

  /* ========================================
     FV — bindScroll (3D Parallax + Fade)
     ======================================== */
  function bindScroll() {
    var container  = document.querySelector('.fv__container');
    var mainText   = document.querySelector('.fv__main-text');
    var sub        = document.querySelector('.fv__sub');
    var hr         = document.querySelector('.fv__hr');
    var edgeBl     = document.querySelector('.fv__edge--bl');
    var edgeBr     = document.querySelector('.fv__edge--br');
    var corners    = document.querySelector('.fv__corners');
    var scrollArea = document.querySelector('.fv__scroll-area');

    if (!scrollArea || !container) return;

    // 3D tilt
    gsap.fromTo(container,
      { rotateX: 0, rotateY: 0 },
      {
        rotateX: 3,
        rotateY: -1.5,
        ease: 'none',
        scrollTrigger: {
          trigger: scrollArea,
          start: '15% top',
          end: 'bottom top',
          scrub: true
        }
      }
    );

    // Main text parallax
    gsap.fromTo(mainText,
      { y: 0 },
      {
        y: -120,
        ease: 'none',
        scrollTrigger: {
          trigger: scrollArea,
          start: '15% top',
          end: 'bottom top',
          scrub: true
        }
      }
    );

    // Sub parallax
    gsap.fromTo(sub,
      { y: 0 },
      {
        y: -80,
        ease: 'none',
        scrollTrigger: {
          trigger: scrollArea,
          start: '15% top',
          end: 'bottom top',
          scrub: true
        }
      }
    );

    // Fade out all FV elements
    var fvFadeElements = [mainText, sub, hr, edgeBl, edgeBr, corners].filter(Boolean);
    gsap.fromTo(fvFadeElements,
      { opacity: 1 },
      {
        opacity: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: scrollArea,
          start: '60% top',
          end: '85% top',
          scrub: true
        }
      }
    );
  }

  /* ========================================
     Mouse Orb Tracking
     ======================================== */
  function initOrbs() {
    // SP check
    if (window.innerWidth <= 767) return;

    var orbs = document.querySelectorAll('.fv__orb');
    if (orbs.length === 0) return;

    var lerps = [0.03, 0.05, 0.08];
    var targets = [
      { x: window.innerWidth / 2, y: window.innerHeight / 2 },
      { x: window.innerWidth / 2, y: window.innerHeight / 2 },
      { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    ];
    var current = [
      { x: window.innerWidth / 2, y: window.innerHeight / 2 },
      { x: window.innerWidth / 2, y: window.innerHeight / 2 },
      { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    ];

    document.addEventListener('mousemove', function (e) {
      for (var i = 0; i < targets.length; i++) {
        targets[i].x = e.clientX;
        targets[i].y = e.clientY;
      }
    });

    function animate() {
      for (var i = 0; i < orbs.length; i++) {
        current[i].x += (targets[i].x - current[i].x) * lerps[i];
        current[i].y += (targets[i].y - current[i].y) * lerps[i];
        orbs[i].style.transform = 'translate(' +
          (current[i].x - orbs[i].offsetWidth / 2) + 'px, ' +
          (current[i].y - orbs[i].offsetHeight / 2) + 'px)';
      }
      requestAnimationFrame(animate);
    }
    animate();
  }

  /* ========================================
     B: Floating Wireframe Geometry
     ======================================== */
  function initWireframe() {
    var fvSticky = document.querySelector('.fv__sticky');
    if (!fvSticky) return;

    var svgNS = 'http://www.w3.org/2000/svg';
    var container = document.createElement('div');
    container.className = 'fv__wireframe';
    container.setAttribute('aria-hidden', 'true');

    var svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', '0 0 1920 1080');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    container.appendChild(svg);
    fvSticky.appendChild(container);

    function makeLine(x1, y1, x2, y2) {
      var el = document.createElementNS(svgNS, 'line');
      el.setAttribute('x1', x1); el.setAttribute('y1', y1);
      el.setAttribute('x2', x2); el.setAttribute('y2', y2);
      el.setAttribute('stroke', 'rgba(255,255,255,0.20)');
      el.setAttribute('stroke-width', '1');
      el.setAttribute('fill', 'none');
      return el;
    }

    // 直線6本
    var lines = [
      makeLine(200, 150, 500, 200),
      makeLine(1400, 100, 1700, 180),
      makeLine(100, 700, 400, 850),
      makeLine(1500, 650, 1800, 750),
      makeLine(800, 50, 1100, 120),
      makeLine(600, 900, 950, 980)
    ];

    lines.forEach(function (line, i) {
      svg.appendChild(line);
      var dx = (Math.random() > 0.5 ? 1 : -1) * (30 + Math.random() * 20);
      var dy = (Math.random() > 0.5 ? 1 : -1) * (30 + Math.random() * 20);
      var rot = (Math.random() > 0.5 ? 1 : -1) * 15;
      var dur = 15 + Math.random() * 20;
      gsap.to(line, {
        x: dx, y: dy, rotation: rot,
        duration: dur, ease: 'sine.inOut', yoyo: true, repeat: -1,
        delay: Math.random() * 5
      });
    });

    // 三角形2個
    var triangles = [
      { points: '960,200 1020,320 900,320' },
      { points: '300,500 380,620 220,620' }
    ];
    triangles.forEach(function (t, i) {
      var poly = document.createElementNS(svgNS, 'polygon');
      poly.setAttribute('points', t.points);
      poly.setAttribute('stroke', 'rgba(255,255,255,0.16)');
      poly.setAttribute('stroke-width', '1');
      poly.setAttribute('fill', 'none');
      svg.appendChild(poly);

      var dx = (Math.random() > 0.5 ? 1 : -1) * (30 + Math.random() * 20);
      var dy = (Math.random() > 0.5 ? 1 : -1) * (30 + Math.random() * 20);
      gsap.to(poly, {
        rotation: 360, x: dx, y: dy,
        transformOrigin: '50% 50%',
        duration: 60 + i * 20, ease: 'none', repeat: -1,
        delay: Math.random() * 5
      });
    });

    // 円1個
    var circle = document.createElementNS(svgNS, 'circle');
    circle.setAttribute('cx', '1400');
    circle.setAttribute('cy', '450');
    circle.setAttribute('r', '40');
    circle.setAttribute('stroke', 'rgba(255,255,255,0.14)');
    circle.setAttribute('stroke-width', '1');
    circle.setAttribute('fill', 'none');
    svg.appendChild(circle);

    // radius パルス
    gsap.to(circle, {
      attr: { r: 55 },
      duration: 8, ease: 'sine.inOut', yoyo: true, repeat: -1,
      delay: Math.random() * 3
    });
    // ドリフト
    gsap.to(circle, {
      x: 35, y: -25,
      duration: 25, ease: 'sine.inOut', yoyo: true, repeat: -1,
      delay: Math.random() * 5
    });
  }

  /* ========================================
     C: Mouse Proximity Text Repel
     ======================================== */
  function initRepel() {
    if (window.innerWidth <= 768) return;

    var letters = document.querySelectorAll('.fv__letter');
    if (!letters.length) return;

    var RADIUS = 150;
    var MAX_FORCE = 25;
    var mouseX = -9999;
    var mouseY = -9999;
    var rafId = null;

    document.addEventListener('mousemove', function (e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    function animate() {
      for (var i = 0; i < letters.length; i++) {
        var rect = letters[i].getBoundingClientRect();
        var cx = rect.left + rect.width / 2;
        var cy = rect.top + rect.height / 2;

        var dx = cx - mouseX;
        var dy = cy - mouseY;
        var dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < RADIUS) {
          var force = (1 - dist / RADIUS) * MAX_FORCE;
          var angle = Math.atan2(dy, dx);
          var tx = Math.cos(angle) * force;
          var ty = Math.sin(angle) * force;
          letters[i].style.transform = 'translate(' + tx + 'px,' + ty + 'px)';
        } else {
          letters[i].style.transform = 'translate(0,0)';
        }
      }
      rafId = requestAnimationFrame(animate);
    }
    animate();

    window.addEventListener('beforeunload', function () {
      if (rafId) cancelAnimationFrame(rafId);
    });
  }

  /* ========================================
     D: Corner Frame Breathing
     ======================================== */
  function initCornerBreathing() {
    var cornerLines = document.querySelectorAll('.fv__corner');
    if (!cornerLines.length) return;

    cornerLines.forEach(function (corner, i) {
      // 入場アニメーションのopacity tweenを上書きしてから開始
      gsap.killTweensOf(corner, 'opacity');
      gsap.set(corner, { opacity: 0.6 });
      gsap.to(corner, {
        opacity: 1.0,
        duration: 4,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
        delay: i * 0.5
      });
    });
  }

  /* ========================================
     E: Particle Dust
     ======================================== */
  function initParticles() {
    var fvSticky = document.querySelector('.fv__sticky');
    if (!fvSticky) return;

    var container = document.createElement('div');
    container.className = 'fv__particles';
    container.setAttribute('aria-hidden', 'true');
    fvSticky.appendChild(container);

    var COUNT = 25;
    for (var i = 0; i < COUNT; i++) {
      var p = document.createElement('div');
      p.className = 'fv__particle';
      var size = 2 + Math.random() * 1.5;
      p.style.width = size + 'px';
      p.style.height = size + 'px';
      p.style.left = (Math.random() * 100) + '%';
      p.style.top = (Math.random() * 100) + '%';

      var initOp = 0.25 + Math.random() * 0.25;
      p.style.opacity = initOp;
      container.appendChild(p);

      // 浮遊
      var driftX = (Math.random() > 0.5 ? 1 : -1) * (50 + Math.random() * 150);
      var driftY = (Math.random() > 0.5 ? 1 : -1) * (30 + Math.random() * 120);
      gsap.to(p, {
        x: driftX, y: driftY,
        duration: 10 + Math.random() * 20,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
        delay: Math.random() * 5
      });

      // opacity 変動
      gsap.to(p, {
        opacity: 0.15 + Math.random() * 0.25,
        duration: 3 + Math.random() * 5,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
        delay: Math.random() * 3
      });
    }
  }

  /* ========================================
     Mouse Press Ripple (⑤)
     ======================================== */
  function initRipple() {
    if (window.innerWidth <= 768) return;

    var fvSticky = document.querySelector('.fv__sticky');
    if (!fvSticky) return;

    var svgNS = 'http://www.w3.org/2000/svg';
    var container = document.createElement('div');
    container.className = 'fv__ripple-container';
    var svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.style.position = 'absolute';
    svg.style.inset = '0';
    container.appendChild(svg);
    fvSticky.appendChild(container);

    var ripples = [];
    var MAX_RIPPLES = 5;
    var intervalId = null;
    var pressX = 0;
    var pressY = 0;

    function createRipple(x, y) {
      if (ripples.length >= MAX_RIPPLES) {
        var oldest = ripples.shift();
        if (oldest.tween) oldest.tween.kill();
        if (oldest.el.parentNode) oldest.el.parentNode.removeChild(oldest.el);
      }

      var rect = container.getBoundingClientRect();
      var cx = x - rect.left;
      var cy = y - rect.top;

      var circle = document.createElementNS(svgNS, 'circle');
      circle.setAttribute('cx', cx);
      circle.setAttribute('cy', cy);
      circle.setAttribute('r', '0');
      circle.setAttribute('fill', 'none');
      circle.setAttribute('stroke', '#fff');
      circle.setAttribute('stroke-width', '1');
      circle.setAttribute('opacity', '0.18');
      svg.appendChild(circle);

      var obj = { el: circle, tween: null };
      obj.tween = gsap.to(circle, {
        attr: { r: 300 },
        opacity: 0,
        duration: 2.5,
        ease: 'none',
        onComplete: function () {
          if (circle.parentNode) circle.parentNode.removeChild(circle);
          var idx = ripples.indexOf(obj);
          if (idx > -1) ripples.splice(idx, 1);
        }
      });
      ripples.push(obj);
    }

    function onMouseDown(e) {
      pressX = e.clientX;
      pressY = e.clientY;
      createRipple(pressX, pressY);
      intervalId = setInterval(function () {
        createRipple(pressX, pressY);
      }, 600);
    }

    function onMouseUp() {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    }

    function onMouseMove(e) {
      if (intervalId) {
        pressX = e.clientX;
        pressY = e.clientY;
      }
    }

    fvSticky.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    fvSticky.addEventListener('mousemove', onMouseMove);
  }

  /* ========================================
     Works Section
     ======================================== */
  function initWorks() {
    var section      = document.querySelector('.works');
    var thumbs       = document.querySelectorAll('.works__thumb');
    var selected     = document.querySelector('.works__selected');
    var typed        = document.querySelector('.works__typed');
    var typedName    = document.querySelector('.works__typed-name');
    var typedSub     = document.querySelector('.works__typed-sub');
    var linesSvg     = document.querySelector('.works__lines');
    var lines        = document.querySelectorAll('.works__line');
    var cables       = document.querySelectorAll('.works__line--cable');

    if (!section || !thumbs.length) return;

    var activeIndex = -1;
    var typeTimeout = null;
    var cableTweens = [];
    var lineTimelines = [];
    var pulseTween = null;

    // SELECTED パルスアニメーション
    if (selected) {
      gsap.set(selected, { opacity: 0.70 });
      pulseTween = gsap.to(selected, {
        opacity: 1.0,
        duration: 3,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1
      });
    }

    // リーダーライン座標を計算
    function calcLineCoords(thumbEl, index) {
      if (!linesSvg) return;

      var svgRect = linesSvg.getBoundingClientRect();
      var thumbRect = thumbEl.getBoundingClientRect();
      var typoRect = document.querySelector('.works__title-area').getBoundingClientRect();

      // 始点: サムネイル左端の垂直中央
      var x1 = thumbRect.left - svgRect.left;
      var y1 = thumbRect.top - svgRect.top + thumbRect.height / 2;

      // 終点: タイポエリアの作品名表示位置
      var x2 = typoRect.left - svgRect.left + typoRect.width * 0.5;
      var y2 = typoRect.top - svgRect.top + typoRect.height * 0.4;

      var line = lines[index];
      var cable = cables[index];
      if (line) {
        line.setAttribute('x1', x1);
        line.setAttribute('y1', y1);
        line.setAttribute('x2', x2);
        line.setAttribute('y2', y2);
      }
      if (cable) {
        cable.setAttribute('x1', x1);
        cable.setAttribute('y1', y1);
        cable.setAttribute('x2', x2);
        cable.setAttribute('y2', y2);
      }

      // ライン長を計算してdasharray設定
      var length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
      if (line) {
        line.style.strokeDasharray = length;
        line.style.strokeDashoffset = length;
      }

      return length;
    }

    // タイピングアニメーション
    function typeText(text, callback) {
      typedName.textContent = '';
      var i = 0;

      function typeChar() {
        if (i < text.length) {
          typedName.textContent += text[i];
          i++;
          typeTimeout = setTimeout(typeChar, 60);
        } else if (callback) {
          callback();
        }
      }
      typeChar();
    }

    // サムネイル自動スクロール（ホバー時）— 各サムネイルごとにtweenを管理
    var scrollTweens = {};

    function startThumbScroll(thumbEl) {
      var index = thumbEl.dataset.index;
      var imgWrap = thumbEl.querySelector('.works__thumb-img-wrap');
      var img = thumbEl.querySelector('img');
      if (!img || !imgWrap) return;

      var wrapH = imgWrap.offsetHeight;
      var renderW = imgWrap.offsetWidth;

      // offsetHeightが0の場合（lazy load未完了）、HTML属性から計算
      var imgH = img.offsetHeight;
      if (imgH <= 0) {
        var natW = img.naturalWidth || parseInt(img.getAttribute('width')) || renderW;
        var natH = img.naturalHeight || parseInt(img.getAttribute('height')) || 0;
        imgH = natW > 0 ? natH * (renderW / natW) : 0;
      }

      var scrollDist = imgH - wrapH;
      if (scrollDist <= 0) return;

      var duration = Math.min(6, Math.max(3, scrollDist / 300));

      if (scrollTweens[index]) scrollTweens[index].kill();

      scrollTweens[index] = gsap.fromTo(img,
        { y: 0 },
        {
          y: -scrollDist,
          duration: duration,
          ease: 'none'
        }
      );
    }

    function stopThumbScroll(thumbEl) {
      var index = thumbEl.dataset.index;
      var img = thumbEl.querySelector('img');
      if (!img) return;

      if (scrollTweens[index]) {
        scrollTweens[index].kill();
        scrollTweens[index] = null;
      }

      gsap.to(img, { y: 0, duration: 0.5, ease: 'power2.out' });
    }

    // ホバー開始
    function onThumbEnter(e) {
      // SP check
      if (window.innerWidth <= 767) return;

      var thumb = e.currentTarget;
      var index = parseInt(thumb.dataset.index);
      var name = thumb.dataset.name;
      var genre = thumb.dataset.genre;
      var pages = thumb.dataset.pages;

      if (activeIndex === index) return;
      resetHover();
      activeIndex = index;

      // SELECTED → タイピング切り替え
      if (selected) selected.style.display = 'none';
      if (pulseTween) pulseTween.pause();
      if (typed) typed.classList.add('is-active');

      // リーダーライン
      var length = calcLineCoords(thumb, index);
      var line = lines[index];
      var cable = cables[index];

      if (line && length) {
        line.style.visibility = 'visible';
        var lineTl = gsap.timeline();
        lineTl.fromTo(line,
          { strokeDashoffset: length },
          { strokeDashoffset: 0, duration: 0.8, ease: EASE_MECH }
        );
        lineTimelines.push(lineTl);
      }

      // 通信ケーブル
      if (cable) {
        cable.style.visibility = 'visible';
        var cableTween = gsap.fromTo(cable,
          { strokeDashoffset: 0 },
          {
            strokeDashoffset: -32,
            duration: 2,
            ease: 'none',
            repeat: -1
          }
        );
        cableTweens.push(cableTween);
      }

      // タイピング
      typeText(name, function () {
        // サブテキスト出現
        if (typedSub) {
          typedSub.textContent = genre + ' / ' + pages;
          gsap.fromTo(typedSub,
            { opacity: 0 },
            { opacity: 1, duration: 0.4, ease: 'power2.out' }
          );
        }
      });

      // サムネイル自動スクロール
      startThumbScroll(thumb);
    }

    // ホバー解除
    function onThumbLeave(e) {
      if (window.innerWidth <= 767) return;
      var thumb = e.currentTarget;
      stopThumbScroll(thumb);
      resetHover();
    }

    // リセット
    function resetHover() {
      clearTimeout(typeTimeout);
      activeIndex = -1;

      // タイピングリセット
      if (typedName) typedName.textContent = '';
      if (typedSub) {
        typedSub.textContent = '';
        typedSub.style.opacity = '0';
      }
      if (typed) typed.classList.remove('is-active');

      // SELECTED復帰
      if (selected) {
        selected.style.display = '';
        if (pulseTween) pulseTween.play();
      }

      // ラインリセット
      lineTimelines.forEach(function (tl) { tl.kill(); });
      lineTimelines = [];
      cableTweens.forEach(function (tw) { tw.kill(); });
      cableTweens = [];

      lines.forEach(function (l) {
        l.style.visibility = 'hidden';
        l.style.strokeDashoffset = l.style.strokeDasharray;
      });
      cables.forEach(function (c) {
        c.style.visibility = 'hidden';
      });
    }

    // イベント登録
    thumbs.forEach(function (thumb) {
      thumb.addEventListener('mouseenter', onThumbEnter);
      thumb.addEventListener('mouseleave', onThumbLeave);
    });

    // SP: タップで作品名表示
    if (window.innerWidth <= 767) {
      thumbs.forEach(function (thumb) {
        thumb.addEventListener('click', function (e) {
          e.preventDefault();
          var name = thumb.dataset.name;
          var genre = thumb.dataset.genre;
          var pages = thumb.dataset.pages;

          // 簡易表示（サムネイル下に作品情報）
          var existing = thumb.querySelector('.works__sp-info');
          if (existing) {
            existing.remove();
            return;
          }
          // 他のSP情報を消す
          document.querySelectorAll('.works__sp-info').forEach(function (el) { el.remove(); });

          var info = document.createElement('div');
          info.className = 'works__sp-info';
          info.innerHTML = '<span class="works__sp-name">' + name + '</span>' +
            '<span class="works__sp-detail">' + genre + ' / ' + pages + '</span>';
          thumb.appendChild(info);
        });
      });
    }

    // Scroll animation — セクション出現
    gsap.fromTo(section.querySelector('.works__index'),
      { opacity: 0, y: 20 },
      {
        opacity: 1, y: 0, duration: 1.2, ease: EASE_MECH,
        scrollTrigger: { trigger: section, start: 'top 80%' }
      }
    );

    gsap.fromTo(thumbs,
      { opacity: 0, y: 30 },
      {
        opacity: 1, y: 0, duration: 1.2, stagger: 0.15, ease: EASE_MECH,
        scrollTrigger: { trigger: section, start: 'top 70%' }
      }
    );

    if (selected) {
      gsap.fromTo(selected,
        { opacity: 0 },
        {
          opacity: 0.70, duration: 1.5, ease: 'power2.out',
          scrollTrigger: { trigger: section, start: 'top 70%' }
        }
      );
    }
  }

  /* ========================================
     Price Section — Scroll Animations
     ======================================== */
  function initPrice() {
    var section = document.querySelector('.price');
    if (!section) return;

    var title = section.querySelector('.price__title');
    var hr = section.querySelector('.price__hr');
    var items = section.querySelectorAll('.price__item');
    var link = section.querySelector('.price__link-wrap');

    // Title
    gsap.fromTo(title,
      { opacity: 0, y: 20 },
      {
        opacity: 1, y: 0, duration: 1.0, ease: EASE_MECH,
        scrollTrigger: { trigger: section, start: 'top 80%' }
      }
    );

    // Horizontal line
    gsap.fromTo(hr,
      { scaleX: 0 },
      {
        scaleX: 1, duration: 0.8, ease: EASE_MECH, transformOrigin: 'left',
        scrollTrigger: { trigger: section, start: 'top 80%' },
        delay: 0.2
      }
    );

    // Price items
    gsap.fromTo(items,
      { opacity: 0, y: 20 },
      {
        opacity: 1, y: 0, duration: 1.0, stagger: 0.15, ease: EASE_MECH,
        scrollTrigger: { trigger: section, start: 'top 70%' }
      }
    );

    // Link
    if (link) {
      gsap.fromTo(link,
        { opacity: 0 },
        {
          opacity: 1, duration: 1.0, ease: 'power2.out',
          scrollTrigger: { trigger: section, start: 'top 60%' }
        }
      );
    }
  }

  /* ========================================
     ⑨ Clip-path Morphing (Works→Price boundary)
     ======================================== */
  function initClipPathMorph() {
    if (window.innerWidth <= 768) return;

    var priceSection = document.querySelector('.price');
    if (!priceSection) return;

    // 境界エリア（セクション上端 ±100px）
    var hitArea = document.createElement('div');
    hitArea.className = 'price__clip-hit';
    hitArea.setAttribute('aria-hidden', 'true');
    priceSection.parentNode.insertBefore(hitArea, priceSection);

    hitArea.addEventListener('mouseenter', function () {
      priceSection.classList.add('is-clip-wave');
    });
    hitArea.addEventListener('mouseleave', function () {
      priceSection.classList.remove('is-clip-wave');
    });
  }

  /* ========================================
     ⑬ Separator Pulsation (Price section)
     ======================================== */
  function initSeparatorPulse() {
    if (window.innerWidth <= 768) return;

    var items = document.querySelectorAll('.price__item');
    if (!items.length) return;

    var svgNS = 'http://www.w3.org/2000/svg';

    items.forEach(function (item) {
      // border-bottom を非表示にし、SVGに置き換え
      var svg = document.createElementNS(svgNS, 'svg');
      svg.setAttribute('class', 'price__separator-svg');
      svg.setAttribute('viewBox', '0 0 1100 6');
      svg.setAttribute('preserveAspectRatio', 'none');
      svg.setAttribute('aria-hidden', 'true');

      var path = document.createElementNS(svgNS, 'path');
      path.setAttribute('d', 'M0,3 L1100,3');
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', '#e0e0e0');
      path.setAttribute('stroke-width', '1');
      svg.appendChild(path);
      item.appendChild(svg);

      var tweenIn = null;
      var tweenOut = null;

      item.addEventListener('mouseenter', function () {
        if (tweenOut) tweenOut.kill();
        tweenIn = gsap.to(path, {
          attr: { d: 'M0,3 Q275,9 550,-1 T1100,3' },
          duration: 0.6,
          ease: 'cubic-bezier(0.16, 1, 0.3, 1)'
        });
      });

      item.addEventListener('mouseleave', function () {
        if (tweenIn) tweenIn.kill();
        tweenOut = gsap.to(path, {
          attr: { d: 'M0,3 L1100,3' },
          duration: 0.6,
          ease: 'cubic-bezier(0.16, 1, 0.3, 1)'
        });
      });
    });
  }

  /* ========================================
     ⑭ Corner Frame Expansion (FV corners)
     ======================================== */
  function initCornerExpansion() {
    if (window.innerWidth <= 768) return;

    var fvSticky = document.querySelector('.fv__sticky');
    if (!fvSticky) return;

    var corners = [
      { selector: '.fv__corner--tl', x: 40, y: 40 },
      { selector: '.fv__corner--tr', x: 1880, y: 40 },
      { selector: '.fv__corner--bl', x: 40, y: 1040 },
      { selector: '.fv__corner--br', x: 1880, y: 1040 }
    ];

    // 各コーナーのhitエリアとアニメーション
    var HIT_SIZE = 150;
    var cornerSvg = document.querySelector('.fv__corners');
    if (!cornerSvg) return;

    corners.forEach(function (c) {
      var polyline = document.querySelector(c.selector);
      if (!polyline) return;

      var hitDiv = document.createElement('div');
      hitDiv.className = 'fv__corner-hit';
      hitDiv.setAttribute('aria-hidden', 'true');

      // polylineのpoints属性からhitエリアの位置を決定
      var isLeft = c.x < 960;
      var isTop = c.y < 540;
      hitDiv.style.position = 'absolute';
      hitDiv.style.width = HIT_SIZE + 'px';
      hitDiv.style.height = HIT_SIZE + 'px';
      hitDiv.style.zIndex = '3';
      if (isLeft) hitDiv.style.left = '0';
      else hitDiv.style.right = '0';
      if (isTop) hitDiv.style.top = '0';
      else hitDiv.style.bottom = '0';

      fvSticky.appendChild(hitDiv);

      // 拡張ポイントの計算
      // 通常: 50px辺 → ホバー: 100px辺
      var originalPoints = polyline.getAttribute('points');
      var expandedPoints;

      if (c.selector === '.fv__corner--tl') {
        expandedPoints = '40,130 40,40 130,40';
      } else if (c.selector === '.fv__corner--tr') {
        expandedPoints = '1790,40 1880,40 1880,130';
      } else if (c.selector === '.fv__corner--bl') {
        expandedPoints = '40,950 40,1040 130,1040';
      } else {
        expandedPoints = '1790,1040 1880,1040 1880,950';
      }

      var tweenIn = null;
      var tweenOut = null;

      hitDiv.addEventListener('mouseenter', function () {
        if (tweenOut) tweenOut.kill();
        tweenIn = gsap.to(polyline, {
          attr: { points: expandedPoints },
          strokeDasharray: 180,
          duration: 0.5,
          ease: 'cubic-bezier(0.16, 1, 0.3, 1)'
        });
      });

      hitDiv.addEventListener('mouseleave', function () {
        if (tweenIn) tweenIn.kill();
        tweenOut = gsap.to(polyline, {
          attr: { points: originalPoints },
          strokeDasharray: 80,
          duration: 0.5,
          ease: 'cubic-bezier(0.16, 1, 0.3, 1)'
        });
      });
    });
  }

  /* ========================================
     Init
     ======================================== */
  document.addEventListener('DOMContentLoaded', function () {
    playSplash(function () {
      revealAndBind();
      initWireframe();
      initRepel();
      initParticles();
      initOrbs();
      initRipple();
      initWorks();
      initPrice();
      initClipPathMorph();
      initSeparatorPulse();
      initCornerExpansion();
    });
  });

})();
