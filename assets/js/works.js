/* ========================================
   works.js — AKASHIKI Portfolio
   works.html 固有アニメーション + フィルタリング
   ======================================== */

(function () {
  'use strict';

  var GSAP_EASE = 'power4.out';

  /* ========================================
     ① Text Split — FVタイトル文字分裂
     ======================================== */
  function initTextSplit() {
    if (window.innerWidth <= 768) return;

    var titleArea = document.querySelector('.works-fv__title-area');
    var title = document.querySelector('.works-fv__title');
    if (!titleArea || !title) return;

    // 文字をspan分割
    var text = title.textContent.trim();
    title.innerHTML = '';
    var chars = [];
    var offsets = [];

    for (var i = 0; i < text.length; i++) {
      var span = document.createElement('span');
      span.className = 'works-fv__char';
      span.textContent = text[i];
      title.appendChild(span);
      chars.push(span);

      // ランダムオフセット（ページロード時に決定）
      var sign = function () { return Math.random() > 0.5 ? 1 : -1; };
      offsets.push({
        x: sign() * (3 + Math.random() * 5),
        y: sign() * (3 + Math.random() * 5)
      });
    }

    titleArea.addEventListener('mouseenter', function () {
      chars.forEach(function (c, idx) {
        gsap.to(c, {
          x: offsets[idx].x,
          y: offsets[idx].y,
          duration: 0.4,
          delay: idx * 0.02,
          ease: 'cubic-bezier(0.16, 1, 0.3, 1)'
        });
      });
    });

    titleArea.addEventListener('mouseleave', function () {
      chars.forEach(function (c, idx) {
        gsap.to(c, {
          x: 0,
          y: 0,
          duration: 0.6,
          delay: idx * 0.02,
          ease: 'elastic.out(1, 0.5)'
        });
      });
    });
  }

  /* ========================================
     ⑫ Scale Breeze — 作品カードスケール
     ======================================== */
  function initScaleBreeze() {
    if (window.innerWidth <= 768) return;

    var cards = document.querySelectorAll('.work-card');
    if (!cards.length) return;

    var gridInner = document.querySelector('.works-grid__inner');
    if (!gridInner) return;

    cards.forEach(function (card, i) {
      card.addEventListener('mouseenter', function () {
        gsap.to(card, {
          scale: 1.02,
          duration: 0.4,
          ease: 'cubic-bezier(0.16, 1, 0.3, 1)'
        });

        // 同じ行の隣接カード取得
        var cols = getComputedStyle(gridInner).gridTemplateColumns.split(' ').length;
        var row = Math.floor(i / cols);
        var leftIdx = i - 1;
        var rightIdx = i + 1;

        if (leftIdx >= 0 && Math.floor(leftIdx / cols) === row) {
          gsap.to(cards[leftIdx], {
            scale: 0.98,
            duration: 0.4,
            ease: 'cubic-bezier(0.16, 1, 0.3, 1)'
          });
        }
        if (rightIdx < cards.length && Math.floor(rightIdx / cols) === row) {
          gsap.to(cards[rightIdx], {
            scale: 0.98,
            duration: 0.4,
            ease: 'cubic-bezier(0.16, 1, 0.3, 1)'
          });
        }
      });

      card.addEventListener('mouseleave', function () {
        cards.forEach(function (c) {
          gsap.to(c, {
            scale: 1,
            duration: 0.4,
            ease: 'cubic-bezier(0.16, 1, 0.3, 1)'
          });
        });
      });
    });
  }

  /* ========================================
     ⑮ Dot Expansion — 背景ドット膨張
     パフォーマンス重視: CSS背景のまま、ホバー時にカード付近のオーバーレイSVGドットだけ膨張
     ======================================== */
  function initDotExpansion() {
    if (window.innerWidth <= 768) return;

    var grid = document.querySelector('.works-grid');
    var cards = document.querySelectorAll('.work-card');
    if (!grid || !cards.length) return;

    var svgNS = 'http://www.w3.org/2000/svg';

    // グリッドエリアにSVGオーバーレイ
    var overlay = document.createElement('div');
    overlay.className = 'works-dot-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    grid.style.position = 'relative';
    grid.appendChild(overlay);

    var svg = document.createElementNS(svgNS, 'svg');
    svg.style.position = 'absolute';
    svg.style.inset = '0';
    svg.style.width = '100%';
    svg.style.height = '100%';
    svg.style.pointerEvents = 'none';
    overlay.appendChild(svg);

    // ドット生成（30px間隔）
    var DOT_GAP = 30;
    var dots = [];

    function generateDots() {
      var w = grid.offsetWidth;
      var h = grid.offsetHeight;
      svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);

      for (var x = DOT_GAP; x < w; x += DOT_GAP) {
        for (var y = DOT_GAP; y < h; y += DOT_GAP) {
          var circle = document.createElementNS(svgNS, 'circle');
          circle.setAttribute('cx', x);
          circle.setAttribute('cy', y);
          circle.setAttribute('r', '1');
          circle.setAttribute('fill', 'rgba(255,255,255,0.12)');
          svg.appendChild(circle);
          dots.push({ el: circle, x: x, y: y });
        }
      }
    }

    generateDots();

    // カードホバーで近くのドットを膨張
    cards.forEach(function (card) {
      card.addEventListener('mouseenter', function () {
        var rect = card.getBoundingClientRect();
        var gridRect = grid.getBoundingClientRect();

        var cardLeft = rect.left - gridRect.left - DOT_GAP;
        var cardRight = rect.right - gridRect.left + DOT_GAP;
        var cardTop = rect.top - gridRect.top - DOT_GAP;
        var cardBottom = rect.bottom - gridRect.top + DOT_GAP;

        dots.forEach(function (d, idx) {
          if (d.x >= cardLeft && d.x <= cardRight && d.y >= cardTop && d.y <= cardBottom) {
            gsap.to(d.el, {
              attr: { r: 3 },
              fill: 'rgba(255,255,255,0.25)',
              duration: 0.3,
              delay: idx % 10 * 0.01,
              ease: 'power2.out'
            });
          }
        });
      });

      card.addEventListener('mouseleave', function () {
        dots.forEach(function (d) {
          gsap.to(d.el, {
            attr: { r: 1 },
            fill: 'rgba(255,255,255,0.12)',
            duration: 0.4,
            ease: 'power2.out'
          });
        });
      });
    });
  }

  /* ========================================
     Dot Matrix — ドットマトリクス背景
     ======================================== */
  function initDotMatrix() {
    var fv = document.querySelector('.works-fv');
    if (!fv) return;

    var matrix = document.createElement('div');
    matrix.className = 'works-fv__dot-matrix';
    matrix.setAttribute('aria-hidden', 'true');
    fv.appendChild(matrix);

    // スクロール視差
    gsap.to(matrix, {
      backgroundPositionY: '-20px',
      ease: 'none',
      scrollTrigger: {
        trigger: fv,
        start: 'top top',
        end: 'bottom top',
        scrub: true
      }
    });
  }

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
    initDotMatrix();
    initFVAnimation();
    initCardScrollAnimation();
    initThumbnailScroll();
    initFilter();
    initGridLineAnimation();
    initTextSplit();
    initScaleBreeze();
    initDotExpansion();
  });

})();
