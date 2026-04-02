/* ========================================
   works.js — AKASHIKI Portfolio
   works.html 固有アニメーション + フィルタリング
   ======================================== */

(function () {
  'use strict';

  var GSAP_EASE = 'power4.out';

  /* ========================================
     FV Entrance Animation
     ======================================== */
  function initFVAnimation() {
    var fv = document.querySelector('.works-fv');
    var title = document.querySelector('.works-fv__title');
    var sub = document.querySelector('.works-fv__sub');
    var count = document.querySelector('.works-fv__count');
    var hr = document.querySelector('.works-fv__hr');
    var edgeBL = document.querySelector('.works-fv__edge--bl');
    var edgeBR = document.querySelector('.works-fv__edge--br');

    if (!title || !fv) return;

    var isTransition = sessionStorage.getItem('akashiki-transition') === 'active';
    var startDelay = isTransition ? 0.8 : 0.2;

    var tl = gsap.timeline({
      delay: startDelay,
      onComplete: function () {
        initFVShrink(fv);
      }
    });

    // WORKS: letter-spacing 0.4em→0.25em + opacity 0→1
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

    // 作品総数
    tl.fromTo(count,
      { opacity: 0 },
      { opacity: 1, duration: 0.6, ease: GSAP_EASE },
      '-=0.6'
    );

    // 水平ライン
    tl.fromTo(hr,
      { scaleX: 0 },
      { scaleX: 1, duration: 0.8, ease: GSAP_EASE },
      '-=0.4'
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
     カードスクロール出現アニメーション
     ======================================== */
  function initCardScrollAnimation() {
    var cards = document.querySelectorAll('.work-card');
    if (!cards.length) return;

    cards.forEach(function (card) {
      gsap.fromTo(card,
        { opacity: 0, y: 15 },
        {
          opacity: 1, y: 0,
          duration: 0.8,
          ease: GSAP_EASE,
          scrollTrigger: {
            trigger: card,
            start: 'top 90%',
            toggleActions: 'play none none none'
          }
        }
      );
    });
  }

  /* ========================================
     サムネイル自動スクロール（ホバー演出）
     ======================================== */
  function initThumbnailScroll() {
    var cards = document.querySelectorAll('.work-card');

    cards.forEach(function (card) {
      var img = card.querySelector('.work-card__thumb-inner img');
      if (!img) return;

      var thumbWrap = card.querySelector('.work-card__thumb');
      var scrollTween = null;

      card.addEventListener('mouseenter', function () {
        // 画像の実際の高さとサムネイル表示エリアの高さを比較
        var imgH = img.offsetHeight;
        var wrapH = thumbWrap.offsetHeight;
        var scrollDist = imgH - wrapH;

        if (scrollDist <= 0) return;

        // duration: 画像高さに比例（3〜6秒）
        var duration = Math.min(6, Math.max(3, scrollDist / 300));

        if (scrollTween) scrollTween.kill();

        scrollTween = gsap.fromTo(img,
          { y: 0 },
          {
            y: -scrollDist,
            duration: duration,
            ease: 'none'
          }
        );
      });

      card.addEventListener('mouseleave', function () {
        if (scrollTween) scrollTween.kill();

        gsap.to(img, {
          y: 0,
          duration: 0.5,
          ease: GSAP_EASE
        });
      });
    });
  }

  /* ========================================
     絞り込みフィルター
     ======================================== */
  function initFilter() {
    var buttons = document.querySelectorAll('.works-filter__btn');
    var cards = document.querySelectorAll('.work-card');

    if (!buttons.length || !cards.length) return;

    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var filter = btn.getAttribute('data-filter');

        // アクティブ状態切り替え
        buttons.forEach(function (b) { b.classList.remove('is-active'); });
        btn.classList.add('is-active');

        // フィルタリング: 機械的にパチッと切り替え
        cards.forEach(function (card) {
          var category = card.getAttribute('data-category');
          var shouldShow = (filter === 'all' || category === filter);

          if (!shouldShow) {
            // フェードアウト → 非表示
            gsap.to(card, {
              opacity: 0,
              duration: 0.3,
              ease: 'power2.in',
              onComplete: function () {
                card.classList.add('is-hidden');
              }
            });
          } else {
            // 表示 → フェードイン
            card.classList.remove('is-hidden');
            gsap.fromTo(card,
              { opacity: 0 },
              {
                opacity: 1,
                duration: 0.3,
                ease: 'power2.out'
              }
            );
          }
        });
      });
    });
  }

  /* ========================================
     グリッドライン起動演出（スクロール連動）
     ======================================== */
  function initGridLineAnimation() {
    var grid = document.querySelector('.works-grid');
    if (!grid) return;

    gsap.fromTo(grid,
      { backgroundColor: '#111' },
      {
        backgroundColor: '#1a1a1a',
        duration: 1.0,
        ease: 'none',
        scrollTrigger: {
          trigger: grid,
          start: 'top 80%',
          end: 'bottom 30%',
          scrub: 1
        }
      }
    );
  }

  /* ========================================
     Init
     ======================================== */
  document.addEventListener('DOMContentLoaded', function () {
    gsap.registerPlugin(ScrollTrigger);
    initFVAnimation();
    initCardScrollAnimation();
    initThumbnailScroll();
    initFilter();
    initGridLineAnimation();
  });

})();
