# Rüzgar Türbini İzleme Paneli Projesi için Copilot Kuralları

## 1. Genel Felsefe ve Mimari

Bu proje, React kullanarak bir rüzgar türbini veri izleme paneli oluşturmayı amaçlamaktadır. Modern, bileşen tabanlı ve sürdürülebilir bir mimari benimsenecektir.

- **Teknoloji Yığını:** React 18+, Vite, TypeScript, Zustand, PapaParse, ECharts for React, date-fns, Material-UI (MUI) for Date Pickers.
- **Bileşen Mimarisi:** Tüm UI elemanları, `src/components` klasörü altında yeniden kullanılabilir, tek bir amaca hizmet eden fonksiyonel bileşenler olarak tasarlanmalıdır. Bileşenler kendi stillerini yönetmelidir (CSS Modules tercih edilir).
- **State (Durum) Yönetimi:** Uygulama geneli paylaşılan durumlar (yüklenen veri, seçilen tarih aralığı, hesaplanan metrikler vb.) için **Zustand** kütüphanesi kullanılacaktır. Bu, prop-drilling'i önler ve durum mantığını merkezileştirir.
- **Veri Akışı:** Tek yönlü veri akışı esastır. Durum değişiklikleri Zustand store'u üzerinden yapılır ve bileşenler bu değişikliklere abone olarak kendilerini günceller.

## 2. Kodlama Standartları ve Kurallar

- **TypeScript Kullanımı:** Tüm projede statik tipleme için TypeScript kullanılacaktır. Veri modelleri için `interface` veya `type` tanımları `src/types` dizininde yapılmalıdır. `any` tipinden kesinlikle kaçınılmalıdır.
- **Fonksiyonel Bileşenler ve Hook'lar:** Sadece fonksiyonel bileşenler ve hook'lar kullanılacaktır. Class bileşenleri yazılmamalıdır.
- **İsimlendirme:** Bileşenler `PascalCase`, hook'lar `useCamelCase`, diğer her şey `camelCase` olmalıdır.
- **Dosya Yapısı:** Proje aşağıdaki gibi organize edilecektir:
/src
|-- /components
|-- /hooks
|-- /pages
|-- /store
|-- /types
|-- /utils

## 3. Projeye Özgü Mantık

- **Veri Yapısı ve Türü:** Yüklenecek CSV dosyası, sabit zaman aralıklı bir zaman serisi değil, bir **olay (event) tabanlı logdur**. Bu nedenle, tüm süre hesaplamaları (`Availability`, `Reliability` vb.) iki sıralı olay arasındaki zaman farklarına dayalı olarak yapılmalıdır. `src/types/index.ts` dosyasında tanımlanacak `TurbineEvent` interface'i `timestamp` (Date), `status` (string), `description` (string), `category` (string), `eventType` (string), `power` (number), `windSpeed` (number) gibi alanları içermelidir.
- **CSV İşleme:** Büyük dosyaları işlemek için `PapaParse` kütüphanesinin `stream` özelliği kullanılacaktır. Bu, tarayıcının donmasını engeller ve performansı artırır.
- **Hesaplamalar:** `Availability`, `Reliability (MTBF, MTTR)` gibi metriklerin hesaplamaları, `src/utils/calculations.ts` içinde, olay tabanlı mantığa göre yazılacaktır.
- **Grafik (Charting):** `ECharts for React` kullanılacaktır. `dataZoom` özelliği, fare tekerleği ile yakınlaştırma ve kaydırma için aktif olarak kullanılacaktır.
- **Tarih/Zaman İşlemleri:** Tüm tarih ve saat işlemleri için `date-fns` kütüphanesi kullanılacaktır.