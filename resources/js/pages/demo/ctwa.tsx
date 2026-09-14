import { Head } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { TrackedCTA } from '@/components/tracking/TrackedCTA';
import { EVENT_TYPES, useAnalytics } from '@/hooks/use-analytics';

// ============================================================================
// Static content — ported 1:1 from the live Full Bright Indonesia CTWA page.
// Pricing, copy and the flash-sale promo are intentionally hardcoded (real
// campaign content), matching how the reference implementation ships it.
// ============================================================================

const waLink = (number: string, message: string) =>
    `https://wa.me/${number}?text=${encodeURIComponent(message)}`;

const FLASH_SALE_MS = 12 * 60 * 60 * 1000;

function flashSaleEndsAt(): number {
    if (typeof window === 'undefined') {
        return Date.now() + FLASH_SALE_MS;
    }

    let start = Number(localStorage.getItem('fb_flash_start') || 0);

    if (!start) {
        start = Date.now();

        try {
            localStorage.setItem('fb_flash_start', String(start));
        } catch {
            // Storage unavailable (private mode) — timer just won't persist.
        }
    }

    return start + FLASH_SALE_MS;
}

function remainingMs(): number {
    return typeof window === 'undefined'
        ? FLASH_SALE_MS
        : Math.max(0, flashSaleEndsAt() - Date.now());
}

function formatCountdown(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const pad = (n: number) => String(n).padStart(2, '0');

    return `${pad(Math.floor(totalSeconds / 3600))}:${pad(Math.floor((totalSeconds % 3600) / 60))}:${pad(totalSeconds % 60)}`;
}

const UNIVERSITY_LOGOS: Array<{ src: string; alt: string }> = [
    { src: '/assets/logos/ui.png', alt: 'Universitas Indonesia' },
    { src: '/assets/logos/itb.png', alt: 'Institut Teknologi Bandung' },
    { src: '/assets/logos/ugm.webp', alt: 'Universitas Gadjah Mada' },
    { src: '/assets/logos/ipb.png', alt: 'IPB University' },
    { src: '/assets/unair.png', alt: 'Universitas Airlangga' },
    {
        src: 'https://www.unpad.ac.id/wp-content/uploads/2025/12/logo-unpad-duo.svg',
        alt: 'Universitas Padjadjaran',
    },
    {
        src: '/assets/logos/its.png',
        alt: 'Institut Teknologi Sepuluh Nopember',
    },
    { src: '/assets/logos/undip.png', alt: 'Universitas Diponegoro' },
    { src: '/assets/logos/nottingham.png', alt: 'University of Nottingham' },
    { src: '/assets/logos/stuttgart.png', alt: 'Universität Stuttgart' },
];

const SCORE_PROOFS: Array<{ src: string; score: string }> = [
    { src: '/assets/toefl1.webp', score: '547' },
    { src: '/assets/toefl2.webp', score: '543' },
    { src: '/assets/toefl3.webp', score: '563' },
    { src: '/assets/toefl4.webp', score: '560' },
    { src: '/assets/toefl5.webp', score: '507' },
    { src: '/assets/toefl6.webp', score: '513' },
    { src: '/assets/toefl7.webp', score: '537' },
    { src: '/assets/toefl9.webp', score: '560' },
];

const REVIEW_NAMES: Array<{ name: string; score: string; avatar: string }> = [
    { name: 'Kak Rani', score: '547', avatar: '/assets/reviews/rani.webp' },
    { name: 'Kak Ayu', score: '543', avatar: '/assets/reviews/ayu.webp' },
    { name: 'Mbak Widya', score: '563', avatar: '/assets/reviews/widya.webp' },
    {
        name: 'Pak Yohanes',
        score: '560',
        avatar: '/assets/reviews/yohanes.webp',
    },
    {
        name: 'Kak Uly Sinaga',
        score: '507',
        avatar: '/assets/reviews/uly.webp',
    },
    {
        name: 'Kak Nadia Ayu',
        score: '513',
        avatar: '/assets/reviews/nadia.webp',
    },
];

const REVIEW_CAROUSEL_COUNT = 19;
const reviewSrc = (index: number) => `/assets/Riview (${index + 1}).webp`;

type ValueCell = 'yes' | 'no';
const VALUE_ROWS: Array<{ label: string; self: ValueCell; kursus: ValueCell }> =
    [
        { label: 'Biaya tetap terjangkau', self: 'yes', kursus: 'no' },
        { label: 'Jadwal bisa kamu atur sendiri', self: 'yes', kursus: 'no' },
        {
            label: 'Materi tersusun urut, tidak bingung',
            self: 'no',
            kursus: 'yes',
        },
        { label: 'Materi khusus pola soal TOEFL', self: 'no', kursus: 'no' },
        {
            label: 'Ada yang bisa ditanya kalau bingung',
            self: 'no',
            kursus: 'yes',
        },
        { label: 'Materi bisa diulang kapan pun', self: 'yes', kursus: 'no' },
        {
            label: 'Skor naik signifikan dalam 15 hari',
            self: 'no',
            kursus: 'no',
        },
    ];

const LMS_FEATURES: Array<{
    step: string;
    label: string;
    value: string;
    title: string;
    desc: string;
    tags: string[];
    img: string;
    imageFirst: boolean;
    badge?: string;
}> = [
    {
        step: '01',
        label: 'Diagnostic Test',
        value: 'Rp 120.000',
        title: 'Tidak Lagi Bingung Harus Mulai dari Mana',
        desc: 'Kerjakan Diagnostic Test lebih dulu untuk mengetahui baseline skor TOEFL ITP kamu. Hasilnya menentukan materi mana yang perlu diprioritaskan.',
        tags: ['Baseline skor per section', 'Materi prioritas otomatis'],
        img: '/lms/lms-1.webp',
        imageFirst: true,
    },
    {
        step: '02',
        label: 'Materi & Roadmap',
        value: 'Rp 300.000',
        title: 'Materi Sudah Urut, Kamu Tinggal Mengikuti',
        desc: 'Materi Structure, Listening, dan Reading tersusun rapi dari Hari 1 sampai Hari 15, jadi kamu tidak perlu menyusun sendiri urutan belajarnya.',
        tags: ['60 video full skills', 'Urut Hari 1–15'],
        img: '/lms/lms-2.webp',
        imageFirst: false,
    },
    {
        step: '03',
        label: 'AI Assistant',
        value: 'Rp 100.000',
        title: 'Kalau Bingung, Ada yang Langsung Menjawab',
        desc: 'Setiap video dilengkapi rangkuman materi dan AI Assistant yang siap menjelaskan ulang topik yang belum kamu pahami, tanpa perlu menunggu jadwal.',
        tags: ['Rangkuman tiap video', 'Tanya AI 24/7'],
        img: '/lms/lms-3.webp',
        imageFirst: true,
    },
    {
        step: '04',
        label: 'Latihan Soal',
        value: 'Rp 150.000',
        title: 'Tahu Persis Bagian yang Belum Kamu Kuasai',
        desc: 'Setiap topik punya latihan soal dengan navigasi antar nomor dan progress tracker, jadi kamu tahu persis bagian mana yang belum dikuasai.',
        tags: ['Latihan per topik', 'Progress tracker'],
        img: '/lms/lms-4.webp',
        imageFirst: false,
    },
    {
        step: '05',
        label: 'Drill Soal',
        value: 'Rp 100.000',
        title: 'Kesalahan yang Sama Tidak Terulang Lagi',
        desc: 'Asah kemampuan spesifik lewat drill per skill — Listening, Structure, dan Reading — dengan paket soal yang bisa diulang sampai benar-benar paham.',
        tags: ['84 paket drill', 'Bisa diulang tanpa batas'],
        img: '/lms/lms-5.webp',
        imageFirst: true,
    },
    {
        step: '06',
        label: 'Simulasi & Ujian',
        value: 'Rp 150.000',
        badge: 'Khusus Dibimbing Tutor',
        title: 'Supaya Nanti Saat Tes TOEFL Asli Tidak Kaget',
        desc: 'Mode Simulasi tanpa timer dengan feedback instan untuk latihan, dan Mode Final dengan timer serta kondisi seperti ujian TOEFL ITP sebenarnya.',
        tags: ['Mode latihan + feedback', 'Mode Final bertimer'],
        img: '/lms/lms-6.webp',
        imageFirst: false,
    },
    {
        step: '07',
        label: 'Dashboard Progress',
        value: 'Rp 85.000',
        title: 'Progresmu Terlihat, Bukan Cuma Terasa Sibuk',
        desc: 'Soal dikerjakan, akurasi, waktu belajar, streak harian, hingga tren skor per section terekam otomatis, jadi progresmu selalu terlihat jelas.',
        tags: ['Akurasi & streak harian', 'Tren skor per section'],
        img: '/lms/lms-7.webp',
        imageFirst: true,
    },
];

const FAQ_CATEGORIES = [
    'Belajar Mandiri (LMS)',
    'Metode & Efektivitas',
    'Dibimbing Tutor',
    'Sertifikat & Legalitas',
    'Pendaftaran & Pembayaran',
    'Jaminan & Garansi',
];

const FAQ_ITEMS: Array<{ category: string; q: string; a: string }> = [
    {
        category: FAQ_CATEGORIES[0],
        q: 'Kalau ambil paket Self-Study LMS, apa saja yang saya dapat?',
        a: 'Kamu dapat akses penuh ke LMS Full Bright: 60+ video materi Full Skills (Listening, Structure, Reading), materi terstruktur hari ke-1 sampai ke-15, 1.000+ nomor latihan soal beserta pembahasan, diagnostic test, simulasi dan post test full skills, serta grup WA diskusi. Semua bisa diakses kapan saja tanpa terikat jadwal kelas.',
    },
    {
        category: FAQ_CATEGORIES[0],
        q: 'Bagaimana cara akses LMS setelah saya bayar?',
        a: 'Setelah pembayaran berhasil, kamu langsung menerima email berisi link dan akun untuk masuk ke platform LMS Full Bright. Akses berlaku 2 tahun dan bisa dibuka dari HP maupun laptop, kapan pun kamu punya waktu.',
    },
    {
        category: FAQ_CATEGORIES[0],
        q: 'Saya belajar sendiri di LMS. Kalau bingung, bisa tanya ke siapa?',
        a: 'Kamu tetap tidak belajar sendirian. Setiap peserta LMS masuk ke grup WA diskusi, jadi kalau ada soal atau materi yang bikin bingung, kamu bisa langsung bertanya dan dibantu. Ini bedanya dengan belajar otodidak dari YouTube — di sana tidak ada yang menjawab kalau kamu stuck.',
    },
    {
        category: FAQ_CATEGORIES[0],
        q: 'Apakah bisa dicoba dulu sebelum bayar?',
        a: 'Bisa. Tersedia free trial LMS dengan akses 1 modul agar kamu bisa merasakan sendiri kualitas video materi dan latihan soalnya sebelum memutuskan. Kalau cocok, tinggal lanjut ambil paketnya.',
    },
    {
        category: FAQ_CATEGORIES[0],
        q: 'Apakah bisa belajar tanpa terikat jadwal karena saya sibuk?',
        a: 'Justru itu kelebihan paket belajar mandiri: tidak ada jam kelas yang harus dikejar. Semua materi tersedia di LMS 24/7 dan bisa diulang berapa kali pun. Banyak alumni kami karyawan, PNS aktif, dan mahasiswa tingkat akhir yang belajar di sela-sela kesibukan.',
    },
    {
        category: FAQ_CATEGORIES[1],
        q: 'Apakah metode ini cocok untuk pemula yang grammar-nya sangat lemah?',
        a: 'Sangat cocok. Materi disusun dari level dasar dan berurutan hari ke-1 sampai ke-15, jadi kamu tidak perlu grammar sempurna untuk memulai. Fokusnya bukan menguasai semua tata bahasa Inggris, tapi mengenali pola soal yang benar-benar keluar di TOEFL ITP.',
    },
    {
        category: FAQ_CATEGORIES[1],
        q: 'Kenapa belajar di sini beda dengan belajar sendiri dari buku dan YouTube?',
        a: 'Dua hal yang paling sering bikin belajar otodidak gagal: materinya tidak terstruktur dan tidak ada yang bisa ditanya kalau salah. Di Full Bright, materi sudah berurutan dan fokus ke pola soal TOEFL, setiap latihan ada pembahasannya, dan ada grup diskusi untuk bertanya.',
    },
    {
        category: FAQ_CATEGORIES[1],
        q: 'Berapa kenaikan skor yang bisa saya harapkan?',
        a: 'Berdasarkan data alumni, peserta yang mengikuti materi secara konsisten dan mengerjakan semua bank soal rata-rata naik 80–100 poin. Yang paling banyak dirasakan alumni adalah jadi paham pola soal TOEFL, dan dari situ skornya ikut naik.',
    },
    {
        category: FAQ_CATEGORIES[1],
        q: 'Apakah dijamin bisa mencapai skor 500?',
        a: 'Kami tidak menjanjikan skor 500 secara mutlak karena hasil tergantung konsistensi masing-masing peserta. Yang bisa kami jamin: metode yang sudah terbukti pada 45.000+ alumni, materi yang fokus dan terstruktur, serta pendampingan selama program.',
    },
    {
        category: FAQ_CATEGORIES[1],
        q: 'Apakah ada batasan usia untuk mengikuti program ini?',
        a: 'Program terbuka untuk usia 17 hingga 45 tahun. Cocok untuk pelajar, mahasiswa, fresh graduate, maupun karyawan yang butuh skor TOEFL untuk studi, karir, atau beasiswa.',
    },
    {
        category: FAQ_CATEGORIES[2],
        q: 'Apa bedanya paket Dibimbing Tutor dengan Self-Study LMS?',
        a: 'Semua materi LMS tetap kamu dapat. Tambahannya khusus di paket Dibimbing Tutor: LIVE ZOOM 15 hari bersama instruktur, rekaman ZOOM, dan sertifikat TOEFL Prediction. Cocok kalau kamu merasa lebih terbantu dengan penjelasan langsung dan tempo belajar yang dipandu.',
    },
    {
        category: FAQ_CATEGORIES[2],
        q: 'Kapan jadwal LIVE ZOOM-nya dan apakah bisa dipilih?',
        a: 'Khusus paket Dibimbing Tutor. Tersedia 5 pilihan sesi harian: • Pagi (09.00 – 10.00 WIB) • Siang (13.00 – 14.00 WIB) • Sore (16.00 – 17.00 WIB) • Malam (19.00 – 20.00 WIB) • Malam (20.15 – 21.15 WIB) Catatan: Jika berhalangan hadir LIVE ZOOM, jangan khawatir — materi bisa diakses di rekaman ZOOM.',
    },
    {
        category: FAQ_CATEGORIES[2],
        q: 'Kalau saya tidak bisa hadir LIVE ZOOM, bagaimana?',
        a: 'Khusus paket Dibimbing Tutor. Setiap sesi direkam dan rekamannya bisa diakses seumur hidup, jadi kamu tetap bisa mengejar materi kalau berhalangan hadir. Kelas hanya 60 menit per hari agar tetap muat di jadwal yang padat.',
    },
    {
        category: FAQ_CATEGORIES[3],
        q: 'Apakah saya dapat sertifikat TOEFL?',
        a: 'Sertifikat TOEFL Prediction diberikan khusus untuk paket Dibimbing Tutor setelah mengikuti post test. Paket Self-Study LMS fokus pada materi dan latihan, tanpa sertifikat.',
    },
    {
        category: FAQ_CATEGORIES[3],
        q: 'Apakah lembaganya resmi dan sertifikatnya valid?',
        a: 'Full Bright Indonesia adalah lembaga resmi dengan legalitas lengkap: SK Kemenkumham RI Nomor AHU-0055720-AH.0114 Tahun 2020, SK Izin Operasional LKP 503/20177/LKP/DPM-PTSP/8/2024, NPSN Nomor K9998700, dan bekerja sama dengan IIEF Jakarta. Sertifikat dapat digunakan untuk daftar kuliah S1/S2/S3, lamar kerja, seleksi CPNS, rekrutmen BUMN, ujian skripsi, kenaikan pangkat, dan pendaftaran beasiswa.',
    },
    {
        category: FAQ_CATEGORIES[4],
        q: 'Bagaimana cara mendaftar dan metode pembayaran apa saja?',
        a: 'Klik tombol daftar, pilih paket yang sesuai, lalu selesaikan pembayaran. Setelah itu kamu langsung menerima email konfirmasi beserta akses LMS dan grup WhatsApp. Pembayaran bisa via transfer bank, GoPay, OVO, DANA, dan QRIS.',
    },
    {
        category: FAQ_CATEGORIES[5],
        q: 'Apakah ada garansi kalau skor saya belum mencapai target?',
        a: 'Garansi mengulang sampai skor target tercapai berlaku khusus untuk Paket Bundling (Dibimbing Tutor). Jika sudah mengikuti program secara penuh dan konsisten tapi skor belum tercapai, kamu bisa claim garansi dan mengulang kelas di batch berikutnya.',
    },
];

const EXIT_REASONS: Array<{
    label: string;
    teaser: string;
    waMessage: string;
}> = [
    {
        label: 'Harganya masih terlalu mahal buatku',
        teaser: 'Ada yang ingin ditanyakan soal harga atau paket?',
        waMessage:
            'Halo Admin Full Bright Indonesia. Saya mau konsultasi soal paket dan harga sebelum daftar.',
    },
    {
        label: 'Belum yakin bisa mencapai target TOEFL-ku',
        teaser: 'Mau tahu apakah program ini cocok untuk target skor kamu?',
        waMessage:
            'Halo Admin Full Bright Indonesia. Saya mau konsultasi soal metode belajar dan hasil yang bisa dicapai sebelum daftar.',
    },
    {
        label: 'Belum yakin program ini cocok untuk kebutuhanku',
        teaser: 'Konsultasikan dulu apakah program ini cocok untukmu.',
        waMessage:
            'Halo Admin Full Bright Indonesia. Saya mau konsultasi apakah program ini cocok dengan kebutuhan saya sebelum daftar.',
    },
    {
        label: 'Masih membandingkan dengan program lain',
        teaser: 'Masih membandingkan? Tanya tim kami tentang programnya.',
        waMessage:
            'Halo Admin Full Bright Indonesia. Saya masih membandingkan dengan program lain, mau tanya-tanya dulu.',
    },
];

const CHECKOUT_URLS = {
    self: 'https://member.fullbrightindonesia.com/paket-gold-e-course-toefl',
    starter:
        'https://member.fullbrightindonesia.com/paket-premium-toefl-level-starter-live-zoom-intensif-flash-sale',
    intermediate:
        'https://member.fullbrightindonesia.com/paket-premium-toefl-level-intermediate-live-zoom-intensif-flash-sale',
};

const SCOPED_STYLE = `
@keyframes fbInfiniteScroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
@keyframes fbSheetUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
@keyframes fbBubbleIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
@keyframes fbHeroBounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(6px); } }
.fb-landing, .fb-landing button, .fb-landing input {
    font-family: 'Nunito', system-ui, sans-serif;
}
.fb-landing section[id], .fb-landing div[id] {
    scroll-margin-top: 120px;
}
.fb-marquee {
    animation: fbInfiniteScroll 32s linear infinite;
}
`;

// ============================================================================
// Small presentational helpers
// ============================================================================

function SectionBadge({ children }: { children: ReactNode }) {
    return (
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#ffb3b3] bg-[#FFF0F0] px-4 py-1.5 text-xs font-bold tracking-wide text-[#D70808] uppercase">
            {children}
        </div>
    );
}

function PrimaryCta({
    href,
    label,
    zone,
}: {
    href: string;
    label: string;
    zone: 'hero' | 'midpage' | 'faq';
}) {
    return (
        <TrackedCTA
            zone={zone}
            action="scroll"
            label={label}
            href={href}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#D70808] px-7 py-3.5 text-base font-bold text-white shadow-[0_4px_20px_rgba(215,8,8,0.35)]"
        >
            {label}
        </TrackedCTA>
    );
}

function SecondaryCta({
    href,
    label,
    zone,
}: {
    href: string;
    label: string;
    zone: 'hero' | 'midpage' | 'faq';
}) {
    return (
        <TrackedCTA
            zone={zone}
            action="scroll"
            label={label}
            href={href}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-[#D70808] px-7 py-3.5 text-base font-bold text-[#151515]"
        >
            {label}
        </TrackedCTA>
    );
}

function TrustBadges() {
    return (
        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-xs font-semibold text-gray-500">
            <span className="flex items-center gap-1">
                ★★★★★ <span className="ml-1">4.9/5 Google Review</span>
            </span>
            <span>•</span>
            <span>45.000+ Alumni Sukses</span>
            <span>•</span>
            <span>🛡 Garansi 100%</span>
        </div>
    );
}

function SectionCloser({
    primaryLabel = 'Gabung Sekarang →',
    secondaryLabel = 'Lihat Bukti Alumni →',
}: {
    primaryLabel?: string;
    secondaryLabel?: string;
}) {
    return (
        <div className="text-center">
            <div className="flex flex-wrap justify-center gap-3">
                <PrimaryCta
                    href="#pricing"
                    label={primaryLabel}
                    zone="midpage"
                />
                <SecondaryCta
                    href="#testimonials"
                    label={secondaryLabel}
                    zone="midpage"
                />
            </div>
            <TrustBadges />
        </div>
    );
}

function WaveDivider({ fill, flip }: { fill: string; flip?: boolean }) {
    return (
        <div className="-mb-px leading-none">
            <svg
                viewBox="0 0 1440 56"
                preserveAspectRatio="none"
                className="block h-14 w-full"
            >
                <path
                    d={
                        flip
                            ? 'M0,28 C240,0 480,56 720,28 C960,0 1200,56 1440,28 L1440,0 L0,0 Z'
                            : 'M0,28 C240,56 480,0 720,28 C960,56 1200,0 1440,28 L1440,56 L0,56 Z'
                    }
                    fill={fill}
                />
            </svg>
        </div>
    );
}

function PlayIcon({ size = 30 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="#fff">
            <path d="M8 5.5v13l11-6.5z" />
        </svg>
    );
}

function VideoPlayOverlay({
    label,
    onPlay,
}: {
    label: string;
    onPlay: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onPlay}
            aria-label={label}
            className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center gap-3.5 border-0 bg-[#151515]/35 transition hover:bg-[#151515]/45"
        >
            <span className="flex h-[76px] w-[76px] items-center justify-center rounded-full bg-[#D70808] shadow-[0_8px_28px_rgba(215,8,8,0.5)]">
                <PlayIcon />
            </span>
            <span className="text-[13px] font-extrabold text-white [text-shadow:0_2px_8px_rgba(0,0,0,0.4)]">
                {label}
            </span>
        </button>
    );
}

function CountdownTimer() {
    const [text, setText] = useState('12:00:00');

    useEffect(() => {
        const tick = () => setText(formatCountdown(remainingMs()));
        tick();
        const id = window.setInterval(tick, 1000);

        return () => window.clearInterval(id);
    }, []);

    return (
        <span className="text-[13px] font-black tracking-wide tabular-nums max-[500px]:text-sm">
            {text}
        </span>
    );
}

type Feature = {
    icon: 'check' | 'cross' | 'globe' | 'label';
    text: string;
    bold?: boolean;
};

function FeatureList({ items }: { items: Feature[] }) {
    return (
        <ul className="m-0 mb-2 flex flex-1 list-none flex-col gap-2 p-0">
            {items.map((item, index) => (
                <li
                    key={index}
                    className={`flex items-start gap-2 text-sm text-[#3d3d3d] ${item.bold ? 'font-extrabold' : 'font-medium'}`}
                >
                    <span
                        className={`mt-px flex-shrink-0 ${
                            item.icon === 'check'
                                ? 'text-[#16a34a]'
                                : item.icon === 'globe'
                                  ? 'text-[#3b82f6]'
                                  : item.icon === 'cross'
                                    ? 'text-[#d1d5db]'
                                    : 'text-[#D70808]'
                        }`}
                    >
                        {item.icon === 'check' && '✓'}
                        {item.icon === 'globe' && '🌐'}
                        {item.icon === 'cross' && '✕'}
                    </span>
                    {item.text}
                </li>
            ))}
        </ul>
    );
}

type PricingCardProps = {
    eyebrow: string;
    title: string;
    subtitle?: string;
    ratingBadge: ReactNode;
    targetScore: string;
    duration: string;
    originalPrice: string;
    discountLabel: string;
    price: string;
    priceNote?: string;
    features: Feature[];
    excluded?: Feature[];
    extras?: ReactNode;
    ctaLabel: string;
    ctaHref: string;
    ctaPackage: string;
    waMessage: string;
    ribbon?: { text: string; bg: string; color: string };
    accent: 'gold' | 'red-outline' | 'green';
    footNote?: string;
    onCheckoutClick: () => void;
    whatsappNumber: string;
};

function PricingCard({
    eyebrow,
    title,
    subtitle,
    ratingBadge,
    targetScore,
    duration,
    originalPrice,
    discountLabel,
    price,
    priceNote,
    features,
    excluded,
    extras,
    ctaLabel,
    ctaHref,
    ctaPackage,
    waMessage,
    ribbon,
    accent,
    footNote,
    onCheckoutClick,
    whatsappNumber,
}: PricingCardProps) {
    const borderClass =
        accent === 'gold'
            ? 'border-2 border-[#F5B700] shadow-[0_8px_32px_rgba(245,183,0,0.15)] bg-gradient-to-br from-white to-[#fffbf0]'
            : accent === 'green'
              ? 'border-2 border-[#16a34a] shadow-[0_16px_56px_rgba(22,163,74,0.2),0_0_0_1px_rgba(22,163,74,0.08)] bg-gradient-to-br from-white to-[#f0fdf4]'
              : 'border-2 border-gray-200 shadow-[0_4px_24px_rgba(0,0,0,0.06)]';

    const ctaButtonClass =
        accent === 'green'
            ? 'bg-[#16a34a] shadow-[0_6px_24px_rgba(22,163,74,0.4)]'
            : 'bg-[#D70808] shadow-[0_6px_24px_rgba(215,8,8,0.4)]';

    return (
        <div
            className={`relative flex flex-col overflow-hidden rounded-3xl p-7 ${borderClass}`}
        >
            {ribbon && (
                <div
                    className="absolute top-0 right-0 rounded-bl-2xl px-4 py-2 text-xs font-black"
                    style={{ background: ribbon.bg, color: ribbon.color }}
                >
                    {ribbon.text}
                </div>
            )}
            <div
                className={`mb-1 flex items-start justify-between ${ribbon ? 'mt-5' : ''}`}
            >
                <div>
                    <p className="m-0 mb-1 text-xs font-bold tracking-wide text-gray-400 uppercase">
                        {eyebrow}
                    </p>
                    <h3 className="m-0 text-2xl font-black text-[#151515]">
                        {title}
                    </h3>
                    {subtitle && (
                        <p className="m-0 mt-0.5 text-xs font-semibold text-[#D70808]">
                            {subtitle}
                        </p>
                    )}
                </div>
                {ratingBadge}
            </div>
            <p className="m-0 mb-4 text-[15px] font-bold text-gray-600">
                Target Skor:{' '}
                <span className="text-xl font-black text-[#16a34a]">
                    {targetScore}
                </span>{' '}
                · <span className="font-black text-[#151515]">{duration}</span>
            </p>
            <div className="mb-5 rounded-2xl border-[1.5px] border-[#ffb3b3] bg-[#FFF0F0] p-4">
                <div className="mb-1 flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-600 line-through">
                        {originalPrice}
                    </span>
                    <span className="rounded-full bg-[#D70808] px-2 py-0.5 text-xs font-black text-white">
                        {discountLabel}
                    </span>
                </div>
                <p className="m-0 text-3xl font-black text-[#D70808]">
                    {price}
                </p>
                {priceNote && (
                    <p className="m-0 mt-1 text-xs font-semibold text-[#D70808]">
                        {priceNote}
                    </p>
                )}
            </div>
            <FeatureList items={features} />
            {excluded && excluded.length > 0 && (
                <>
                    <p className="m-0 mt-3 mb-2 text-xs font-bold tracking-wide text-gray-400 uppercase">
                        Belum termasuk:
                    </p>
                    <FeatureList items={excluded} />
                </>
            )}
            {extras}
            <div className="mt-1 flex flex-col gap-1.5">
                <TrackedCTA
                    zone="pricing"
                    action="external_checkout"
                    label={ctaLabel}
                    href={ctaHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={onCheckoutClick}
                    className={`box-border flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 text-base font-black text-white ${ctaButtonClass}`}
                >
                    {ctaLabel}
                </TrackedCTA>
                <p className="m-0 flex items-center justify-center gap-1 text-center text-xs text-gray-400">
                    🔒 Pembayaran aman &amp; terenkripsi
                </p>
            </div>
            {footNote && (
                <p className="m-0 mt-1.5 text-center text-xs font-semibold text-[#D70808]">
                    {footNote}
                </p>
            )}
            <div className="my-3 flex items-center gap-3">
                <div className="h-px flex-1 bg-gray-200" />
                <span className="text-xs font-semibold text-gray-400">
                    atau
                </span>
                <div className="h-px flex-1 bg-gray-200" />
            </div>
            <TrackedCTA
                zone="pricing"
                action="whatsapp"
                label={`WhatsApp ${ctaPackage}`}
                href={waLink(whatsappNumber, waMessage)}
                target="_blank"
                rel="noopener noreferrer"
                className="box-border flex w-full items-center justify-center gap-2 rounded-2xl border-[1.5px] border-[#25D366] px-5 py-3 text-sm font-bold text-[#16a34a]"
            >
                <img
                    src="/assets/admin-avatar.jpg"
                    alt="Admin Full Bright"
                    width={26}
                    height={26}
                    loading="lazy"
                    className="h-[26px] w-[26px] flex-shrink-0 rounded-full border-2 border-[#25D366] object-cover"
                />
                💬 Tanya via WhatsApp
            </TrackedCTA>
            <div className="mt-3.5 flex flex-wrap items-center justify-center gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-full bg-[#FEF3C7] px-2.5 py-1 text-xs font-semibold text-[#B45309]">
                    ★ 4.9/5
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#F0FDF4] px-2.5 py-1 text-xs font-semibold text-[#15803d]">
                    45.000+
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#EFF6FF] px-2.5 py-1 text-xs font-semibold text-[#1d4ed8]">
                    🛡 Garansi 100%
                </span>
            </div>
        </div>
    );
}

function ReviewCarousel({ onOpen }: { onOpen: (index: number) => void }) {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const id = window.setInterval(
            () => setIndex((i) => (i + 1) % REVIEW_CAROUSEL_COUNT),
            3000,
        );

        return () => window.clearInterval(id);
    }, []);

    const prevIndex =
        (index - 1 + REVIEW_CAROUSEL_COUNT) % REVIEW_CAROUSEL_COUNT;
    const nextIndex = (index + 1) % REVIEW_CAROUSEL_COUNT;

    return (
        <div className="mt-12">
            <div className="mb-6 flex items-center justify-center gap-2">
                <svg width="20" height="20" viewBox="0 0 48 48">
                    <path
                        fill="#FFC107"
                        d="M43.6 20.5H42V20.4H24v7.2h11.3C33.7 32 29.3 35 24 35c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.1-5.1C33.9 6.1 29.2 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"
                    />
                    <path
                        fill="#FF3D00"
                        d="M6.3 14.7l5.8 4.3C13.9 15.4 18.6 12 24 12c3.1 0 5.9 1.2 8 3.1l5.1-5.1C33.9 6.1 29.2 4 24 4 16.4 4 9.8 8.5 6.3 14.7z"
                    />
                    <path
                        fill="#4CAF50"
                        d="M24 44c5.2 0 9.9-2 13.4-5.3l-6.2-5.2C29.2 35.2 26.7 36 24 36c-5.3 0-9.6-3.4-11.3-8l-6 4.6C9.6 39.5 16.2 44 24 44z"
                    />
                    <path
                        fill="#1976D2"
                        d="M43.6 20.5H42V20.4H24v7.2h11.3c-1 3-3.1 5.5-5.9 7.1l6.2 5.2C39.4 37 44 31 44 24c0-1.3-.1-2.7-.4-3.5z"
                    />
                </svg>
                <span className="text-sm font-extrabold text-[#151515]">
                    4.9
                </span>
                <span className="text-base text-[#FBBF24]">★★★★★</span>
                <span className="text-sm text-gray-500">
                    <b>3.620</b> Google Reviews
                </span>
            </div>
            <div className="relative flex h-[220px] items-center justify-center overflow-hidden">
                <button
                    onClick={() => setIndex(prevIndex)}
                    aria-label="Sebelumnya"
                    className="absolute left-0 z-[3] flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-gray-200 bg-white text-base text-[#151515] shadow-[0_4px_12px_rgba(0,0,0,0.12)]"
                >
                    ‹
                </button>
                <div
                    className="absolute z-[1] h-[210px] w-[160px] cursor-pointer overflow-hidden rounded-2xl bg-cover bg-center opacity-50 shadow-[0_8px_28px_rgba(0,0,0,0.18)] transition-all duration-500"
                    style={{
                        left: 'calc(50% - 260px)',
                        backgroundImage: `url('${reviewSrc(prevIndex)}')`,
                    }}
                    onClick={() => setIndex(prevIndex)}
                />
                <img
                    src={reviewSrc(index)}
                    alt="Bukti skor TOEFL alumni Full Bright"
                    loading="lazy"
                    onClick={() => onOpen(index)}
                    className="absolute left-1/2 z-[2] h-[210px] w-auto max-w-[340px] -translate-x-1/2 cursor-pointer rounded-2xl object-contain shadow-[0_8px_28px_rgba(0,0,0,0.18)] transition-all duration-300"
                />
                <div
                    className="absolute z-[1] h-[210px] w-[160px] cursor-pointer overflow-hidden rounded-2xl bg-cover bg-center opacity-50 shadow-[0_8px_28px_rgba(0,0,0,0.18)] transition-all duration-500"
                    style={{
                        left: 'calc(50% + 100px)',
                        backgroundImage: `url('${reviewSrc(nextIndex)}')`,
                    }}
                    onClick={() => setIndex(nextIndex)}
                />
                <button
                    onClick={() => setIndex(nextIndex)}
                    aria-label="Selanjutnya"
                    className="absolute right-0 z-[3] flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-gray-200 bg-white text-base text-[#151515] shadow-[0_4px_12px_rgba(0,0,0,0.12)]"
                >
                    ›
                </button>
            </div>
        </div>
    );
}

function Lightbox({
    src,
    caption,
    counter,
    onClose,
    onPrev,
    onNext,
}: {
    src: string;
    caption?: string;
    counter: string;
    onClose: () => void;
    onPrev: () => void;
    onNext: () => void;
}) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/92"
            onClick={onClose}
        >
            <button
                onClick={onClose}
                className="absolute top-4 right-4 border-none bg-transparent text-3xl text-white/70"
            >
                ✕
            </button>
            <button
                onClick={onPrev}
                className="absolute left-4 border-none bg-transparent p-2 text-4xl text-white/70"
            >
                ‹
            </button>
            <div
                className="flex flex-col items-center gap-4 px-16"
                onClick={(e) => e.stopPropagation()}
            >
                <img
                    src={src}
                    alt={caption ?? 'Bukti skor TOEFL'}
                    className="max-h-[80vh] max-w-[80vw] rounded-2xl object-contain shadow-[0_24px_80px_rgba(0,0,0,0.6)]"
                />
                {caption && (
                    <p className="m-0 text-sm text-white/60">{caption}</p>
                )}
                <p className="m-0 text-xs text-white/40">{counter}</p>
            </div>
            <button
                onClick={onNext}
                className="absolute right-4 border-none bg-transparent p-2 text-4xl text-white/70"
            >
                ›
            </button>
        </div>
    );
}

// ============================================================================
// Page
// ============================================================================

type Props = {
    whatsappUrl: string;
    whatsappNumber: string;
    externalCheckoutUrl?: string;
};

export default function CtwaDemo({ whatsappNumber }: Props) {
    const { track } = useAnalytics();

    const [mode, setMode] = useState<'self' | 'tutor'>(() => {
        if (typeof window === 'undefined') {
            return 'self';
        }

        try {
            return new URLSearchParams(window.location.search).get('mode') ===
                'tutor'
                ? 'tutor'
                : 'self';
        } catch {
            return 'self';
        }
    });
    const [headerScrolled, setHeaderScrolled] = useState(false);
    const [bannerVisible, setBannerVisible] = useState(true);
    const [bannerHeight, setBannerHeight] = useState(38);
    const bannerRef = useRef<HTMLDivElement>(null);

    const [scoreIndex, setScoreIndex] = useState<number | null>(null);
    const [reviewIndex, setReviewIndex] = useState<number | null>(null);

    const [faqCategory, setFaqCategory] = useState<number | null>(null);
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    const [surveyAnswer, setSurveyAnswer] = useState<number | null>(null);

    const [returnPopupOpen, setReturnPopupOpen] = useState(false);
    const [exitReason, setExitReason] = useState<number | null>(null);

    const [bubbleVisible, setBubbleVisible] = useState(false);

    const [lmsVideoIdle, setLmsVideoIdle] = useState(true);
    const [testimoniVideoIdle, setTestimoniVideoIdle] = useState(true);
    const lmsVideoRef = useRef<HTMLVideoElement>(null);
    const testimoniVideoRef = useRef<HTMLVideoElement>(null);

    // Sticky header shadow on scroll.
    useEffect(() => {
        const onScroll = () => setHeaderScrolled(window.scrollY > 12);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });

        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // Flash-sale countdown visibility (banner disappears once it expires).
    useEffect(() => {
        const tick = () => setBannerVisible(remainingMs() > 0);
        tick();
        const id = window.setInterval(tick, 1000);

        return () => window.clearInterval(id);
    }, []);

    // Spacer height so fixed banner + header never overlap content.
    useEffect(() => {
        const measure = () =>
            setBannerHeight(
                bannerRef.current
                    ? Math.round(
                          bannerRef.current.getBoundingClientRect().height,
                      )
                    : 0,
            );
        measure();
        window.addEventListener('resize', measure);

        return () => window.removeEventListener('resize', measure);
    }, [bannerVisible]);

    // WhatsApp teaser bubble — after 7s idle or 25% scroll, once per session.
    useEffect(() => {
        let dismissed = false;

        try {
            dismissed = sessionStorage.getItem('fb_wa_bubble_v2') === '1';
        } catch {
            // Ignore.
        }

        if (dismissed) {
            return;
        }

        const show = () => setBubbleVisible(true);
        const timeout = window.setTimeout(show, 7000);
        const onScroll = () => {
            const scrolled =
                (window.scrollY + window.innerHeight) /
                Math.max(document.documentElement.scrollHeight, 1);

            if (scrolled > 0.25) {
                show();
                window.removeEventListener('scroll', onScroll);
            }
        };
        window.addEventListener('scroll', onScroll, { passive: true });

        return () => {
            window.clearTimeout(timeout);
            window.removeEventListener('scroll', onScroll);
        };
    }, []);

    // Return-visit popup — shown once if the visitor left for checkout and came back within 24h.
    useEffect(() => {
        const onVisible = () => {
            if (document.visibilityState !== 'visible') {
                return;
            }

            try {
                const clickedAt = Number(
                    localStorage.getItem('fb_checkout_clicked_at') || 0,
                );
                const alreadyShown = localStorage.getItem(
                    'fb_return_popup_shown',
                );

                if (
                    clickedAt &&
                    !alreadyShown &&
                    Date.now() - clickedAt < 86400000
                ) {
                    setReturnPopupOpen(true);
                    localStorage.setItem('fb_return_popup_shown', '1');
                }
            } catch {
                // Ignore.
            }
        };
        document.addEventListener('visibilitychange', onVisible);

        return () =>
            document.removeEventListener('visibilitychange', onVisible);
    }, []);

    const markCheckoutClicked = useCallback(() => {
        try {
            localStorage.setItem('fb_checkout_clicked_at', String(Date.now()));
            localStorage.removeItem('fb_return_popup_shown');
        } catch {
            // Ignore.
        }
    }, []);

    const closeBubble = useCallback(() => {
        setBubbleVisible(false);

        try {
            sessionStorage.setItem('fb_wa_bubble_v2', '1');
        } catch {
            // Ignore.
        }
    }, []);

    const answerSurvey = (index: number, label: string) => {
        setSurveyAnswer(index);
        track(EVENT_TYPES.intent, {
            zone: 'midpage',
            action: 'link',
            cta_label: `survey:${label}`,
        });
    };

    // Keyboard navigation for whichever lightbox / popup is open.
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (reviewIndex !== null) {
                if (e.key === 'Escape') {
                    setReviewIndex(null);
                } else if (e.key === 'ArrowLeft') {
                    setReviewIndex(
                        (i) =>
                            ((i ?? 0) - 1 + REVIEW_CAROUSEL_COUNT) %
                            REVIEW_CAROUSEL_COUNT,
                    );
                } else if (e.key === 'ArrowRight') {
                    setReviewIndex(
                        (i) => ((i ?? 0) + 1) % REVIEW_CAROUSEL_COUNT,
                    );
                }
            } else if (scoreIndex !== null) {
                if (e.key === 'Escape') {
                    setScoreIndex(null);
                } else if (e.key === 'ArrowLeft') {
                    setScoreIndex(
                        (i) =>
                            ((i ?? 0) - 1 + SCORE_PROOFS.length) %
                            SCORE_PROOFS.length,
                    );
                } else if (e.key === 'ArrowRight') {
                    setScoreIndex((i) => ((i ?? 0) + 1) % SCORE_PROOFS.length);
                }
            } else if (returnPopupOpen && e.key === 'Escape') {
                setReturnPopupOpen(false);
            }
        };
        window.addEventListener('keydown', onKey);

        return () => window.removeEventListener('keydown', onKey);
    }, [reviewIndex, scoreIndex, returnPopupOpen]);

    return (
        <div className="fb-landing bg-white font-sans">
            <Head title="Raih TOEFL 500+ Cukup 15 Hari. (LMS + Tutor AI)">
                <meta
                    name="description"
                    content="Persiapkan TOEFL 500+ dalam 15 hari dengan metode belajar terstruktur dari Full Bright Indonesia. Sudah membantu 45.000+ alumni meraih beasiswa & CPNS. Mulai dari Rp99rb."
                />
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link
                    rel="preconnect"
                    href="https://fonts.gstatic.com"
                    crossOrigin="anonymous"
                />
                <link
                    href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&display=swap"
                    rel="stylesheet"
                />
            </Head>
            <style>{SCOPED_STYLE}</style>

            {/* Sticky urgency banner + header */}
            <div className="fixed inset-x-0 top-0 z-50">
                {bannerVisible && (
                    <div ref={bannerRef} id="urgency-banner">
                        <TrackedCTA
                            zone="sticky"
                            action="scroll"
                            label="Urgency banner"
                            href="#pricing"
                            className="flex flex-nowrap items-center justify-center gap-2 overflow-hidden bg-[#C10707] px-3 py-2 text-center no-underline max-[500px]:py-2.5"
                        >
                            <span className="text-[13px] font-extrabold tracking-wide text-white uppercase max-[500px]:hidden">
                                🔥 FLASH SALE SEPTEMBER · DISKON 60%
                            </span>
                            <span className="hidden text-xs font-extrabold tracking-wide text-white uppercase max-[500px]:inline">
                                🔥 FLASH SALE SEPTEMBER · 60%
                            </span>
                            <span className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-full bg-white px-2.5 py-0.5 text-[#C10707]">
                                <span className="text-[11px] font-extrabold tracking-wide uppercase max-[500px]:hidden">
                                    ⏱ Berakhir
                                </span>
                                <CountdownTimer />
                            </span>
                        </TrackedCTA>
                    </div>
                )}
                <header
                    className={`border-b border-gray-100 transition-all ${
                        headerScrolled
                            ? 'bg-white/95 shadow-[0_4px_12px_rgba(0,0,0,0.08)] backdrop-blur-sm'
                            : 'bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
                    }`}
                >
                    <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
                        <a href="#" className="flex items-center no-underline">
                            <img
                                src="/logo/Logo-Fullbright.webp"
                                alt="Full Bright Indonesia"
                                className="h-auto w-40 object-contain"
                            />
                        </a>
                        <TrackedCTA
                            zone="nav"
                            action="scroll"
                            label="Amankan Seat"
                            href="#pricing"
                            className="flex flex-col justify-center gap-px rounded-full bg-[#D70808] px-4 py-1.5 no-underline shadow-[0_6px_16px_rgba(215,8,8,0.35)]"
                        >
                            <span className="text-[13px] leading-tight font-extrabold whitespace-nowrap text-white">
                                🎓 Amankan Seat
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="text-[11px] whitespace-nowrap text-white/90 line-through">
                                    Rp250rb
                                </span>
                                <span className="text-sm font-black whitespace-nowrap text-white">
                                    Rp99rb
                                </span>
                                <span className="rounded-full bg-[#F59E0B] px-1.5 py-0.5 text-[10px] font-black whitespace-nowrap text-[#151515]">
                                    -60%
                                </span>
                            </span>
                        </TrackedCTA>
                    </div>
                </header>
            </div>
            <div style={{ height: bannerHeight + 64 }} />

            {/* Hero */}
            <section
                id="hero"
                className="relative overflow-hidden bg-[linear-gradient(160deg,#fff_55%,#FFF5F5_100%)]"
            >
                <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-[#D70808] opacity-[0.07] blur-[120px]" />
                <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-[#151515] opacity-5 blur-[100px]" />
                <div className="relative mx-auto max-w-6xl px-6 pt-10 pb-4 max-[500px]:pt-6 max-[500px]:pb-2">
                    <div className="grid grid-cols-[1.05fr_0.95fr] items-center gap-10 max-[899px]:relative max-[899px]:grid-cols-1 max-[899px]:gap-3">
                        <div className="relative z-[1] col-start-1 flex flex-col gap-4">
                            <div className="inline-flex w-fit items-center gap-2 rounded-full border-[1.5px] border-[#151515] px-4 py-1.5 text-xs font-bold tracking-wide text-gray-700">
                                <span className="flex gap-0.5 text-[#F59E0B]">
                                    ★★★★★
                                </span>
                                <span className="tracking-widest uppercase">
                                    45.000+ ALUMNI
                                </span>
                                <div className="ml-2 flex">
                                    {['People 1', 'People 2', 'People 3'].map(
                                        (p) => (
                                            <img
                                                key={p}
                                                src={`/assets/${p}.webp`}
                                                alt="alumni"
                                                width={80}
                                                height={80}
                                                className="-ml-2 h-5 w-5 rounded-full border-2 border-white object-cover"
                                            />
                                        ),
                                    )}
                                </div>
                            </div>
                            <h1 className="m-0 text-[clamp(30px,4vw,44px)] leading-[1.15] font-black text-[#151515] max-[500px]:text-[clamp(24px,7vw,30px)]">
                                Serius Soal Beasiswa &amp; CPNS?
                                <br />
                                Capai{' '}
                                <span className="[background-image:linear-gradient(rgb(245,183,0),rgb(245,183,0))] bg-[length:100%_12px] bg-[position:0_100%] bg-no-repeat px-0.5">
                                    TOEFL 500+ dalam 15 Hari Saja
                                </span>
                            </h1>
                            <p className="m-0 text-base leading-relaxed text-[#3d3d3d] max-[500px]:text-[clamp(12px,3.4vw,14px)]">
                                <b>Persiapkan dari</b>
                                <strong className="text-[#151515]">
                                    &nbsp;sekarang
                                </strong>
                                &nbsp;dengan strategi{' '}
                                <strong className="text-[#151515]">
                                    belajar 1 jam sehari
                                </strong>{' '}
                                yang telah membantu{' '}
                                <strong className="text-[#151515]">
                                    45.000+ alumni
                                </strong>{' '}
                                meraih <b>beasiswa impian</b> mereka.
                            </p>
                            <div className="flex flex-wrap gap-2 max-[500px]:hidden">
                                <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700">
                                    ✓ Lembaga Resmi ITP &amp; IIEF
                                </span>
                                <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700">
                                    ✓ 13+ Tahun Pengalaman
                                </span>
                            </div>
                            <div className="flex flex-col gap-3">
                                <div className="flex flex-wrap gap-3 max-[500px]:flex-col">
                                    <TrackedCTA
                                        zone="hero"
                                        action="scroll"
                                        label="Mulai Persiapan TOEFL"
                                        href="#pricing"
                                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#D70808] px-7 py-3.5 text-base font-bold text-white no-underline shadow-[0_4px_20px_rgba(215,8,8,0.35)] max-[500px]:box-border max-[500px]:w-full"
                                    >
                                        Mulai Persiapan TOEFL →
                                    </TrackedCTA>
                                    <TrackedCTA
                                        zone="hero"
                                        action="scroll"
                                        label="Lihat Bukti Alumni"
                                        href="#testimonials"
                                        className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-[#D70808] px-7 py-3.5 text-base font-bold text-[#151515] no-underline max-[500px]:box-border max-[500px]:w-full"
                                    >
                                        Lihat Bukti Alumni →
                                    </TrackedCTA>
                                </div>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                                    <span className="flex items-center gap-1 text-xs font-semibold text-gray-500">
                                        ★★★★★{' '}
                                        <span className="ml-1">
                                            4.9/5 Google Review
                                        </span>
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        •
                                    </span>
                                    <span className="text-xs font-semibold text-gray-500">
                                        45.000+ Alumni Sukses
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        •
                                    </span>
                                    <span className="text-xs font-semibold text-gray-500">
                                        🛡 Garansi 100%
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="col-start-2 flex items-end justify-center max-[899px]:col-start-1 max-[899px]:-mt-1">
                            <div className="relative flex w-full max-w-[560px] items-end justify-center self-stretch max-[899px]:max-w-[250px] max-[899px]:self-auto">
                                <img
                                    src="/assets/hero-consultant.png"
                                    alt="Konsultan Full Bright Indonesia siap membantu persiapan TOEFL kamu"
                                    width={820}
                                    height={1000}
                                    fetchPriority="high"
                                    className="block h-auto max-h-[min(72vh,660px)] w-full [mask-image:linear-gradient(to_bottom,#000_0%,#000_78%,rgba(0,0,0,0.5)_92%,transparent_100%)] object-contain object-bottom [filter:drop-shadow(0_18px_40px_rgba(0,0,0,0.16))] max-[899px]:max-h-[min(28vh,215px)]"
                                />
                                <div className="hidden min-[900px]:contents">
                                    <div className="absolute bottom-[18px] left-0 flex max-w-[216px] items-center gap-2.5 rounded-2xl bg-white p-3 shadow-[0_8px_32px_rgba(0,0,0,0.14)]">
                                        <span className="text-[22px]">🎓</span>
                                        <p className="m-0 text-xs leading-[1.35] font-black text-[#151515]">
                                            Alumni kami tersebar di seluruh
                                            dunia
                                        </p>
                                    </div>
                                    <div className="absolute top-3 right-0 flex items-center gap-1.5 rounded-2xl bg-white px-3 py-2 shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
                                        <span className="text-[#F59E0B]">
                                            ★★★★★
                                        </span>
                                        <span className="ml-1 text-xs font-black text-[#151515]">
                                            4.9
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="relative flex justify-center pb-1 max-[899px]:-mt-[78px] max-[899px]:pb-2.5">
                    <div className="flex h-[52px] w-[52px] [animation:fbHeroBounce_2s_ease-in-out_infinite] items-center justify-center rounded-full border border-gray-200 bg-gray-100 text-gray-700">
                        <svg
                            width="22"
                            height="22"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={3}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M12 4v14M5 12l7 7 7-7" />
                        </svg>
                    </div>
                </div>
                <WaveDivider fill="#F3F3F3" />
            </section>

            {/* Partner university logo marquee */}
            <div className="overflow-hidden bg-[#F3F3F3] py-8">
                <p className="m-0 mb-4.5 text-center text-xs font-bold tracking-wide text-gray-600 uppercase">
                    Alumni Kami Sekarang Kuliah Di
                </p>
                <div className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]">
                    <div className="fb-marquee flex w-max">
                        {[...UNIVERSITY_LOGOS, ...UNIVERSITY_LOGOS].map(
                            (logo, i) => (
                                <img
                                    key={i}
                                    src={logo.src}
                                    alt={logo.alt}
                                    loading="lazy"
                                    width={110}
                                    height={64}
                                    className="mx-5 h-16 w-[110px] flex-shrink-0 object-contain"
                                />
                            ),
                        )}
                    </div>
                </div>
            </div>

            {/* Agitation */}
            <section id="agitation" className="bg-[#F3F3F3] px-6 py-14">
                <div className="mx-auto max-w-2xl">
                    <div className="mb-6 text-center">
                        <div className="inline-block rounded-full bg-white px-6 py-2.5 text-[13px] font-extrabold tracking-wide text-[#D70808] uppercase shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
                            Kamu Sudah Mencoba
                        </div>
                    </div>
                    <h2 className="m-0 mb-5 text-center text-[clamp(28px,3.6vw,42px)] leading-tight font-black text-[#151515]">
                        Sudah Banyak Belajar,
                        <br />
                        <span className="text-[#D70808]">
                            Tapi Kenapa Skor Masih Stuck?
                        </span>
                    </h2>
                    <p className="m-0 mb-9 text-center text-base leading-relaxed text-gray-500">
                        Bukan karena kamu kurang berusaha. Hanya saja,{' '}
                        <b>usahamu belum memberikan hasil yang diharapkan.</b>
                    </p>
                    <div className="mb-8 overflow-hidden rounded-[20px] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.07)]">
                        <div className="grid grid-cols-2 bg-[#F9F9F9] max-[559px]:hidden">
                            <div className="p-4.5 text-sm font-black text-[#151515]">
                                Yang sudah kamu lakukan
                            </div>
                            <div className="border-l border-[#ececec] p-4.5 text-sm font-black text-[#D70808]">
                                Yang kamu alami
                            </div>
                        </div>
                        <div className="hidden border-b border-[#ececec] bg-[#F9F9F9] p-4 text-sm font-black text-[#151515] max-[559px]:block">
                            Yang sudah kamu lakukan{' '}
                            <span className="text-[#D70808]">
                                → yang kamu alami
                            </span>
                        </div>
                        {[
                            [
                                '01',
                                'Sudah download banyak PDF materi',
                                'Tapi bingung mulai dari mana',
                            ],
                            [
                                '02',
                                'Sudah nonton banyak video TOEFL',
                                'Tapi besoknya lupa lagi materinya',
                            ],
                            [
                                '03',
                                'Sudah mengerjakan banyak latihan soal',
                                'Tapi kesalahan yang sama terus terulang',
                            ],
                            [
                                '04',
                                'Sudah ikut kursus bahasa Inggris',
                                'Tapi materinya terlalu umum, bukan pola TOEFL',
                            ],
                            [
                                '05',
                                'Sudah di kursus, berusaha ikutin semua jadwal kelas',
                                'Tapi sekali jadwal bentrok, materi jadi tertinggal',
                            ],
                        ].map(([num, before, after], i, arr) => (
                            <div
                                key={num}
                                className={`grid grid-cols-2 items-stretch max-[559px]:grid-cols-1 ${i < arr.length - 1 ? 'border-b border-[#f2f2f2]' : ''}`}
                            >
                                <div className="flex items-start gap-3 p-4.5 max-[559px]:px-4 max-[559px]:pt-4 max-[559px]:pb-2.5">
                                    <span className="flex-shrink-0 pt-0.5 text-xs font-black text-gray-500">
                                        {num}
                                    </span>
                                    <p className="m-0 text-[15px] leading-snug font-semibold text-[#151515]">
                                        {before}
                                    </p>
                                </div>
                                <div className="flex items-start gap-2.5 border-l border-[#f2f2f2] bg-[#FFFAFA] p-4.5 max-[559px]:border-l-0 max-[559px]:bg-transparent max-[559px]:py-0 max-[559px]:pr-4 max-[559px]:pb-4 max-[559px]:pl-11">
                                    <p className="m-0 text-[15px] leading-snug font-bold text-[#D70808]">
                                        {after}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mb-8 rounded-[20px] bg-white px-6 py-7 shadow-[0_4px_24px_rgba(0,0,0,0.07)]">
                        <div className="mx-auto max-w-[520px]">
                            <p className="m-0 mb-5 text-center text-xs font-black tracking-widest text-[#D70808] uppercase">
                                Kalau kamu belajar sendiri
                            </p>
                            <div className="flex items-end justify-center gap-[clamp(20px,6vw,48px)] border-b-2 border-[#151515] pb-3.5">
                                <div className="flex flex-col items-center gap-2.5">
                                    <span className="text-xs font-black tracking-wide text-[#151515] uppercase">
                                        Effort kamu
                                    </span>
                                    <div className="flex h-[clamp(120px,26vw,160px)] w-[clamp(84px,22vw,116px)] items-end justify-center rounded-t-[10px] bg-[#151515] pb-3">
                                        <span className="text-center text-[11px] leading-tight font-extrabold text-white/75">
                                            Waktu &amp;
                                            <br />
                                            tenaga
                                        </span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-center gap-2.5">
                                    <span className="text-xs font-black tracking-wide text-[#D70808] uppercase">
                                        Kenaikan skor
                                    </span>
                                    <div className="h-[clamp(24px,6vw,34px)] w-[clamp(84px,22vw,116px)] rounded-t-[10px] bg-[#D70808]" />
                                </div>
                            </div>
                            <p className="m-0 mt-6 text-center text-lg leading-snug font-black text-[#151515]">
                                Effort yang kamu keluarkan{' '}
                                <span className="text-[#D70808]">
                                    jauh lebih besar daripada kenaikan skormu.
                                </span>
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col items-center gap-2">
                    <p className="m-0 text-center text-xl leading-relaxed font-semibold text-gray-500">
                        Kamu tidak membutuhkan lebih banyak materi.
                    </p>
                    <p className="m-0 text-center text-xl leading-relaxed font-bold text-[#151515]">
                        Kamu butuh cara belajar yang terstruktur dan fokus ke
                        pola soal TOEFL
                    </p>
                    <div className="mt-2 flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-lg text-gray-700">
                        ↓
                    </div>
                </div>
            </section>
            <div className="-mt-px bg-[#F3F3F3]">
                <WaveDivider fill="#ffffff" flip />
            </div>

            {/* Value comparison */}
            <section id="value" className="bg-white px-6 py-20">
                <div className="mx-auto max-w-6xl">
                    <div className="mb-14 text-center">
                        <SectionBadge>
                            💡 Metode Eksklusif Full Bright
                        </SectionBadge>
                        <h2 className="m-0 mb-5 text-[clamp(24px,3vw,36px)] font-black text-[#151515]">
                            Ini{' '}
                            <span className="text-[#D70808]">
                                Strategi Belajar TOEFL
                            </span>{' '}
                            Yang Tepat Untuk Kamu
                        </h2>
                        <p className="m-0 mx-auto max-w-xl text-base leading-relaxed text-[#3d3d3d]">
                            Ini cara Full Bright membantu{' '}
                            <strong className="text-[#151515]">
                                45.000+ orang
                            </strong>{' '}
                            mengubah submission yang tadinya ditolak jadi
                            diterima di kampus &amp; perusahaan impian mereka.
                        </p>
                    </div>
                    <div className="mx-auto mb-14 max-w-3xl overflow-hidden rounded-[20px] border border-[#ececec] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.05)]">
                        <div className="sticky top-16 z-20 grid grid-cols-[1.5fr_0.85fr_0.85fr_0.9fr] items-stretch overflow-hidden rounded-t-[20px] border-b border-[#ececec] bg-[#F9F9F9]">
                            <div className="p-4 text-xs font-black tracking-wide text-gray-500 uppercase">
                                Kriteria
                            </div>
                            <div className="p-4 text-center text-[13px] leading-tight font-extrabold text-gray-500">
                                Belajar Otodidak
                            </div>
                            <div className="p-4 text-center text-[13px] leading-tight font-extrabold text-gray-500">
                                Kursus Lain
                            </div>
                            <div className="bg-[#D70808] p-4 text-center text-[13px] leading-tight font-black text-white">
                                Full Bright
                            </div>
                        </div>
                        {VALUE_ROWS.map((row, i) => (
                            <div
                                key={row.label}
                                className={`grid grid-cols-[1.5fr_0.85fr_0.85fr_0.9fr] items-center ${i < VALUE_ROWS.length - 1 ? 'border-b border-[#f4f4f4]' : ''}`}
                            >
                                <div className="p-4 text-sm leading-snug font-bold text-[#151515]">
                                    {row.label}
                                </div>
                                <div className="flex justify-center p-4">
                                    <ValueMark yes={row.self === 'yes'} />
                                </div>
                                <div className="flex justify-center p-4">
                                    <ValueMark yes={row.kursus === 'yes'} />
                                </div>
                                <div className="flex items-center justify-center self-stretch bg-[#FFF7F7] p-4">
                                    <ValueMark yes red />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mx-auto mb-4.5 max-w-xl">
                        <div className="overflow-hidden rounded-2xl border border-[#ececec] bg-white leading-none shadow-[0_3px_16px_rgba(0,0,0,0.05)]">
                            <img
                                src="/assets/pasted-1788585564773-0.png"
                                alt="Instruktur Full Bright menjelaskan pola soal TOEFL di kelas"
                                width={1000}
                                height={607}
                                loading="lazy"
                                className="block h-auto w-full"
                            />
                        </div>
                    </div>
                    <p className="m-0 mx-auto mb-7 max-w-3xl text-center text-[19px] leading-relaxed font-extrabold text-[#151515]">
                        3 Metode Belajar yang Membuat Alumni Full Bright Naik
                        Skor dalam 15 Hari:
                    </p>
                    <div className="mb-10 grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4">
                        {[
                            {
                                icon: '🎯',
                                iconBg: '#FFF0F0',
                                border: '#D70808',
                                title: 'TOEFL Pattern Recognition Method™',
                                desc: 'Belajar pola soal yang paling sering muncul agar target skor lebih cepat tercapai, tanpa menghabiskan waktu mempelajari semua materi.',
                            },
                            {
                                icon: '⚡',
                                iconBg: '#F3F3F3',
                                border: '#151515',
                                title: 'Shortcut Structure Framework™',
                                desc: 'Roadmap belajar disesuaikan dengan target skor, sehingga kamu fokus pada materi yang paling berdampak untuk mencapai skor.',
                            },
                            {
                                icon: '📈',
                                iconBg: '#FFF0F0',
                                border: '#D70808',
                                title: 'Score-Focused Learning System™',
                                desc: 'Setiap sesi belajar difokuskan pada target skor yang dibutuhkan, sehingga progresmu selalu mengarah ke tujuan yang jelas.',
                            },
                        ].map((card) => (
                            <div
                                key={card.title}
                                className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-7 shadow-[0_4px_24px_rgba(0,0,0,0.06)]"
                                style={{
                                    borderLeft: `4px solid ${card.border}`,
                                }}
                            >
                                <div
                                    className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl text-[22px]"
                                    style={{ background: card.iconBg }}
                                >
                                    {card.icon}
                                </div>
                                <h3 className="m-0 text-base font-black text-[#151515]">
                                    {card.title}
                                </h3>
                                <p className="m-0 text-sm leading-relaxed text-[#3d3d3d]">
                                    {card.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                    <SectionCloser />
                </div>
            </section>

            {/* Proof */}
            <section id="proof" className="bg-white px-6 py-18">
                <div className="mx-auto max-w-2xl">
                    <div className="mb-9 text-center">
                        <SectionBadge>📱 Bukti Nyata dari Alumni</SectionBadge>
                        <h2 className="m-0 mb-3.5 text-[clamp(24px,3vw,36px)] leading-snug font-black text-[#151515]">
                            Metode Kami Berhasil Membuat
                            <br />
                            <span className="text-2xl text-[#d70808]">
                                Ribuan Alumni Kami Capai TOEFL 500+{' '}
                            </span>
                        </h2>
                        <p className="m-0 text-sm text-gray-500">
                            Klik foto untuk memperbesar
                        </p>
                    </div>
                    <div className="mx-auto mb-8 flex max-w-[420px] flex-col">
                        {SCORE_PROOFS.slice(0, 3).map((item, i) => (
                            <button
                                key={item.src}
                                onClick={() => setScoreIndex(i)}
                                className={`flex cursor-pointer flex-col items-center gap-2.5 border-0 bg-transparent py-5 ${i < 2 ? 'border-b border-gray-200' : ''}`}
                            >
                                <p className="m-0 text-lg font-extrabold text-[#151515]">
                                    Skor{' '}
                                    <span className="text-[#D70808]">
                                        {item.score}
                                    </span>
                                </p>
                                <div
                                    className="aspect-square w-full overflow-hidden rounded-2xl bg-cover bg-center shadow-[0_6px_24px_rgba(0,0,0,0.18)]"
                                    style={{
                                        backgroundImage: `url(${item.src})`,
                                    }}
                                />
                            </button>
                        ))}
                    </div>
                    <div className="text-center">
                        <div className="flex flex-wrap justify-center gap-3">
                            <PrimaryCta
                                href="#pricing"
                                label="Gabung Sekarang →"
                                zone="midpage"
                            />
                            <SecondaryCta
                                href="#testimonials"
                                label="Lihat Lebih Banyak Bukti →"
                                zone="midpage"
                            />
                        </div>
                        <TrustBadges />
                    </div>
                </div>
            </section>

            {/* LMS showcase */}
            <section id="lms" className="bg-white px-6 py-20">
                <div className="mx-auto max-w-6xl">
                    <div className="mb-12 text-center">
                        <SectionBadge>💻 Tampilan LMS</SectionBadge>
                        <h2 className="m-0 mb-4 text-[clamp(24px,3vw,36px)] font-black text-[#151515]">
                            Intip Langsung{' '}
                            <span className="text-[#D70808]">
                                Platform Belajarnya
                            </span>
                        </h2>
                        <p className="m-0 mx-auto max-w-xl text-base leading-relaxed text-[#3d3d3d]">
                            Semua yang kamu butuhkan untuk mengetahui kelemahan,
                            belajar, berlatih, dan menghadapi ujian.
                        </p>
                    </div>
                    <div className="relative mx-auto mb-10 max-w-[1040px] overflow-hidden rounded-2xl bg-[#151515] leading-none shadow-[0_8px_28px_rgba(0,0,0,0.18)]">
                        <video
                            ref={lmsVideoRef}
                            controls
                            preload="metadata"
                            playsInline
                            onLoadedMetadata={() => {
                                const el = lmsVideoRef.current;

                                if (el && Number.isFinite(el.duration)) {
                                    el.currentTime = Math.min(
                                        4,
                                        Math.max(0, el.duration - 0.1),
                                    );
                                }
                            }}
                            onPlay={() => setLmsVideoIdle(false)}
                            className="block aspect-video w-full bg-[#151515] object-cover"
                        >
                            <source
                                src="https://demo-fullbright.b-cdn.net/NEW.mp4#t=4"
                                type="video/mp4"
                            />
                            Browser kamu tidak mendukung pemutaran video.
                        </video>
                        {lmsVideoIdle && (
                            <VideoPlayOverlay
                                label="Putar showcase LMS"
                                onPlay={() => lmsVideoRef.current?.play()}
                            />
                        )}
                    </div>
                    <div className="mx-auto mb-10 flex max-w-[1040px] flex-col gap-5">
                        {LMS_FEATURES.map((feature) => {
                            const imageBlock = (
                                <div
                                    className={`flex flex-col justify-center bg-[#FAFAFA] p-5.5 ${feature.imageFirst ? 'max-[899px]:order-none' : 'order-2 max-[899px]:order-none'}`}
                                >
                                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white leading-none shadow-[0_4px_18px_rgba(0,0,0,0.09)]">
                                        <img
                                            src={feature.img}
                                            alt={feature.title}
                                            width={1920}
                                            height={1200}
                                            loading="lazy"
                                            className="block h-auto w-full"
                                        />
                                    </div>
                                </div>
                            );
                            const textBlock = (
                                <div
                                    className={`flex flex-col justify-center gap-2.5 p-6.5 ${feature.imageFirst ? '' : 'order-1 max-[899px]:order-none'}`}
                                >
                                    <div className="flex flex-wrap items-center gap-2.5">
                                        <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-[9px] bg-[#D70808] text-xs font-black text-white">
                                            {feature.step}
                                        </span>
                                        <span className="text-[11px] font-black tracking-wide text-gray-500 uppercase">
                                            {feature.label}
                                        </span>
                                        <span className="inline-flex items-baseline gap-1 rounded-full border-[1.5px] border-[#ffb3b3] bg-[#FFF0F0] px-3 py-1.5 text-[15px] font-black whitespace-nowrap text-[#D70808]">
                                            <span className="text-[10px] font-black tracking-wide uppercase">
                                                Senilai
                                            </span>
                                            {feature.value}
                                        </span>
                                        {feature.badge && (
                                            <span className="rounded-full border border-[#ffb3b3] bg-[#FFF0F0] px-2.5 py-1 text-[10px] font-extrabold text-[#D70808]">
                                                {feature.badge}
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="m-0 text-[clamp(19px,2.2vw,22px)] leading-snug font-black text-[#151515]">
                                        {feature.title}
                                    </h3>
                                    <p className="m-0 text-[15px] leading-relaxed text-[#3d3d3d]">
                                        {feature.desc}
                                    </p>
                                    <div className="mt-0.5 flex flex-wrap gap-1.5">
                                        {feature.tags.map((tag) => (
                                            <span
                                                key={tag}
                                                className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-full border border-[#ececec] bg-[#F7F7F7] px-3 py-1.5 text-[13px] font-bold whitespace-nowrap text-[#151515]"
                                            >
                                                <span className="font-black text-[#D70808]">
                                                    ✓
                                                </span>
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            );

                            return (
                                <div
                                    key={feature.step}
                                    className={`grid items-stretch overflow-hidden rounded-[22px] border border-[#ececec] bg-white shadow-[0_4px_22px_rgba(0,0,0,0.06)] max-[899px]:grid-cols-1 ${feature.imageFirst ? 'grid-cols-[1.35fr_1fr]' : 'grid-cols-[1fr_1.35fr]'}`}
                                >
                                    {imageBlock}
                                    {textBlock}
                                </div>
                            );
                        })}
                    </div>
                    <div className="mx-auto mb-11 max-w-[560px] rounded-[22px] border-[1.5px] border-[#ffd6d6] bg-white p-6 text-center shadow-[0_4px_22px_rgba(0,0,0,0.06)]">
                        <p className="m-0 mb-2 text-xs font-black tracking-wide text-gray-500 uppercase">
                            Total nilai semua fitur di atas
                        </p>
                        <p className="m-0 mb-3 text-[clamp(30px,5vw,40px)] font-black text-gray-500 line-through [text-decoration-color:#D70808] [text-decoration-thickness:3px]">
                            Rp 1.005.000
                        </p>
                        <p className="m-0 mb-1.5 text-xs font-black tracking-wide text-[#D70808] uppercase">
                            MULAI DARI HANYA
                        </p>
                        <p className="m-0 mb-2 text-[clamp(32px,5.4vw,44px)] font-black text-[#D70808]">
                            Rp 99.000
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="m-0 mx-auto mb-5 max-w-[520px] text-lg leading-snug font-bold text-[#151515]">
                            Semua fitur ini bisa kamu akses{' '}
                            <span className="text-[#D70808]">
                                begitu kamu bergabung
                            </span>
                            .
                        </p>
                        <SectionCloser />
                    </div>
                </div>
            </section>

            {/* Why Full Bright */}
            <section id="why-fullbright" className="bg-[#F3F3F3] px-6 py-20">
                <div className="mx-auto max-w-6xl">
                    <div className="mb-12 text-center">
                        <SectionBadge>🏅 Mengapa Full Bright?</SectionBadge>
                        <h2 className="m-0 text-[clamp(24px,3vw,36px)] font-black text-[#151515]">
                            Mengapa{' '}
                            <span className="text-[#D70808]">45.000+</span>{' '}
                            Orang Memilih Full Bright?
                        </h2>
                    </div>
                    <div className="mx-auto mb-10 grid max-w-3xl grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">
                        {[
                            {
                                icon: '📖',
                                title: 'Lembaga Resmi ITP & IIEF Jakarta',
                                desc: 'Sertifikat terjamin sah dan diakui langsung sebagai syarat submission beasiswa luar negeri.',
                            },
                            {
                                icon: '📈',
                                title: 'Alumni Lulus Beasiswa ke Luar Negeri',
                                desc: 'UK, Jerman, Australia: bukti nyata metode belajar bertahap ini bekerja, bukan sekadar janji.',
                            },
                            {
                                icon: '👥',
                                title: 'Pengajar Praktisi Skor 600+',
                                desc: 'Belajar dari yang sudah membuktikan sendiri skornya, bukan yang cuma tahu teori.',
                            },
                            {
                                icon: '⏱',
                                title: 'Cukup 1 Jam Sehari, Mulai dari Sekarang',
                                desc: 'Tidak perlu menunggu waktu luang besar. 1 jam sehari dari sekarang jauh lebih ringan daripada belajar maraton menjelang deadline.',
                            },
                        ].map((reason) => (
                            <div
                                key={reason.title}
                                className="flex items-start gap-4 rounded-2xl bg-white p-4 shadow-[0_1px_8px_rgba(0,0,0,0.04)]"
                            >
                                <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[#D70808] text-white">
                                    {reason.icon}
                                </div>
                                <div className="flex flex-col gap-1">
                                    <p className="m-0 text-sm leading-snug font-bold text-[#151515]">
                                        {reason.title}
                                    </p>
                                    <p className="m-0 text-xs leading-relaxed text-gray-500">
                                        {reason.desc}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mx-auto mb-9 max-w-[440px] overflow-hidden rounded-2xl border border-[#ececec] bg-white shadow-[0_3px_16px_rgba(0,0,0,0.05)]">
                        <div className="leading-none">
                            <img
                                src="/assets/Foto Bareng.png"
                                alt="Tim instruktur Full Bright Indonesia"
                                width={1000}
                                height={705}
                                loading="lazy"
                                className="block h-auto w-full"
                            />
                        </div>
                        <p className="m-0 p-3.5 text-center text-[13px] font-extrabold text-[#151515]">
                            Tim instruktur Full Bright, pengalaman 10+ tahun
                            mengajar TOEFL ITP
                        </p>
                    </div>
                    <div className="text-center">
                        <div className="flex flex-wrap justify-center gap-3">
                            <PrimaryCta
                                href="#pricing"
                                label="Gabung Sekarang →"
                                zone="midpage"
                            />
                            <SecondaryCta
                                href="#testimonials"
                                label="Lihat Bukti Alumni →"
                                zone="midpage"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section id="testimonials">
                <div className="bg-[#151515] px-6 py-10">
                    <div className="mx-auto grid max-w-6xl grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-8 text-center text-white">
                        {[
                            ['45.000+', 'Alumni Sukses'],
                            ['4.9/5', 'Rating Rata-rata'],
                            ['13+', 'Tahun Pengalaman'],
                            ['95%', 'Skor Naik Signifikan'],
                        ].map(([value, label]) => (
                            <div key={label}>
                                <p className="m-0 text-[clamp(32px,4vw,48px)] font-black tracking-tight">
                                    {value}
                                </p>
                                <p className="m-0 mt-1.5 text-xs font-medium opacity-75">
                                    {label}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="bg-white px-6 py-20">
                    <div className="mx-auto max-w-6xl">
                        <div className="mb-12 text-center">
                            <SectionBadge>
                                💬 Testimoni Alumni Kami
                            </SectionBadge>
                            <h2 className="m-0 mb-4 text-[clamp(24px,3vw,36px)] font-black text-[#151515]">
                                Lihat Bagaimana Strategi Kami Membantu Alumni
                                <br />
                                <span className="text-[#D70808]">
                                    Meraih Target Skor Untuk Beasiswa &amp; CPNS
                                </span>
                            </h2>
                            <p className="m-0 text-sm text-gray-500">
                                Klik foto untuk memperbesar
                            </p>
                        </div>

                        <div className="mb-14 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]">
                            <div className="fb-marquee flex w-max">
                                {[...SCORE_PROOFS, ...SCORE_PROOFS].map(
                                    (item, i) => (
                                        <button
                                            key={i}
                                            onClick={() =>
                                                setScoreIndex(
                                                    i % SCORE_PROOFS.length,
                                                )
                                            }
                                            className="mx-2 flex flex-shrink-0 cursor-pointer flex-col items-center gap-2 border-0 bg-transparent"
                                        >
                                            <p className="m-0 text-base font-extrabold text-[#151515]">
                                                Skor{' '}
                                                <span className="text-[#D70808]">
                                                    {item.score}
                                                </span>
                                            </p>
                                            <img
                                                src={item.src}
                                                alt={`Bukti skor TOEFL ${item.score}`}
                                                loading="lazy"
                                                width={415}
                                                height={547}
                                                className="block aspect-[9/16] w-[130px] rounded-xl object-cover shadow-[0_4px_16px_rgba(0,0,0,0.15)]"
                                            />
                                        </button>
                                    ),
                                )}
                            </div>
                        </div>

                        <div className="mx-auto mb-14 w-full max-w-4xl">
                            <p className="m-0 mb-6 text-center text-xs font-bold tracking-wide text-gray-500 uppercase">
                                Testimoni Alumni yang Sukses Masuk Universitas
                                Luar Negeri
                            </p>
                            <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">
                                {[
                                    {
                                        badge: 'University of Nottingham, UK',
                                        title: 'Sangat Terjangkau Untuk Mahasiswa',
                                        quote: '"Full Bright ini tempat yang paling "pas" buat teman-teman Mahasiswa menaklukkan Tes TOEFL & IELTS"',
                                        name: 'Andi Manggala Putra',
                                        role: 'Accounting and Finance',
                                        avatar: '/assets/People 1.webp',
                                    },
                                    {
                                        badge: 'Stuttgart University, Germany',
                                        title: 'A Good Place to Learn TOEFL & IELTS',
                                        quote: '"Fullbright growing together with their students. This place is good place to learn TOEFL & IELTS. Thank you for the teacher and friendly staff. Now I can see the world"',
                                        name: 'Hajrah',
                                        role: 'Student Water Resources Engineering and Management',
                                        avatar: '/assets/People 2.webp',
                                    },
                                ].map((t) => (
                                    <div
                                        key={t.name}
                                        className="flex min-w-0 flex-col gap-3 rounded-2xl border border-gray-100 bg-[#F9F9F9] p-5 shadow-[0_2px_16px_rgba(0,0,0,0.05)]"
                                    >
                                        <span className="w-fit self-start rounded-full bg-[#FFF0F0] px-2.5 py-1 text-xs font-semibold text-[#D70808]">
                                            {t.badge}
                                        </span>
                                        <p className="m-0 text-xs font-black tracking-wide text-[#D70808] uppercase">
                                            {t.title}
                                        </p>
                                        <p className="m-0 flex-1 text-sm leading-relaxed text-[#3d3d3d]">
                                            {t.quote}
                                        </p>
                                        <div className="flex items-center gap-3 border-t border-gray-100 pt-2">
                                            <div
                                                role="img"
                                                aria-label={t.name}
                                                className="h-10 w-10 flex-shrink-0 rounded-full bg-cover bg-center"
                                                style={{
                                                    backgroundImage: `url(${t.avatar})`,
                                                }}
                                            />
                                            <div className="min-w-0 flex-1">
                                                <p className="m-0 truncate text-sm font-black text-[#151515]">
                                                    {t.name}
                                                </p>
                                                <p className="m-0 truncate text-xs text-gray-500">
                                                    {t.role}
                                                </p>
                                            </div>
                                            <span className="flex-shrink-0 text-xs text-[#F59E0B]">
                                                ★★★★★
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mt-10 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
                            <div className="fb-marquee flex w-max">
                                {[...REVIEW_NAMES, ...REVIEW_NAMES].map(
                                    (r, i) => (
                                        <div
                                            key={i}
                                            className="mx-3 flex w-[220px] flex-shrink-0 items-center gap-3 rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-[0_2px_12px_rgba(0,0,0,0.06)]"
                                        >
                                            <img
                                                src={r.avatar}
                                                alt={r.name}
                                                width={36}
                                                height={36}
                                                loading="lazy"
                                                className="h-9 w-9 flex-shrink-0 rounded-full object-cover"
                                            />
                                            <div className="min-w-0 flex-1">
                                                <p className="m-0 truncate text-xs font-black text-[#151515]">
                                                    {r.name}
                                                </p>
                                            </div>
                                            <p className="m-0 flex-shrink-0 text-xl font-black text-[#16a34a]">
                                                {r.score}
                                            </p>
                                        </div>
                                    ),
                                )}
                            </div>
                        </div>

                        <ReviewCarousel onOpen={setReviewIndex} />

                        <div className="mx-auto mt-12 max-w-[520px]">
                            <p className="m-0 mb-1.5 text-center text-[11px] font-black tracking-wide text-gray-500 uppercase">
                                Cerita Alumni
                            </p>
                            <h3 className="m-0 mb-4 text-center text-[clamp(19px,2.4vw,24px)] leading-snug font-black text-[#151515]">
                                Dengar Langsung dari{' '}
                                <span className="text-[#D70808]">
                                    Alumni Kami
                                </span>
                            </h3>
                            <div className="relative cursor-pointer overflow-hidden rounded-2xl bg-[#151515] leading-none shadow-[0_8px_28px_rgba(0,0,0,0.18)]">
                                <video
                                    ref={testimoniVideoRef}
                                    src="/assets/testimoni iyha.mp4#t=1.5"
                                    controls
                                    playsInline
                                    preload="metadata"
                                    onPlay={() => setTestimoniVideoIdle(false)}
                                    className="block aspect-[9/16] max-h-[560px] w-full bg-[#151515] object-cover"
                                />
                                {testimoniVideoIdle && (
                                    <VideoPlayOverlay
                                        label="Putar video testimoni"
                                        onPlay={() =>
                                            testimoniVideoRef.current?.play()
                                        }
                                    />
                                )}
                            </div>
                        </div>

                        <div className="mt-10 text-center">
                            <p className="m-0 mx-auto mb-5 max-w-[520px] text-lg leading-snug font-bold text-[#151515]">
                                Keberhasilan alumni selama ini bukan karena
                                mereka pintar, tapi karena mereka{' '}
                                <span className="text-[#D70808]">
                                    gunakan metode yang tepat
                                </span>
                                .
                            </p>
                            <PrimaryCta
                                href="#pricing"
                                label="Gabung Sekarang →"
                                zone="midpage"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Score / review lightboxes */}
            {scoreIndex !== null && (
                <Lightbox
                    src={SCORE_PROOFS[scoreIndex].src}
                    counter={`${scoreIndex + 1} / ${SCORE_PROOFS.length}`}
                    caption={`Skor ${SCORE_PROOFS[scoreIndex].score}`}
                    onClose={() => setScoreIndex(null)}
                    onPrev={() =>
                        setScoreIndex(
                            (i) =>
                                ((i ?? 0) - 1 + SCORE_PROOFS.length) %
                                SCORE_PROOFS.length,
                        )
                    }
                    onNext={() =>
                        setScoreIndex(
                            (i) => ((i ?? 0) + 1) % SCORE_PROOFS.length,
                        )
                    }
                />
            )}
            {reviewIndex !== null && (
                <Lightbox
                    src={reviewSrc(reviewIndex)}
                    counter={`${reviewIndex + 1} / ${REVIEW_CAROUSEL_COUNT}`}
                    onClose={() => setReviewIndex(null)}
                    onPrev={() =>
                        setReviewIndex(
                            (i) =>
                                ((i ?? 0) - 1 + REVIEW_CAROUSEL_COUNT) %
                                REVIEW_CAROUSEL_COUNT,
                        )
                    }
                    onNext={() =>
                        setReviewIndex(
                            (i) => ((i ?? 0) + 1) % REVIEW_CAROUSEL_COUNT,
                        )
                    }
                />
            )}

            {/* Pricing */}
            {mode === 'self' ? (
                <section id="pricing" className="bg-white px-6 pt-20 pb-12">
                    <div className="mx-auto max-w-6xl">
                        <PricingIntro mode={mode} setMode={setMode} />
                        <div className="mx-auto mb-10 max-w-[520px]">
                            <PricingCard
                                eyebrow="E-Course"
                                title="Self-Study LMS"
                                ratingBadge={
                                    <span className="flex items-center gap-1 rounded-full bg-[#FFF0F0] px-2.5 py-1 text-xs font-semibold text-[#D70808]">
                                        📚 Mandiri
                                    </span>
                                }
                                targetScore="500+"
                                duration="Belajar Kapan Saja"
                                originalPrice="Rp 250.000"
                                discountLabel="HEMAT 60%"
                                price="Rp 99.000"
                                features={[
                                    {
                                        icon: 'check',
                                        text: '60+ Video Materi Pembelajaran',
                                        bold: true,
                                    },
                                    {
                                        icon: 'check',
                                        text: 'Materi Hari ke-1 s/d ke-15 (Roadmap Lengkap)',
                                        bold: true,
                                    },
                                    {
                                        icon: 'check',
                                        text: 'Lebih dari 1.000+ Nomor Latihan Soal',
                                        bold: true,
                                    },
                                    { icon: 'check', text: 'Grup WA Diskusi' },
                                    { icon: 'check', text: 'Diagnostic Test' },
                                    {
                                        icon: 'check',
                                        text: 'Simulasi dan Post Test (Full Skills)',
                                    },
                                ]}
                                excluded={[
                                    {
                                        icon: 'cross',
                                        text: 'LIVE ZOOM 15 Hari',
                                    },
                                    { icon: 'cross', text: 'Sertifikat TOEFL' },
                                ]}
                                ctaLabel="Mulai Belajar Mandiri →"
                                ctaHref={CHECKOUT_URLS.self}
                                ctaPackage="Self-Study LMS"
                                waMessage="Halo Admin Full Bright Indonesia. Saya minat mau daftar E-Course Self-Study LMS."
                                accent="gold"
                                ribbon={{
                                    text: '🔥 POPULAR',
                                    bg: '#F5B700',
                                    color: '#151515',
                                }}
                                onCheckoutClick={markCheckoutClicked}
                                whatsappNumber={whatsappNumber}
                            />
                            <p className="m-0 mt-3.5 text-center text-[13px] leading-relaxed text-gray-400">
                                Mau intip materinya dulu?{' '}
                                <TrackedCTA
                                    zone="pricing"
                                    action="link"
                                    label="Coba gratis 1 modul di LMS"
                                    href="https://class.fullbrightindonesia.com/register"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-extrabold text-gray-500 underline underline-offset-[3px]"
                                >
                                    Coba gratis 1 modul di LMS
                                </TrackedCTA>
                            </p>
                        </div>
                        <div className="mx-auto mb-8 max-w-[520px]">
                            <p className="m-0 mb-4 text-center text-[13px] font-extrabold tracking-wide text-gray-500 uppercase">
                                Kata Mereka yang Belajar Mandiri
                            </p>
                            <div className="rounded-2xl border border-[#ececec] bg-[#F9F9F9] p-5.5">
                                <p className="m-0 mb-2 text-base tracking-wide text-[#FBBF24]">
                                    ★★★★★
                                </p>
                                <p className="m-0 mb-4.5 text-[15px] leading-relaxed text-[#3d3d3d]">
                                    "Trm kasih Full Bright Indonesia yg sudah
                                    memberikan kesempatan belajar Bhs Inggris,
                                    belajar di sini bisa menjadi alternatif bagi
                                    individu yg ingin belajar sambil bekerja,
                                    LMS bisa diakses kapan pun"
                                </p>
                                <div className="flex items-center gap-3.5">
                                    <img
                                        src="/assets/nina.png"
                                        alt="Nina Hernawati"
                                        width={108}
                                        height={108}
                                        loading="lazy"
                                        className="h-[60px] w-[60px] flex-shrink-0 rounded-full border-2 border-white object-cover shadow-[0_3px_12px_rgba(0,0,0,0.12)]"
                                    />
                                    <p className="m-0 text-[17px] font-black text-[#151515]">
                                        Nina Hernawati
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            ) : (
                <section id="pricing" className="bg-white px-6 pt-20 pb-12">
                    <div className="mx-auto max-w-6xl">
                        <PricingIntro mode={mode} setMode={setMode} />
                        <div className="mb-14 grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-6">
                            <PricingCard
                                eyebrow="Paket"
                                title="Starter"
                                ratingBadge={
                                    <span className="flex items-center gap-1 rounded-full bg-[#F0FDF4] px-2.5 py-1 text-xs font-semibold text-[#16a34a]">
                                        ★★★★★ <span className="ml-1">5.0</span>
                                    </span>
                                }
                                targetScore="450+"
                                duration="10 Hari (2 Minggu)"
                                originalPrice="Rp 1.000.000"
                                discountLabel="HEMAT 80%"
                                price="Rp 200.000"
                                features={STARTER_FEATURES}
                                ctaLabel="Apply Sekarang →"
                                ctaHref={CHECKOUT_URLS.starter}
                                ctaPackage="Starter"
                                waMessage="Halo Admin Full Bright Indonesia. Saya minat mau daftar kelas TOEFL Level Starter"
                                accent="red-outline"
                                onCheckoutClick={markCheckoutClicked}
                                whatsappNumber={whatsappNumber}
                            />
                            <PricingCard
                                eyebrow="Paket"
                                title="Bundling"
                                subtitle="Starter + Intermediate"
                                ratingBadge={
                                    <span className="flex items-center gap-1 rounded-full bg-[#FFF0F0] px-2.5 py-1 text-xs font-semibold text-[#D70808]">
                                        ★★★★★ <span className="ml-1">5.0</span>
                                    </span>
                                }
                                targetScore="500+"
                                duration="25 Hari Total"
                                originalPrice="Rp 1.875.000"
                                discountLabel="DISKON 80% + Rp50rb"
                                price="Rp 325.000"
                                priceNote="Hemat Rp 1.550.000 dari harga normal!"
                                features={BUNDLING_FEATURES}
                                extras={
                                    <div className="mb-5 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
                                        {[
                                            {
                                                title: 'Garansi Sampai Skor Tercapai',
                                                desc: 'Ikut program secara penuh dan konsisten, tapi skor belum tercapai, gratis ulang kelas di batch berikutnya.',
                                            },
                                            {
                                                title: 'Post Test Ulang 3× Gratis',
                                                desc: 'Belum puas hasilnya? Ulang ujian akhir hingga 3 kali, gratis.',
                                            },
                                        ].map((g) => (
                                            <div
                                                key={g.title}
                                                className="rounded-2xl bg-[#F3F3F3] p-4"
                                            >
                                                <div className="mb-2 flex items-center gap-2.5">
                                                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[10px] bg-[#FEF3C7]">
                                                        <svg
                                                            width="16"
                                                            height="16"
                                                            viewBox="0 0 24 24"
                                                            fill="#F59E0B"
                                                            stroke="#F59E0B"
                                                        >
                                                            <path d="M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6l7-3z" />
                                                        </svg>
                                                    </div>
                                                    <p className="m-0 text-[13px] leading-snug font-black text-[#151515]">
                                                        {g.title}
                                                    </p>
                                                </div>
                                                <p className="m-0 text-xs leading-relaxed text-gray-500">
                                                    {g.desc}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                }
                                ctaLabel="Apply Sekarang →"
                                ctaHref={CHECKOUT_URLS.starter}
                                ctaPackage="Bundling"
                                waMessage="Halo Admin Full Bright Indonesia. Saya minat mau daftar paket HEMAT TOEFL Level Starter + Intermediate."
                                accent="green"
                                ribbon={{
                                    text: '⭐ PALING HEMAT',
                                    bg: '#16a34a',
                                    color: '#fff',
                                }}
                                footNote="* Centang opsi Bundle saat checkout"
                                onCheckoutClick={markCheckoutClicked}
                                whatsappNumber={whatsappNumber}
                            />
                            <PricingCard
                                eyebrow="Paket"
                                title="Intermediate"
                                ratingBadge={
                                    <span className="flex items-center gap-1 rounded-full bg-[#F0FDF4] px-2.5 py-1 text-xs font-semibold text-[#16a34a]">
                                        ★★★★★ <span className="ml-1">5.0</span>
                                    </span>
                                }
                                targetScore="500+"
                                duration="15 Hari"
                                originalPrice="Rp 1.400.000"
                                discountLabel="DISKON 80%"
                                price="Rp 280.000"
                                features={INTERMEDIATE_FEATURES}
                                ctaLabel="Apply Sekarang →"
                                ctaHref={CHECKOUT_URLS.intermediate}
                                ctaPackage="Intermediate"
                                waMessage="Halo Admin Full Bright Indonesia. Saya minat mau daftar kelas TOEFL Level Intermediate."
                                accent="red-outline"
                                onCheckoutClick={markCheckoutClicked}
                                whatsappNumber={whatsappNumber}
                            />
                        </div>
                        <div className="mx-auto mb-8 max-w-3xl rounded-2xl border border-gray-200 bg-[#F3F3F3] p-6">
                            <p className="m-0 mb-3 text-xs font-black tracking-wide text-gray-400 uppercase">
                                Legalitas Resmi
                            </p>
                            <div className="flex flex-col gap-1.5">
                                {[
                                    'SK Kemenkumham RI Nomor AHU-0055720-AH.0114 Tahun 2020',
                                    'SK Izin Operasional LKP 503/20177/LKP/DPM-PTSP/8/2024',
                                    'NPSN Nomor K9998700',
                                    'Bekerja sama dengan IIEF Jakarta',
                                ].map((item) => (
                                    <span
                                        key={item}
                                        className="text-xs font-semibold text-[#151515]"
                                    >
                                        ✓ {item}
                                    </span>
                                ))}
                            </div>
                            <a
                                href="https://referensi.data.kemendikdasmen.go.id/pendidikan/npsn/K9998700"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-3 inline-block text-xs font-semibold text-[#D70808] no-underline"
                            >
                                Info Detail Legalitas →
                            </a>
                        </div>
                    </div>
                </section>
            )}

            {/* FAQ */}
            <section id="faq" className="bg-[#F3F3F3] px-6 pt-20 pb-12">
                <div className="mx-auto max-w-6xl">
                    <div className="mb-14 text-center">
                        <SectionBadge>❓ Masih Ragu?</SectionBadge>
                        <h2 className="m-0 text-[clamp(24px,3vw,36px)] font-black text-[#151515]">
                            Apakah Kamu Benar-Benar{' '}
                            <span className="text-[#D70808]">
                                Butuh Ini Sekarang?
                            </span>
                        </h2>
                    </div>
                    <div className="mb-8 flex flex-wrap justify-center gap-2">
                        <button
                            onClick={() => setFaqCategory(null)}
                            className={`cursor-pointer rounded-full border-[1.5px] border-[#D70808] px-4 py-2 text-xs font-bold ${faqCategory === null ? 'bg-[#D70808] text-white' : 'bg-white text-[#D70808]'}`}
                        >
                            Semua
                        </button>
                        {FAQ_CATEGORIES.map((cat, i) => (
                            <button
                                key={cat}
                                onClick={() => setFaqCategory(i)}
                                className={`cursor-pointer rounded-full border-[1.5px] border-[#D70808] px-4 py-2 text-xs font-bold ${faqCategory === i ? 'bg-[#D70808] text-white' : 'bg-white text-[#D70808]'}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                    <div className="mx-auto mb-12 max-w-3xl rounded-3xl bg-white px-7 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
                        {FAQ_ITEMS.map((item, i) => {
                            const visible =
                                faqCategory === null ||
                                item.category === FAQ_CATEGORIES[faqCategory];

                            return (
                                <div
                                    key={item.q}
                                    className={`border-b border-gray-100 last:border-b-0 ${visible ? 'block' : 'hidden'}`}
                                >
                                    <button
                                        onClick={() =>
                                            setOpenFaq(openFaq === i ? null : i)
                                        }
                                        className="flex w-full cursor-pointer items-start justify-between gap-4 border-0 bg-transparent py-5 text-left"
                                    >
                                        <span
                                            className={`text-sm leading-snug font-bold ${openFaq === i ? 'text-[#D70808]' : 'text-[#151515]'}`}
                                        >
                                            {item.q}
                                        </span>
                                        <span
                                            className={`mt-0.5 flex-shrink-0 text-sm transition-transform ${openFaq === i ? 'rotate-180 text-[#D70808]' : 'text-[#151515]'}`}
                                        >
                                            ▾
                                        </span>
                                    </button>
                                    {openFaq === i && (
                                        <div className="pr-8 pb-6">
                                            <p className="m-0 text-sm leading-relaxed whitespace-pre-line text-[#3d3d3d]">
                                                {item.a}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    <div className="mx-auto max-w-lg text-center">
                        <p className="m-0 mb-6 text-sm font-semibold text-[#3d3d3d]">
                            Masih ada pertanyaan lain? Hubungi kami sekarang.
                        </p>
                        <div className="flex flex-wrap justify-center gap-3">
                            <TrackedCTA
                                zone="faq"
                                action="whatsapp"
                                label="Chat Via WA"
                                href={waLink(
                                    whatsappNumber,
                                    'Halo Admin Full Bright Indonesia. Saya minat mau daftar kelas TOEFL. Saya mau tanya-tanya dulu.',
                                )}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#D70808] px-7 py-3.5 text-base font-bold text-white no-underline shadow-[0_4px_20px_rgba(215,8,8,0.35)]"
                            >
                                Chat Via WA →
                            </TrackedCTA>
                            <SecondaryCta
                                href="#testimonials"
                                label="Lihat Bukti Alumni →"
                                zone="faq"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Difficulty survey */}
            <section id="survey" className="bg-white px-6 py-7">
                <div className="mx-auto max-w-md rounded-2xl border border-[#ececec] bg-[#FAFAFA] px-5 pt-5 pb-4">
                    <div className="mb-4">
                        <p className="m-0 mb-1.5 text-[11px] font-bold tracking-wide text-gray-500 uppercase">
                            BOLEH TAHU KESULITANMU?
                        </p>
                        <h2 className="m-0 text-[clamp(20px,3.6vw,23px)] leading-snug font-extrabold text-[#151515]">
                            Apa Tantangan Terbesarmu{' '}
                            <span className="text-[#D70808]">
                                Soal TOEFL Sekarang?
                            </span>
                        </h2>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        {[
                            'Bingung mulai belajar dari mana',
                            'Sudah belajar tapi skor masih stuck',
                            'Masih ragu apakah perlu ikut kursus',
                            'Lainnya',
                        ].map((label, i) => (
                            <button
                                key={label}
                                onClick={() => answerSurvey(i, label)}
                                className={`flex min-h-[48px] w-full cursor-pointer items-center gap-2.5 rounded-[9px] border px-3 py-2.5 text-left transition-all ${
                                    surveyAnswer === i
                                        ? 'border-[#D70808]/30 bg-[#D70808]/5'
                                        : 'border-gray-200 bg-white'
                                }`}
                            >
                                <span className="flex-1 text-left text-[13px] font-medium text-[#151515]">
                                    {label}
                                </span>
                                {surveyAnswer === i && (
                                    <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-[#D70808] text-[9px] font-extrabold text-white">
                                        ✓
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                    <p
                        className={`m-0 mt-2 min-h-[16px] text-xs font-semibold text-gray-500 transition-opacity ${surveyAnswer !== null ? 'opacity-100' : 'opacity-0'}`}
                    >
                        ✓ Makasih! Jawabanmu sudah tercatat.
                    </p>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-[#151515] px-4 pt-14 pb-8">
                <div className="mx-auto max-w-6xl">
                    <div className="mb-10 grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-10">
                        <div>
                            <div className="mb-4">
                                <img
                                    src="/logo/Logo-Fullbright.webp"
                                    alt="Full Bright Indonesia"
                                    className="w-40 object-contain brightness-0 invert"
                                />
                            </div>
                            <p className="m-0 mb-4 text-xs leading-relaxed text-gray-400">
                                SK Kemenkumham RI No. AHU-0055720-AH.0114 Tahun
                                2020
                                <br />
                                SK LKP No. 503/20177/LKP/DPM-PTSP/8/2024
                                <br />
                                NPSN K9998700 · Kerjasama dengan IIEF Jakarta
                            </p>
                            <a
                                href="https://www.instagram.com/fulbrightindonesia/"
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="Instagram"
                                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/8 text-gray-400 no-underline"
                            >
                                <svg
                                    width="17"
                                    height="17"
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                >
                                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                                </svg>
                            </a>
                        </div>
                        <div>
                            <p className="m-0 mb-5 text-xs font-black tracking-wide text-gray-400 uppercase">
                                Navigasi
                            </p>
                            <ul className="m-0 flex list-none flex-col gap-3 p-0">
                                {[
                                    {
                                        href: '#value',
                                        label: 'Keunggulan',
                                        tracked: false,
                                    },
                                    {
                                        href: '#testimonials',
                                        label: 'Testimoni',
                                        tracked: true,
                                    },
                                    {
                                        href: '#pricing',
                                        label: 'Harga',
                                        tracked: true,
                                    },
                                    {
                                        href: '#faq',
                                        label: 'FAQ',
                                        tracked: false,
                                    },
                                ].map((item) => (
                                    <li key={item.href}>
                                        {item.tracked ? (
                                            <TrackedCTA
                                                zone="footer"
                                                action="scroll"
                                                label={item.label}
                                                href={item.href}
                                                className="text-sm text-gray-400 no-underline"
                                            >
                                                {item.label}
                                            </TrackedCTA>
                                        ) : (
                                            <a
                                                href={item.href}
                                                className="text-sm text-gray-400 no-underline"
                                            >
                                                {item.label}
                                            </a>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <p className="m-0 mb-5 text-xs font-black tracking-wide text-gray-400 uppercase">
                                Hubungi Kami
                            </p>
                            <ul className="m-0 flex list-none flex-col gap-4 p-0">
                                {[
                                    {
                                        icon: '💬',
                                        name: 'Ms. Aini',
                                        phone: '+62 819-5948-6507',
                                        number: '6281959486507',
                                    },
                                    {
                                        icon: '💬',
                                        name: 'Mr. Choiri',
                                        phone: '+62 887-4487-5322',
                                        number: '6288744875322',
                                    },
                                    {
                                        icon: '💬',
                                        name: 'Ms. Fini',
                                        phone: '+62 852-5549-9299',
                                        number: '6285255499299',
                                    },
                                ].map((c) => (
                                    <li
                                        key={c.name}
                                        className="flex items-start gap-3"
                                    >
                                        <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white/8 text-gray-400">
                                            {c.icon}
                                        </div>
                                        <div>
                                            <p className="m-0 mb-0.5 text-xs font-semibold text-white">
                                                {c.name}
                                            </p>
                                            <TrackedCTA
                                                zone="footer"
                                                action="whatsapp"
                                                label={c.name}
                                                href={`https://wa.me/${c.number}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-gray-400 no-underline"
                                            >
                                                {c.phone}
                                            </TrackedCTA>
                                        </div>
                                    </li>
                                ))}
                                <li className="flex items-start gap-3">
                                    <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white/8 text-gray-400">
                                        ✉
                                    </div>
                                    <div>
                                        <p className="m-0 mb-0.5 text-xs font-semibold text-white">
                                            Email
                                        </p>
                                        <a
                                            href="mailto:info@fullbrightindonesia.org"
                                            className="text-xs text-gray-400 no-underline"
                                        >
                                            info@fullbrightindonesia.org
                                        </a>
                                    </div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white/8 text-gray-400">
                                        📍
                                    </div>
                                    <div>
                                        <p className="m-0 mb-0.5 text-xs font-semibold text-white">
                                            Alamat
                                        </p>
                                        <p className="m-0 text-xs text-gray-400">
                                            Gedung Yotta Signature Perintis, Jl.
                                            Perintis Kemerdekaan No.97 Lantai 3,
                                            Tamalanrea Jaya, Kec. Tamalanrea,
                                            Kota Makassar, Sulawesi Selatan
                                            90245
                                        </p>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div className="flex justify-center border-t border-white/8 pt-6 text-xs text-gray-400">
                        <p className="m-0">
                            © 2026 Full Bright Indonesia. Lembaga Resmi TOEFL
                            ITP bekerjasama dengan IIEF Jakarta.
                        </p>
                    </div>
                </div>
            </footer>

            {/* Return-visit popup */}
            {returnPopupOpen && (
                <div
                    className="fixed inset-0 z-[100] flex items-end justify-center bg-[#151515]/45"
                    onClick={() => setReturnPopupOpen(false)}
                >
                    <div
                        className="relative max-h-[60vh] w-full max-w-[480px] [animation:fbSheetUp_0.25s_ease] overflow-y-auto rounded-t-3xl bg-white p-5.5 pb-7 shadow-[0_-12px_40px_rgba(0,0,0,0.18)]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setReturnPopupOpen(false)}
                            aria-label="Tutup"
                            className="absolute top-4 right-4 flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded-full border-0 bg-gray-100 text-base text-gray-500"
                        >
                            ✕
                        </button>
                        <p className="m-0 mb-1.5 text-[11px] font-bold tracking-wide text-gray-500 uppercase">
                            Sebelum Kamu Pergi
                        </p>
                        <h3 className="m-0 mb-4.5 pr-8 text-[clamp(22px,5vw,26px)] leading-snug font-extrabold text-[#151515]">
                            Apa yang{' '}
                            <span className="text-[#D70808]">
                                Masih Bikin Kamu Ragu Daftar?
                            </span>
                        </h3>
                        {exitReason === null ? (
                            <div className="flex flex-col gap-2">
                                {EXIT_REASONS.map((reason, i) => (
                                    <button
                                        key={reason.label}
                                        onClick={() => setExitReason(i)}
                                        className="flex min-h-[54px] w-full cursor-pointer items-center gap-2.5 rounded-xl border border-gray-200 bg-white px-3.5 py-3 text-left"
                                    >
                                        <span className="flex-1 text-left text-sm font-medium text-[#151515]">
                                            {reason.label}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <>
                                <TrackedCTA
                                    zone="floating"
                                    action="whatsapp"
                                    label="Konsultasi via WhatsApp"
                                    href={waLink(
                                        whatsappNumber,
                                        EXIT_REASONS[exitReason].waMessage,
                                    )}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mb-3.5 box-border flex w-full items-center justify-center gap-2 rounded-xl bg-[#16a34a] px-4 py-3.5 text-sm font-bold text-white no-underline"
                                >
                                    💬 Konsultasi via WhatsApp →
                                </TrackedCTA>
                                <p className="m-0 mb-0.5 text-sm font-bold text-[#151515]">
                                    {EXIT_REASONS[exitReason].teaser}
                                </p>
                                <p className="m-0 mb-3 text-xs font-medium text-gray-500">
                                    Tim kami siap bantu jawab langsung lewat
                                    WhatsApp.
                                </p>
                                <div className="flex min-h-[54px] w-full items-center gap-2.5 rounded-xl border border-[#D70808] bg-[#D70808]/5 px-3.5 py-3">
                                    <span className="flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-full bg-[#D70808] text-[10px] font-extrabold text-white">
                                        ✓
                                    </span>
                                    <span className="flex-1 text-left text-sm font-medium text-[#151515]">
                                        {EXIT_REASONS[exitReason].label}
                                    </span>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Floating WhatsApp bubble */}
            <div className="fixed right-12 bottom-5 z-[52] flex flex-col items-end gap-2.5 max-[559px]:right-7">
                {bubbleVisible && (
                    <div className="relative max-w-[270px] [animation:fbBubbleIn_0.2s_ease] rounded-[18px] rounded-br-md border border-gray-200 bg-white p-3.5 shadow-[0_10px_34px_rgba(0,0,0,0.18)] max-[559px]:max-w-[208px] max-[559px]:rounded-2xl max-[559px]:rounded-br-md max-[559px]:p-2.5">
                        <button
                            onClick={closeBubble}
                            aria-label="Tutup"
                            className="absolute -top-2.5 -right-2.5 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-[#151515] p-0 text-xs leading-none font-black text-white"
                        >
                            ✕
                        </button>
                        <TrackedCTA
                            zone="floating"
                            action="whatsapp"
                            label="WhatsApp bubble"
                            href={waLink(
                                whatsappNumber,
                                'Halo Admin Full Bright Indonesia. Saya tertarik daftar kelas TOEFL Online.',
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-start gap-2.5 no-underline"
                        >
                            <img
                                src="/assets/admin-avatar.webp"
                                alt="Admin Full Bright"
                                width={192}
                                height={192}
                                loading="lazy"
                                className="h-[38px] w-[38px] flex-shrink-0 rounded-full border-2 border-[#25D366] object-cover max-[559px]:h-7 max-[559px]:w-7"
                            />
                            <span className="block">
                                <span className="mb-0.5 block text-xs font-black text-[#151515]">
                                    Ms. Fini - Admin Full Bright
                                </span>
                                <span className="block text-[13px] leading-relaxed font-semibold text-[#3d3d3d]">
                                    Masih bingung atau ragu? Tanya langsung ke
                                    saya di WA ☕
                                </span>
                                <span className="mt-2 inline-block text-xs font-black text-[#15803d]">
                                    Balas sekarang →
                                </span>
                            </span>
                        </TrackedCTA>
                    </div>
                )}
                <TrackedCTA
                    zone="floating"
                    action="whatsapp"
                    label="Chat WhatsApp"
                    href={waLink(
                        whatsappNumber,
                        'Halo Admin Full Bright Indonesia. Saya tertarik daftar kelas TOEFL Online.',
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Chat WhatsApp"
                    className="flex h-[58px] w-[58px] items-center justify-center rounded-full bg-[#25D366] shadow-[0_6px_22px_rgba(37,211,102,0.5)]"
                >
                    <svg
                        width="30"
                        height="30"
                        viewBox="0 0 24 24"
                        fill="white"
                    >
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.553 4.103 1.522 5.833L0 24l6.302-1.499A11.944 11.944 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.887 0-3.656-.494-5.192-1.358l-.373-.213-3.741.89.934-3.629-.243-.384A9.953 9.953 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
                    </svg>
                </TrackedCTA>
            </div>
        </div>
    );
}

function ValueMark({ yes, red }: { yes: boolean; red?: boolean }) {
    return (
        <span
            className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[13px] font-black ${
                yes
                    ? red
                        ? 'bg-[#D70808] text-white'
                        : 'bg-gray-400 text-white'
                    : 'bg-[#efefef] text-[#b4b4b4]'
            }`}
        >
            {yes ? '✓' : '✕'}
        </span>
    );
}

function PricingIntro({
    mode,
    setMode,
}: {
    mode: 'self' | 'tutor';
    setMode: (m: 'self' | 'tutor') => void;
}) {
    return (
        <>
            <div className="mb-8 text-center">
                <SectionBadge>⏳ Mulai dari Sekarang, Bukan Nanti</SectionBadge>
                <h2 className="m-0 mb-5 text-[clamp(24px,3vw,36px)] font-black text-[#151515]">
                    Persiapkan Sekarang,{' '}
                    <span className="text-[#D70808]">Jangan Ditunda</span>
                </h2>
                <p className="m-0 mx-auto max-w-lg text-base leading-relaxed text-[#3d3d3d]">
                    <b>
                        Semakin cepat kamu mulai, semakin besar peluang kamu
                        diterima beasiswa
                    </b>{' '}
                    karena skor 500+ tercapai sebelum deadline submission.
                </p>
            </div>
            <div className="mb-11 text-center">
                <p className="m-0 mb-1.5 text-[13px] font-extrabold tracking-wide text-[#D70808] uppercase">
                    👇 Pilih Cara Belajarmu
                </p>
                <div className="inline-flex gap-1 rounded-full border border-[#ffb3b3] bg-white p-1.5 shadow-[0_2px_12px_rgba(215,8,8,0.08)]">
                    <button
                        onClick={() => setMode('self')}
                        className={`relative rounded-full px-6 py-3 text-[15px] font-extrabold transition-all ${
                            mode === 'self'
                                ? 'bg-[#D70808] text-white shadow-[0_4px_14px_rgba(215,8,8,0.28)]'
                                : 'text-gray-500 underline decoration-dotted decoration-2 underline-offset-4'
                        }`}
                    >
                        Belajar Sendiri
                    </button>
                    <button
                        onClick={() => setMode('tutor')}
                        className={`relative rounded-full px-6 py-3 text-[15px] font-extrabold transition-all ${
                            mode === 'tutor'
                                ? 'bg-[#D70808] text-white shadow-[0_4px_14px_rgba(215,8,8,0.28)]'
                                : 'text-gray-500 underline decoration-dotted decoration-2 underline-offset-4'
                        }`}
                    >
                        Dibimbing Tutor
                        <span className="absolute -top-2.5 -right-1.5 flex h-[34px] w-[34px] items-center justify-center rounded-full border-2 border-white bg-[#F97316] text-[11px] font-black text-[#151515] shadow-[0_2px_8px_rgba(249,115,22,0.4)]">
                            -80%
                        </span>
                    </button>
                </div>
            </div>
        </>
    );
}

const STARTER_FEATURES: Feature[] = [
    { icon: 'check', text: 'LIVE ZOOM 10 Hari', bold: true },
    {
        icon: 'check',
        text: 'Akses Latihan Soal di LMS (Total 370+ Soal)',
        bold: true,
    },
    { icon: 'check', text: 'Post Test (Full Test) 1x', bold: true },
    { icon: 'check', text: 'Evaluasi Progress Mingguan' },
    {
        icon: 'check',
        text: 'Strategi Submit Sesuai Jurusan & Rencana Kontribusi',
    },
    { icon: 'check', text: 'Rekaman ZOOM jika tidak hadir' },
    { icon: 'check', text: '30+ Video Materi Pembelajaran' },
    { icon: 'check', text: 'E-Book Structure' },
    { icon: 'check', text: 'E-Book Listening dan Reading' },
    { icon: 'check', text: 'Grup WA Diskusi' },
    { icon: 'check', text: 'Placement Test / Pre-Test' },
    { icon: 'check', text: '10+ Link Soal Tambahan saat LIVE ZOOM' },
    { icon: 'check', text: 'Tutor Tanya AI 24 Jam di setiap materi' },
    { icon: 'check', text: 'Pembahasan setiap soal di LMS' },
    { icon: 'globe', text: 'Webinar Beasiswa Luar Negeri' },
    {
        icon: 'globe',
        text: 'Konsultasi Kampus Luar Negeri, urus LoA, Visa, dll.',
    },
    { icon: 'label', text: 'Bonus Spesial' },
    { icon: 'check', text: 'Sertifikat TOEFL' },
    { icon: 'cross', text: 'Tidak termasuk garansi mengulang 1 bulan' },
];

const BUNDLING_FEATURES: Feature[] = [
    { icon: 'check', text: 'LIVE ZOOM 25 Hari', bold: true },
    {
        icon: 'check',
        text: 'Akses Latihan Soal di LMS (Total 1.370+ Soal)',
        bold: true,
    },
    {
        icon: 'check',
        text: 'Progress Test & Post Test (Full Test) 3x',
        bold: true,
    },
    { icon: 'check', text: 'Evaluasi Progress Mingguan' },
    {
        icon: 'check',
        text: 'Strategi Submit Sesuai Jurusan & Rencana Kontribusi',
    },
    { icon: 'check', text: 'Rekaman ZOOM jika tidak hadir' },
    { icon: 'check', text: '90+ Video Materi Pembelajaran' },
    { icon: 'check', text: 'E-Book Structure (500+ Soal)' },
    { icon: 'check', text: 'E-Book Listening dan Reading' },
    { icon: 'check', text: 'Grup WA Diskusi' },
    { icon: 'check', text: 'Placement Test / Pre-Test' },
    { icon: 'check', text: '25 Link Soal Tambahan saat LIVE ZOOM' },
    {
        icon: 'check',
        text: 'Free mengulang 1 bulan jika belum capai skor 500+',
    },
    { icon: 'check', text: 'Tutor Tanya AI 24 Jam di setiap materi' },
    { icon: 'check', text: 'Pembahasan setiap soal di LMS' },
    { icon: 'globe', text: 'Webinar Beasiswa Luar Negeri' },
    {
        icon: 'globe',
        text: 'Konsultasi Kampus Luar Negeri, urus LoA, Visa, dll.',
    },
    { icon: 'label', text: 'Bonus Spesial' },
    { icon: 'check', text: 'Sertifikat TOEFL' },
];

const INTERMEDIATE_FEATURES: Feature[] = [
    { icon: 'check', text: 'LIVE ZOOM 15 Hari', bold: true },
    {
        icon: 'check',
        text: 'Akses Latihan Soal di LMS (Total 1000+ Soal)',
        bold: true,
    },
    {
        icon: 'check',
        text: 'Progress Test & Post Test (Full Test) 2x',
        bold: true,
    },
    { icon: 'check', text: 'Evaluasi Progress Mingguan' },
    {
        icon: 'check',
        text: 'Strategi Submit Sesuai Jurusan & Rencana Kontribusi',
    },
    { icon: 'check', text: 'Rekaman ZOOM jika tidak hadir' },
    { icon: 'check', text: '60+ Video Materi Pembelajaran' },
    { icon: 'check', text: 'E-Book Structure' },
    { icon: 'check', text: 'E-Book Listening dan Reading' },
    { icon: 'check', text: 'Grup WA Diskusi' },
    { icon: 'check', text: 'Placement Test / Pre-Test' },
    { icon: 'check', text: '15 Link Soal Tambahan saat LIVE ZOOM' },
    { icon: 'check', text: 'Tutor Tanya AI 24 Jam di setiap materi' },
    { icon: 'check', text: 'Pembahasan setiap soal di LMS' },
    { icon: 'globe', text: 'Webinar Beasiswa Luar Negeri' },
    {
        icon: 'globe',
        text: 'Konsultasi Kampus Luar Negeri, urus LoA, Visa, dll.',
    },
    { icon: 'label', text: 'Bonus Spesial' },
    { icon: 'check', text: 'Sertifikat TOEFL' },
];
