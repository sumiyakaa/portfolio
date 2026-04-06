/* ========================================
   service.js — AKASHIKI Portfolio
   service.html 固有アニメーション
   ======================================== */

(function () {
  'use strict';

  var GSAP_EASE = 'power4.out';

  /* ========================================
     ③ Neg-Pos Invert — 制作スタイル見出しホバー
     ======================================== */
  function initNegPosInvert() {
    // CSS transitionで実装 — JSは不要（CSSのみ）
  }

  /* ========================================
     ⑥ Border Scanner — ブロックホバー走査線
     ======================================== */
  function initBorderScanner() {
    if (window.innerWidth <= 768) return;

    var svgNS = 'http://www.w3.org/2000/svg';
    var blocks = document.querySelectorAll('.service-style__item, .service-price__item');

    blocks.forEach(function (block) {
      block.style.position = 'relative';

      var svg = document.createElementNS(svgNS, 'svg');
      svg.setAttribute('class', 'service-border-scanner');
      svg.setAttribute('aria-hidden', 'true');
      svg.style.position = 'absolute';
      svg.style.inset = '0';
      svg.style.width = '100%';
      svg.style.height = '100%';
      svg.style.pointerEvents = 'none';
      svg.style.overflow = 'visible';

      var rect = document.createElementNS(svgNS, 'rect');
      rect.setAttribute('x', '0');
      rect.setAttribute('y', '0');
      rect.setAttribute('width', '100%');
      rect.setAttribute('height', '100%');
      rect.setAttribute('fill', 'none');
      rect.setAttribute('stroke', '#fff');
      rect.setAttribute('stroke-width', '1');
      rect.setAttribute('opacity', '0.15');

      svg.appendChild(rect);
      block.appendChild(svg);

      var tweenIn = null;

      function updateDash() {
        var w = block.offsetWidth;
        var h = block.offsetHeight;
        var perimeter = 2 * (w + h);
        rect.style.strokeDasharray = perimeter;
        rect.style.strokeDashoffset = perimeter;
        return perimeter;
      }

      block.addEventListener('mouseenter', function () {
        var perimeter = updateDash();
        if (tweenIn) tweenIn.kill();
        tweenIn = gsap.to(rect.style, {
          strokeDashoffset: 0,
          duration: 1.2,
          ease: 'none'
        });
      });

      block.addEventListener('mouseleave', function () {
        if (tweenIn) tweenIn.kill();
        var perimeter = 2 * (block.offsetWidth + block.offsetHeight);
        rect.style.strokeDashoffset = perimeter;
      });
    });
  }

  /* ========================================
     ⑧ 3D Tilt — 制作スタイル各項目ホバー
     ======================================== */
  function initTilt() {
    if (window.innerWidth <= 768) return;

    var items = document.querySelectorAll('.service-style__item');
    items.forEach(function (item) {
      item.style.willChange = 'transform';

      // 親にperspective設定
      var parent = item.parentElement;
      if (parent) parent.style.perspective = '600px';

      item.addEventListener('mouseenter', function (e) {
        var rect = item.getBoundingClientRect();
        var cx = e.clientX - rect.left;
        var cy = e.clientY - rect.top;
        var halfW = rect.width / 2;
        var halfH = rect.height / 2;

        var rotY = cx < halfW ? 2 : -2;
        var rotX = cy < halfH ? -2 : 2;

        gsap.to(item, {
          rotateX: rotX,
          rotateY: rotY,
          duration: 0.5,
          ease: 'cubic-bezier(0.16, 1, 0.3, 1)'
        });
      });

      item.addEventListener('mouseleave', function () {
        gsap.to(item, {
          rotateX: 0,
          rotateY: 0,
          duration: 0.5,
          ease: 'cubic-bezier(0.16, 1, 0.3, 1)'
        });
      });
    });
  }

  /* ========================================
     Circuit Pattern — 回路パターン背景
     ======================================== */
  function initCircuitPattern() {
    var fv = document.querySelector('.service-fv');
    if (!fv) return;

    var container = document.createElement('div');
    container.className = 'service-fv__circuit';
    container.setAttribute('aria-hidden', 'true');

    var svgNS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', '0 0 1920 1080');
    svg.setAttribute('preserveAspectRatio', 'none');

    var traces = [
      { d: 'M100,200 H300 V400 H500', nodes: [[100,200],[300,200],[300,400],[500,400]] },
      { d: 'M800,100 V350 H1000 V500', nodes: [[800,100],[800,350],[1000,350],[1000,500]] },
      { d: 'M1400,300 H1200 V600 H1500 V450', nodes: [[1400,300],[1200,300],[1200,600],[1500,600],[1500,450]] },
      { d: 'M200,700 H450 V900 H700', nodes: [[200,700],[450,700],[450,900],[700,900]] },
      { d: 'M1600,150 V400 H1800 V650', nodes: [[1600,150],[1600,400],[1800,400],[1800,650]] },
      { d: 'M900,600 H1100 V800 H1300 V700', nodes: [[900,600],[1100,600],[1100,800],[1300,800],[1300,700]] }
    ];

    traces.forEach(function (t, i) {
      var path = document.createElementNS(svgNS, 'path');
      path.setAttribute('d', t.d);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', 'rgba(255,255,255,0.15)');
      path.setAttribute('stroke-width', '0.8');
      path.setAttribute('stroke-dasharray', '8 20');
      path.style.willChange = 'stroke-dashoffset';
      svg.appendChild(path);

      // データフロー: dashoffset連続変化
      gsap.to(path, {
        strokeDashoffset: -56,
        duration: 4,
        ease: 'none',
        repeat: -1,
        delay: i * 1
      });

      // ノード
      t.nodes.forEach(function (n) {
        var rect = document.createElementNS(svgNS, 'rect');
        rect.setAttribute('x', n[0] - 2);
        rect.setAttribute('y', n[1] - 2);
        rect.setAttribute('width', '4');
        rect.setAttribute('height', '4');
        rect.setAttribute('fill', 'rgba(255,255,255,0.12)');
        svg.appendChild(rect);

        // ノードパルス
        gsap.to(rect, {
          opacity: 0.20,
          duration: 3,
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1
        });
        gsap.set(rect, { opacity: 0.10 });
      });
    });

    container.appendChild(svg);
    fv.appendChild(container);
  }

  /* ========================================
     FV Entrance Animation
     ======================================== */
  function initFVAnimation() {
    var fv = document.querySelector('.service-fv');
    var title = document.querySelector('.service-fv__title');
    var sub = document.querySelector('.service-fv__sub');
    var hr = document.querySelector('.service-fv__hr');
    var edgeBL = document.querySelector('.service-fv__edge--bl');
    var edgeBR = document.querySelector('.service-fv__edge--br');

    if (!title || !fv) return;

    var isTransition = sessionStorage.getItem('akashiki-transition') === 'active';
    var startDelay = isTransition ? 0.8 : 0.2;

    var tl = gsap.timeline({
      delay: startDelay,
      onComplete: function () {
        initFVShrink(fv);
      }
    });

    // SERVICE: letter-spacing 0.4em→0.25em + opacity 0→1
    tl.fromTo(title,
      { opacity: 0, letterSpacing: '0.4em' },
      { opacity: 1, letterSpacing: '0.25em', duration: 1.2, ease: GSAP_EASE }
    );

    // サブテキスト
    tl.fromTo(sub,
      { opacity: 0 },
      { opacity: 1, duration: 0.8, ease: GSAP_EASE },
      '-=0.8'
    );

    // 水平ライン
    tl.fromTo(hr,
      { scaleX: 0 },
      { scaleX: 1, duration: 0.8, ease: GSAP_EASE },
      '-=0.6'
    );

    // エッジテキスト
    tl.fromTo(edgeBL,
      { opacity: 0 },
      { opacity: 1, duration: 0.6, ease: GSAP_EASE },
      '-=0.4'
    );
    tl.fromTo(edgeBR,
      { opacity: 0 },
      { opacity: 1, duration: 0.6, ease: GSAP_EASE },
      '-=0.5'
    );
  }

  /* ========================================
     FV Shrink Animation (100vh → 50vh)
     ======================================== */
  function initFVShrink(fv) {
    if (!fv) return;

    var shrinkTl = gsap.timeline();

    shrinkTl.to(fv, {
      height: '50vh',
      duration: 0.8,
      ease: 'cubic-bezier(0.16, 1, 0.3, 1)',
      onComplete: function () {
        fv.style.height = '50vh';
        ScrollTrigger.refresh();
      }
    });
  }

  /* ========================================
     制作スタイル スクロールアニメーション
     ======================================== */
  function initStyleAnimation() {
    var title = document.querySelector('.service-style__title');
    var items = document.querySelectorAll('.service-style__item');

    if (!title) return;

    // 左タイトル
    gsap.fromTo(title,
      { opacity: 0, y: 20 },
      {
        opacity: 1, y: 0,
        duration: 1.0,
        ease: GSAP_EASE,
        scrollTrigger: {
          trigger: title,
          start: 'top 80%',
          toggleActions: 'play none none none'
        }
      }
    );

    // 右の各項目: stagger
    items.forEach(function (item, i) {
      gsap.fromTo(item,
        { opacity: 0, y: 20 },
        {
          opacity: 1, y: 0,
          duration: 1.0,
          delay: i * 0.15,
          ease: GSAP_EASE,
          scrollTrigger: {
            trigger: item,
            start: 'top 85%',
            toggleActions: 'play none none none'
          }
        }
      );
    });
  }

  /* ========================================
     AIO説明 スクロールアニメーション
     ======================================== */
  function initAIOAnimation() {
    var title = document.querySelector('.service-aio__title');
    var lead = document.querySelector('.service-aio__lead');
    var texts = document.querySelectorAll('.service-aio__text');
    var listItems = document.querySelectorAll('.service-aio__list-item');

    if (!title) return;

    // タイトル + リード
    gsap.fromTo(title,
      { opacity: 0, y: 20 },
      {
        opacity: 1, y: 0,
        duration: 1.0,
        ease: GSAP_EASE,
        scrollTrigger: {
          trigger: title,
          start: 'top 80%',
          toggleActions: 'play none none none'
        }
      }
    );

    gsap.fromTo(lead,
      { opacity: 0 },
      {
        opacity: 1,
        duration: 0.8,
        ease: GSAP_EASE,
        scrollTrigger: {
          trigger: lead,
          start: 'top 85%',
          toggleActions: 'play none none none'
        }
      }
    );

    // 本文
    texts.forEach(function (t, i) {
      gsap.fromTo(t,
        { opacity: 0, y: 15 },
        {
          opacity: 1, y: 0,
          duration: 0.8,
          delay: 0.3 + i * 0.1,
          ease: GSAP_EASE,
          scrollTrigger: {
            trigger: t,
            start: 'top 88%',
            toggleActions: 'play none none none'
          }
        }
      );
    });

    // 箇条書き: stagger 0.15s
    listItems.forEach(function (li, i) {
      gsap.fromTo(li,
        { opacity: 0, x: -10 },
        {
          opacity: 1, x: 0,
          duration: 0.6,
          delay: i * 0.15,
          ease: GSAP_EASE,
          scrollTrigger: {
            trigger: li,
            start: 'top 90%',
            toggleActions: 'play none none none'
          }
        }
      );
    });
  }

  /* ========================================
     料金 スクロールアニメーション
     ======================================== */
  function initPriceAnimation() {
    var title = document.querySelector('.service-price__title');
    var hr = document.querySelector('.service-price__hr');
    var items = document.querySelectorAll('.service-price__item');
    var option = document.querySelector('.service-price__option');

    if (!title) return;

    // タイトル
    gsap.fromTo(title,
      { opacity: 0, y: 20 },
      {
        opacity: 1, y: 0,
        duration: 1.0,
        ease: GSAP_EASE,
        scrollTrigger: {
          trigger: title,
          start: 'top 80%',
          toggleActions: 'play none none none'
        }
      }
    );

    // 水平ライン
    gsap.fromTo(hr,
      { scaleX: 0 },
      {
        scaleX: 1,
        duration: 0.8,
        ease: GSAP_EASE,
        scrollTrigger: {
          trigger: hr,
          start: 'top 85%',
          toggleActions: 'play none none none'
        }
      }
    );

    // 基本料金: stagger 0.15s
    items.forEach(function (item, i) {
      gsap.fromTo(item,
        { opacity: 0, y: 15 },
        {
          opacity: 1, y: 0,
          duration: 0.8,
          delay: i * 0.15,
          ease: GSAP_EASE,
          scrollTrigger: {
            trigger: item,
            start: 'top 85%',
            toggleActions: 'play none none none'
          }
        }
      );
    });

    // オプション: 基本料金後に delay 0.3s
    if (option) {
      gsap.fromTo(option,
        { opacity: 0, y: 15 },
        {
          opacity: 1, y: 0,
          duration: 0.8,
          delay: 0.3,
          ease: GSAP_EASE,
          scrollTrigger: {
            trigger: option,
            start: 'top 85%',
            toggleActions: 'play none none none'
          }
        }
      );
    }
  }

  /* ========================================
     制作の流れ スクロールアニメーション（連鎖起動）
     ======================================== */
  function initProcessAnimation() {
    var title = document.querySelector('.service-process__title');
    var hr = document.querySelector('.service-process__hr');
    var line = document.querySelector('.service-process__line');
    var steps = document.querySelectorAll('.service-process__step');

    if (!title) return;

    // タイトル
    gsap.fromTo(title,
      { opacity: 0, y: 20 },
      {
        opacity: 1, y: 0,
        duration: 1.0,
        ease: GSAP_EASE,
        scrollTrigger: {
          trigger: title,
          start: 'top 80%',
          toggleActions: 'play none none none'
        }
      }
    );

    // 水平ライン
    gsap.fromTo(hr,
      { scaleX: 0 },
      {
        scaleX: 1,
        duration: 0.8,
        ease: GSAP_EASE,
        scrollTrigger: {
          trigger: hr,
          start: 'top 85%',
          toggleActions: 'play none none none'
        }
      }
    );

    // 垂直ライン: scaleY 0→1（上から下に伸長、スクロール連動）
    if (line) {
      gsap.fromTo(line,
        { scaleY: 0 },
        {
          scaleY: 1,
          duration: 1.5,
          ease: 'none',
          scrollTrigger: {
            trigger: line,
            start: 'top 80%',
            end: 'bottom 30%',
            scrub: 1
          }
        }
      );
    }

    // 各ステップ: ラインが到達するタイミングで連鎖起動
    steps.forEach(function (step, i) {
      // 番号が先に出現（0.1s先行）
      var num = step.querySelector('.service-process__num');
      var name = step.querySelector('.service-process__name');
      var text = step.querySelector('.service-process__text');

      var stepTl = gsap.timeline({
        scrollTrigger: {
          trigger: step,
          start: 'top 80%',
          toggleActions: 'play none none none'
        }
      });

      // 番号先行
      if (num) {
        stepTl.fromTo(num,
          { opacity: 0 },
          { opacity: 1, duration: 0.4, ease: GSAP_EASE }
        );
      }

      // step全体を表示
      stepTl.fromTo(step,
        { opacity: 0 },
        { opacity: 1, duration: 0.6, ease: GSAP_EASE },
        '-=0.3'
      );
    });
  }

  /* ========================================
     Marker Highlight — スクロール発火マーカー
     ======================================== */
  function initMarkerHighlight() {
    var markers = document.querySelectorAll('.marker');
    if (!markers.length) return;

    markers.forEach(function (marker, i) {
      ScrollTrigger.create({
        trigger: marker,
        start: 'top 85%',
        once: true,
        onEnter: function () {
          gsap.delayedCall(i * 0.3, function () {
            marker.classList.add('is-visible');
          });
        }
      });
    });

    // Stats fade-up stagger
    var stats = document.querySelectorAll('.service-aio__stat');
    if (stats.length) {
      gsap.fromTo(stats,
        { opacity: 0, y: 30 },
        {
          opacity: 1, y: 0, duration: 1.0, stagger: 0.2,
          ease: 'cubic-bezier(0.16, 1, 0.3, 1)',
          scrollTrigger: { trigger: '.service-aio__stats', start: 'top 70%' }
        }
      );
    }
  }

  /* ========================================
     Hash Scroll — FV縮小後にアンカーへスクロール
     ======================================== */
  function initHashScroll() {
    if (window.location.hash !== '#aio') return;
    window.scrollTo(0, 0);
    var fv = document.querySelector('.service-fv');
    var target = document.getElementById('aio');
    if (!fv || !target) return;
    var check = setInterval(function () {
      if (fv.offsetHeight <= window.innerHeight * 0.55) {
        clearInterval(check);
        setTimeout(function () {
          var rect = target.getBoundingClientRect();
          var scrollY = window.pageYOffset + rect.top - 40;
          window.scrollTo({ top: scrollY, behavior: 'smooth' });
        }, 300);
      }
    }, 100);
    setTimeout(function () { clearInterval(check); }, 8000);
  }

  /* ========================================
     Init
     ======================================== */
  document.addEventListener('DOMContentLoaded', function () {
    gsap.registerPlugin(ScrollTrigger);
    initCircuitPattern();
    initFVAnimation();
    initStyleAnimation();
    initAIOAnimation();
    initPriceAnimation();
    initProcessAnimation();
    initNegPosInvert();
    initBorderScanner();
    initTilt();
    initMarkerHighlight();
    initHashScroll();
  });

})();
