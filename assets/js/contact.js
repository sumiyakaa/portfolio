/* ========================================
   contact.js — AKASHIKI Portfolio
   contact.html 固有アニメーション + フォーム処理
   ======================================== */

(function () {
  'use strict';

  var GSAP_EASE = 'power4.out';

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
    initFVAnimation();
    initFormAnimation();
    initFormSubmit();
  });

})();
