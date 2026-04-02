/* ========================================
   service.js — AKASHIKI Portfolio
   service.html 固有アニメーション
   ======================================== */

(function () {
  'use strict';

  var GSAP_EASE = 'power4.out';

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
     Init
     ======================================== */
  document.addEventListener('DOMContentLoaded', function () {
    gsap.registerPlugin(ScrollTrigger);
    initFVAnimation();
    initStyleAnimation();
    initAIOAnimation();
    initPriceAnimation();
    initProcessAnimation();
  });

})();
