// NÖBET: Otopark — Hesap sistemi ayarları (Firebase web yapılandırması)
//
// Firebase konsolu → Proje ayarları → Genel → "Web uygulaman" bölümündeki apiKey ve projectId.
// Bu değerler gizli değildir (her Firebase web sitesinde sayfada görünür); hesapları ve kayıtları
// Firestore kuralları korur (Web/Hesap/firestore.rules). Kurulum: Web/Hesap/KURULUM.txt
//
// apiKey boş bırakılırsa giriş sayfası çıkmaz ve oyun kaydı eskisi gibi tarayıcıda tutar.
window.NOBET_HESAP = {
  apiKey: "",
  projectId: ""
};
