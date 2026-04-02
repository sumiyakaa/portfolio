/* ========================================
   about.js — AKASHIKI Portfolio
   about.html 固有アニメーション
   ======================================== */

(function () {
  'use strict';

  var EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';
  var GSAP_EASE = 'power4.out';

  /* ========================================
     ④ Stroke Expose — FVタイトルホバー
     ======================================== */
  function initStrokeExpose() {
    if (window.innerWidth <= 768) return;

    var title = document.querySelector('.about-fv__title');
    if (!title) return;

    title.addEventListener('mouseenter', function () {
      title.classList.add('is-stroke');
    });
    title.addEventListener('mouseleave', function () {
      title.classList.remove('is-stroke');
    });
  }

  /* ========================================
     ② Weight Shift — セクション見出しホバー
     ======================================== */
  function initWeightShift() {
    if (window.innerWidth <= 768) return;

    var headings = document.querySelectorAll('.about-skill__title');
    if (!headings.length) return;
    // Barlow見出しに適用（SKILL SET等）
  }

  /* ========================================
     ⑦ Grid Line Appearance — 信条ブロックホバー
     ======================================== */
  function initGridAppearance() {
    if (window.innerWidth <= 768) return;

    var items = document.querySelectorAll('.about-belief__item');
    if (!items.length) return;

    items.forEach(function (item) {
      var overlay = document.createElement('div');
      overlay.className = 'about-belief__grid-overlay';
      overlay.setAttribute('aria-hidden', 'true');
      item.style.position = 'relative';
      item.appendChild(overlay);

      item.addEventListener('mouseenter', function () {
        gsap.to(overlay, { opacity: 0.15, duration: 0.5 });
      });
      item.addEventListener('mouseleave', function () {
        gsap.to(overlay, { opacity: 0, duration: 0.5 });
      });
    });
  }

  /* ========================================
     水平流線（墨の筆跡）
     ======================================== */
  function initFlowLines() {
    var fv = document.querySelector('.about-fv');
    if (!fv) return;

    var container = document.createElement('div');
    container.className = 'about-fv__flow-lines';
    container.setAttribute('aria-hidden', 'true');

    var svgNS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', '0 0 4000 1080');
    svg.setAttribute('preserveAspectRatio', 'none');

    var paths = [
      { d: 'M0,120 Q200,125 400,117 T800,122 T1200,119 T1600,123 T2000,120', y: 0, dur: 35, sw: 0.8 },
      { d: 'M0,220 Q200,225 400,213 T800,222 T1200,218 T1600,226 T2000,220', y: 0, dur: 42, sw: 0.5 },
      { d: 'M0,380 Q200,385 400,377 T800,382 T1200,375 T1600,383 T2000,380', y: 0, dur: 30, sw: 1.2 },
      { d: 'M0,500 Q200,505 400,497 T800,502 T1200,495 T1600,503 T2000,500', y: 0, dur: 48, sw: 0.4 },
      { d: 'M0,650 Q200,655 400,643 T800,652 T1200,648 T1600,656 T2000,650', y: 0, dur: 38, sw: 1.0 },
      { d: 'M0,780 Q200,783 400,775 T800,782 T1200,777 T1600,784 T2000,780', y: 0, dur: 45, sw: 0.6 },
      { d: 'M0,900 Q200,905 400,897 T800,902 T1200,895 T1600,903 T2000,900', y: 0, dur: 33, sw: 1.5 }
    ];

    paths.forEach(function (p) {
      var path = document.createElementNS(svgNS, 'path');
      path.setAttribute('d', p.d);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', 'rgba(255,255,255,0.15)');
      path.setAttribute('stroke-width', p.sw);
      path.style.willChange = 'transform, opacity';
      svg.appendChild(path);

      // 水平ドリフト
      gsap.fromTo(path,
        { x: 0 },
        { x: -2000, duration: p.dur, ease: 'none', repeat: -1 }
      );

      // opacity sin波変動
      gsap.fromTo(path,
        { opacity: 0.10 },
        { opacity: 0.20, duration: 8, ease: 'sine.inOut', yoyo: true, repeat: -1 }
      );
    });

    container.appendChild(svg);
    fv.appendChild(container);
  }

  /* ========================================
     FV Entrance Animation
     ======================================== */
  function initFVAnimation() {
    var fv = document.querySelector('.about-fv');
    var title = document.querySelector('.about-fv__title');
    var sub = document.querySelector('.about-fv__sub');
    var hr = document.querySelector('.about-fv__hr');
    var edgeBL = document.querySelector('.about-fv__edge--bl');
    var edgeBR = document.querySelector('.about-fv__edge--br');

    if (!title || !fv) return;

    var isTransition = sessionStorage.getItem('akashiki-transition') === 'active';
    var startDelay = isTransition ? 0.8 : 0.2;

    var tl = gsap.timeline({
      delay: startDelay,
      onComplete: function () {
        // FV入場アニメーション完了後、1秒静止→50vhに縮小
        initFVShrink(fv);
      }
    });

    // 名前: letter-spacing 0.4em→0.2em + opacity 0→1
    tl.fromTo(title,
      { opacity: 0, letterSpacing: '0.4em' },
      { opacity: 1, letterSpacing: '0.2em', duration: 1.2, ease: GSAP_EASE }
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
     経歴ストーリー スクロールアニメーション
     ======================================== */
  function initStoryAnimation() {
    var lead = document.querySelector('.about-story__lead');
    var paragraphs = document.querySelectorAll('.about-story__paragraph');
    var highlight = document.querySelector('.about-story__highlight');

    if (!lead) return;

    // リード文
    gsap.fromTo(lead,
      { opacity: 0, y: 20 },
      {
        opacity: 1, y: 0,
        duration: 1.2,
        ease: GSAP_EASE,
        scrollTrigger: {
          trigger: lead,
          start: 'top 80%',
          toggleActions: 'play none none none'
        }
      }
    );

    // 本文各段落
    paragraphs.forEach(function (p, i) {
      gsap.fromTo(p,
        { opacity: 0, y: 20 },
        {
          opacity: 1, y: 0,
          duration: 1.2,
          delay: i * 0.2,
          ease: GSAP_EASE,
          scrollTrigger: {
            trigger: p,
            start: 'top 85%',
            toggleActions: 'play none none none'
          }
        }
      );
    });

    // ハイライト行
    if (highlight) {
      gsap.fromTo(highlight,
        { opacity: 0, y: 15 },
        {
          opacity: 1, y: 0,
          duration: 1.0,
          ease: GSAP_EASE,
          scrollTrigger: {
            trigger: highlight,
            start: 'top 85%',
            toggleActions: 'play none none none'
          }
        }
      );
    }
  }

  /* ========================================
     信条・こだわり スクロールアニメーション
     ======================================== */
  function initBeliefAnimation() {
    var items = document.querySelectorAll('.about-belief__item');
    var dividers = document.querySelectorAll('.about-belief__divider');

    if (!items.length) return;

    // 各信条: 左からスライド
    items.forEach(function (item, i) {
      gsap.fromTo(item,
        { opacity: 0, x: -20 },
        {
          opacity: 1, x: 0,
          duration: 1.0,
          delay: i * 0.2,
          ease: GSAP_EASE,
          scrollTrigger: {
            trigger: item,
            start: 'top 85%',
            toggleActions: 'play none none none'
          }
        }
      );
    });

    // 区切り線: scaleX 0→1
    dividers.forEach(function (div) {
      gsap.fromTo(div,
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: 0.8,
          ease: GSAP_EASE,
          scrollTrigger: {
            trigger: div,
            start: 'top 85%',
            toggleActions: 'play none none none'
          }
        }
      );
    });
  }

  /* ========================================
     スキルセット スクロールアニメーション
     ======================================== */
  function initSkillAnimation() {
    var title = document.querySelector('.about-skill__title');
    var hr = document.querySelector('.about-skill__hr');
    var rows = document.querySelectorAll('.about-skill__row');

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

    // 各行: stagger 0.1s
    rows.forEach(function (row, i) {
      gsap.fromTo(row,
        { opacity: 0, x: -10 },
        {
          opacity: 1, x: 0,
          duration: 0.8,
          delay: i * 0.1,
          ease: GSAP_EASE,
          scrollTrigger: {
            trigger: row,
            start: 'top 90%',
            toggleActions: 'play none none none'
          }
        }
      );
    });
  }

  /* ========================================
     Init
     ======================================== */
  document.addEventListener('DOMContentLoaded', function () {
    gsap.registerPlugin(ScrollTrigger);
    initFlowLines();
    initFVAnimation();
    initStoryAnimation();
    initBeliefAnimation();
    initSkillAnimation();
    initStrokeExpose();
    initWeightShift();
    initGridAppearance();
  });

})();
