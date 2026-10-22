# FKTEN Live Score · KSU 2026

Live score, jadual & lokasi perlawanan pasukan **FKTEN** di Kejohanan Sukan Universiti (KSU) UniMAP, 20–22 November 2026.

> ⚠️ **Ini prototaip (mock).** Semua data adalah contoh dan disimpan dalam browser (localStorage) sahaja. Belum disambung ke Firebase.

## Cuba demo

1. Buka laman GitHub Pages repo ini.
2. Buka **tab kedua**, pergi ke **Admin**, pilih akaun demo (cth. Syahril – Bola Keranjang).
3. Tekan butang +1 / +2 / +3 atau tukar status — tab pertama akan berubah secara live.
4. "Set semula data demo" di bawah log kemas kini untuk kembali ke data asal.

Masa disimulasikan pada **Sabtu, 21 Nov 10:30** supaya perlawanan yang tamat, sedang berlangsung dan akan datang semuanya kelihatan.

## Ciri dalam mock

- Paparan awam tanpa login, dwibahasa (BM / EN), mesra telefon
- Utama: perlawanan LIVE, seterusnya, keputusan terkini, rekod & pingat FKTEN
- Jadual ikut hari, dengan penapis "FKTEN sahaja"
- Halaman sukan: info, pengurus, lokasi (Google Maps), perlawanan, jadual kedudukan (auto-kira), bracket kalah mati, senarai pasukan
- 3 jenis skor: **skor terus** (bola sepak, ragbi, bola baling, bola keranjang, bola jaring), **set/permainan** (bola tampar, sepak takraw, petanque), **kedudukan/catatan** (olahraga, woodball)
- Dashboard pengurus: butang besar untuk kemas kini skor, set, status, nota, pilih pasukan kalah mati, log audit

## Struktur

```
index.html
css/style.css
js/data.js   – data contoh (fakulti, venue, sukan, pengurus, jana perlawanan)
js/i18n.js   – teks BM / EN
js/app.js    – paparan & logik
```

## Langkah seterusnya (sistem sebenar)

- Firebase Firestore (data realtime melalui `onSnapshot`) menggantikan localStorage
- Firebase Auth – Google Sign-In terhad kepada `@unimap.edu.my`
- Firestore Security Rules – pengurus hanya boleh kemas kini sukan sendiri
- Masukkan jadual/draw rasmi, nama fakulti & venue sebenar
