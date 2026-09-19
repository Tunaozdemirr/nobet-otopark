// NÖBET: Otopark — Ekran kartı kullanılmıyor mu? (yazılım çizimi algılama + düşük grafik)
//
// Tarayıcıda donanım hızlandırma kapalıysa ya da ekran kartı sürücüsü yoksa / kara listedeyse
// WebGL'i işlemci çizer: Windows'ta "Microsoft Basic Render Driver" (WARP), başka yerde
// SwiftShader / llvmpipe. O zaman her piksel pahalıdır ve oyun takılır. Burada:
//   - WebGL'in çizicisine bakılır; yazılımsa window.NOBET_GRAFIK = "dusuk" (oyun bunu okur:
//     Assets/Scripts/Rendering/GraphicsMode.cs) ve oyunun tuvali küçültülür (dpr)
//   - oyuncuya kendi tarayıcısında donanım hızlandırmayı nasıl açacağı gösterilir
// Adres satırından: ?grafik=dusuk (zorla düşük) · ?grafik=normal (algılamayı yok say) · ?tuval=540
(function () {
  "use strict";
  var q = location.search;
  var zorla = (/[?&]grafik=(dusuk|normal)/.exec(q) || [])[1] || "";
  var tuvalYuksekligi = +((/[?&]tuval=(\d+)/.exec(q) || [])[1] || 720);

  function cizici() {
    var sonuc = { ad: "", yavas: false };
    try {
      var c = document.createElement("canvas");
      var g = c.getContext("webgl2") || c.getContext("webgl");
      if (!g) return sonuc;
      var i = g.getExtension("WEBGL_debug_renderer_info");
      sonuc.ad = String(i ? g.getParameter(i.UNMASKED_RENDERER_WEBGL) : g.getParameter(g.RENDERER));
      var l = g.getExtension("WEBGL_lose_context");
      if (l) l.loseContext();
      // Tarayıcının kendisi de "ciddi performans kaybı" diyorsa (SwiftShader) bağlam açılmaz
      var s = document.createElement("canvas").getContext("webgl2", { failIfMajorPerformanceCaveat: true });
      if (!s) sonuc.yavas = true;
      else { var l2 = s.getExtension("WEBGL_lose_context"); if (l2) l2.loseContext(); }
    } catch (e) { }
    return sonuc;
  }

  var c = cizici();
  var yazilim = c.yavas || /SwiftShader|Basic Render|llvmpipe|softpipe|Software|WARP/i.test(c.ad);
  var dusuk = zorla === "dusuk" || (yazilim && zorla !== "normal");
  if (dusuk) window.NOBET_GRAFIK = "dusuk";

  var ua = navigator.userAgent;
  var tarayici = /OPR\/|Opera/.test(ua) ? "opera" : /Edg\//.test(ua) ? "edge" : /Firefox\//.test(ua) ? "firefox"
    : /Chrome\//.test(ua) ? "chrome" : "diger";
  var tr = (navigator.language || "").toLowerCase().indexOf("tr") === 0;

  var ADIM = tr ? {
    opera: { ad: "Opera GX / Opera", adres: "opera://settings/system", yol: "Ayarlar → Gelişmiş → Tarayıcı → Sistem",
      secenek: "Kullanılabilir olduğunda donanım hızlandırmasını kullan", gpu: "opera://gpu" },
    chrome: { ad: "Chrome", adres: "chrome://settings/system", yol: "Ayarlar → Sistem",
      secenek: "Kullanılabilir olduğunda grafik hızlandırmayı kullan", gpu: "chrome://gpu" },
    edge: { ad: "Edge", adres: "edge://settings/system", yol: "Ayarlar → Sistem ve performans",
      secenek: "Kullanılabilir olduğunda grafik hızlandırmayı kullan", gpu: "edge://gpu" },
    firefox: { ad: "Firefox", adres: "about:preferences", yol: "Ayarlar → Genel → Performans (önce \"Önerilen performans ayarlarını kullan\" işaretini kaldır)",
      secenek: "Kullanılabilir olduğunda donanım ivmesini kullan", gpu: "about:support" },
    diger: { ad: "tarayıcın", adres: "", yol: "Ayarlar → Sistem",
      secenek: "donanım / grafik hızlandırma", gpu: "" }
  } : {
    opera: { ad: "Opera GX / Opera", adres: "opera://settings/system", yol: "Settings → Advanced → Browser → System",
      secenek: "Use hardware acceleration when available", gpu: "opera://gpu" },
    chrome: { ad: "Chrome", adres: "chrome://settings/system", yol: "Settings → System",
      secenek: "Use graphics acceleration when available", gpu: "chrome://gpu" },
    edge: { ad: "Edge", adres: "edge://settings/system", yol: "Settings → System and performance",
      secenek: "Use graphics acceleration when available", gpu: "edge://gpu" },
    firefox: { ad: "Firefox", adres: "about:preferences", yol: "Settings → General → Performance (untick \"Use recommended performance settings\" first)",
      secenek: "Use hardware acceleration when available", gpu: "about:support" },
    diger: { ad: "your browser", adres: "", yol: "Settings → System",
      secenek: "hardware / graphics acceleration", gpu: "" }
  };

  var T = tr ? {
    baslik: "EKRAN KARTI KULLANILMIYOR",
    govde: "Tarayıcın oyunu ekran kartı yerine <b>işlemciyle</b> çiziyor:",
    sonuc: "Bu yüzden görüntü takılır. Oynanabilsin diye <b>düşük grafik modu açıldı</b> (daha düşük çözünürlük, daha az efekt).",
    cozum: "KALICI ÇÖZÜM · {0}",
    a1: "Adres çubuğuna yaz:", a1b: "(ya da {0})",
    a2: "\"{0}\" seçeneğini <b>aç</b>.",
    a3: "Tarayıcıyı tamamen kapatıp yeniden aç, bu sayfayı yenile.",
    hala: "Hâlâ bu uyarı çıkıyorsa ekran kartı sürücüsünü güncelle (Intel / NVIDIA / AMD sitesinden). {0} sayfasında \"WebGL: Hardware accelerated\" yazmalı.",
    kopyala: "KOPYALA", kopyalandi: "KOPYALANDI", gosterme: "BİR DAHA GÖSTERME", devam: "DÜŞÜK GRAFİKLE DEVAM ET"
  } : {
    baslik: "YOUR GRAPHICS CARD ISN'T BEING USED",
    govde: "Your browser is drawing the game with the <b>CPU</b> instead of the graphics card:",
    sonuc: "That's why it stutters. To keep it playable, <b>low graphics mode is on</b> (lower resolution, fewer effects).",
    cozum: "PERMANENT FIX · {0}",
    a1: "Type in the address bar:", a1b: "(or {0})",
    a2: "Turn <b>on</b> \"{0}\".",
    a3: "Close the browser completely, reopen it and reload this page.",
    hala: "If you still see this, update your graphics driver (from the Intel / NVIDIA / AMD site). {0} should say \"WebGL: Hardware accelerated\".",
    kopyala: "COPY", kopyalandi: "COPIED", gosterme: "DON'T SHOW AGAIN", devam: "CONTINUE WITH LOW GRAPHICS"
  };

  function fmt(s) { var a = arguments; return s.replace(/\{(\d)\}/g, function (_, i) { return a[+i + 1]; }); }
  function kacis(s) { return String(s).replace(/[&<>"']/g, function (ch) { return "&#" + ch.charCodeAt(0) + ";"; }); }

  var CSS =
    "#grafik-uyari{position:fixed;inset:0;z-index:10;display:flex;align-items:center;justify-content:center;padding:16px;" +
    "background:rgba(0,0,0,.72);font-family:NRoboto,'Segoe UI',Arial,sans-serif;color:#eceae3;text-align:left}" +
    "#grafik-uyari *{box-sizing:border-box}" +
    "#grafik-uyari .gu-kart{width:min(620px,100%);max-height:calc(100vh - 32px);overflow:auto;background:rgba(14,15,17,.97);" +
    "border:1px solid rgba(220,166,59,.45);box-shadow:0 20px 60px rgba(0,0,0,.7)}" +
    "#grafik-uyari .gu-serit{height:9px;background:repeating-linear-gradient(-45deg,#e5a92e 0 10px,#111 10px 20px)}" +
    "#grafik-uyari .gu-ic{padding:24px 28px 22px}" +
    "#grafik-uyari h2{margin:0 0 12px;font:700 22px/1.2 NRoboto,Arial,sans-serif;letter-spacing:.06em;color:#dca63b}" +
    "#grafik-uyari h2::before{content:'';display:inline-block;width:10px;height:10px;margin:0 10px 2px 0;background:#d8453a;" +
    "border-radius:50%;animation:gu-yan 1.2s steps(2) infinite}@keyframes gu-yan{50%{opacity:0}}" +
    "#grafik-uyari p{margin:0 0 10px;font-size:15px;line-height:1.55;color:#c9c6bd}#grafik-uyari b{color:#eceae3}" +
    "#grafik-uyari .gu-cizici{display:block;margin:0 0 12px;padding:8px 12px;background:#050606;border-left:3px solid #d8453a;" +
    "font:13px/1.4 NMono,Consolas,monospace;color:#f0b3aa;word-break:break-word}" +
    "#grafik-uyari h3{margin:18px 0 10px;font:13px NMono,Consolas,monospace;letter-spacing:.22em;color:#8d8b84;font-weight:400}" +
    "#grafik-uyari ol{margin:0 0 12px;padding-left:22px;font-size:15px;line-height:1.5;color:#c9c6bd}#grafik-uyari li{margin:0 0 8px}" +
    "#grafik-uyari .gu-adres{display:inline-flex;align-items:center;gap:8px;margin:4px 6px 0 0;padding:4px 4px 4px 10px;background:#050606;" +
    "border:1px solid #3c4044;font:14px NMono,Consolas,monospace;color:#eceae3}" +
    "#grafik-uyari button{font:inherit;cursor:pointer}" +
    "#grafik-uyari .gu-kopya{border:1px solid #45494e;background:#1d2023;color:#aeaba2;font:11px NMono,Consolas,monospace;letter-spacing:.14em;padding:5px 8px}" +
    "#grafik-uyari .gu-kopya:hover,#grafik-uyari .gu-kopya:focus-visible{color:#dca63b;border-color:#dca63b;outline:none}" +
    "#grafik-uyari .gu-not{font-size:13px;color:#8d8b84}" +
    "#grafik-uyari .gu-alt{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;margin-top:18px}" +
    "#grafik-uyari label{display:inline-flex;align-items:center;gap:9px;cursor:pointer;font:12px NMono,Consolas,monospace;letter-spacing:.14em;color:#aeaba2}" +
    "#grafik-uyari label input{accent-color:#dca63b;width:16px;height:16px}" +
    "#grafik-uyari .gu-devam{display:inline-flex;align-items:center;gap:14px;height:46px;padding:0 18px;border:1px solid #45494e;" +
    "background:rgba(36,39,43,.95);color:#eceae3;font:700 15px NRoboto,Arial,sans-serif;letter-spacing:.06em}" +
    "#grafik-uyari .gu-devam::after{content:'\\203A';font-size:22px;font-weight:400;color:#8d8b84}" +
    "#grafik-uyari .gu-devam:hover,#grafik-uyari .gu-devam:focus-visible{border-color:#dca63b;color:#dca63b;outline:none}";

  var UYARI = "nobet.grafikUyari";

  function uyar() {
    if (!yazilim || zorla === "normal" || document.getElementById("grafik-uyari")) return;
    try { if (localStorage.getItem(UYARI) === "gizle") return; } catch (e) { }
    var a = ADIM[tarayici];
    var st = document.createElement("style");
    st.textContent = CSS;
    document.head.appendChild(st);
    var kok = document.createElement("div");
    kok.id = "grafik-uyari";
    kok.setAttribute("role", "dialog");
    kok.innerHTML =
      '<div class="gu-kart"><div class="gu-serit"></div><div class="gu-ic">' +
      '<h2>' + T.baslik + '</h2>' +
      '<p>' + T.govde + '</p>' +
      '<span class="gu-cizici">' + kacis(c.ad || "?") + '</span>' +
      '<p>' + T.sonuc + '</p>' +
      '<h3>' + fmt(T.cozum, kacis(a.ad.toLocaleUpperCase(tr ? "tr-TR" : "en-US"))) + '</h3>' +
      '<ol>' +
      (a.adres ? '<li>' + T.a1 + '<br><span class="gu-adres">' + a.adres + ' <button type="button" class="gu-kopya" data-metin="' + a.adres + '">' +
        T.kopyala + '</button></span> <span class="gu-not">' + fmt(T.a1b, a.yol) + '</span></li>' : '<li>' + a.yol + '</li>') +
      '<li>' + fmt(T.a2, a.secenek) + '</li>' +
      '<li>' + T.a3 + '</li>' +
      '</ol>' +
      '<p class="gu-not">' + fmt(T.hala, a.gpu ? '<b>' + a.gpu + '</b>' : "") + '</p>' +
      '<div class="gu-alt"><label><input type="checkbox" id="gu-gizle">' + T.gosterme + '</label>' +
      '<button type="button" class="gu-devam" id="gu-devam">' + T.devam + '</button></div>' +
      '</div></div>';
    document.body.appendChild(kok);
    kok.addEventListener("click", function (e) {
      var k = e.target.closest && e.target.closest(".gu-kopya");
      if (k) {
        var metin = k.getAttribute("data-metin");
        var bitti = function () { k.textContent = T.kopyalandi; setTimeout(function () { k.textContent = T.kopyala; }, 1500); };
        if (navigator.clipboard) navigator.clipboard.writeText(metin).then(bitti, function () { });
        return;
      }
      if (e.target.id === "gu-devam") {
        try { if (document.getElementById("gu-gizle").checked) localStorage.setItem(UYARI, "gizle"); } catch (err) { }
        kok.remove();
        var hesap = document.getElementById("hesap");
        var odak = hesap && !hesap.hidden ? hesap.querySelector("input.h-kutu") : document.getElementById("unity-canvas");
        if (odak) odak.focus();
      }
    });
    setTimeout(function () { var d = document.getElementById("gu-devam"); if (d) d.focus(); }, 50);
  }

  // Uyarı açıkken klavye / fare oyuna gitmesin (Unity tuşların varsayılanını engeller: Enter, Tab)
  ["keydown", "keyup", "keypress", "mousedown", "mouseup", "mousemove", "pointerdown", "pointerup", "wheel"].forEach(function (tur) {
    window.addEventListener(tur, function (e) {
      var k = document.getElementById("grafik-uyari");
      if (k && k.contains(e.target)) e.stopImmediatePropagation();
    }, true);
  });

  window.NobetGrafik = {
    dusuk: dusuk,
    yazilim: yazilim,
    cizici: c.ad,
    /// Unity tuvalinin piksel oranı: düşük grafikte tuval en fazla ~720 satır
    dpr: function () { return dusuk ? Math.min(1, tuvalYuksekligi / Math.max(1, window.innerHeight)) : 1; },
    uyar: uyar
  };
  if (dusuk) console.log("[Grafik] " + (yazilim ? "Yazılım çizimi: " + c.ad : "Düşük grafik (adres satırı)"));
})();
