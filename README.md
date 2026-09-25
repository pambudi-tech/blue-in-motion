# Blue, in motion — studi morph jersey

Sampel lokal dua bentuk jersey untuk diskusi sebelum produksi timeline Chelsea.

## Jalankan

Jalankan `python3 -m http.server 4173` dari folder ini, lalu buka http://localhost:4173.

## Kontrol

- Geser timeline untuk mengubah kerah bulat menjadi kerah V, menyempitkan badan, dan memperpendek lengan.
- Klik Studi A / Studi B atau jersey untuk berpindah bentuk.
- Play menjalankan transisi bolak-balik, 4,5 detik setiap arah.
- Panah kiri/kanan mengubah posisi; Shift memberi langkah lebih kecil.
- Home / End saat slider fokus menuju ujung. Space pada slider menjalankan playback.

## Ruang lingkup dan batas

Tekstur adalah gambar konsep yang dibuat dengan AI, bukan dokumentasi jersey Chelsea dari suatu musim. Crest dan konstruksi belum diverifikasi historis.

Satu tekstur pada satu mesh WebGL: koordinat vertex diinterpolasi dengan slider, bukan crossfade dua gambar. Kerah, lengan, dan badan berubah secara kontinu. Area crest dipertahankan. Ini 2.5D dari depan, bukan model pakaian 3D penuh; lipatan dan pencahayaan masih melekat pada foto. Kerah V yang dihasilkan merupakan deformasi kain foto dan belum setara konstruksi kerah V sungguhan. Dua bentuk ini memvalidasi mekanisme, bukan dua jersey final.

Semua aset lokal, tanpa CDN, paket, analytics, atau koneksi eksternal saat digunakan. Jika WebGL tidak tersedia, foto statis ditampilkan dan kontrol dinonaktifkan.
