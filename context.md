Rüzgar Türbini İzleme Paneli - Geliştirme Kuralları ve Standartları (v2.0)
Bu belge, projenin kodlama standartlarını, mimari felsefesini ve en iyi uygulama yöntemlerini tanımlar. Projeye katkıda bulunan tüm geliştiricilerin bu kurallara uyması beklenir.

1. Mimari ve Felsefe
1.1. Teknoloji Yığını

Proje, modern ve performans odaklı bir teknoloji yığını üzerine kurulmuştur:

Frontend Kütüphanesi: React 19

Derleme Aracı: Vite

Dil: TypeScript

Durum Yönetimi (State Management): Zustand

Grafik Kütüphanesi: ECharts for React

CSV İşleme: Papaparse

Tarih/Zaman Yönetimi: date-fns

UI Bileşenleri (Özelleşmiş): Material-UI (sadece Date Picker gibi karmaşık bileşenler için)

1.2. Temel Prensipler

Bileşen Odaklı Mimari: Arayüz, src/components altında bulunan, tek bir sorumluluğu olan, yeniden kullanılabilir ve kendi stilini yöneten fonksiyonel bileşenlerden oluşur.

Merkezi Durum Yönetimi: Uygulama genelinde paylaşılan durumlar (veri, filtreler, kullanıcı seçimleri vb.) Zustand store'unda tutulur. Bu, "prop drilling" sorununu ortadan kaldırır ve durum mantığını öngörülebilir kılar.

Tek Yönlü Veri Akışı: Veri akışı daima yukarıdan aşağıya doğrudur. Durum değişiklikleri, Zustand eylemleri (actions) aracılığıyla tetiklenir ve bileşenler bu değişikliklere tepki vererek güncellenir.

2. Kodlama Standartları
2.1. TypeScript Kullanımı

TypeScript, projenin temel taşıdır ve tip güvenliğini sağlamak için katı kurallarla kullanılmalıdır.

any Tipinden Kaçınma: any tipi kesinlikle yasaktır. Harici kütüphanelerden (örn: ECharts) gelen tipler belirsiz olduğunda, kütüphanenin sağladığı ECElementEvent gibi spesifik tipler import edilmeli veya unknown kullanılarak tip daraltma (type narrowing) yapılmalıdır.

Katı Tipler: Tüm fonksiyon parametreleri, dönüş değerleri ve değişkenler için tipler belirtilmelidir.

Veri Modelleri: Uygulama genelinde kullanılacak veri yapıları (örn: TurbineEvent, PowerCurvePoint) src/types/index.ts dosyasında interface veya type olarak tanımlanmalıdır.

tsconfig.json: Projedeki tsconfig.app.json dosyasında yer alan "strict": true ayarı korunmalıdır.

2.2. React & Bileşenler

Sadece Fonksiyonel Bileşenler: Projede yalnızca fonksiyonel bileşenler ve hook'lar kullanılacaktır. Sınıf (class) tabanlı bileşenler yazılmamalıdır.

Props Tiplemesi: Her bileşenin alacağı props için bir interface veya type tanımlanmalıdır (Örn: interface KpiCardProps { ... }).

Tek Sorumluluk Prensibi: Her bileşen, iyi tanımlanmış tek bir işlevi yerine getirmelidir. Bileşenler çok karmaşık hale geldiğinde, daha küçük ve yönetilebilir alt bileşenlere bölünmelidir.

Mantığın Ayrıştırılması (Custom Hooks): Bileşen içinde karmaşıklaşan veya yeniden kullanılabilir hale gelen mantıklar (veri filtreleme, API çağrıları, olay dinleyicileri vb.) src/hooks klasörü altında özel hook'lara (örn: useFilteredLogData) taşınmalıdır.

Hata Yönetimi (Error Boundaries): Bir bileşende oluşan hatanın tüm uygulamayı çökertmesini engellemek için React Error Boundary mekanizması kullanılmalıdır.

2.3. Styling (CSS Modules)

CSS Modules: Bileşen stilleri, kapsam (scope) sorunlarını önlemek için yalnızca CSS Modülleri (*.module.css) kullanılarak yazılmalıdır.

Global Stiller: Sadece genel tema değişkenleri, font tanımları ve temel sıfırlama (reset) işlemleri için src/index.css gibi global bir CSS dosyası kullanılabilir. Bileşene özgü stiller burada yer almamalıdır.

CSS Değişkenleri: Renkler, gölgeler ve boşluklar gibi tema değerleri için :root içinde CSS değişkenleri (--color-brand, --shadow-main vb.) kullanılmalıdır. Bu, özellikle tema geçişlerini (açık/koyu mod) kolaylaştırır.

2.4. İsimlendirme ve Dosya Yapısı

İsimlendirme:

Bileşenler ve tipler: PascalCase (örn: DataChart, TurbineEvent)

Hook'lar: useCamelCase (örn: useDebounce)

Diğer değişkenler ve fonksiyonlar: camelCase

Dosya Yapısı: Proje, aşağıdaki dizin yapısına sadık kalmalıdır:

/src
|-- /assets         # Resimler, ikonlar, fontlar
|-- /components     # Yeniden kullanılabilir React bileşenleri
|-- /hooks          # Özel (custom) React hook'ları
|-- /store          # Zustand store ve ilgili tipler
|-- /types          # Global TypeScript tipleri ve arayüzleri
|-- /utils          # Yardımcı fonksiyonlar (hesaplamalar, veri işleme vb.)
|-- App.tsx         # Ana uygulama bileşeni ve layout
|-- main.tsx        # Uygulamanın başlangıç noktası
Not: Uygulama büyüyüp farklı sayfalara (view) ihtiyaç duyduğunda bir /pages klasörü eklenebilir.

3. Projeye Özgü Mantık
Veri Modeli: Proje, sabit zaman aralıklı bir seriden ziyade, olay tabanlı (event-based) bir log verisi üzerine kuruludur. Tüm süreye dayalı metrikler (Kullanılabilirlik, MTBF, MTTR), sıralı olayların zaman damgaları arasındaki farklar kullanılarak hesaplanmalıdır.

Veri İşleme: Büyük CSV dosyalarının tarayıcıyı kilitlemeden işlenmesi için PapaParse kütüphanesi kullanılmalıdır. Veri birleştirme ve dönüştürme mantığı src/utils altında tutulmalıdır.

4. Performans ve Optimizasyon
Gereksiz Render'ları Önleme: props alan ve sık güncellenen state'lere bağlı olmayan bileşenler, React.memo ile sarmalanarak gereksiz yeniden render işlemlerinin önüne geçilmelidir.

Fonksiyonların Hafızada Tutulması: Memoize edilmiş (React.memo) alt bileşenlere props olarak geçirilen fonksiyonlar, useCallback hook'u ile sarmalanmalıdır. Bu, fonksiyonların her render'da yeniden oluşturulmasını engeller.

Veri Sanallaştırma (Virtualization): CriticalLogs bileşeninde olduğu gibi uzun listelerin render edilmesi gerektiğinde, performansı korumak için react-window gibi bir sanallaştırma kütüphanesi kullanılmalıdır.