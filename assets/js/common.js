/* ========================================
   common.js — AKASHIKI Portfolio
   ヘッダー制御 / ページ遷移 / SPメニュー
   ======================================== */

(function () {
  'use strict';

  const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';

  /* ========================================
     Smart Header
     ======================================== */
  function initHeader() {
    const header = document.querySelector('.header');
    if (!header) return;

    // トップページ: .fv（scroll-area 200vh）→ 100vh固定閾値
    // 下層ページ: FV要素の実際の高さを動的に参照（縮小後は50vh）
    const isIndex = !!document.querySelector('.fv');
    const subFv = document.querySelector('.about-fv, .service-fv, .works-fv, .contact-fv');

    let ticking = false;

    function onScroll() {
      if (ticking) return;
      ticking = true;

      requestAnimationFrame(function () {
        const currentY = window.scrollY;
        const threshold = isIndex
          ? window.innerHeight
          : (subFv ? subFv.offsetHeight : window.innerHeight);

        if (currentY > threshold) {
          // FV通過後は常時表示（下スクロールでも隠れない）
          header.classList.remove('is-hidden');
          header.classList.add('is-visible');
        } else {
          // FV内では非表示
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
    const burger = document.querySelector('.header__burger');
    const menu = document.querySelector('.sp-menu');
    if (!burger || !menu) return;

    const links = menu.querySelectorAll('.sp-menu__link');

    burger.addEventListener('click', function () {
      const isOpen = burger.classList.toggle('is-open');
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
          line.style.transform = '';
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
    }

    // Exit: 内部リンククリック時にトランジション
    document.addEventListener('click', function (e) {
      var anchor = e.target.closest('a[href]');
      if (!anchor) return;

      var href = anchor.getAttribute('href');
      // 外部リンク・アンカーリンク・JS実行リンクはスキップ
      if (!href ||
          href.startsWith('#') ||
          href.startsWith('http') ||
          href.startsWith('mailto') ||
          href.startsWith('tel') ||
          anchor.target === '_blank') return;

      e.preventDefault();

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
     Init
     ======================================== */
  document.addEventListener('DOMContentLoaded', function () {
    initHeader();
    initBurgerMenu();
    initPageTransition();
  });

})();
