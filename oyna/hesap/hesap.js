// NÖBET: Otopark — Personel girişi (e-posta hesabı)
//
// Oyun açılmadan önce oyuncu e-posta + şifresiyle giriş yapar ya da kayıt olur; kampanya kaydı
// (gece, kasa, çanta, kayıt noktası) hesabına yazılır, her tarayıcıdan / bilgisayardan aynı kayıt
// gelir. Hesaptan çıkınca bu tarayıcıda oturum da kayıt da kalmaz.
//
// Sunucu: Firebase (Authentication e-posta/şifre + Firestore), tarayıcıdan doğrudan REST ile.
// Ayarlar ../hesap-ayar.js içinde (window.NOBET_HESAP). apiKey boşsa sistem kapalıdır ve oyun
// eskisi gibi kaydı tarayıcıda tutar.
//
// Oyunla köprü (Assets/Plugins/WebGL/NobetHesap.jslib, Assets/Scripts/Core/Account*.cs):
//   oyun → sayfa   NobetHesap.kaydet(json), .cikis(), .oyunHazir()
//   sayfa → oyun   SendMessage("NobetHesap", "HesapGirildi" | "HesapCikildi", ...)
(function () {
  "use strict";
  var A = window.NOBET_HESAP || {};
  function bos() {}
  var H = window.NobetHesap = {
    etkin: !!(A.apiKey && A.projectId),
    baslat: bos, ilerleme: bos, oyunYuklendi: bos, hata: bos, kaydet: bos, cikis: bos, oyunHazir: bos
  };
  if (!H.etkin) return;

  var tr = (navigator.language || "").toLowerCase().indexOf("tr") === 0;
  var T = tr ? {
    cam: "CAM 00 · PERSONEL GİRİŞİ", anasayfa: "‹ ANA SAYFA", bolum: "BÖLÜM 1 · OTOPARK",
    ust: "MÜHÜR GÜVENLİK · <b>PERSONEL GİRİŞİ</b>", slogan: "MÜHÜR GÜVENLİK · GECE MÜHÜRLÜDÜR.",
    girisBaslik: "VARDİYAYA GİRİŞ",
    girisAciklama: "Kaydın hesabında tutulur: <b>hangi bilgisayardan girersen gir</b>, kaldığın geceden devam edersin.",
    eposta: "E-POSTA", sifre: "ŞİFRE", sifreTekrar: "ŞİFRE (TEKRAR)", yeniSifre: "YENİ ŞİFRE", ornek: "ad@ornek.com",
    goster: "GÖSTER", gizle: "GİZLE", caps: "BÜYÜK HARF KİLİDİ AÇIK", hatirla: "BENİ HATIRLA",
    unuttum: "ŞİFREMİ UNUTTUM", gir: "VARDİYAYA GİR", kayitaGec: "HESABIN YOK MU? <b>KAYIT OL</b>",
    kayitBaslik: "YENİ PERSONEL KAYDI",
    kayitAciklama: "E-postan ve belirleyeceğin şifreyle hesap aç. Gecelerin, kasandaki para ve çantan hesabına kaydedilir.",
    ipucu: "En az 6 karakter", kayitOl: "KAYDI OLUŞTUR", giriseGec: "ZATEN HESABIN VAR MI? <b>GİRİŞ YAP</b>",
    unuttumBaslik: "ŞİFREMİ UNUTTUM",
    unuttumAciklama: "Hesabının e-postasını yaz; şifreni yenilemen için sana bir bağlantı gönderelim.",
    gonder: "SIFIRLAMA BAĞLANTISI GÖNDER", geri: "‹ GİRİŞE DÖN",
    gonderildi: "Bu e-postayla kayıtlı bir hesap varsa şifre sıfırlama bağlantısı gönderildi. Gelen kutunu ve <b>istenmeyen (spam)</b> klasörünü kontrol et.",
    yeniBaslik: "YENİ ŞİFRE BELİRLE", yeniAciklama: "<b>{0}</b> hesabı için yeni şifreni yaz.",
    yeniKontrol: "Bağlantı kontrol ediliyor…", yeniKaydet: "ŞİFREYİ KAYDET",
    yeniTamam: "Şifren değiştirildi. Yeni şifrenle giriş yapabilirsin.",
    dogrulaniyor: "OTURUM DOĞRULANIYOR", bekleyin: "BEKLEYİN…", cikiliyor: "OTURUM KAPATILIYOR",
    hosgeldin: "HOŞ GELDİN", hazirlaniyor: "VARDİYA HAZIRLANIYOR",
    kayitVar: "KAYIT BULUNDU · <em>{0}. GECE · {1}</em>", kayitBitti: "KAYIT BULUNDU · <em>5 GECE TAMAMLANDI</em>",
    kayitYok: "İLK VARDİYAN · <em>KAYIT YOK</em>",
    cikildi: "Hesaptan çıkıldı. Kaydın hesabında duruyor; tekrar giriş yaptığında kaldığın yerden devam edersin.",
    cikisKayip: "Hesaptan çıkıldı, ama son kayıt sunucuya yazılamadı (bağlantı yok).",
    oturumDustu: "Oturumun süresi doldu. Yeniden giriş yap.",
    yukleniyor: "SİSTEM YÜKLENİYOR", basliyor: "SİSTEM BAŞLATILIYOR", hazir: "SİSTEM HAZIR",
    kayitHata: "KAYIT HESABA YAZILAMADI · TEKRAR DENENİYOR", kayitTamam: "KAYIT HESABA YAZILDI",
    kartBaslik: "PERSONEL KARTI", firma: "MÜHÜR GÜVENLİK A.Ş.", ad: "AD", gorev: "GÖREV", gorevDeger: "GECE BEKÇİSİ",
    bolge: "BÖLGE", bolgeDeger: "OTOPARK", vardiya: "VARDİYA",
    kartNot: "Kart şahsa özeldir. Kaybolursa Mühür Güvenlik'e bildiriniz.", onayli: "ONAYLI",
    h: {
      gecersizEposta: "Geçerli bir e-posta adresi yaz.", sifreBos: "Şifreni yaz.",
      zayif: "Şifre en az 6 karakter olmalı.", farkli: "Şifreler aynı değil.",
      yanlis: "E-posta ya da şifre hatalı.", var: "Bu e-postayla zaten bir hesap var. Giriş yap ya da şifreni sıfırla.",
      kapali: "Bu hesap devre dışı bırakılmış.", cok: "Çok fazla deneme yapıldı. Biraz bekleyip tekrar dene.",
      izinYok: "E-posta ile giriş bu sitede henüz açılmamış.", kod: "Bu şifre sıfırlama bağlantısının süresi dolmuş ya da daha önce kullanılmış. Yeni bir bağlantı iste.",
      anahtar: "Hesap sistemi yanlış ayarlanmış (API anahtarı).", ag: "Sunucuya ulaşılamadı. İnternet bağlantını kontrol et.",
      depo: "Kayıt deposuna ulaşılamadı. Biraz sonra tekrar dene.", depoYok: "Kayıt deposu (Firestore) henüz kurulmamış.",
      bilinmeyen: "Beklenmeyen bir hata oldu ({0})."
    }
  } : {
    cam: "CAM 00 · STAFF SIGN-IN", anasayfa: "‹ HOME", bolum: "EPISODE 1 · THE CAR PARK",
    ust: "MÜHÜR SECURITY · <b>STAFF SIGN-IN</b>", slogan: "MÜHÜR SECURITY · THE NIGHT IS SEALED.",
    girisBaslik: "CLOCK IN",
    girisAciklama: "Your save lives in your account: <b>sign in from any computer</b> and continue from the night you left.",
    eposta: "E-MAIL", sifre: "PASSWORD", sifreTekrar: "PASSWORD (AGAIN)", yeniSifre: "NEW PASSWORD", ornek: "name@example.com",
    goster: "SHOW", gizle: "HIDE", caps: "CAPS LOCK IS ON", hatirla: "REMEMBER ME",
    unuttum: "FORGOT PASSWORD", gir: "START SHIFT", kayitaGec: "NO ACCOUNT? <b>SIGN UP</b>",
    kayitBaslik: "NEW STAFF REGISTRATION",
    kayitAciklama: "Create an account with your e-mail and a password. Your nights, cash and bag are saved to it.",
    ipucu: "At least 6 characters", kayitOl: "CREATE ACCOUNT", giriseGec: "ALREADY HAVE AN ACCOUNT? <b>SIGN IN</b>",
    unuttumBaslik: "FORGOT PASSWORD",
    unuttumAciklama: "Enter your account's e-mail and we'll send you a link to reset your password.",
    gonder: "SEND RESET LINK", geri: "‹ BACK TO SIGN-IN",
    gonderildi: "If an account exists for this e-mail, a password reset link has been sent. Check your inbox and your <b>spam</b> folder.",
    yeniBaslik: "SET A NEW PASSWORD", yeniAciklama: "Enter a new password for <b>{0}</b>.",
    yeniKontrol: "Checking the link…", yeniKaydet: "SAVE PASSWORD",
    yeniTamam: "Your password has been changed. Sign in with your new password.",
    dogrulaniyor: "VERIFYING SESSION", bekleyin: "PLEASE WAIT…", cikiliyor: "SIGNING OUT",
    hosgeldin: "WELCOME", hazirlaniyor: "PREPARING YOUR SHIFT",
    kayitVar: "SAVE FOUND · <em>NIGHT {0} · {1}</em>", kayitBitti: "SAVE FOUND · <em>ALL 5 NIGHTS DONE</em>",
    kayitYok: "FIRST SHIFT · <em>NO SAVE YET</em>",
    cikildi: "Signed out. Your save stays in your account; sign in again to continue where you left off.",
    cikisKayip: "Signed out, but the last save couldn't reach the server (no connection).",
    oturumDustu: "Your session has expired. Please sign in again.",
    yukleniyor: "SYSTEM LOADING", basliyor: "SYSTEM STARTING", hazir: "SYSTEM READY",
    kayitHata: "SAVE NOT UPLOADED · RETRYING", kayitTamam: "SAVE UPLOADED",
    kartBaslik: "STAFF ID", firma: "MÜHÜR SECURITY LTD.", ad: "NAME", gorev: "ROLE", gorevDeger: "NIGHT GUARD",
    bolge: "AREA", bolgeDeger: "GARAGE", vardiya: "SHIFT",
    kartNot: "This card is personal. Report a lost card to Mühür Security.", onayli: "APPROVED",
    h: {
      gecersizEposta: "Enter a valid e-mail address.", sifreBos: "Enter your password.",
      zayif: "The password must be at least 6 characters.", farkli: "The passwords don't match.",
      yanlis: "Wrong e-mail or password.", var: "An account with this e-mail already exists. Sign in or reset your password.",
      kapali: "This account has been disabled.", cok: "Too many attempts. Wait a little and try again.",
      izinYok: "E-mail sign-in isn't enabled on this site yet.", kod: "This password reset link has expired or was already used. Request a new one.",
      anahtar: "The account system is misconfigured (API key).", ag: "Couldn't reach the server. Check your internet connection.",
      depo: "Couldn't reach the save storage. Try again in a moment.", depoYok: "The save storage (Firestore) isn't set up yet.",
      bilinmeyen: "Something unexpected happened ({0})."
    }
  };

  var KEY = encodeURIComponent(A.apiKey);
  var AUTH = (A.authUrl || "https://identitytoolkit.googleapis.com") + "/v1/accounts:";
  var TOKEN = (A.tokenUrl || "https://securetoken.googleapis.com") + "/v1/token?key=" + KEY;
  var DEPO = (A.storeUrl || "https://firestore.googleapis.com") + "/v1/projects/" + encodeURIComponent(A.projectId) +
    "/databases/(default)/documents/" + (A.collection || "oyuncular") + "/";
  var OTURUM = "nobet.oturum", EPOSTA = "nobet.eposta";

  // ==================== DURUM ====================

  var oturum = null;        // { uid, email, idToken, refreshToken, bitis, kalici }
  var kampanya = "";        // hesabin kampanya kaydi (JSON, bos: kayit yok)
  var unity = null;         // createUnityInstance sonucu
  var oyunHazir = false;    // oyundaki NobetHesap nesnesi mesaj almaya hazir
  var gonderildi = false;   // bu oturum oyuna bildirildi
  var bekleyen = null;      // hesaba yazilmayi bekleyen son kayit
  var yazma = null;         // suren yazma dongusu (Promise)
  var yazmaHatasi = false;
  var sifirlamaKodu = "";
  var kok, $ = function (id) { return document.getElementById(id); };

  function fmt(s) { var a = arguments; return s.replace(/\{(\d)\}/g, function (_, i) { return a[+i + 1]; }); }
  function kacis(s) { return String(s).replace(/[&<>"']/g, function (c) { return "&#" + c.charCodeAt(0) + ";"; }); }
  function uyu(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function buyuk(s) { return tr ? s.toLocaleUpperCase("tr-TR") : s.toUpperCase(); }

  // ==================== SUNUCU (Firebase REST) ====================

  function Hata(kod, ham) { this.kod = kod; this.ham = ham || kod; }

  async function istek(url, secenek) {
    var yanit;
    try { yanit = await fetch(url, secenek); }
    catch (e) { throw new Hata("AG"); }
    var govde = null;
    try { govde = await yanit.json(); } catch (e) { govde = null; }
    if (!yanit.ok) {
      // Authentication hatalari "WEAK_PASSWORD : …" gibi kodla baslar; Firestore'unkiler cumledir, kod status'ta
      var h = (govde && govde.error) || {};
      var m = String(h.message || "");
      if (/API key not valid/i.test(m)) throw new Hata("API_KEY_INVALID", m);
      if (/database .* does not exist/i.test(m)) throw new Hata("DEPO_YOK", m);
      var kod = /^[A-Z][A-Z_]+/.exec(m);
      kod = kod ? kod[0] : (h.status || ("HTTP_" + yanit.status));
      if (yanit.status === 404 && kod === "NOT_FOUND") throw new Hata("BELGE_YOK", m);
      throw new Hata(kod, m || kod);
    }
    return govde || {};
  }

  function hesap(yol, govde) {
    return istek(AUTH + yol + "?key=" + KEY, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Firebase-Locale": tr ? "tr" : "en" },
      body: JSON.stringify(govde)
    });
  }

  function yenile(refreshToken) {
    return istek(TOKEN, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "grant_type=refresh_token&refresh_token=" + encodeURIComponent(refreshToken)
    });
  }

  async function gecerliToken() {
    if (Date.now() < oturum.bitis - 5 * 60 * 1000) return oturum.idToken;
    var o = oturum, j = await yenile(o.refreshToken);
    o.idToken = j.id_token;
    o.refreshToken = j.refresh_token || o.refreshToken;
    o.bitis = Date.now() + (+j.expires_in || 3600) * 1000;
    if (o === oturum) sakla();
    return o.idToken;
  }

  async function belge(yontem, govde) {
    var token = await gecerliToken();
    var url = DEPO + encodeURIComponent(oturum.uid) +
      (yontem === "PATCH" ? "?updateMask.fieldPaths=kampanya&updateMask.fieldPaths=guncelleme" : "");
    return istek(url, {
      method: yontem,
      headers: { "Authorization": "Bearer " + token, "Content-Type": "application/json" },
      body: govde ? JSON.stringify(govde) : undefined
    });
  }

  async function kaydiOku() {
    try {
      var b = await belge("GET");
      return b.fields && b.fields.kampanya ? (b.fields.kampanya.stringValue || "") : "";
    } catch (e) {
      if (e.kod === "BELGE_YOK") return "";
      throw e;
    }
  }

  function kaydiYaz(json) {
    return belge("PATCH", { fields: {
      kampanya: { stringValue: json },
      guncelleme: { timestampValue: new Date().toISOString() }
    } });
  }

  function hataYazisi(e) {
    var h = T.h, k = e && e.kod;
    switch (k) {
      case "EMAIL_NOT_FOUND": case "INVALID_PASSWORD": case "INVALID_LOGIN_CREDENTIALS": case "USER_NOT_FOUND": return h.yanlis;
      case "EMAIL_EXISTS": return h.var;
      case "USER_DISABLED": return h.kapali;
      case "TOO_MANY_ATTEMPTS_TRY_LATER": return h.cok;
      case "WEAK_PASSWORD": return h.zayif;
      case "INVALID_EMAIL": case "MISSING_EMAIL": return h.gecersizEposta;
      case "MISSING_PASSWORD": return h.sifreBos;
      case "OPERATION_NOT_ALLOWED": case "PASSWORD_LOGIN_DISABLED": case "ADMIN_ONLY_OPERATION": return h.izinYok;
      case "EXPIRED_OOB_CODE": case "INVALID_OOB_CODE": return h.kod;
      case "API_KEY_INVALID": return h.anahtar;
      case "AG": return h.ag;
      case "DEPO_YOK": return h.depoYok;
      case "PERMISSION_DENIED": case "UNAUTHENTICATED": return h.depo;
      case "TOKEN_EXPIRED": case "INVALID_REFRESH_TOKEN": case "INVALID_ID_TOKEN": return T.oturumDustu;
      default: return fmt(h.bilinmeyen, kacis(k || "?"));
    }
  }

  function kaliciHata(e) {
    return e && ["TOKEN_EXPIRED", "INVALID_REFRESH_TOKEN", "USER_DISABLED", "USER_NOT_FOUND", "INVALID_ID_TOKEN"].indexOf(e.kod) >= 0;
  }

  // ==================== OTURUM SAKLAMA ====================

  function depolar() {
    var d = [];
    try { d.push(window.localStorage); } catch (e) { }
    try { d.push(window.sessionStorage); } catch (e) { }
    return d;
  }

  function sakla() {
    if (!oturum) return;
    var v = JSON.stringify({ uid: oturum.uid, email: oturum.email, refreshToken: oturum.refreshToken, kalici: oturum.kalici });
    try {
      (oturum.kalici ? localStorage : sessionStorage).setItem(OTURUM, v);
      (oturum.kalici ? sessionStorage : localStorage).removeItem(OTURUM);
      if (oturum.kalici) localStorage.setItem(EPOSTA, oturum.email); else localStorage.removeItem(EPOSTA);
    } catch (e) { }
  }

  function saklananOturum() {
    var d = depolar();
    for (var i = 0; i < d.length; i++) {
      try {
        var v = JSON.parse(d[i].getItem(OTURUM) || "null");
        if (v && v.refreshToken) return v;
      } catch (e) { }
    }
    return null;
  }

  function oturumuUnut() {
    depolar().forEach(function (d) { try { d.removeItem(OTURUM); } catch (e) { } });
  }

  // ==================== ARAYUZ ====================

  var FOTO = '<svg viewBox="0 0 84 104" xmlns="http://www.w3.org/2000/svg"><rect width="84" height="104" fill="#c9c3af"/>' +
    '<circle cx="42" cy="40" r="17" fill="#6f6b60"/><path d="M8 104C10 76 25 64 42 64s32 12 34 40z" fill="#6f6b60"/>' +
    '<rect x="0" y="92" width="84" height="12" fill="#b8b19b"/></svg>';

  function alan(id, etiket, tip, tamamla, ek) {
    var sifre = tip === "password";
    return '<div class="h-alan"><label class="h-etiket" for="' + id + '">' + etiket + '</label>' +
      '<input class="h-kutu' + (sifre ? ' sifre' : '') + '" id="' + id + '" type="' + tip + '" autocomplete="' + tamamla + '"' +
      (sifre ? (tamamla === "new-password" ? ' placeholder="' + T.ipucu + '"' : '') :
        ' inputmode="email" spellcheck="false" autocapitalize="off" placeholder="' + T.ornek + '"') + (ek || '') + '>' +
      (sifre ? '<button type="button" class="h-goster" tabindex="-1">' + T.goster + '</button>' : '') + '</div>' +
      (sifre ? '<div class="h-caps">' + T.caps + '</div>' : '');
  }

  function kur() {
    var cizgi = "- - - - - - - - - - - - - - - - - - - - - -";
    kok = document.createElement("div");
    kok.id = "hesap";
    kok.hidden = true;
    kok.innerHTML =
      '<div class="h-fx golge"></div><div class="h-fx vinyet"></div><div class="h-fx tarama"></div><div class="h-fx gren"></div>' +
      '<div class="h-kose sol-ust"></div><div class="h-kose sag-ust"></div><div class="h-kose sol-alt"></div><div class="h-kose sag-alt"></div>' +
      '<div class="h-ust"><span><span class="h-rec">REC</span>&nbsp;&nbsp;' + T.cam + '</span><span class="h-tarih" id="h-saat"></span></div>' +
      '<a class="h-anasayfa" id="h-anasayfa" href="../" hidden>' + T.anasayfa + '</a>' +
      '<div class="h-sutun">' +
        '<div class="h-baslik"><div class="h-levha">P</div><div class="h-kelime"><b>NÖBET</b><span>' + T.bolum + '</span></div></div>' +
        '<div class="h-serit"></div>' +
        '<div class="h-bolum">' + T.ust + '</div>' +
        '<div class="h-mesaj" id="h-mesaj" role="alert"></div>' +

        '<form class="h-sayfa" id="h-giris" novalidate>' +
          '<h2>' + T.girisBaslik + '</h2><p class="h-aciklama">' + T.girisAciklama + '</p>' +
          alan("g-eposta", T.eposta, "email", "username") +
          alan("g-sifre", T.sifre, "password", "current-password") +
          '<div class="h-satir"><label class="h-kutucuk"><input type="checkbox" id="g-hatirla" checked><i></i>' + T.hatirla + '</label>' +
          '<button type="button" class="h-bag" data-git="unuttum">' + T.unuttum + '</button></div>' +
          '<button type="submit" class="h-dugme">' + T.gir + '</button>' +
          '<div class="h-alt-bag"><button type="button" class="h-bag" data-git="kayit">' + T.kayitaGec + '</button></div>' +
        '</form>' +

        '<form class="h-sayfa" id="h-kayit" novalidate hidden>' +
          '<h2>' + T.kayitBaslik + '</h2><p class="h-aciklama">' + T.kayitAciklama + '</p>' +
          alan("k-eposta", T.eposta, "email", "username") +
          alan("k-sifre", T.sifre, "password", "new-password") +
          alan("k-sifre2", T.sifreTekrar, "password", "new-password") +
          '<div class="h-satir"><label class="h-kutucuk"><input type="checkbox" id="k-hatirla" checked><i></i>' + T.hatirla + '</label></div>' +
          '<button type="submit" class="h-dugme">' + T.kayitOl + '</button>' +
          '<div class="h-alt-bag"><button type="button" class="h-bag" data-git="giris">' + T.giriseGec + '</button></div>' +
        '</form>' +

        '<form class="h-sayfa" id="h-unuttum" novalidate hidden>' +
          '<h2>' + T.unuttumBaslik + '</h2><p class="h-aciklama">' + T.unuttumAciklama + '</p>' +
          alan("u-eposta", T.eposta, "email", "username") +
          '<button type="submit" class="h-dugme">' + T.gonder + '</button>' +
          '<div class="h-alt-bag"><button type="button" class="h-bag" data-git="giris">' + T.geri + '</button></div>' +
        '</form>' +

        '<form class="h-sayfa" id="h-yeni" novalidate hidden>' +
          '<h2>' + T.yeniBaslik + '</h2><p class="h-aciklama" id="y-aciklama">' + T.yeniKontrol + '</p>' +
          '<input type="email" id="y-eposta" autocomplete="username" hidden>' +
          alan("y-sifre", T.yeniSifre, "password", "new-password") +
          alan("y-sifre2", T.sifreTekrar, "password", "new-password") +
          '<button type="submit" class="h-dugme">' + T.yeniKaydet + '</button>' +
          '<div class="h-alt-bag"><button type="button" class="h-bag" data-git="giris">' + T.geri + '</button></div>' +
        '</form>' +

        '<div class="h-sayfa h-bekle" id="h-bekle" hidden></div>' +
      '</div>' +

      '<div class="h-kart" aria-hidden="true">' +
        '<div class="k-bas"><b>' + T.kartBaslik + '</b><span id="k-no">No ----</span></div>' +
        '<div class="k-firma">' + T.firma + '</div>' +
        '<div class="k-cizgi">' + cizgi + '</div>' +
        '<div class="k-govde"><div class="k-foto">' + FOTO + '</div><dl>' +
          '<dt>' + T.ad + '</dt><dd id="k-ad">— — —</dd>' +
          '<dt>' + T.gorev + '</dt><dd>' + T.gorevDeger + '</dd>' +
          '<dt>' + T.bolge + '</dt><dd>' + T.bolgeDeger + '</dd>' +
          '<dt>' + T.vardiya + '</dt><dd>22:00–06:00</dd>' +
        '</dl></div>' +
        '<div class="k-cizgi">' + cizgi + '</div>' +
        '<div class="k-barkod" id="k-barkod">|| ||| | |||| || | ||| || |||| | ||</div>' +
        '<div class="k-not">' + T.kartNot + '</div>' +
        '<div class="k-muhur bos" id="k-muhur">' + T.onayli + '</div>' +
      '</div>' +

      '<div class="h-alt">' + T.slogan + '</div>' +
      '<div class="h-yukleme" id="h-yukleme"><span id="h-yuk-yazi">' + T.yukleniyor + '</span>' +
        '<div class="h-cubuk"><div id="h-yuk-cubuk"></div></div></div>';
    document.body.appendChild(kok);

    var bildirim = document.createElement("div");
    bildirim.id = "hesap-bildirim";
    document.body.appendChild(bildirim);

    // Ana sayfa bagi: oyun sitenin icindeyse (…/oyna/)
    if (/\/oyna\/?(index\.html)?$/.test(location.pathname)) $("h-anasayfa").hidden = false;

    // Sayfalar arasi gecis
    kok.addEventListener("click", function (e) {
      var git = e.target.closest && e.target.closest("[data-git]");
      if (git) { e.preventDefault(); goster(git.getAttribute("data-git")); return; }
      var gb = e.target.closest && e.target.closest(".h-goster");
      if (gb) {
        var kutu = gb.parentNode.querySelector("input");
        var ac = kutu.type === "password";
        kutu.type = ac ? "text" : "password";
        gb.textContent = ac ? T.gizle : T.goster;
        kutu.focus();
      }
    });
    ["g-eposta", "k-eposta", "u-eposta"].forEach(function (id) {
      $(id).addEventListener("input", function () { kart($(id).value); });
    });
    $("h-giris").addEventListener("submit", girisYap);
    $("h-kayit").addEventListener("submit", kayitOl);
    $("h-unuttum").addEventListener("submit", baglantiGonder);
    $("h-yeni").addEventListener("submit", yeniSifre);

    saat();
    setInterval(saat, 1000);
  }

  function saat() {
    var d = new Date(), p = function (n) { return (n < 10 ? "0" : "") + n; };
    $("h-saat").textContent = p(d.getDate()) + "." + p(d.getMonth() + 1) + "." + d.getFullYear() + "   " +
      p(d.getHours()) + ":" + p(d.getMinutes()) + ":" + p(d.getSeconds());
  }

  function ozet(o) {
    var h = 0;
    for (var i = 0; i < o.length; i++) h = (h * 31 + o.charCodeAt(i)) >>> 0;
    return h;
  }

  /// Personel karti: yazilan e-postadan ad, sicil no ve barkod
  function kart(eposta) {
    eposta = (eposta || "").trim();
    var ad = eposta.split("@")[0].replace(/[._\-+]+/g, " ").trim();
    $("k-ad").textContent = ad ? buyuk(ad).slice(0, 18) : "— — —";
    var h = ozet(eposta.toLowerCase());
    $("k-no").textContent = eposta ? "No " + ("000" + (h % 10000)).slice(-4) : "No ----";
    var bar = "", x = h || 7;
    for (var i = 0; i < 16; i++) {
      x = (x * 1103515245 + 12345) >>> 0;
      bar += ["|", "||", "|||", "||||"][(x >>> 16) % 4] + " ";
    }
    $("k-barkod").textContent = eposta ? bar.trim() : "|| ||| | |||| || | ||| || |||| | ||";
  }

  function muhur(acik) { $("k-muhur").classList.toggle("bos", !acik); }

  function mesaj(tur, metin) {
    var m = $("h-mesaj");
    m.className = "h-mesaj" + (metin ? " acik " + tur : "");
    m.innerHTML = metin || "";
  }

  var sayfalar = { giris: "h-giris", kayit: "h-kayit", unuttum: "h-unuttum", yeni: "h-yeni", bekle: "h-bekle" };
  var sayfa = "";

  function goster(ad, mesajiKoru) {
    var onceki = sayfa ? $(sayfalar[sayfa]) : null;
    var eposta = onceki ? onceki.querySelector("input[type=email]") : null;
    sayfa = ad;
    for (var k in sayfalar) $(sayfalar[k]).hidden = k !== ad;
    if (!mesajiKoru) mesaj();
    var yeni = $(sayfalar[ad]);
    var hedef = yeni.querySelector("input[type=email]:not([hidden])");
    if (hedef && eposta && eposta.value && !hedef.value) hedef.value = eposta.value;
    if (hedef) kart(hedef.value);
    if (ad !== "bekle") {
      var bosKutu = [].filter.call(yeni.querySelectorAll("input.h-kutu"), function (i) { return !i.value; })[0];
      setTimeout(function () { try { (bosKutu || yeni.querySelector(".h-dugme")).focus({ preventScroll: true }); } catch (e) { } }, 30);
    }
  }

  function bekle(baslik, alt) {
    $("h-bekle").innerHTML = "<b>" + baslik + "</b>" + (alt || "");
    goster("bekle", true);
  }

  function mesgul(form, acik) {
    var d = form.querySelector(".h-dugme");
    if (acik) { d.dataset.yazi = d.textContent; d.textContent = T.bekleyin; }
    else if (d.dataset.yazi) d.textContent = d.dataset.yazi;
    d.disabled = acik;
    [].forEach.call(form.querySelectorAll("input"), function (i) { i.disabled = acik; });
  }

  function epostaGecerli(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }

  function ac() {
    kok.hidden = false;
    kok.classList.remove("kapaniyor");
    try { if (document.pointerLockElement) document.exitPointerLock(); } catch (e) { }
    ["back", "rec"].forEach(function (id) { var el = $(id); if (el) el.hidden = true; });
  }

  function kapat() {
    kok.classList.add("kapaniyor");
    setTimeout(function () {
      if (!kok.classList.contains("kapaniyor")) return;
      kok.hidden = true;
      var c = $("unity-canvas");
      if (c) c.focus();
    }, 650);
  }

  function bildir(metin, tamam) {
    var b = $("hesap-bildirim");
    b.textContent = metin;
    b.className = "acik" + (tamam ? " tamam" : "");
    clearTimeout(bildir.t);
    if (tamam) bildir.t = setTimeout(function () { b.className = tamam ? "tamam" : ""; }, 2500);
  }

  // ==================== AKIS ====================

  function kayitOzeti(json) {
    try {
      var s = JSON.parse(json);
      if (s.completed) return T.kayitBitti;
      var dk = Math.floor((s.hasCheckpoint ? s.checkpointHours : 0) * 60), p = function (n) { return (n < 10 ? "0" : "") + n; };
      return fmt(T.kayitVar, s.night || 1, p((22 + Math.floor(dk / 60)) % 24) + ":" + p(dk % 60));
    } catch (e) { return T.kayitYok; }
  }

  /// Giris / kayit / hatirlanan oturum sonrasi: hesabin kaydini al, oyuna ver
  async function oturumuBaslat(o) {
    oturum = o;
    try {
      kampanya = await kaydiOku();
    } catch (e) {
      oturum = null;
      throw e;
    }
    sakla();
    gonderildi = false;
    muhur(true);
    kart(o.email);
    bekle(T.hosgeldin,
      '<span>' + kacis(o.email) + '</span><br>' + (kampanya ? kayitOzeti(kampanya) : T.kayitYok) +
      '<br><span class="h-noktalar">' + T.hazirlaniyor + '</span>');
    oyunaBildir();
  }

  function oyunaBildir() {
    if (!oturum || !unity || !oyunHazir || gonderildi) return;
    gonderildi = true;
    unity.SendMessage("NobetHesap", "HesapGirildi", JSON.stringify({ email: oturum.email, kampanya: kampanya || "" }));
    setTimeout(kapat, 350);
  }

  function yeniOturum(j, kalici) {
    return {
      uid: j.localId, email: j.email, idToken: j.idToken, refreshToken: j.refreshToken,
      bitis: Date.now() + (+j.expiresIn || 3600) * 1000, kalici: kalici
    };
  }

  async function girisYap(e) {
    e.preventDefault();
    var f = $("h-giris"), eposta = $("g-eposta").value.trim(), sifre = $("g-sifre").value;
    if (!epostaGecerli(eposta)) { mesaj("hata", T.h.gecersizEposta); $("g-eposta").focus(); return; }
    if (!sifre) { mesaj("hata", T.h.sifreBos); $("g-sifre").focus(); return; }
    mesaj();
    mesgul(f, true);
    try {
      var j = await hesap("signInWithPassword", { email: eposta, password: sifre, returnSecureToken: true });
      $("g-sifre").value = "";
      await oturumuBaslat(yeniOturum(j, $("g-hatirla").checked));
    } catch (err) {
      mesgul(f, false);
      goster("giris", true);
      mesaj("hata", hataYazisi(err));
      $("g-sifre").select();
      return;
    }
    mesgul(f, false);
  }

  async function kayitOl(e) {
    e.preventDefault();
    var f = $("h-kayit"), eposta = $("k-eposta").value.trim(), s1 = $("k-sifre").value, s2 = $("k-sifre2").value;
    if (!epostaGecerli(eposta)) { mesaj("hata", T.h.gecersizEposta); $("k-eposta").focus(); return; }
    if (s1.length < 6) { mesaj("hata", T.h.zayif); $("k-sifre").focus(); return; }
    if (s1 !== s2) { mesaj("hata", T.h.farkli); $("k-sifre2").select(); return; }
    mesaj();
    mesgul(f, true);
    try {
      var j = await hesap("signUp", { email: eposta, password: s1, returnSecureToken: true });
      $("k-sifre").value = $("k-sifre2").value = "";
      await oturumuBaslat(yeniOturum(j, $("k-hatirla").checked));
    } catch (err) {
      mesgul(f, false);
      goster("kayit", true);
      mesaj("hata", hataYazisi(err));
      return;
    }
    mesgul(f, false);
  }

  async function baglantiGonder(e) {
    e.preventDefault();
    var f = $("h-unuttum"), eposta = $("u-eposta").value.trim();
    if (!epostaGecerli(eposta)) { mesaj("hata", T.h.gecersizEposta); $("u-eposta").focus(); return; }
    mesaj();
    mesgul(f, true);
    try {
      await hesap("sendOobCode", { requestType: "PASSWORD_RESET", email: eposta });
      mesaj("tamam", T.gonderildi);
    } catch (err) {
      // E-posta bulunamadi hatasi hesap varligini ele verir: ayni olumlu mesaj
      if (err.kod === "EMAIL_NOT_FOUND" || err.kod === "USER_NOT_FOUND") mesaj("tamam", T.gonderildi);
      else mesaj("hata", hataYazisi(err));
    }
    mesgul(f, false);
  }

  /// E-postadaki baglanti oyunun sayfasina donduyse (?mode=resetPassword&oobCode=…)
  async function sifirlamaBaglantisi() {
    goster("yeni");
    mesgul($("h-yeni"), true);
    try {
      var j = await hesap("resetPassword", { oobCode: sifirlamaKodu });
      $("y-eposta").value = j.email || "";
      $("y-aciklama").innerHTML = fmt(T.yeniAciklama, kacis(j.email || ""));
      kart(j.email || "");
      mesgul($("h-yeni"), false);
      $("y-sifre").focus();
    } catch (err) {
      mesgul($("h-yeni"), false);
      goster("unuttum");
      mesaj("hata", hataYazisi(err));
    }
  }

  async function yeniSifre(e) {
    e.preventDefault();
    var f = $("h-yeni"), s1 = $("y-sifre").value, s2 = $("y-sifre2").value;
    if (s1.length < 6) { mesaj("hata", T.h.zayif); $("y-sifre").focus(); return; }
    if (s1 !== s2) { mesaj("hata", T.h.farkli); $("y-sifre2").select(); return; }
    mesaj();
    mesgul(f, true);
    try {
      await hesap("resetPassword", { oobCode: sifirlamaKodu, newPassword: s1 });
      sifirlamaKodu = "";
      $("y-sifre").value = $("y-sifre2").value = "";
      mesgul(f, false);
      $("g-eposta").value = $("y-eposta").value;
      goster("giris");
      mesaj("tamam", T.yeniTamam);
    } catch (err) {
      mesgul(f, false);
      mesaj("hata", hataYazisi(err));
    }
  }

  // ==================== OYUNDAN GELENLER ====================

  /// Oyun kampanya kaydini yazdi (her saat basi, gece sonu, ana menuye donus)
  H.kaydet = function (json) {
    if (!oturum) return;
    kampanya = json;
    bekleyen = json;
    if (!yazma) yazma = yazmaDongusu();
  };

  async function yazmaDongusu() {
    var ara = 2000;
    while (bekleyen !== null && oturum) {
      var json = bekleyen;
      bekleyen = null;
      try {
        await kaydiYaz(json);
        if (yazmaHatasi) bildir(T.kayitTamam, true);
        yazmaHatasi = false;
        ara = 2000;
      } catch (e) {
        if (bekleyen === null) bekleyen = json;
        if (kaliciHata(e)) { oturumDustu(); break; }
        if (e.kod === "UNAUTHENTICATED" && oturum) oturum.bitis = 0;
        yazmaHatasi = true;
        bildir(T.kayitHata, false);
        console.warn("[Hesap] Kayıt yazılamadı:", e.ham);
        await uyu(ara);
        ara = Math.min(ara * 2, 30000);
      }
    }
    yazma = null;
  }

  function oturumuKapat() {
    oturumuUnut();
    oturum = null;
    kampanya = "";
    gonderildi = false;
    bekleyen = null;
    yazmaHatasi = false;
    muhur(false);
    $("hesap-bildirim").className = "";
    if (unity) unity.SendMessage("NobetHesap", "HesapCikildi", "");
  }

  function oturumDustu() {
    oturumuKapat();
    ac();
    goster("giris");
    mesaj("hata", T.oturumDustu);
  }

  /// Menudeki HESAPTAN ÇIK: once bekleyen kayit yazilsin
  H.cikis = async function () {
    if (!oturum) return;
    ac();
    bekle(T.cikiliyor, '<span class="h-noktalar"></span>');
    if (yazma) await Promise.race([yazma, uyu(8000)]);
    var kayip = bekleyen !== null;
    var eposta = oturum ? oturum.email : "";
    oturumuKapat();
    $("g-eposta").value = eposta;
    $("g-sifre").value = "";
    goster("giris");
    mesaj(kayip ? "hata" : "tamam", kayip ? T.cikisKayip : T.cikildi);
  };

  H.oyunHazir = function () {
    oyunHazir = true;
    oyunaBildir();
  };

  // ==================== SAYFADAN (index.html) GELENLER ====================

  H.ilerleme = function (p) {
    $("h-yuk-cubuk").style.width = Math.round(p * 100) + "%";
    $("h-yuk-yazi").textContent = (p >= 0.9 ? T.basliyor : T.yukleniyor) + "  " + Math.round(p * 100) + "%";
  };

  H.oyunYuklendi = function (instance) {
    unity = instance;
    $("h-yukleme").classList.add("bitti");
    $("h-yuk-yazi").textContent = T.hazir;
    oyunaBildir();
  };

  H.hata = function (metin) {
    if (!kok) return;
    $("h-yuk-yazi").innerHTML = '<span class="hata">' + metin + "</span>";
  };

  H.baslat = async function () {
    if (!kok) kur();
    ac();
    try { $("g-eposta").value = localStorage.getItem(EPOSTA) || ""; } catch (e) { }

    var q = new URLSearchParams(location.search);
    if (q.get("mode") === "resetPassword" && q.get("oobCode")) {
      sifirlamaKodu = q.get("oobCode");
      ["mode", "oobCode", "apiKey", "lang", "continueUrl", "tenantId"].forEach(function (k) { q.delete(k); });
      var kalan = q.toString();
      try { history.replaceState(null, "", location.pathname + (kalan ? "?" + kalan : "")); } catch (e) { }
      sifirlamaBaglantisi();
      return;
    }

    var s = saklananOturum();
    if (!s) { goster("giris"); return; }
    bekle(T.dogrulaniyor, '<span class="h-noktalar"></span>');
    kart(s.email);
    try {
      var j = await yenile(s.refreshToken);
      await oturumuBaslat({
        uid: j.user_id || s.uid, email: s.email, idToken: j.id_token, refreshToken: j.refresh_token || s.refreshToken,
        bitis: Date.now() + (+j.expires_in || 3600) * 1000, kalici: !!s.kalici
      });
    } catch (err) {
      if (err.kod !== "AG") oturumuUnut();
      $("g-eposta").value = s.email || "";
      goster("giris");
      mesaj("hata", err.kod === "AG" ? T.h.ag : T.oturumDustu);
    }
  };

  // Sayfa kapanirken hesaba yazilmamis kayit varsa uyar
  window.addEventListener("beforeunload", function (e) {
    if (oturum && (bekleyen !== null || yazma)) { e.preventDefault(); e.returnValue = ""; }
  });

  // Giris sayfasi acikken klavye / fare oyuna gitmesin (oyun tuslari yakalayip varsayilani engeller).
  // Unity'den once, yakalama asamasinda: yazma, Tab, Enter tarayicinin kendi isi olarak calisir.
  ["keydown", "keyup", "keypress"].forEach(function (tur) {
    window.addEventListener(tur, function (e) {
      if (!kok || kok.hidden || !kok.contains(e.target)) return;
      e.stopImmediatePropagation();
      if (e.target.type === "password" || (e.target.classList && e.target.classList.contains("sifre"))) {
        var caps = e.getModifierState && e.getModifierState("CapsLock");
        var uyari = e.target.parentNode.nextElementSibling;
        if (uyari && uyari.classList.contains("h-caps")) uyari.classList.toggle("acik", !!caps);
      }
    }, true);
  });
  ["mousedown", "mouseup", "mousemove", "pointerdown", "pointerup", "pointermove", "wheel", "touchstart", "touchend", "touchmove", "contextmenu"].forEach(function (tur) {
    window.addEventListener(tur, function (e) {
      if (kok && !kok.hidden && kok.contains(e.target)) e.stopImmediatePropagation();
    }, true);
  });
})();
