# Deployment ke Vercel

1. Buat repository GitHub baru bernama `adli-portfolio`.
2. Upload seluruh isi folder ini ke root repository, bukan folder ZIP-nya.
3. Masuk ke Vercel dan impor repository GitHub tersebut.
4. Karena ini website statis, pilih framework preset `Other`.
5. Biarkan Build Command dan Output Directory kosong, atau ikuti konfigurasi proyek jika Vercel meminta nilai.
6. Deploy. Setelah itu setiap push ke branch utama akan memicu deployment baru.

## Pengembangan lokal
Bisa dibuka dengan Live Server di VS Code. Untuk pengujian path absolut (`/css/...`), jalankan dari root folder melalui server lokal, bukan membuka file HTML dengan `file://`.

## Catatan
Website ini tidak memakai backend PHP atau database. PDF di folder publik dapat diakses siapa pun yang mengetahui alamatnya.
