// ================= Chuyển qua lại giữa các mục =================
const tabs = document.querySelectorAll('.tab');
const panels = document.querySelectorAll('.panel');

tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    tabs.forEach((t) => t.classList.remove('active'));
    panels.forEach((p) => p.classList.remove('active'));

    tab.classList.add('active');
    document.getElementById(tab.dataset.target).classList.add('active');
  });
});


// ================= Drawings =================
// Trang tự lấy danh sách ảnh trong thư mục images/drawings của repo.
// Chỉ cần upload ảnh vào thư mục đó là ảnh tự hiện.
const REPO = {
  owner: 'thaonhw06-spec',
  name: 'art-space',
  branch: 'main',
  folder: 'images/drawings',
};

// (Không bắt buộc) Nếu muốn tự sắp xếp thứ tự, điền tên file vào đây,
// ví dụ: ['ve-01.png', 've-02.jpg']. Để trống thì ảnh xếp theo tên file.
const MANUAL_LIST = [];

const IMG_EXT = /\.(png|jpe?g|gif|webp)$/i;

const gallery = document.getElementById('gallery');
const galleryMsg = document.getElementById('gallery-msg');
let images = [];

async function loadList() {
  if (MANUAL_LIST.length) return MANUAL_LIST;

  const url = `https://api.github.com/repos/${REPO.owner}/${REPO.name}/contents/${REPO.folder}?ref=${REPO.branch}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const data = await res.json();

  return data
    .filter((f) => f.type === 'file' && IMG_EXT.test(f.name))
    .map((f) => f.name)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

async function initGallery() {
  let names = [];

  // Lưu tạm trong phiên để không gọi GitHub lặp lại nhiều lần
  try {
    const cached = sessionStorage.getItem('drawings-list');
    if (cached && !MANUAL_LIST.length) names = JSON.parse(cached);
  } catch (e) {}

  if (!names.length) {
    try {
      names = await loadList();
      try { sessionStorage.setItem('drawings-list', JSON.stringify(names)); } catch (e) {}
    } catch (e) {
      galleryMsg.textContent = 'chưa tải được ảnh, bạn thử tải lại trang nhé.';
      return;
    }
  }

  if (!names.length) {
    galleryMsg.textContent = 'đang cập nhật...';
    return;
  }

  images = names.map((n) => `${REPO.folder}/${encodeURIComponent(n)}`);

  images.forEach((src, i) => {
    const btn = document.createElement('button');
    btn.className = 'thumb';
    btn.type = 'button';

    const img = document.createElement('img');
    img.src = src;
    img.alt = 'drawing';
    img.loading = 'lazy';

    btn.appendChild(img);
    btn.addEventListener('click', () => openLightbox(i));
    gallery.appendChild(btn);
  });
}

initGallery();


// ================= Xem ảnh phóng to =================
const lightbox = document.getElementById('lightbox');
const lbImg = lightbox.querySelector('.lb-img');
let current = 0;

function show(i) {
  current = (i + images.length) % images.length;
  lbImg.src = images[current];
}

function openLightbox(i) {
  show(i);
  lightbox.hidden = false;
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  lightbox.hidden = true;
  lbImg.src = '';
  document.body.style.overflow = '';
}

lightbox.querySelector('.lb-close').addEventListener('click', closeLightbox);
lightbox.querySelector('.lb-prev').addEventListener('click', (e) => { e.stopPropagation(); show(current - 1); });
lightbox.querySelector('.lb-next').addEventListener('click', (e) => { e.stopPropagation(); show(current + 1); });

// Bấm vào nền đen để đóng
lightbox.addEventListener('click', (e) => {
  if (e.target === lightbox) closeLightbox();
});

// Bàn phím: Esc đóng, mũi tên trái/phải chuyển ảnh
document.addEventListener('keydown', (e) => {
  if (lightbox.hidden) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft') show(current - 1);
  if (e.key === 'ArrowRight') show(current + 1);
});

// Vuốt trái/phải trên điện thoại
let touchX = null;
lightbox.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
lightbox.addEventListener('touchend', (e) => {
  if (touchX === null) return;
  const dx = e.changedTouches[0].clientX - touchX;
  if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
  touchX = null;
});
