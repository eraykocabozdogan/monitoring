Rüzgar Türbini Gelişmiş İzleme Paneli (Advanced Wind Turbine Monitoring Dashboard)
Bu proje, rüzgar türbini operasyonel verilerini görselleştirmek, analiz etmek ve yorumlamak için geliştirilmiş kapsamlı bir React tabanlı web uygulamasıdır. Kullanıcılar, CSV formatındaki olay günlüğü (event log) ve güç eğrisi (power curve) verilerini yükleyerek türbin performansını çok yönlü ve interaktif bir arayüzde inceleyebilirler.

Ana Özellikler
Veri Yönetimi ve Görselleştirme

Çoklu CSV Yükleme: papaparse ile birden fazla olay günlüğü ve güç eğrisi dosyasını aynı anda yükleme ve işleme.

İnteraktif Ana Grafik: ECharts tabanlı, yakınlaştırma (zoom) ve kaydırma (pan) özelliklerine sahip, güç, rüzgar hızı ve arıza olaylarını birleştiren dinamik zaman serisi grafiği.

Gelişmiş Log Tablosu: Yüzlerce log kaydını yüksek performansla görüntülemek için react-window ile sanallaştırılmış (virtualized) bir log tablosu.

Kapsamlı Filtreleme: Log verilerini durum, olay türü, kategori gibi çok sayıda kritere göre filtrelemek için modal tabanlı bir arayüz.

Analitik Araçlar ve KPI'lar

Dinamik KPI Paneli: Seçilen tarih aralığına göre anlık olarak hesaplanan temel performans göstergeleri (KPI):

Operasyonel Kullanılabilirlik (Ao %)

Teknik Kullanılabilirlik (At %)

Arızalar Arası Ortalama Süre (MTBF)

Ortalama Tamir Süresi (MTTR)

Güvenilirlik (Reliability R %)

Performans Dağılım Grafiği: Rüzgar hızı ve üretilen güç arasındaki ilişkiyi, referans güç eğrisine karşı görselleştiren bir scatter plot grafiği.

Hata Dağılım Grafiği: Hata kategorilerinin arıza sayısına veya toplam duruş süresine (downtime) göre dağılımını gösteren interaktif bir dairesel grafik.

Haftalık KPI Analizi: Önemli KPI metriklerinin (Ao, At, R) haftalık performansını gösteren ve hedeflere göre karşılaştıran bir bar grafiği.

Kullanıcı Etkileşimi ve Analiz

Analist Yorumları: Analistlerin bulgularını kaydetmeleri için geliştirilmiş yorum bölümü. Yorumlar, ilgili log kayıtlarına, grafik üzerine eklenmiş pinlere ve seçilmiş zaman aralıklarına bağlanabilir.

İnteraktif Grafik İşaretleme: Ana grafik üzerinde önemli noktaları (Pin) veya zaman aralıklarını (Interval) işaretleyerek analizi kolaylaştırma ve bu seçimleri yorumlara ekleyebilme.

Açık ve Koyu Tema: Kullanıcı tercihine göre değiştirilebilen modern bir arayüz teması.

Teknoloji Yığını
Frontend: React 19, TypeScript

Build Aracı: Vite

Durum Yönetimi: Zustand

Grafik: ECharts for React

UI Bileşenleri: Material-UI (Date Picker)

Tarih/Zaman: date-fns

CSV İşleme: Papaparse

Liste Sanallaştırma: React Window

Kurulum ve Çalıştırma
Gerekli Paketleri Yükleyin:

Bash
npm install
Geliştirme Sunucusunu Başlatın:

Bash
npm run dev
Uygulama, Vite'in belirlediği yerel bir port üzerinde (genellikle http://localhost:5173) çalışmaya başlayacaktır.