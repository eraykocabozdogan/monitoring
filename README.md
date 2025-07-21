# Rüzgar Türbini İzleme Paneli (Wind Turbine Monitoring Dashboard)

Bu proje, rüzgar türbini operasyonel verilerini görselleştirmek ve analiz etmek için geliştirilmiş bir React tabanlı web uygulamasıdır. Kullanıcılar, CSV formatındaki veri setlerini yükleyerek türbinin performansını interaktif bir grafik üzerinde inceleyebilir, kritik metrikleri takip edebilir ve önemli olay günlüklerini görüntüleyebilirler.

## Özellikler

* **CSV Veri Yükleme:** `papaparse` kütüphanesi ile verimli CSV dosyası yükleme ve işleme.
* **İnteraktif Veri Görselleştirme:** `ECharts for React` kullanılarak oluşturulmuş, yakınlaştırma (zoom) ve kaydırma (pan) özelliklerine sahip zaman serisi grafiği.
* **Dinamik KPI Göstergeleri:** Yüklenen ve filtrelenen verilere göre anlık olarak hesaplanan temel performans göstergeleri (KPI):
    * **Kullanılabilirlik (Availability)**
    * **Arızalar Arası Ortalama Süre (MTBF)**
    * **Ortalama Tamir Süresi (MTTR)**
    * **Güvenilirlik (Reliability R(100h))**
* **Kritik Olay Günlükleri:** Veri setindeki "fault", "warning" gibi kritik olayları filtreleyerek tablo formatında gösterme.
* **Tarih Aralığı Filtreleme:** Grafik ve metrik hesaplamaları için belirli bir tarih aralığı seçebilme.
* **Modern ve Reaktif Arayüz:** Vite, React ve TypeScript ile oluşturulmuş, CSS modülleri ile stillendirilmiş bileşen tabanlı bir yapı.
* **Merkezi Durum Yönetimi:** `Zustand` ile uygulama durumunun (state) verimli bir şekilde yönetimi.

## Teknoloji Yığını

* **Frontend:** React 19, TypeScript
* **Build Aracı:** Vite
* **Durum Yönetimi:** Zustand
* **Grafik:** ECharts for React
* **Tarih/Zaman:** date-fns
* **UI Bileşenleri:** Material-UI (Date Picker için)
* **CSV İşleme:** Papaparse

## Kurulum ve Çalıştırma

1.  **Gerekli Paketleri Yükleyin:**
    ```bash
    npm install
    ```

2.  **Geliştirme Sunucusunu Başlatın:**
    ```bash
    npm run dev
    ```
    Uygulama `http://localhost:5173` (veya Vite'in belirlediği başka bir port) üzerinde çalışmaya başlayacaktır.