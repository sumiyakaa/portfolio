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

      // SELECTED → タイピング切り替え（opacityのみ、display変更なし）
      if (pulseTween) pulseTween.pause();
      if (selected) gsap.set(selected, { opacity: 0 });
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

      // SELECTED復帰 — ふわっとフェードイン
      if (selected) {
        gsap.to(selected, {
          opacity: 0.70,
          duration: 0.6,
          ease: 'power2.out',
          onComplete: function () {
            if (pulseTween) pulseTween.restart();
          }
        });
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
     Init
     ======================================== */
  document.addEventListener('DOMContentLoaded', function () {
    playSplash(function () {
      revealAndBind();
      initOrbs();
      initWorks();
      initPrice();
    });
  });

})();
