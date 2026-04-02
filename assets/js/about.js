/* ========================================
   about.js — AKASHIKI Portfolio
   about.html 固有アニメーション
   ======================================== */

(function () {
  'use strict';

  var EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';
  var GSAP_EASE = 'power4.out';

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
    initFVAnimation();
    initStoryAnimation();
    initBeliefAnimation();
    initSkillAnimation();
  });

})();
