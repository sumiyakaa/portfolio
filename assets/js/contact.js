/* ========================================
   contact.js — AKASHIKI Portfolio
   contact.html 固有アニメーション + フォーム処理
   ======================================== */

(function () {
  'use strict';

  var GSAP_EASE = 'power4.out';

  /* ========================================
     ⑤ Typewriter Replay — FVタイトル再タイプ
     ======================================== */
  function initTypewriter() {
    if (window.innerWidth <= 768) return;

    var title = document.querySelector('.contact-fv__title');
    if (!title) return;

    var originalText = title.textContent.trim();
    var isPlaying = false;

    // 文字をspan分割
    function splitChars() {
      title.innerHTML = '';
      var chars = [];
      for (var i = 0; i < originalText.length; i++) {
        var span = document.createElement('span');
        span.className = 'contact-fv__char';
        span.textContent = originalText[i];
        title.appendChild(span);
        chars.push(span);
      }
      // カーソル要素
      var cursor = document.createElement('span');
      cursor.className = 'contact-fv__cursor';
      title.appendChild(cursor);
      return { chars: chars, cursor: cursor };
    }

    var parts = splitChars();

    title.addEventListener('mouseenter', function () {
      if (isPlaying) return;
      isPlaying = true;

      var chars = parts.chars;
      var cursor = parts.cursor;

      // 1. 全文字消す
      var tl = gsap.timeline({
        onComplete: function () {
          isPlaying = false;
        }
      });

      tl.to(chars, {
        opacity: 0,
        duration: 0.15,
        stagger: 0
      });

      // 2. カーソル出現
      tl.to(cursor, {
        opacity: 1,
        duration: 0.1
      }, '+=0.2');

      // 3. 1文字ずつ再タイプ
      chars.forEach(function (c, i) {
        tl.to(c, {
          opacity: 1,
          duration: 0.01
        }, '+=' + (i === 0 ? '0' : '0.06'));
      });

      // 4. カーソル点滅2回→消滅
      tl.to(cursor, {
        opacity: 0, duration: 0.1
      }, '+=0.2');
      tl.to(cursor, {
        opacity: 1, duration: 0.1
      }, '+=0.4');
      tl.to(cursor, {
        opacity: 0, duration: 0.1
      }, '+=0.4');
      tl.to(cursor, {
        opacity: 1, duration: 0.1
      }, '+=0.4');
      tl.to(cursor, {
        opacity: 0, duration: 0.15
      }, '+=0.2');
    });
  }

  /* ========================================
     ⑯ Input Electrify — フォームfocus走査線
     ======================================== */
  function initInputElectrify() {
    var inputs = document.querySelectorAll('.contact-form__input, .contact-form__select, .contact-form__textarea');
    if (!inputs.length) return;

    inputs.forEach(function (input) {
      var field = input.closest('.contact-form__field');
      if (!field) return;

      // ::after擬似要素の代わりにdivを使用
      var line = document.createElement('div');
      line.className = 'contact-form__electrify';
      // selectの場合はselect-wrapの後に追加
      var selectWrap = field.querySelector('.contact-form__select-wrap');
      if (selectWrap) {
        selectWrap.style.position = 'relative';
        selectWrap.appendChild(line);
      } else {
        input.style.position = 'relative';
        field.style.position = 'relative';
        field.appendChild(line);
      }

      input.addEventListener('focus', function () {
        gsap.fromTo(line,
          { width: '0%', left: '0', right: 'auto' },
          { width: '100%', duration: 0.4, ease: 'cubic-bezier(0.16, 1, 0.3, 1)' }
        );
      });

      input.addEventListener('blur', function () {
        gsap.to(line, {
          width: '0%',
          duration: 0.3,
          ease: 'cubic-bezier(0.16, 1, 0.3, 1)',
          onStart: function () {
            line.style.left = 'auto';
            line.style.right = '0';
          },
          onComplete: function () {
            line.style.left = '0';
            line.style.right = 'auto';
          }
        });
      });
    });
  }

  /* ========================================
     ⑰ Label Float — フォームラベル浮上
     ======================================== */
  function initLabelFloat() {
    var fields = document.querySelectorAll('.contact-form__field');

    fields.forEach(function (field) {
      var label = field.querySelector('.contact-form__label');
      var input = field.querySelector('.contact-form__input, .contact-form__select, .contact-form__textarea');
      if (!label || !input) return;

      function checkState() {
        var hasValue = input.value && input.value.trim() !== '';
        var isFocused = document.activeElement === input;

        if (isFocused || hasValue) {
          label.classList.add('is-float');
        } else {
          label.classList.remove('is-float');
        }
      }

      input.addEventListener('focus', checkState);
      input.addEventListener('blur', checkState);
      input.addEventListener('input', checkState);
      input.addEventListener('change', checkState);

      // 初期状態チェック
      checkState();
    });
  }

  /* ========================================
     ⑱ Submit Button Charge — 送信ボタン充電
     ======================================== */
  function initButtonCharge() {
    if (window.innerWidth <= 768) return;

    var btn = document.querySelector('.contact-form__submit');
    if (!btn) return;

    var originalText = btn.textContent;
    var chargeTween = null;

    btn.addEventListener('mouseenter', function () {
      if (btn.disabled) return;

      btn.textContent = 'READY';
      btn.classList.add('is-charging');

      chargeTween = gsap.fromTo(btn,
        { backgroundPosition: '-100% 0' },
        {
          backgroundPosition: '100% 0',
          duration: 0.8,
          ease: 'none'
        }
      );
    });

    btn.addEventListener('mouseleave', function () {
      if (chargeTween) chargeTween.kill();
      btn.classList.remove('is-charging');
      btn.textContent = originalText;
      btn.style.backgroundPosition = '';
    });
  }

  /* ========================================
     Pulse Ring — 電波パルスリング
     ======================================== */
  function initPulseRings() {
    var fv = document.querySelector('.contact-fv');
    if (!fv) return;

    var svgNS = 'http://www.w3.org/2000/svg';
    var container = document.createElement('div');
    container.className = 'contact-fv__pulse-rings';
    container.setAttribute('aria-hidden', 'true');

    var svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.style.position = 'absolute';
    svg.style.inset = '0';
    container.appendChild(svg);
    fv.appendChild(container);

    var rings = [];
    var MAX_RINGS = 4;

    function createRing() {
      if (rings.length >= MAX_RINGS) {
        var oldest = rings.shift();
        if (oldest.tween) oldest.tween.kill();
        if (oldest.el.parentNode) oldest.el.parentNode.removeChild(oldest.el);
      }

      var circle = document.createElementNS(svgNS, 'circle');
      circle.setAttribute('cx', '50%');
      circle.setAttribute('cy', '50%');
      circle.setAttribute('r', '0');
      circle.setAttribute('fill', 'none');
      circle.setAttribute('stroke', 'rgba(255,255,255,0.12)');
      circle.setAttribute('stroke-width', '1');
      svg.appendChild(circle);

      var maxR = Math.max(window.innerWidth, window.innerHeight) * 0.5;
      var obj = { el: circle, tween: null };
      obj.tween = gsap.to(circle, {
        attr: { r: maxR },
        opacity: 0,
        duration: 4,
        ease: 'none',
        onComplete: function () {
          if (circle.parentNode) circle.parentNode.removeChild(circle);
          var idx = rings.indexOf(obj);
          if (idx > -1) rings.splice(idx, 1);
        }
      });
      rings.push(obj);
    }

    // 初回生成
    createRing();
    var intervalId = setInterval(createRing, 2000);

    window.addEventListener('beforeunload', function () {
      clearInterval(intervalId);
    });
  }

  /* ========================================
     FV Entrance Animation
     ======================================== */
  function initFVAnimation() {
    var fv = document.querySelector('.contact-fv');
    var title = document.querySelector('.contact-fv__title');
    var sub = document.querySelector('.contact-fv__sub');
    var hr = document.querySelector('.contact-fv__hr');
    var edgeBL = document.querySelector('.contact-fv__edge--bl');
    var edgeBR = document.querySelector('.contact-fv__edge--br');

    if (!title || !fv) return;

    var isTransition = sessionStorage.getItem('akashiki-transition') === 'active';
    var startDelay = isTransition ? 0.8 : 0.2;

    var tl = gsap.timeline({
      delay: startDelay,
      onComplete: function () {
        initFVShrink(fv);
      }
    });

    // CONTACT: letter-spacing 0.4em→0.25em + opacity 0→1
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
     フォームフィールド スクロールアニメーション
     ======================================== */
  function initFormAnimation() {
    var fields = document.querySelectorAll('.contact-form__field');
    var submit = document.querySelector('.contact-form__submit');

    if (!fields.length) return;

    // 各フィールド: stagger 0.1s で上から順次出現
    fields.forEach(function (field, i) {
      gsap.fromTo(field,
        { opacity: 0, y: 15 },
        {
          opacity: 1, y: 0,
          duration: 0.8,
          delay: i * 0.1,
          ease: GSAP_EASE,
          scrollTrigger: {
            trigger: field,
            start: 'top 90%',
            toggleActions: 'play none none none'
          }
        }
      );
    });

    // 送信ボタン: 最後に出現
    if (submit) {
      gsap.fromTo(submit,
        { opacity: 0, y: 10 },
        {
          opacity: 1, y: 0,
          duration: 0.8,
          ease: GSAP_EASE,
          scrollTrigger: {
            trigger: submit,
            start: 'top 95%',
            toggleActions: 'play none none none'
          }
        }
      );
    }
  }

  /* ========================================
     フォームバリデーション
     ======================================== */
  function validateField(input) {
    var errorEl = input.closest('.contact-form__field').querySelector('.contact-form__error');
    if (!errorEl) return true;

    var value = input.value.trim();
    var type = input.type;
    var required = input.hasAttribute('required');

    // クリア
    errorEl.textContent = '';

    if (required && !value) {
      errorEl.textContent = 'この項目は必須です';
      return false;
    }

    if (type === 'email' && value) {
      var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(value)) {
        errorEl.textContent = '有効なメールアドレスを入力してください';
        return false;
      }
    }

    return true;
  }

  function validateForm(form) {
    var inputs = form.querySelectorAll('[required]');
    var isValid = true;

    inputs.forEach(function (input) {
      if (!validateField(input)) {
        isValid = false;
      }
    });

    return isValid;
  }

  /* ========================================
     フォーム送信（AJAX + DOM書き換え）
     ======================================== */
  function initFormSubmit() {
    var form = document.getElementById('contact-form');
    var thanks = document.getElementById('contact-thanks');
    if (!form || !thanks) return;

    // リアルタイムバリデーション: blur時
    var requiredInputs = form.querySelectorAll('[required]');
    requiredInputs.forEach(function (input) {
      input.addEventListener('blur', function () {
        validateField(input);
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      if (!validateForm(form)) return;

      var submitBtn = form.querySelector('.contact-form__submit');
      submitBtn.disabled = true;
      submitBtn.textContent = 'SENDING...';

      var formData = new FormData(form);

      fetch(form.action, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      })
      .then(function (response) {
        if (response.ok) {
          // 成功: フォーム fadeOut → 完了表示
          gsap.to(form, {
            opacity: 0,
            duration: 0.4,
            ease: 'power2.in',
            onComplete: function () {
              form.style.display = 'none';
              thanks.style.display = 'block';

              var thanksTitle = thanks.querySelector('.contact-thanks__title');
              var thanksText = thanks.querySelector('.contact-thanks__text');

              gsap.fromTo(thanksTitle,
                { opacity: 0, y: 15 },
                { opacity: 1, y: 0, duration: 1.0, ease: GSAP_EASE }
              );
              gsap.fromTo(thanksText,
                { opacity: 0 },
                { opacity: 1, duration: 0.8, delay: 0.3, ease: GSAP_EASE }
              );
            }
          });
        } else {
          submitBtn.disabled = false;
          submitBtn.textContent = 'SEND →';
          var lastError = form.querySelector('.contact-form__field:last-of-type .contact-form__error');
          if (lastError) {
            lastError.textContent = '送信に失敗しました。時間をおいて再度お試しください。';
          }
        }
      })
      .catch(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = 'SEND →';
        var lastError = form.querySelector('.contact-form__field:last-of-type .contact-form__error');
        if (lastError) {
          lastError.textContent = '通信エラーが発生しました。ネットワーク接続を確認してください。';
        }
      });
    });
  }

  /* ========================================
     Init
     ======================================== */
  document.addEventListener('DOMContentLoaded', function () {
    gsap.registerPlugin(ScrollTrigger);
    initPulseRings();
    initFVAnimation();
    initFormAnimation();
    initFormSubmit();
    initTypewriter();
    initInputElectrify();
    initLabelFloat();
    initButtonCharge();
  });

})();
