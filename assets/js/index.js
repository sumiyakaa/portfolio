/* ========================================
   index.js — AKASHIKI Portfolio
   灯篭オープニング / FV / Works / 料金
   ======================================== */

(function () {
  'use strict';

  var EASE_MECH = 'cubic-bezier(0.16, 1, 0.3, 1)';

  /* ========================================
     Three.js — 3Dテキストシーン
     ======================================== */

  function canUseThreeJS() {
    if (typeof THREE === 'undefined') return false;
    try {
      var c = document.createElement('canvas');
      return !!(c.getContext('webgl') || c.getContext('experimental-webgl'));
    } catch (e) { return false; }
  }

  /* ========================================
     Navier-Stokes Fluid Simulation
     (about.js initInkSimulation からポート)
     ======================================== */
  function initInkFluid(canvas) {
    var glOpts = { alpha: false, depth: false, stencil: false, antialias: false, preserveDrawingBuffer: false };
    var gl = canvas.getContext('webgl2', glOpts);
    var isGL2 = !!gl;
    if (!gl) gl = canvas.getContext('webgl', glOpts);
    if (!gl) return null;

    // Float texture サポート
    var halfFloat, intFmt;
    if (isGL2) {
      gl.getExtension('EXT_color_buffer_float');
      halfFloat = gl.HALF_FLOAT;
      intFmt = gl.RGBA16F;
    } else {
      var hfExt = gl.getExtension('OES_texture_half_float');
      gl.getExtension('OES_texture_half_float_linear');
      if (!hfExt) return null;
      halfFloat = hfExt.HALF_FLOAT_OES;
      intFmt = gl.RGBA;
    }

    // 解像度（50%）
    var W = Math.floor(window.innerWidth * 0.5);
    var H = Math.floor(window.innerHeight * 0.5);
    canvas.width = W;
    canvas.height = H;

    // FBOサポートテスト
    var testTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, testTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, intFmt, 4, 4, 0, gl.RGBA, halfFloat, null);
    var testFBO = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, testFBO);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, testTex, 0);
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.deleteTexture(testTex);
      gl.deleteFramebuffer(testFBO);
      return null;
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.deleteTexture(testTex);
    gl.deleteFramebuffer(testFBO);

    // ---- ユーティリティ ----
    function compile(type, src) {
      var s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    }

    function mkProg(vs, fs) {
      var p = gl.createProgram();
      gl.attachShader(p, compile(gl.VERTEX_SHADER, vs));
      gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fs));
      gl.linkProgram(p);
      return p;
    }

    function ulocs(p, names) {
      var u = {};
      for (var i = 0; i < names.length; i++) u[names[i]] = gl.getUniformLocation(p, names[i]);
      return u;
    }

    // フルスクリーン Quad
    var qBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, qBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    function use(p) {
      gl.useProgram(p);
      var loc = gl.getAttribLocation(p, 'a_position');
      gl.bindBuffer(gl.ARRAY_BUFFER, qBuf);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    }

    function texBind(unit, t) {
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, t);
    }

    function blit(fbo) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.viewport(0, 0, W, H);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    // FBO生成
    function createFBO() {
      var t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, intFmt, W, H, 0, gl.RGBA, halfFloat, null);
      var f = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, f);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      return { fbo: f, tex: t };
    }

    function createDblFBO() {
      var a = createFBO(), b = createFBO();
      return { r: a, w: b, swap: function () { var tmp = this.r; this.r = this.w; this.w = tmp; } };
    }

    // ---- シェーダーソース ----
    var VS = [
      'attribute vec2 a_position;',
      'varying vec2 v_uv;',
      'void main() {',
      '  v_uv = a_position * 0.5 + 0.5;',
      '  gl_Position = vec4(a_position, 0.0, 1.0);',
      '}'
    ].join('\n');

    // 移流（Advection）
    var advFS = [
      'precision highp float;',
      'varying vec2 v_uv;',
      'uniform sampler2D u_vel;',
      'uniform sampler2D u_src;',
      'uniform vec2 u_ts;',
      'uniform float u_dt;',
      'uniform float u_diss;',
      'void main() {',
      '  vec2 coord = v_uv - u_dt * texture2D(u_vel, v_uv).xy * u_ts;',
      '  gl_FragColor = u_diss * texture2D(u_src, coord);',
      '}'
    ].join('\n');

    // スプラット（力・密度注入）
    var splFS = [
      'precision highp float;',
      'varying vec2 v_uv;',
      'uniform sampler2D u_tgt;',
      'uniform float u_ar;',
      'uniform vec2 u_pt;',
      'uniform vec3 u_clr;',
      'uniform float u_rad;',
      'void main() {',
      '  vec2 p = v_uv - u_pt;',
      '  p.x *= u_ar;',
      '  vec3 s = exp(-dot(p, p) / u_rad) * u_clr;',
      '  gl_FragColor = vec4(texture2D(u_tgt, v_uv).xyz + s, 1.0);',
      '}'
    ].join('\n');

    // 渦度（Curl）
    var curFS = [
      'precision highp float;',
      'varying vec2 v_uv;',
      'uniform sampler2D u_vel;',
      'uniform vec2 u_ts;',
      'void main() {',
      '  float L = texture2D(u_vel, v_uv - vec2(u_ts.x, 0.0)).y;',
      '  float R = texture2D(u_vel, v_uv + vec2(u_ts.x, 0.0)).y;',
      '  float T = texture2D(u_vel, v_uv + vec2(0.0, u_ts.y)).x;',
      '  float B = texture2D(u_vel, v_uv - vec2(0.0, u_ts.y)).x;',
      '  gl_FragColor = vec4(R - L - T + B, 0.0, 0.0, 1.0);',
      '}'
    ].join('\n');

    // 渦度閉じ込め（Vorticity Confinement）
    var vorFS = [
      'precision highp float;',
      'varying vec2 v_uv;',
      'uniform sampler2D u_vel;',
      'uniform sampler2D u_curl;',
      'uniform vec2 u_ts;',
      'uniform float u_str;',
      'uniform float u_dt;',
      'void main() {',
      '  float L = texture2D(u_curl, v_uv - vec2(u_ts.x, 0.0)).x;',
      '  float R = texture2D(u_curl, v_uv + vec2(u_ts.x, 0.0)).x;',
      '  float T = texture2D(u_curl, v_uv + vec2(0.0, u_ts.y)).x;',
      '  float B = texture2D(u_curl, v_uv - vec2(0.0, u_ts.y)).x;',
      '  float C = texture2D(u_curl, v_uv).x;',
      '  vec2 f = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));',
      '  f /= length(f) + 1e-4;',
      '  f *= u_str * C;',
      '  f.y *= -1.0;',
      '  vec2 vel = texture2D(u_vel, v_uv).xy;',
      '  gl_FragColor = vec4(vel + f * u_dt, 0.0, 1.0);',
      '}'
    ].join('\n');

    // 発散（Divergence）
    var divFS = [
      'precision highp float;',
      'varying vec2 v_uv;',
      'uniform sampler2D u_vel;',
      'uniform vec2 u_ts;',
      'void main() {',
      '  float L = texture2D(u_vel, v_uv - vec2(u_ts.x, 0.0)).x;',
      '  float R = texture2D(u_vel, v_uv + vec2(u_ts.x, 0.0)).x;',
      '  float T = texture2D(u_vel, v_uv + vec2(0.0, u_ts.y)).y;',
      '  float B = texture2D(u_vel, v_uv - vec2(0.0, u_ts.y)).y;',
      '  gl_FragColor = vec4(0.5 * (R - L + T - B), 0.0, 0.0, 1.0);',
      '}'
    ].join('\n');

    // 圧力（Jacobi反復）
    var preFS = [
      'precision highp float;',
      'varying vec2 v_uv;',
      'uniform sampler2D u_pres;',
      'uniform sampler2D u_div;',
      'uniform vec2 u_ts;',
      'void main() {',
      '  float L = texture2D(u_pres, v_uv - vec2(u_ts.x, 0.0)).x;',
      '  float R = texture2D(u_pres, v_uv + vec2(u_ts.x, 0.0)).x;',
      '  float T = texture2D(u_pres, v_uv + vec2(0.0, u_ts.y)).x;',
      '  float B = texture2D(u_pres, v_uv - vec2(0.0, u_ts.y)).x;',
      '  float D = texture2D(u_div, v_uv).x;',
      '  gl_FragColor = vec4((L + R + B + T - D) * 0.25, 0.0, 0.0, 1.0);',
      '}'
    ].join('\n');

    // 勾配減算（Gradient Subtract）
    var grdFS = [
      'precision highp float;',
      'varying vec2 v_uv;',
      'uniform sampler2D u_pres;',
      'uniform sampler2D u_vel;',
      'uniform vec2 u_ts;',
      'void main() {',
      '  float L = texture2D(u_pres, v_uv - vec2(u_ts.x, 0.0)).x;',
      '  float R = texture2D(u_pres, v_uv + vec2(u_ts.x, 0.0)).x;',
      '  float T = texture2D(u_pres, v_uv + vec2(0.0, u_ts.y)).x;',
      '  float B = texture2D(u_pres, v_uv - vec2(0.0, u_ts.y)).x;',
      '  vec2 vel = texture2D(u_vel, v_uv).xy;',
      '  gl_FragColor = vec4(vel - 0.5 * vec2(R - L, T - B), 0.0, 1.0);',
      '}'
    ].join('\n');

    // 表示（Display）— 白墨 on 黒背景（オープニング用）
    var dspFS = [
      'precision highp float;',
      'varying vec2 v_uv;',
      'uniform sampler2D u_tex;',
      'uniform float u_bri;',
      'void main() {',
      '  float d = texture2D(u_tex, v_uv).x;',
      '  float ink = clamp(d * u_bri, 0.0, 1.0);',
      '  gl_FragColor = vec4(vec3(ink), 1.0);',
      '}'
    ].join('\n');

    // ---- プログラム生成 & Uniform取得 ----
    var pAdv = mkProg(VS, advFS);
    var uAdv = ulocs(pAdv, ['u_vel', 'u_src', 'u_ts', 'u_dt', 'u_diss']);

    var pSpl = mkProg(VS, splFS);
    var uSpl = ulocs(pSpl, ['u_tgt', 'u_ar', 'u_pt', 'u_clr', 'u_rad']);

    var pCur = mkProg(VS, curFS);
    var uCur = ulocs(pCur, ['u_vel', 'u_ts']);

    var pVor = mkProg(VS, vorFS);
    var uVor = ulocs(pVor, ['u_vel', 'u_curl', 'u_ts', 'u_str', 'u_dt']);

    var pDiv = mkProg(VS, divFS);
    var uDiv = ulocs(pDiv, ['u_vel', 'u_ts']);

    var pPre = mkProg(VS, preFS);
    var uPre = ulocs(pPre, ['u_pres', 'u_div', 'u_ts']);

    var pGrd = mkProg(VS, grdFS);
    var uGrd = ulocs(pGrd, ['u_pres', 'u_vel', 'u_ts']);

    var pDsp = mkProg(VS, dspFS);
    var uDsp = ulocs(pDsp, ['u_tex', 'u_bri']);

    // ---- FBO ----
    var velFB = createDblFBO();
    var dyeFB = createDblFBO();
    var curFB = createFBO();
    var divFB = createFBO();
    var preFB = createDblFBO();

    // ---- 定数 ----
    var ts = [1.0 / W, 1.0 / H];
    var ar = W / H;
    var VEL_DISS = 0.985;
    var DYE_DISS = 0.998;
    var VORT = 30.0;
    var PRES_ITER = 20;
    var BRI = 0.35;

    // ---- スプラット関数 ----
    function addSplat(target, x, y, cx, cy, cz, radius) {
      use(pSpl);
      texBind(0, target.r.tex);
      gl.uniform1i(uSpl.u_tgt, 0);
      gl.uniform1f(uSpl.u_ar, ar);
      gl.uniform2f(uSpl.u_pt, x, y);
      gl.uniform3f(uSpl.u_clr, cx, cy, cz);
      gl.uniform1f(uSpl.u_rad, radius);
      blit(target.w.fbo);
      target.swap();
    }

    // ---- シミュレーションステップ ----
    function simStep(dt) {
      // 1. Curl
      use(pCur);
      texBind(0, velFB.r.tex);
      gl.uniform1i(uCur.u_vel, 0);
      gl.uniform2f(uCur.u_ts, ts[0], ts[1]);
      blit(curFB.fbo);

      // 2. Vorticity Confinement
      use(pVor);
      texBind(0, velFB.r.tex);
      texBind(1, curFB.tex);
      gl.uniform1i(uVor.u_vel, 0);
      gl.uniform1i(uVor.u_curl, 1);
      gl.uniform2f(uVor.u_ts, ts[0], ts[1]);
      gl.uniform1f(uVor.u_str, VORT);
      gl.uniform1f(uVor.u_dt, dt);
      blit(velFB.w.fbo);
      velFB.swap();

      // 3. Divergence
      use(pDiv);
      texBind(0, velFB.r.tex);
      gl.uniform1i(uDiv.u_vel, 0);
      gl.uniform2f(uDiv.u_ts, ts[0], ts[1]);
      blit(divFB.fbo);

      // 4. Pressure Solve (Jacobi反復)
      use(pPre);
      gl.uniform2f(uPre.u_ts, ts[0], ts[1]);
      for (var i = 0; i < PRES_ITER; i++) {
        texBind(0, preFB.r.tex);
        texBind(1, divFB.tex);
        gl.uniform1i(uPre.u_pres, 0);
        gl.uniform1i(uPre.u_div, 1);
        blit(preFB.w.fbo);
        preFB.swap();
      }

      // 5. Gradient Subtract
      use(pGrd);
      texBind(0, preFB.r.tex);
      texBind(1, velFB.r.tex);
      gl.uniform1i(uGrd.u_pres, 0);
      gl.uniform1i(uGrd.u_vel, 1);
      gl.uniform2f(uGrd.u_ts, ts[0], ts[1]);
      blit(velFB.w.fbo);
      velFB.swap();

      // 6. Advect Velocity
      use(pAdv);
      texBind(0, velFB.r.tex);
      texBind(1, velFB.r.tex);
      gl.uniform1i(uAdv.u_vel, 0);
      gl.uniform1i(uAdv.u_src, 1);
      gl.uniform2f(uAdv.u_ts, ts[0], ts[1]);
      gl.uniform1f(uAdv.u_dt, dt);
      gl.uniform1f(uAdv.u_diss, VEL_DISS);
      blit(velFB.w.fbo);
      velFB.swap();

      // 7. Advect Dye
      texBind(0, velFB.r.tex);
      texBind(1, dyeFB.r.tex);
      gl.uniform1i(uAdv.u_vel, 0);
      gl.uniform1i(uAdv.u_src, 1);
      gl.uniform1f(uAdv.u_diss, DYE_DISS);
      blit(dyeFB.w.fbo);
      dyeFB.swap();
    }

    // ---- 画面出力 ----
    function display() {
      use(pDsp);
      texBind(0, dyeFB.r.tex);
      gl.uniform1i(uDsp.u_tex, 0);
      gl.uniform1f(uDsp.u_bri, BRI);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, W, H);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    // ---- 公開API ----
    return {
      splat: function (x, y, forceX, forceY, density, radius) {
        addSplat(velFB, x, y, forceX, forceY, 0, radius);
        addSplat(dyeFB, x, y, density, 0, 0, radius);
      },
      step: function (dt) {
        simStep(dt);
        display();
      },
      destroy: function () {
        var ext = gl.getExtension('WEBGL_lose_context');
        if (ext) ext.loseContext();
      }
    };
  }

  /* ========================================
     Three.js — 3Dテキストシーン（alpha対応）
     ======================================== */
  function initThreeScene(canvas) {
    var W = window.innerWidth;
    var H = window.innerHeight;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);

    var scene = new THREE.Scene();
    // 背景なし（alpha透過で墨キャンバスが見える）

    var frustumSize = 8;
    var aspect = W / H;
    var camera = new THREE.OrthographicCamera(
      frustumSize * aspect / -2, frustumSize * aspect / 2,
      frustumSize / 2, frustumSize / -2,
      0.1, 100
    );
    camera.position.set(0, 0.3, 15);
    camera.lookAt(0, 0, 0);

    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(dpr);
    renderer.setClearColor(0x000000, 0);
    renderer.outputEncoding = THREE.sRGBEncoding;

    // 環境光（暖色系で暗め）
    var ambLight = new THREE.AmbientLight(0x100800, 0.008);
    scene.add(ambLight);

    // メインライト（上方やや後ろ → チルト後の正面に垂直、側面だけ照らす）
    var topLight = new THREE.DirectionalLight(0xffffff, 0);
    topLight.position.set(0, 10, -3);
    scene.add(topLight);

    // リムライト（後方上 → 文字上端エッジを暖色で光らせる）
    var rimLight = new THREE.DirectionalLight(0xffcc88, 0);
    rimLight.position.set(0, 4, -8);
    scene.add(rimLight);

    // 下方からの暖色光（底面の橙色を引き立てる）
    var fillLight = new THREE.DirectionalLight(0x884422, 0);
    fillLight.position.set(0, -8, 0.5);
    scene.add(fillLight);

    // 正面からの暖白色光（面の視認性確保用）
    var frontLight = new THREE.DirectionalLight(0xffeedd, 0);
    frontLight.position.set(0, 0, 10);
    scene.add(frontLight);

    // 上面ライト（真上やや奥から → チルト後の上面のみ照射）
    var topSurfLight = new THREE.DirectionalLight(0xffffff, 0);
    topSurfLight.position.set(0, 10, -2);
    scene.add(topSurfLight);

    // 環境マップは不使用（正面の余計な反射を防ぐ）
    var envMap = null;

    return {
      scene: scene,
      camera: camera,
      renderer: renderer,
      envMap: envMap,
      ambLight: ambLight,
      topLight: topLight,
      rimLight: rimLight,
      fillLight: fillLight,
      frontLight: frontLight,
      topSurfLight: topSurfLight,
      render: function () { renderer.render(scene, camera); },
      destroy: function () {
        renderer.dispose();
        var glCtx = renderer.getContext();
        var ext = glCtx.getExtension('WEBGL_lose_context');
        if (ext) ext.loseContext();
      }
    };
  }

  /* ========================================
     Per-character 3D Text
     ======================================== */
  function createLanternText(scene, camera, envMap, onReady) {
    var loader = new THREE.FontLoader();
    // EN/JP共通: 頂点カラーで塗り分けるマテリアル
    var vertexColorMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      vertexColors: true,
      metalness: 0.15,
      roughness: 0.40
    });

    // 法線Z成分で正面/側面を塗り分け + 正面にYグラデーション
    function applyNormalColors(geometry, faceHex, sideHex) {
      var normals = geometry.attributes.normal;
      var positions = geometry.attributes.position;
      var colors = new Float32Array(positions.count * 3);
      var faceCol = new THREE.Color(faceHex);
      var sideCol = new THREE.Color(sideHex);
      var tmp = new THREE.Color();
      for (var i = 0; i < positions.count; i++) {
        var nz = Math.abs(normals.getZ(i));
        var t = Math.pow(nz, 6);
        tmp.copy(sideCol).lerp(faceCol, t);
        colors[i * 3] = tmp.r;
        colors[i * 3 + 1] = tmp.g;
        colors[i * 3 + 2] = tmp.b;
      }
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    }

    // 正面はYグラデーション、側面は暗色（W-ENGINE風）
    function applyGradientFaceDarkSides(geometry, topHex, bottomHex, sideHex) {
      geometry.computeBoundingBox();
      var minY = geometry.boundingBox.min.y;
      var maxY = geometry.boundingBox.max.y;
      var range = maxY - minY || 1;
      var normals = geometry.attributes.normal;
      var positions = geometry.attributes.position;
      var colors = new Float32Array(positions.count * 3);
      var topCol = new THREE.Color(topHex);
      var botCol = new THREE.Color(bottomHex);
      var sideCol = new THREE.Color(sideHex);
      var tmp = new THREE.Color();
      var faceCol = new THREE.Color();
      for (var i = 0; i < positions.count; i++) {
        var nz = Math.abs(normals.getZ(i));
        var t = Math.pow(nz, 4);
        var yT = (positions.getY(i) - minY) / range;
        faceCol.copy(botCol).lerp(topCol, yT);
        tmp.copy(sideCol).lerp(faceCol, t);
        colors[i * 3] = tmp.r;
        colors[i * 3 + 1] = tmp.g;
        colors[i * 3 + 2] = tmp.b;
      }
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    }

    // 異常三角形除去（面積ゼロ・法線反転をインデックスから削除）
    function removeDegenTriangles(geometry) {
      var pos = geometry.attributes.position;
      var idx = geometry.index;
      if (!idx) return;
      var arr = idx.array;
      var keep = [];
      var a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
      var ab = new THREE.Vector3(), ac = new THREE.Vector3(), cross = new THREE.Vector3();
      for (var i = 0; i < arr.length; i += 3) {
        a.fromBufferAttribute(pos, arr[i]);
        b.fromBufferAttribute(pos, arr[i + 1]);
        c.fromBufferAttribute(pos, arr[i + 2]);
        ab.subVectors(b, a);
        ac.subVectors(c, a);
        cross.crossVectors(ab, ac);
        var area = cross.length() * 0.5;
        // 面積が極小の退化三角形を除外
        if (area > 1e-6) {
          keep.push(arr[i], arr[i + 1], arr[i + 2]);
        }
      }
      geometry.setIndex(keep);
    }

    // Y方向グラデーション（灯敷用）
    function applyGradientColors(geometry, topHex, bottomHex) {
      geometry.computeBoundingBox();
      var minY = geometry.boundingBox.min.y;
      var maxY = geometry.boundingBox.max.y;
      var range = maxY - minY || 1;
      var positions = geometry.attributes.position;
      var colors = new Float32Array(positions.count * 3);
      var top = new THREE.Color(topHex);
      var bot = new THREE.Color(bottomHex);
      var tmp = new THREE.Color();
      for (var i = 0; i < positions.count; i++) {
        var t = (positions.getY(i) - minY) / range;
        tmp.copy(bot).lerp(top, t);
        colors[i * 3] = tmp.r;
        colors[i * 3 + 1] = tmp.g;
        colors[i * 3 + 2] = tmp.b;
      }
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    }

    // 英字用(Anton) と 漢字用(遊子朱句) の2フォントを読み込み
    var antonFont = null;
    var yujisyukuFont = null;
    var fontsLoaded = 0;

    function onFontLoaded() {
      fontsLoaded++;
      if (fontsLoaded < 2) return;
      buildText(antonFont, yujisyukuFont);
    }

    function onFontError() {
      if (onReady) onReady('font-error', null);
    }

    loader.load('assets/fonts/anton-regular.json', function (font) {
      antonFont = font;
      onFontLoaded();
    }, undefined, onFontError);

    loader.load('assets/fonts/yujisyuku-regular-subset.json', function (font) {
      yujisyukuFont = font;
      onFontLoaded();
    }, undefined, onFontError);

    function buildText(antonFont, yujisyukuFont) {
      try {
        var CHARS = ['A', 'K', 'A', 'S', 'H', 'I', 'K', 'I', '\u2014', '\u706F', '\u6577'];

        var enOpts = {
          font: antonFont,
          size: 1.331,
          height: 1.037,
          curveSegments: 16,
          bevelEnabled: true,
          bevelThickness: 0.001,
          bevelSize: 0.02,
          bevelSegments: 1
        };
        var EN_STRETCH_X = 1.3;

        var jpOpts = {
          font: yujisyukuFont,
          size: 0.778,
          height: 0.45,
          curveSegments: 12,
          bevelEnabled: true,
          bevelThickness: 0.005,
          bevelSize: 0.003,
          bevelSegments: 1
        };

        var jpOptsFallback = {
          font: yujisyukuFont,
          size: 0.864,
          height: 0.691,
          curveSegments: 8,
          bevelEnabled: false
        };

        var group = new THREE.Group();
        var charMeshes = [];
        var charWidths = [];
        var LETTER_SPACING = 0.08;
        var DASH_SPACING = 0.15;
        var JP_SPACING = 0.15;

        // 各文字のジオメトリを生成
        for (var ci = 0; ci < CHARS.length; ci++) {
          var ch = CHARS[ci];
          var isJP = (ci >= 9);
          var isDash = (ci === 8);
          var mesh = null;
          var w = 0;

          if (isJP) {
            // 漢字: Y方向グラデーション
            try {
              var jpGeom = new THREE.TextGeometry(ch, jpOpts);
              jpGeom.computeBoundingBox();
              applyGradientColors(jpGeom, 0xfcff38, 0xf77123);
              mesh = new THREE.Mesh(jpGeom, vertexColorMat);
              w = jpGeom.boundingBox.max.x - jpGeom.boundingBox.min.x;
            } catch (e) {
              console.warn('Kanji failed, retrying fallback:', e);
              try {
                var jpGeom2 = new THREE.TextGeometry(ch, jpOptsFallback);
                jpGeom2.computeBoundingBox();
                applyGradientColors(jpGeom2, 0xfcff38, 0xf77123);
                mesh = new THREE.Mesh(jpGeom2, vertexColorMat);
                w = jpGeom2.boundingBox.max.x - jpGeom2.boundingBox.min.x;
              } catch (e2) {
                console.warn('Kanji TextGeometry failed for "' + ch + '":', e2);
              }
            }
          } else {
            // 英字 / ダッシュ: 正面・側面ともにダークグレー/黒
            var geom = new THREE.TextGeometry(ch, enOpts);
            if (ch === 'S') {
              removeDegenTriangles(geom);
              // S: 4%拡大 + 縦方向に2px相当伸ばし
              geom.scale(1.04, 1.06, 1.04);
            }
            // 横方向に引き延ばし
            geom.scale(EN_STRETCH_X, 1, 1);
            geom.computeBoundingBox();
            applyNormalColors(geom, 0x3a3a3e, 0x08080a);
            mesh = new THREE.Mesh(geom, vertexColorMat);
            w = geom.boundingBox.max.x - geom.boundingBox.min.x;
            // ダッシュをジオメトリレベルで縮小
            if (isDash) {
              geom.scale(0.25, 1, 1);
              geom.computeBoundingBox();
              w = geom.boundingBox.max.x - geom.boundingBox.min.x;
            }
          }

          if (mesh) {
            mesh.visible = false;
            group.add(mesh);
          }
          charMeshes.push(mesh);
          charWidths.push(w);
        }

        // X座標レイアウト
        var cursor = 0;
        var charLocalXCenters = [];
        for (var li = 0; li < CHARS.length; li++) {
          // 文字間スペーシング
          if (li === 8) {
            // ダッシュ前にスペース追加（AKASHIKI と — の間）
            cursor += DASH_SPACING;
          } else if (li === 9) {
            // 漢字前にスペース追加（— と 灯 の間）
            cursor += JP_SPACING;
          } else if (li > 0 && li < 8) {
            cursor += LETTER_SPACING;
          }

          if (charMeshes[li]) {
            charMeshes[li].position.x = cursor;
            // 漢字は少しY位置を調整
            if (li >= 9) {
              charMeshes[li].position.y = 0.05;
            }
            // S（index=3）: 左に3px相当ずらし
            if (li === 3) {
              charMeshes[li].position.x = cursor - 0.03;
            }
          }
          charLocalXCenters.push(cursor + charWidths[li] / 2);
          cursor += charWidths[li];
        }

        var totalWidth = cursor;
        group.position.x = -totalWidth / 2;
        group.position.y = -0.42;

        scene.add(group);

        // スクリーン正規化座標を計算（0〜1範囲、インクスプラット用）
        var charPositions = [];
        for (var pi = 0; pi < CHARS.length; pi++) {
          // ワールド座標でのキャラクター中心
          var worldX = group.position.x + charLocalXCenters[pi];
          var worldY = group.position.y + 0.3; // テキスト中央付近

          // Three.js → NDC → スクリーン正規化座標
          var vec = new THREE.Vector3(worldX, worldY, 0);
          vec.project(camera);
          // NDC (-1〜1) → 0〜1
          var screenX = (vec.x + 1) / 2;
          var screenY = 1 - (vec.y + 1) / 2; // Y反転（WebGL座標系）

          charPositions.push({ x: screenX, y: screenY });
        }

        if (onReady) onReady(null, {
          group: group,
          charMeshes: charMeshes,
          charPositions: charPositions
        });

      } catch (e) {
        console.error('TextGeometry creation failed:', e);
        if (onReady) onReady('font-error', null);
      }
    }
  }

  /* ========================================
     Lantern Opening — Phase 1〜7 (Three.js + Ink)
     ======================================== */
  function playLanternOpening(onComplete) {
    var opening = document.getElementById('lanternOpening');
    var threeCanvas = document.getElementById('lanternCanvas');
    var inkCanvas = document.getElementById('lanternInk');
    var flash = document.getElementById('lanternFlash');
    var logoFloat = document.getElementById('logoFloating');

    if (!opening) { onComplete(); return; }

    document.body.classList.add('is-locked');

    var isSP = window.innerWidth <= 768;
    if (isSP || !canUseThreeJS()) {
      playSimpleOpening(opening, logoFloat, onComplete);
      return;
    }

    // 墨流体シミュレーション初期化
    var ink = initInkFluid(inkCanvas);
    if (!ink) {
      // WebGL2/float texture非対応 → 墨なしで進行（inkCanvasは黒のまま）
      ink = null;
    }

    var three = initThreeScene(threeCanvas);
    var rafId = null;
    var inkRafId = null;

    // GSAP用プロキシ — 5灯ライティング
    var lightState = {
      ambient: 0.008,
      topIntensity: 0,
      rimIntensity: 0,
      fillIntensity: 0,
      frontIntensity: 0,
      topSurfIntensity: 0
    };

    // 墨シミュレーション用ループ
    var inkT0 = -1;
    var inkTPrev = 0;
    function inkLoop(timestamp) {
      if (!ink) return;
      if (inkT0 < 0) { inkT0 = timestamp; inkTPrev = timestamp; }
      var dt = Math.min((timestamp - inkTPrev) * 0.001, 0.033);
      inkTPrev = timestamp;
      ink.step(dt);
      inkRafId = requestAnimationFrame(inkLoop);
    }

    // 墨ループ開始
    if (ink) {
      inkRafId = requestAnimationFrame(inkLoop);
    }

    // 3Dテキスト生成 → 完了後にアニメーション開始
    createLanternText(three.scene, three.camera, three.envMap, function (err, result) {
      if (err) {
        if (inkRafId) cancelAnimationFrame(inkRafId);
        if (ink) ink.destroy();
        playSimpleOpening(opening, logoFloat, onComplete);
        return;
      }

      var textGroup = result.group;
      var charMeshes = result.charMeshes;
      var charPositions = result.charPositions;

      // カメラ・テキスト状態のプロキシ
      var TILT_X = THREE.MathUtils.degToRad(-18);
      var camState = {
        x: 0, y: 0.3, z: 15,
        lookX: 0, lookY: 0, lookZ: 0
      };
      var textState = {
        rotY: 0, rotX: TILT_X, rotZ: 0,
        scale: 1,
        posX: textGroup.position.x,
        posY: textGroup.position.y,
        posZ: 0
      };

      function renderLoop() {
        // 5灯ライティング同期
        three.ambLight.intensity = lightState.ambient;
        three.topLight.intensity = lightState.topIntensity;
        three.rimLight.intensity = lightState.rimIntensity;
        three.fillLight.intensity = lightState.fillIntensity;
        three.frontLight.intensity = lightState.frontIntensity;
        three.topSurfLight.intensity = lightState.topSurfIntensity;
        // カメラ同期
        three.camera.position.set(camState.x, camState.y, camState.z);
        three.camera.lookAt(camState.lookX, camState.lookY, camState.lookZ);
        // テキスト同期
        if (textGroup) {
          textGroup.rotation.set(textState.rotX, textState.rotY, textState.rotZ);
          textGroup.scale.setScalar(textState.scale);
          textGroup.position.set(textState.posX, textState.posY, textState.posZ);
        }
        three.render();
        rafId = requestAnimationFrame(renderLoop);
      }

      // レンダーループ開始
      renderLoop();

      // ============ GSAP Master Timeline ============
      var master = gsap.timeline();

      // --- Phase 1: 暗闇 (0s〜0.5s) --- アンビエントがかすかに点灯
      master.to(lightState, { ambient: 0.015, duration: 0.4, ease: 'power2.out' }, 0.2);

      // --- Phase 2: 文字の逐次出現 + インクスプラット (0.5s〜) ---
      var CHAR_DELAY = 0.25;
      var CHAR_START = 0.5;

      charMeshes.forEach(function (mesh, i) {
        if (!mesh) return;
        var t = CHAR_START + i * CHAR_DELAY;

        master.call(function () {
          // 文字を表示（スケールアニメーション）
          mesh.visible = true;
          mesh.scale.set(0.01, 0.01, 0.01);
          gsap.to(mesh.scale, { x: 1, y: 1, z: 1, duration: 0.4, ease: 'back.out(1.7)' });

          // インクスプラットをトリガー
          if (ink && charPositions[i]) {
            var pos = charPositions[i];
            var force = 400;
            var angle = Math.random() * Math.PI * 2;
            ink.splat(pos.x, pos.y, Math.cos(angle) * force, Math.sin(angle) * force, 0.4, 0.008);
            // 放射状の二次スプラット（有機的な広がり）
            for (var j = 0; j < 4; j++) {
              var a2 = (j / 4) * Math.PI * 2 + Math.random() * 0.5;
              ink.splat(pos.x, pos.y, Math.cos(a2) * force * 0.5, Math.sin(a2) * force * 0.5, 0.2, 0.004);
            }
          }
        }, [], t);
      });

      // 文字が出現するたびにシルエットが浮かぶ
      var CHAR_TOTAL = charMeshes.length * CHAR_DELAY;
      master.to(lightState, {
        ambient: 0.06,
        topIntensity: 0.5,
        fillIntensity: 0.1,
        frontIntensity: 0.04,
        topSurfIntensity: 0.3,
        duration: CHAR_TOTAL,
        ease: 'power1.out'
      }, CHAR_START);

      // --- Phase 3: 全文字出揃い後、ライトフェードイン ---
      var LIGHT_FADE_START = CHAR_START + CHAR_TOTAL + 0.3;
      master.to(lightState, {
        topIntensity: 2.8,
        rimIntensity: 0.5,
        fillIntensity: 0.4,
        frontIntensity: 0.18,
        topSurfIntensity: 1.8,
        ambient: 0.12,
        duration: 1.8,
        ease: 'power2.inOut'
      }, LIGHT_FADE_START);

      // ============================================================
      // Phase 4〜7: シネマティック遷移
      // ============================================================
      var P5 = LIGHT_FADE_START + 1.8; // ライトフェード完了後

      // ライトを安定させる
      master.to(lightState, {
        ambient: 0.14, topIntensity: 3.2, rimIntensity: 0.6, fillIntensity: 0.45, frontIntensity: 0.2, topSurfIntensity: 2.0,
        duration: 0.6, ease: 'power2.out'
      }, P5);

      // --- Step 1: オービット (0.8s) ---
      master.to(camState, {
        x: 5.25, y: 1.2, z: 12,
        duration: 0.8, ease: 'power2.inOut'
      }, P5);
      master.to(textState, {
        rotY: -0.35,
        duration: 0.8, ease: 'power2.inOut'
      }, P5);

      // --- Step 2: フリップ開始 + カメラ引き (0.6s) ---
      var S2 = P5 + 0.8;
      master.to(textState, {
        rotY: Math.PI,
        duration: 0.6, ease: 'power2.in'
      }, S2);
      master.to(camState, {
        x: 1.5, y: 1.5, z: 18,
        duration: 0.6, ease: 'power2.inOut'
      }, S2);

      // --- Step 3: 3D回転 + Canvas自体を左上へ移動 (1.2s) ---
      var S3 = S2 + 0.5;

      master.to(textState, {
        rotY: Math.PI * 2,
        rotX: TILT_X * 0.3,
        duration: 1.2,
        ease: 'cubic-bezier(0.16, 1, 0.3, 1)'
      }, S3);

      // ライトは現状維持（静かに保つ）

      // Canvas要素自体をCSS transformで左上のロゴ位置へ移動+縮小
      var logoRect = logoFloat.getBoundingClientRect();
      var canvasRect = threeCanvas.getBoundingClientRect();
      var targetX = logoRect.left + logoRect.width / 2 - canvasRect.width / 2;
      var targetY = logoRect.top + logoRect.height / 2 - canvasRect.height / 2;
      var targetScale = 0.015;

      master.to(threeCanvas, {
        x: targetX,
        y: targetY,
        scale: targetScale,
        duration: 1.2,
        ease: 'cubic-bezier(0.16, 1, 0.3, 1)'
      }, S3);

      // インクキャンバスも同時にフェードアウト
      master.to(inkCanvas, {
        opacity: 0,
        duration: 1.0,
        ease: 'power2.out'
      }, S3);

      // --- Step 4: 着地 + CSSロゴへクロスフェード (0.4s) ---
      var S4 = S3 + 1.0;
      master.to(opening, {
        opacity: 0,
        duration: 0.4,
        ease: 'power2.out',
        onStart: function () {
          logoFloat.style.display = '';
          gsap.fromTo(logoFloat,
            { opacity: 0, scale: 0.1, transformOrigin: 'left top' },
            { opacity: 1, scale: 1, duration: 0.6, ease: 'cubic-bezier(0.16, 1, 0.3, 1)' }
          );
        },
        onComplete: function () {
          if (rafId) cancelAnimationFrame(rafId);
          rafId = null;
          if (inkRafId) cancelAnimationFrame(inkRafId);
          inkRafId = null;
          three.destroy();
          if (ink) ink.destroy();
          opening.remove();
          sessionStorage.setItem('akashiki-splash', 'done');
          onComplete();
        }
      }, S4);
    });
  }

  /* ========================================
     Simple Opening (SP / Three.js非対応)
     ======================================== */
  function playSimpleOpening(opening, logoFloat, onComplete) {
    var tl = gsap.timeline({
      onComplete: function () {
        logoFloat.style.display = '';
        gsap.fromTo(logoFloat,
          { opacity: 0, scale: 0.1, transformOrigin: 'left top' },
          { opacity: 1, scale: 1, duration: 0.6, ease: 'cubic-bezier(0.16, 1, 0.3, 1)' }
        );
        opening.remove();
        sessionStorage.setItem('akashiki-splash', 'done');
        onComplete();
      }
    });

    // シンプルフェードアウト
    tl.to(opening, { opacity: 0, duration: 1.0, delay: 0.5 });
  }

  /* ========================================
     FV — revealAndBind
     ======================================== */
  function revealAndBind() {
    gsap.registerPlugin(ScrollTrigger);

    var mainText = document.querySelector('.fv__main-text');
    var letters  = document.querySelectorAll('.fv__letter');
    var sub      = document.querySelector('.fv__sub');
    var aio      = document.querySelector('.fv__aio');
    var aioLink  = document.querySelector('.fv__aio-link');
    var hr       = document.querySelector('.fv__hr');
    var edgeBl   = document.querySelector('.fv__edge--bl');
    var edgeBr   = document.querySelector('.fv__edge--br');
    var corners  = document.querySelector('.fv__corners');
    var cornerLines = document.querySelectorAll('.fv__corner');

    // Step 1: gsap.set — visibility:visible + opacity:0
    var allElements = [mainText, sub, aio, aioLink, hr, edgeBl, edgeBr, corners];
    allElements.forEach(function (el) {
      if (el) gsap.set(el, { visibility: 'visible', opacity: 0 });
    });

    // Step 2: entrance timeline
    var entrance = gsap.timeline({
      onComplete: function () {
        bindScroll();
        initCornerBreathing();
        initRepel();
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

    // AIO tagline
    entrance.fromTo(aio,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 1.0, ease: EASE_MECH },
      0.5
    );

    // AIO link
    entrance.fromTo(aioLink,
      { opacity: 0, y: 8 },
      { opacity: 1, y: 0, duration: 0.8, ease: EASE_MECH },
      0.65
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
    var aio        = document.querySelector('.fv__aio');
    var aioLink    = document.querySelector('.fv__aio-link');
    var hr         = document.querySelector('.fv__hr');
    var edgeBl     = document.querySelector('.fv__edge--bl');
    var edgeBr     = document.querySelector('.fv__edge--br');
    var corners    = document.querySelector('.fv__corners');
    var scrollArea = document.querySelector('.fv__scroll-area');

    if (!scrollArea || !container) return;

    // sticky区間 = scrollArea高さ - 100vh（140vh - 100vh = 40vh）
    // end: 'bottom bottom' でstickyが外れる瞬間に完了

    // 3D tilt — 奥に倒れ込むように
    gsap.fromTo(container,
      { rotateX: 0, rotateY: 0, scale: 1, transformPerspective: 800 },
      {
        rotateX: 8,
        rotateY: -3,
        scale: 0.9,
        transformPerspective: 800,
        ease: 'power1.in',
        scrollTrigger: {
          trigger: scrollArea,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.5
        }
      }
    );

    // Main text — 上に速く流れる
    gsap.fromTo(mainText,
      { y: 0 },
      {
        y: -180,
        ease: 'none',
        scrollTrigger: {
          trigger: scrollArea,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.5
        }
      }
    );

    // Sub — メインより遅く（視差）
    gsap.fromTo(sub,
      { y: 0 },
      {
        y: -100,
        ease: 'none',
        scrollTrigger: {
          trigger: scrollArea,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.5
        }
      }
    );

    // AIO — subと同じ視差
    gsap.fromTo(aio,
      { y: 0 },
      {
        y: -90,
        ease: 'none',
        scrollTrigger: {
          trigger: scrollArea,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.5
        }
      }
    );

    // AIO Link — aioと同じ視差
    gsap.fromTo(aioLink,
      { y: 0 },
      {
        y: -85,
        ease: 'none',
        scrollTrigger: {
          trigger: scrollArea,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.5
        }
      }
    );

    // Fade out — sticky後半で消える
    var fvFadeElements = [mainText, sub, aio, aioLink, hr, edgeBl, edgeBr, corners].filter(Boolean);
    gsap.fromTo(fvFadeElements,
      { opacity: 1 },
      {
        opacity: 0,
        ease: 'power1.in',
        scrollTrigger: {
          trigger: scrollArea,
          start: '30% top',
          end: 'bottom bottom',
          scrub: 0.5
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

    // offsetWidth/offsetHeight をキャッシュ（毎フレーム読み出しは強制レイアウトの原因）
    var orbHW = [];
    for (var si = 0; si < orbs.length; si++) {
      orbHW.push({ w: orbs[si].offsetWidth / 2, h: orbs[si].offsetHeight / 2 });
    }

    function animate() {
      if (fvActive) {
        for (var i = 0; i < orbs.length; i++) {
          current[i].x += (targets[i].x - current[i].x) * lerps[i];
          current[i].y += (targets[i].y - current[i].y) * lerps[i];
          orbs[i].style.transform = 'translate(' +
            (current[i].x - orbHW[i].w) + 'px, ' +
            (current[i].y - orbHW[i].h) + 'px)';
        }
      }
      requestAnimationFrame(animate);
    }
    animate();
  }

  /* ========================================
     B: Floating Wireframe Geometry
     ======================================== */
  function initWireframe() {
    var fvSticky = document.querySelector('.fv__sticky');
    if (!fvSticky) return;

    var svgNS = 'http://www.w3.org/2000/svg';
    var container = document.createElement('div');
    container.className = 'fv__wireframe';
    container.setAttribute('aria-hidden', 'true');

    var svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', '0 0 1920 1080');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    container.appendChild(svg);
    fvSticky.appendChild(container);

    function makeLine(x1, y1, x2, y2) {
      var el = document.createElementNS(svgNS, 'line');
      el.setAttribute('x1', x1); el.setAttribute('y1', y1);
      el.setAttribute('x2', x2); el.setAttribute('y2', y2);
      el.setAttribute('stroke', 'rgba(255,255,255,0.20)');
      el.setAttribute('stroke-width', '1');
      el.setAttribute('fill', 'none');
      return el;
    }

    // 直線6本
    var lines = [
      makeLine(200, 150, 500, 200),
      makeLine(1400, 100, 1700, 180),
      makeLine(100, 700, 400, 850),
      makeLine(1500, 650, 1800, 750),
      makeLine(800, 50, 1100, 120),
      makeLine(600, 900, 950, 980)
    ];

    lines.forEach(function (line, i) {
      svg.appendChild(line);
      var dx = (Math.random() > 0.5 ? 1 : -1) * (30 + Math.random() * 20);
      var dy = (Math.random() > 0.5 ? 1 : -1) * (30 + Math.random() * 20);
      var rot = (Math.random() > 0.5 ? 1 : -1) * 15;
      var dur = 15 + Math.random() * 20;
      gsap.to(line, {
        x: dx, y: dy, rotation: rot,
        duration: dur, ease: 'sine.inOut', yoyo: true, repeat: -1,
        delay: Math.random() * 5
      });
    });

    // 三角形2個
    var triangles = [
      { points: '960,200 1020,320 900,320' },
      { points: '300,500 380,620 220,620' }
    ];
    triangles.forEach(function (t, i) {
      var poly = document.createElementNS(svgNS, 'polygon');
      poly.setAttribute('points', t.points);
      poly.setAttribute('stroke', 'rgba(255,255,255,0.16)');
      poly.setAttribute('stroke-width', '1');
      poly.setAttribute('fill', 'none');
      svg.appendChild(poly);

      var dx = (Math.random() > 0.5 ? 1 : -1) * (30 + Math.random() * 20);
      var dy = (Math.random() > 0.5 ? 1 : -1) * (30 + Math.random() * 20);
      gsap.to(poly, {
        rotation: 360, x: dx, y: dy,
        transformOrigin: '50% 50%',
        duration: 60 + i * 20, ease: 'none', repeat: -1,
        delay: Math.random() * 5
      });
    });

    // 円1個
    var circle = document.createElementNS(svgNS, 'circle');
    circle.setAttribute('cx', '1400');
    circle.setAttribute('cy', '450');
    circle.setAttribute('r', '40');
    circle.setAttribute('stroke', 'rgba(255,255,255,0.14)');
    circle.setAttribute('stroke-width', '1');
    circle.setAttribute('fill', 'none');
    svg.appendChild(circle);

    // radius パルス
    gsap.to(circle, {
      attr: { r: 55 },
      duration: 8, ease: 'sine.inOut', yoyo: true, repeat: -1,
      delay: Math.random() * 3
    });
    // ドリフト
    gsap.to(circle, {
      x: 35, y: -25,
      duration: 25, ease: 'sine.inOut', yoyo: true, repeat: -1,
      delay: Math.random() * 5
    });
  }

  /* ========================================
     C: Mouse Proximity Text Repel
     ======================================== */
  function initRepel() {
    if (window.innerWidth <= 768) return;

    var letters = document.querySelectorAll('.fv__letter');
    if (!letters.length) return;

    var RADIUS = 150;
    var MAX_FORCE = 25;
    var mouseX = -9999;
    var mouseY = -9999;
    var rafId = null;

    // gsap.quickSetter — GSAP の transform キャッシュと同期し
    // style.transform 直書きによる GSAP との競合を防止
    var xSetters = [];
    var ySetters = [];
    for (var qi = 0; qi < letters.length; qi++) {
      xSetters.push(gsap.quickSetter(letters[qi], 'x', 'px'));
      ySetters.push(gsap.quickSetter(letters[qi], 'y', 'px'));
    }

    document.addEventListener('mousemove', function (e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    function animate() {
      if (!fvActive) { rafId = requestAnimationFrame(animate); return; }

      // Batch reads（1回のレイアウト計算で全rect取得 — 読み書き交互による layout thrashing 防止）
      var rects = [];
      for (var i = 0; i < letters.length; i++) {
        rects.push(letters[i].getBoundingClientRect());
      }
      // Batch writes（quickSetter で GSAP キャッシュ同期）
      for (var j = 0; j < letters.length; j++) {
        var cx = rects[j].left + rects[j].width / 2;
        var cy = rects[j].top + rects[j].height / 2;
        var dx = cx - mouseX;
        var dy = cy - mouseY;
        var dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < RADIUS) {
          var force = (1 - dist / RADIUS) * MAX_FORCE;
          var angle = Math.atan2(dy, dx);
          xSetters[j](Math.cos(angle) * force);
          ySetters[j](Math.sin(angle) * force);
        } else {
          xSetters[j](0);
          ySetters[j](0);
        }
      }
      rafId = requestAnimationFrame(animate);
    }
    animate();

    window.addEventListener('beforeunload', function () {
      if (rafId) cancelAnimationFrame(rafId);
    });
  }

  /* ========================================
     D: Corner Frame Breathing
     ======================================== */
  function initCornerBreathing() {
    var cornerLines = document.querySelectorAll('.fv__corner');
    if (!cornerLines.length) return;

    cornerLines.forEach(function (corner, i) {
      // 入場アニメーションのopacity tweenを上書きしてから開始
      gsap.killTweensOf(corner, 'opacity');
      gsap.set(corner, { opacity: 0.6 });
      gsap.to(corner, {
        opacity: 1.0,
        duration: 4,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
        delay: i * 0.5
      });
    });
  }

  /* ========================================
     E: Particle Dust
     ======================================== */
  function initParticles() {
    var fvSticky = document.querySelector('.fv__sticky');
    if (!fvSticky) return;

    var container = document.createElement('div');
    container.className = 'fv__particles';
    container.setAttribute('aria-hidden', 'true');
    fvSticky.appendChild(container);

    var COUNT = 25;
    for (var i = 0; i < COUNT; i++) {
      var p = document.createElement('div');
      p.className = 'fv__particle';
      var size = 2 + Math.random() * 1.5;
      p.style.width = size + 'px';
      p.style.height = size + 'px';
      p.style.left = (Math.random() * 100) + '%';
      p.style.top = (Math.random() * 100) + '%';

      var initOp = 0.25 + Math.random() * 0.25;
      p.style.opacity = initOp;
      container.appendChild(p);

      // 浮遊
      var driftX = (Math.random() > 0.5 ? 1 : -1) * (50 + Math.random() * 150);
      var driftY = (Math.random() > 0.5 ? 1 : -1) * (30 + Math.random() * 120);
      gsap.to(p, {
        x: driftX, y: driftY,
        duration: 10 + Math.random() * 20,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
        delay: Math.random() * 5
      });

      // opacity 変動
      gsap.to(p, {
        opacity: 0.15 + Math.random() * 0.25,
        duration: 3 + Math.random() * 5,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
        delay: Math.random() * 3
      });
    }
  }

  /* ========================================
     Mouse Press Ripple (⑤)
     ======================================== */
  function initRipple() {
    if (window.innerWidth <= 768) return;

    var fvSticky = document.querySelector('.fv__sticky');
    if (!fvSticky) return;

    var svgNS = 'http://www.w3.org/2000/svg';
    var container = document.createElement('div');
    container.className = 'fv__ripple-container';
    var svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.style.position = 'absolute';
    svg.style.inset = '0';
    container.appendChild(svg);
    fvSticky.appendChild(container);

    var ripples = [];
    var MAX_RIPPLES = 5;
    var intervalId = null;
    var pressX = 0;
    var pressY = 0;

    function createRipple(x, y) {
      if (ripples.length >= MAX_RIPPLES) {
        var oldest = ripples.shift();
        if (oldest.tween) oldest.tween.kill();
        if (oldest.el.parentNode) oldest.el.parentNode.removeChild(oldest.el);
      }

      var rect = container.getBoundingClientRect();
      var cx = x - rect.left;
      var cy = y - rect.top;

      var circle = document.createElementNS(svgNS, 'circle');
      circle.setAttribute('cx', cx);
      circle.setAttribute('cy', cy);
      circle.setAttribute('r', '0');
      circle.setAttribute('fill', 'none');
      circle.setAttribute('stroke', '#fff');
      circle.setAttribute('stroke-width', '1');
      circle.setAttribute('opacity', '0.18');
      svg.appendChild(circle);

      var obj = { el: circle, tween: null };
      obj.tween = gsap.to(circle, {
        attr: { r: 300 },
        opacity: 0,
        duration: 2.5,
        ease: 'none',
        onComplete: function () {
          if (circle.parentNode) circle.parentNode.removeChild(circle);
          var idx = ripples.indexOf(obj);
          if (idx > -1) ripples.splice(idx, 1);
        }
      });
      ripples.push(obj);
    }

    function onMouseDown(e) {
      pressX = e.clientX;
      pressY = e.clientY;
      createRipple(pressX, pressY);
      intervalId = setInterval(function () {
        createRipple(pressX, pressY);
      }, 600);
    }

    function onMouseUp() {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    }

    function onMouseMove(e) {
      if (intervalId) {
        pressX = e.clientX;
        pressY = e.clientY;
      }
    }

    fvSticky.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    fvSticky.addEventListener('mousemove', onMouseMove);
  }

  /* ========================================
     FV要素のフェードイン (Phase 6)
     オープニング中は非表示だったFV背景要素をフェードイン
     ======================================== */
  function fadeInFVElements() {
    var radial = document.querySelector('.fv__radial');
    var orbs = document.querySelectorAll('.fv__orb');
    var scanline = document.querySelector('.fv__scanline');

    var targets = [radial, scanline].filter(Boolean);
    targets.forEach(function (el) {
      gsap.fromTo(el, { opacity: 0 }, { opacity: parseFloat(getComputedStyle(el).opacity) || 1, duration: 0.8, ease: 'power2.out' });
    });
    orbs.forEach(function (orb) {
      gsap.fromTo(orb, { opacity: 0 }, { opacity: 1, duration: 0.8, ease: 'power2.out' });
    });
  }

  /* ========================================
     Phase 7: ScrollTrigger ロゴ転移
     ======================================== */
  /* ---- ロゴ着地・パルス同期ヘルパー ---- */
  var logoPulseTween = null;

  function anchorLogoToWorks(logoFloat, selected, worksSection) {
    // fixed → absolute に切り替え、Worksセクション内に配置
    // GSAPのtransformをクリア
    gsap.set(logoFloat, { clearProps: 'x,y,scale,rotateX,rotateY,transform' });

    var selectedFontSize = parseFloat(getComputedStyle(selected).fontSize);
    logoFloat.style.position = 'absolute';
    logoFloat.style.left = (selected.offsetLeft - 10) + 'px';
    logoFloat.style.top = (selected.offsetTop + selected.offsetHeight + 4) + 'px';
    logoFloat.style.fontSize = selectedFontSize + 'px';
    logoFloat.style.letterSpacing = '0.15em';
    worksSection.style.position = 'relative';
    worksSection.appendChild(logoFloat);
  }

  function releaseLogoFromWorks(logoFloat) {
    // absolute → fixed に戻す
    gsap.set(logoFloat, { clearProps: 'x,y,scale,rotateX,rotateY,transform' });
    document.body.appendChild(logoFloat);
    logoFloat.style.position = 'fixed';
    logoFloat.style.left = '24px';
    logoFloat.style.top = '18px';
    logoFloat.style.fontSize = '13px';
    logoFloat.style.letterSpacing = '0.2em';
    logoFloat.style.display = '';
  }

  function startLogoPulse(logoFloat, selected) {
    // SELECTEDと同じパルス（opacity 0.70〜1.0, duration 3, sine.inOut）
    gsap.set(logoFloat, { opacity: 0.70 });
    logoPulseTween = gsap.to(logoFloat, {
      opacity: 1.0,
      duration: 3,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1
    });
  }

  function stopLogoPulse(logoFloat) {
    if (logoPulseTween) {
      logoPulseTween.kill();
      logoPulseTween = null;
    }
    gsap.set(logoFloat, { opacity: 1 });
  }

  /* ========================================
     FV重量要素の自動停止
     — スクロール領域を抜けたらGPU負荷を落とす
     ======================================== */
  var fvActive = true;

  function initFVCleanup() {
    var scrollArea = document.querySelector('.fv__scroll-area');
    if (!scrollArea) return;

    var orbs = document.querySelectorAll('.fv__orb');

    ScrollTrigger.create({
      trigger: scrollArea,
      start: 'top top',
      end: 'bottom bottom',
      onLeave: function () {
        fvActive = false;
        // blur(80px) を除去 — GPU再合成の最大負荷源
        orbs.forEach(function (o) { o.style.filter = 'none'; });
      },
      onEnterBack: function () {
        fvActive = true;
        orbs.forEach(function (o) { o.style.filter = ''; });
      }
    });
  }

  function initLogoTransfer() {
    if (window.innerWidth <= 768) return;

    var logoFloat = document.getElementById('logoFloating');
    var selected = document.querySelector('.works__selected');
    var worksSection = document.querySelector('.works');
    var scrollArea = document.querySelector('.fv__scroll-area');

    if (!logoFloat || !selected || !worksSection || !scrollArea) return;

    // ロゴ移動完了までヘッダーをブロック
    document.body.classList.add('is-logo-transferring');

    // FV通過時に.logo-floatingを消す（ヘッダーロゴに委譲）
    // ヘッダー表示タイミング(scrollY > innerHeight + 50)に合わせる
    ScrollTrigger.create({
      trigger: scrollArea,
      start: '50% top-=50',
      onEnter: function () {
        gsap.to(logoFloat, { opacity: 0, duration: 0.3, ease: 'power2.in' });
      },
      onLeaveBack: function () {
        gsap.to(logoFloat, { opacity: 1, duration: 0.3, ease: 'power2.out' });
      }
    });

    // SELECTEDのWorksセクション内での正確な座標を計算
    var selRect = selected.getBoundingClientRect();
    var worksRect = worksSection.getBoundingClientRect();
    var selLeftInWorks = selRect.left - worksRect.left;
    var selTopInWorks = selRect.top - worksRect.top + selRect.height + 80;

    // Works内にロゴの分身を作成（SELECTED下に配置）
    var logoAnchored = document.createElement('div');
    logoAnchored.className = 'logo-anchored';
    logoAnchored.innerHTML = logoFloat.innerHTML;
    var anchoredFontSize = Math.round(parseFloat(getComputedStyle(selected).fontSize) * 0.35);
    logoAnchored.style.cssText = 'position:absolute; opacity:0; pointer-events:none; font-size:' +
      anchoredFontSize + 'px; letter-spacing:0.15em; color:#fff; white-space:nowrap; line-height:1;' +
      'left:' + (selLeftInWorks - 20) + 'px; top:' + selTopInWorks + 'px;';
    worksSection.style.position = 'relative';
    worksSection.appendChild(logoAnchored);

    ScrollTrigger.create({
      trigger: worksSection,
      start: 'top 40%',
      onEnter: function () {
        // ヘッダーはcommon.jsが制御

        // anchoredをfloatingと同じビューポート位置に配置してからSELECTED下へ移動
        var floatRect = logoFloat.getBoundingClientRect();
        var worksRect2 = worksSection.getBoundingClientRect();
        var startLeft = floatRect.left - worksRect2.left;
        var startTop = floatRect.top - worksRect2.top;

        gsap.set(logoAnchored, {
          left: startLeft,
          top: startTop,
          fontSize: 13,
          letterSpacing: '0.2em',
          opacity: 1
        });

        // floatingは既にFV通過時に非表示済み

        // SELECTED下へ拡大移動アニメーション
        gsap.to(logoAnchored, {
          left: selLeftInWorks - 20,
          top: selTopInWorks,
          fontSize: anchoredFontSize,
          letterSpacing: '0.15em',
          opacity: 0.70,
          duration: 2.0,
          ease: 'cubic-bezier(0.16, 1, 0.3, 1)',
          onComplete: function () {
            // ロゴ着地完了 → ヘッダー表示を許可
            document.body.classList.remove('is-logo-transferring');
            startLogoPulse(logoAnchored, selected);
          }
        });
      },
      onLeaveBack: function () {
        // スクロールバック → ヘッダーを再ブロック
        document.body.classList.add('is-logo-transferring');
        stopLogoPulse(logoAnchored);
        gsap.to(logoAnchored, { opacity: 0, duration: 0.5 });
      }
    });
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

      // SELECTED → タイピング切り替え（visibility でレイアウトシフト回避）
      if (selected) selected.style.visibility = 'hidden';
      if (pulseTween) pulseTween.pause();
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

      // SELECTED復帰
      if (selected) {
        selected.style.visibility = '';
        if (pulseTween) pulseTween.play();
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
     Wave Lift — data-wave-lift 自動初期化
     ======================================== */
  function initWaveLift() {
    document.querySelectorAll('[data-wave-lift]').forEach(function (el) {
      var text = el.textContent;
      el.textContent = '';
      for (var i = 0; i < text.length; i++) {
        var span = document.createElement('span');
        span.textContent = text[i] === ' ' ? '\u00A0' : text[i];
        span.style.display = 'inline-block';
        span.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
        span.style.transitionDelay = (i * 0.03) + 's';
        el.appendChild(span);
      }
      var parent = el.closest('.price__title, .price__item-left');
      if (!parent) parent = el;
      parent.style.cursor = 'default';
      parent.addEventListener('mouseenter', function () {
        el.querySelectorAll('span').forEach(function (s) { s.style.transform = 'translateY(-4px)'; });
      });
      parent.addEventListener('mouseleave', function () {
        el.querySelectorAll('span').forEach(function (s) { s.style.transform = 'translateY(0)'; });
      });
    });
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

    // セクション全体のフェードイン（data-reveal clip-path の代替）
    gsap.fromTo(section,
      { opacity: 0, y: 40 },
      {
        opacity: 1, y: 0, duration: 1.2, ease: EASE_MECH,
        scrollTrigger: { trigger: section, start: 'top 85%' }
      }
    );

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
     ⑨ Clip-path Morphing (Works→Price boundary)
     ======================================== */
  function initClipPathMorph() {
    if (window.innerWidth <= 768) return;

    var priceSection = document.querySelector('.price');
    if (!priceSection) return;

    // 境界エリア（セクション上端 ±100px）
    var hitArea = document.createElement('div');
    hitArea.className = 'price__clip-hit';
    hitArea.setAttribute('aria-hidden', 'true');
    priceSection.parentNode.insertBefore(hitArea, priceSection);

    hitArea.addEventListener('mouseenter', function () {
      priceSection.classList.add('is-clip-wave');
    });
    hitArea.addEventListener('mouseleave', function () {
      priceSection.classList.remove('is-clip-wave');
    });
  }

  /* ========================================
     ⑬ Separator Pulsation (Price section)
     ======================================== */
  function initSeparatorPulse() {
    if (window.innerWidth <= 768) return;

    var items = document.querySelectorAll('.price__item');
    if (!items.length) return;

    var svgNS = 'http://www.w3.org/2000/svg';

    items.forEach(function (item) {
      // border-bottom を非表示にし、SVGに置き換え
      var svg = document.createElementNS(svgNS, 'svg');
      svg.setAttribute('class', 'price__separator-svg');
      svg.setAttribute('viewBox', '0 0 1100 6');
      svg.setAttribute('preserveAspectRatio', 'none');
      svg.setAttribute('aria-hidden', 'true');

      var path = document.createElementNS(svgNS, 'path');
      path.setAttribute('d', 'M0,3 L1100,3');
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', '#e0e0e0');
      path.setAttribute('stroke-width', '1');
      svg.appendChild(path);
      item.appendChild(svg);

      var tweenIn = null;
      var tweenOut = null;

      item.addEventListener('mouseenter', function () {
        if (tweenOut) tweenOut.kill();
        tweenIn = gsap.to(path, {
          attr: { d: 'M0,3 Q275,9 550,-1 T1100,3' },
          duration: 0.6,
          ease: 'cubic-bezier(0.16, 1, 0.3, 1)'
        });
      });

      item.addEventListener('mouseleave', function () {
        if (tweenIn) tweenIn.kill();
        tweenOut = gsap.to(path, {
          attr: { d: 'M0,3 L1100,3' },
          duration: 0.6,
          ease: 'cubic-bezier(0.16, 1, 0.3, 1)'
        });
      });
    });
  }

  /* ========================================
     ⑭ Corner Frame Expansion (FV corners)
     ======================================== */
  function initCornerExpansion() {
    if (window.innerWidth <= 768) return;

    var fvSticky = document.querySelector('.fv__sticky');
    if (!fvSticky) return;

    var corners = [
      { selector: '.fv__corner--tl', x: 40, y: 40 },
      { selector: '.fv__corner--tr', x: 1880, y: 40 },
      { selector: '.fv__corner--bl', x: 40, y: 1040 },
      { selector: '.fv__corner--br', x: 1880, y: 1040 }
    ];

    // 各コーナーのhitエリアとアニメーション
    var HIT_SIZE = 150;
    var cornerSvg = document.querySelector('.fv__corners');
    if (!cornerSvg) return;

    corners.forEach(function (c) {
      var polyline = document.querySelector(c.selector);
      if (!polyline) return;

      var hitDiv = document.createElement('div');
      hitDiv.className = 'fv__corner-hit';
      hitDiv.setAttribute('aria-hidden', 'true');

      // polylineのpoints属性からhitエリアの位置を決定
      var isLeft = c.x < 960;
      var isTop = c.y < 540;
      hitDiv.style.position = 'absolute';
      hitDiv.style.width = HIT_SIZE + 'px';
      hitDiv.style.height = HIT_SIZE + 'px';
      hitDiv.style.zIndex = '3';
      if (isLeft) hitDiv.style.left = '0';
      else hitDiv.style.right = '0';
      if (isTop) hitDiv.style.top = '0';
      else hitDiv.style.bottom = '0';

      fvSticky.appendChild(hitDiv);

      // 拡張ポイントの計算
      // 通常: 50px辺 → ホバー: 100px辺
      var originalPoints = polyline.getAttribute('points');
      var expandedPoints;

      if (c.selector === '.fv__corner--tl') {
        expandedPoints = '40,130 40,40 130,40';
      } else if (c.selector === '.fv__corner--tr') {
        expandedPoints = '1790,40 1880,40 1880,130';
      } else if (c.selector === '.fv__corner--bl') {
        expandedPoints = '40,950 40,1040 130,1040';
      } else {
        expandedPoints = '1790,1040 1880,1040 1880,950';
      }

      var tweenIn = null;
      var tweenOut = null;

      hitDiv.addEventListener('mouseenter', function () {
        if (tweenOut) tweenOut.kill();
        tweenIn = gsap.to(polyline, {
          attr: { points: expandedPoints },
          strokeDasharray: 180,
          duration: 0.5,
          ease: 'cubic-bezier(0.16, 1, 0.3, 1)'
        });
      });

      hitDiv.addEventListener('mouseleave', function () {
        if (tweenIn) tweenIn.kill();
        tweenOut = gsap.to(polyline, {
          attr: { points: originalPoints },
          strokeDasharray: 80,
          duration: 0.5,
          ease: 'cubic-bezier(0.16, 1, 0.3, 1)'
        });
      });
    });
  }

  /* ========================================
     Init
     ======================================== */
  document.addEventListener('DOMContentLoaded', function () {
    var isRevisit = sessionStorage.getItem('akashiki-splash') === 'done';
    var logoFloat = document.getElementById('logoFloating');
    var opening = document.getElementById('lanternOpening');

    // FV背景要素を初期非表示（オープニング中）
    if (!isRevisit) {
      var fvBgEls = document.querySelectorAll('.fv__radial, .fv__orb, .fv__scanline');
      fvBgEls.forEach(function (el) { el.style.opacity = '0'; });
    }

    if (isRevisit) {
      // 再訪問: オープニングスキップ
      if (opening) opening.remove();
      if (logoFloat) {
        logoFloat.style.display = '';
        logoFloat.style.opacity = '1';
      }

      // 即座にFV表示 + 全エフェクト起動
      revealAndBind();
      initWireframe();
      initParticles();
      initOrbs();
      initRipple();
      initWorks();
      initWaveLift();
      initPrice();
      initClipPathMorph();
      initSeparatorPulse();
      initCornerExpansion();
      initFVCleanup();
      initLogoTransfer();
    } else {
      // 初回: 灯篭オープニング
      var safetyFired = false;

      // Brave等でWebGLオープニングが完了しない場合の強制解除（10秒）
      var safetyTimeout = setTimeout(function () {
        if (safetyFired) return;
        safetyFired = true;

        document.body.classList.remove('is-locked');
        document.body.style.overflow = '';
        var lantern = document.querySelector('.lantern-opening');
        if (lantern) lantern.style.display = 'none';
        if (window.lenis) window.lenis.start();

        var logo = document.querySelector('.logo-floating');
        if (logo) {
          logo.style.position = 'fixed';
          logo.style.left = '24px';
          logo.style.top = '18px';
          logo.style.fontSize = '13px';
          logo.style.opacity = '1';
        }

        sessionStorage.setItem('akashiki-splash', 'done');

        fadeInFVElements();
        revealAndBind();
        initWireframe();
        initParticles();
        initOrbs();
        initRipple();
        initWorks();
        initWaveLift();
        initPrice();
        initClipPathMorph();
        initSeparatorPulse();
        initCornerExpansion();
        initFVCleanup();
        initLogoTransfer();
      }, 10000);

      playLanternOpening(function () {
        if (safetyFired) return;
        safetyFired = true;
        clearTimeout(safetyTimeout);

        // Phase 6: FVメインテキスト出現
        fadeInFVElements();
        revealAndBind();
        initWireframe();
        initParticles();
        initOrbs();
        initRipple();
        initWorks();
        initWaveLift();
        initPrice();
        initClipPathMorph();
        initSeparatorPulse();
        initCornerExpansion();
        initFVCleanup();
        initLogoTransfer();

        // body unlock + Lenis
        document.body.classList.remove('is-locked');
        if (window.lenis) window.lenis.start();
      });
    }
  });

})();
