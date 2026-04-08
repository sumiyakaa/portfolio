/* ========================================
   common.js — AKASHIKI Portfolio
   ヘッダー制御 / ページ遷移 / SPメニュー
   Lenis / char分割 / マグネティック / スクロールCSS変数 / clip-path reveal
   ======================================== */

(function () {
  'use strict';

  var EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';

  /* ========================================
     Lenis Instance（グローバル）
     ======================================== */
  window.lenis = null;

  /* ========================================
     Smart Header
     ======================================== */
  function initHeader() {
    var header = document.querySelector('.header');
    if (!header) return;

    var isIndex = !!document.querySelector('.fv');
    var subFv = document.querySelector('.about-fv, .service-fv, .works-fv, .contact-fv');

    var ticking = false;

    var headerVisible = false;
    var BUFFER = 50; // ヒステリシス: 閾値±50pxのバッファで点滅防止

    function onScroll() {
      if (ticking) return;
      ticking = true;

      requestAnimationFrame(function () {
        var currentY = window.scrollY;
        var threshold = isIndex
          ? window.innerHeight
          : (subFv ? subFv.offsetHeight : window.innerHeight);

        if (!headerVisible && currentY > threshold + BUFFER) {
          headerVisible = true;
          header.classList.remove('is-hidden');
          header.classList.add('is-visible');
        } else if (headerVisible && currentY < threshold - BUFFER) {
          headerVisible = false;
          header.classList.remove('is-visible');
          header.classList.add('is-hidden');
        }

        ticking = false;
      });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ========================================
     SP Hamburger Menu
     ======================================== */
  function initBurgerMenu() {
    var burger = document.querySelector('.header__burger');
    var menu = document.querySelector('.sp-menu');
    if (!burger || !menu) return;

    var links = menu.querySelectorAll('.sp-menu__link');

    burger.addEventListener('click', function () {
      var isOpen = burger.classList.toggle('is-open');
      menu.classList.toggle('is-open', isOpen);
      document.body.classList.toggle('is-locked', isOpen);
    });

    links.forEach(function (link) {
      link.addEventListener('click', function () {
        burger.classList.remove('is-open');
        menu.classList.remove('is-open');
        document.body.classList.remove('is-locked');
      });
    });
  }

  /* ========================================
     Page Transition
     ======================================== */
  function initPageTransition() {
    var overlay = document.querySelector('.page-transition');
    var line = document.querySelector('.page-transition__line');
    if (!overlay || !line) return;

    // Entrance: 遷移元がある場合、逆アニメーションで開く
    if (sessionStorage.getItem('akashiki-transition') === 'active') {
      sessionStorage.removeItem('akashiki-transition');
      overlay.style.clipPath = 'inset(0)';
      overlay.classList.add('is-active');
      line.style.transform = 'scaleX(1)';

      var entranceTl = gsap.timeline({
        onComplete: function () {
          overlay.classList.remove('is-active');
          overlay.style.clipPath = '';
          overlay.style.display = 'none';
          line.style.transform = '';
          // Lenis再開（オープニング待ちでなければ）
          var splashPending = !!document.getElementById('lanternOpening');
          if (window.lenis && !splashPending) {
            window.lenis.start();
          }
        }
      });

      entranceTl
        .to(line, {
          scaleX: 0,
          duration: 0.3,
          ease: 'power2.in'
        })
        .to(overlay, {
          clipPath: 'inset(50% 0)',
          duration: 0.5,
          ease: EASE
        }, '-=0.1');
    } else {
      // 入場トランジションなし → オーバーレイをGPUレイヤーから除外
      overlay.style.display = 'none';
    }

    // 戻るボタン対策: Exitアニメーション状態が残っていたらリセット
    window.addEventListener('pageshow', function () {
      if (overlay.classList.contains('is-active')) {
        overlay.classList.remove('is-active');
        overlay.style.clipPath = '';
        overlay.style.display = 'none';
        line.style.transform = '';
        sessionStorage.removeItem('akashiki-transition');
        if (window.lenis) window.lenis.start();
      }
    });

    // Exit: 内部リンククリック時にトランジション
    document.addEventListener('click', function (e) {
      var anchor = e.target.closest('a[href]');
      if (!anchor) return;

      var href = anchor.getAttribute('href');
      if (!href ||
          href.startsWith('#') ||
          href.startsWith('http') ||
          href.startsWith('mailto') ||
          href.startsWith('tel') ||
          anchor.target === '_blank') return;

      e.preventDefault();

      // Lenis停止
      if (window.lenis) window.lenis.stop();

      overlay.style.display = '';
      overlay.classList.add('is-active');

      var exitTl = gsap.timeline({
        onComplete: function () {
          sessionStorage.setItem('akashiki-transition', 'active');
          window.location.href = href;
        }
      });

      exitTl
        .fromTo(overlay,
          { clipPath: 'inset(50% 0)' },
          { clipPath: 'inset(0)', duration: 0.5, ease: EASE }
        )
        .fromTo(line,
          { scaleX: 0 },
          { scaleX: 1, duration: 0.3, ease: 'power2.out' },
          '-=0.3'
        );
    });
  }

  /* ========================================
     Lenis 滑らかスクロール
     ======================================== */
  function initLenis() {
    if (typeof Lenis === 'undefined') return;

    var lenis = new Lenis({
      duration: 1.2,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      smooth: true,
      smoothTouch: false
    });

    window.lenis = lenis;

    // GSAP ScrollTrigger連携（必須）
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);

    // オープニング中はstop
    var opening = document.getElementById('lanternOpening');
    if (opening) {
      lenis.stop();
    }
  }

  /* ========================================
     テキストchar分割
     ======================================== */
  function splitTextToChars(selector) {
    document.querySelectorAll(selector).forEach(function (el) {
      var ariaLabel = el.textContent;
      var nodes = Array.from(el.childNodes);
      el.innerHTML = '';
      el.setAttribute('aria-label', ariaLabel);
      nodes.forEach(function (node) {
        if (node.nodeType === 1 && node.tagName === 'BR') {
          el.appendChild(document.createElement('br'));
          return;
        }
        var text = node.textContent;
        text.split('').forEach(function (char) {
          var span = document.createElement('span');
          span.textContent = char === ' ' ? '\u00A0' : char;
          span.style.display = 'inline-block';
          span.classList.add('char');
          el.appendChild(span);
        });
      });
    });
  }

  /* ========================================
     char分割アニメーション（ScrollTrigger）
     ======================================== */
  function initCharAnim() {
    splitTextToChars('[data-char-anim]');

    document.querySelectorAll('[data-char-anim]').forEach(function (el) {
      // FV内の要素はスキップ（各ページJSで独自アニメーション）
      if (el.closest('.fv, [class*="-fv"]')) return;

      var chars = el.querySelectorAll('.char');
      gsap.fromTo(chars,
        { opacity: 0, y: 20 },
        {
          opacity: 1, y: 0,
          duration: 0.6,
          stagger: 0.03,
          ease: EASE,
          scrollTrigger: { trigger: el, start: 'top 85%', once: true }
        }
      );
    });
  }

  /* ========================================
     マグネティックホバー
     ======================================== */
  function initMagnetic() {
    // SP（768px以下）: マグネティック無効化
    if (window.innerWidth <= 768) return;

    document.querySelectorAll('[data-magnetic]').forEach(function (el) {
      var strength = parseFloat(el.dataset.magnetic) || 0.3;

      el.addEventListener('mousemove', function (e) {
        var rect = el.getBoundingClientRect();
        var x = e.clientX - rect.left - rect.width / 2;
        var y = e.clientY - rect.top - rect.height / 2;
        gsap.to(el, {
          x: x * strength,
          y: y * strength,
          duration: 0.4,
          ease: 'power2.out'
        });
      });

      el.addEventListener('mouseleave', function () {
        gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.5)' });
      });
    });
  }

  /* ========================================
     スクロール連動CSS変数
     ======================================== */
  function initScrollProgress() {
    // グローバルスクロール進捗（0〜1）
    ScrollTrigger.create({
      trigger: document.body,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: function (self) {
        document.documentElement.style.setProperty(
          '--scroll-progress', self.progress.toFixed(4)
        );
      }
    });

    // セクションごとのローカル進捗
    document.querySelectorAll('[data-scroll-section]').forEach(function (section) {
      ScrollTrigger.create({
        trigger: section,
        start: 'top bottom',
        end: 'bottom top',
        onUpdate: function (self) {
          section.style.setProperty(
            '--section-progress', self.progress.toFixed(4)
          );
        }
      });
    });
  }

  /* ========================================
     clip-path reveal
     ======================================== */
  function initClipPathReveal() {
    document.querySelectorAll('[data-reveal]').forEach(function (section) {
      gsap.fromTo(section,
        { clipPath: 'inset(100% 0 0 0)' },
        {
          clipPath: 'inset(0% 0 0 0)',
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top 80%',
            end: 'top 20%',
            scrub: 0.5
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

    initHeader();
    initBurgerMenu();
    initPageTransition();

    initLenis();
    initScrollProgress();
    initCharAnim();
    initMagnetic();
    initClipPathReveal();
  });

})();
