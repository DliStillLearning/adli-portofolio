# Adli Portfolio

Portfolio statis Muhamad Adli Irawan menggunakan HTML, CSS, dan Vanilla JavaScript. Halaman utama memakai satu halaman panjang dengan navigasi anchor dan vertical timeline yang garisnya dibuat lembut agar menyatu dengan latar. Detail setiap project tetap memiliki halaman tersendiri.

## Menjalankan lokal
1. Buka folder ini di VS Code.
2. Jalankan `index.html` dengan Live Server.
3. Website dapat dipublikasikan sebagai situs statis di Vercel.

## Mengubah foto profil
Ganti `assets/images/profile.jpg` dengan foto milikmu. Pertahankan nama file atau sesuaikan `src` pada `index.html`.

## Mengatur kontak
Edit `data/contacts.js`, lalu isi nilai `github`, `email`, dan `linkedin` dengan URL atau alamat email asli. Kontak yang belum diisi tidak akan berpura-pura menjadi tautan aktif.

## Menambah sertifikat
Simpan PDF asli di `assets/documents/certificates/`, lalu edit `data/certificates.js`. Isi `title`, `issuer`, `date`, dan `file` untuk lima sertifikat yang sudah dimiliki. Dua sertifikat berstatus `progress` dan akan ditampilkan sebagai sedang diproses. Klik sertifikat untuk membuka popup preview; PDF ditampilkan di dalam popup bila `file` sudah diisi.

## Menambah screenshot project
Simpan screenshot di `assets/images/projects/` lalu ganti placeholder pada halaman detail project yang sesuai. Jangan menambahkan screenshot atau data yang bukan milik project.

## Deployment Vercel
Import repository GitHub ke Vercel sebagai project statis. Tidak memerlukan build command atau database. Setelah deployment, cek navigasi anchor, halaman detail project, PDF viewer, dan layout pada beberapa lebar layar.
