// 1. SUPABASE AYARLARI
const SUPABASE_URL = "https://slsbrbazrilierlvvwdw.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsc2JyYmF6cmlsaWVybHZ2d2R3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIzMzMyNDYsImV4cCI6MjEwNzkwOTI0Nn0.9kKCxbubU7hcBn_xk-RpSIj6MMUUGWlny_RmejPmNac";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Sayfa Durumu
let currentProduct = null;
let activeImages = [];
let currentIndex = 0;

// DOM Elemanları
const mainImage = document.getElementById("mainImage");
const imageBox = document.getElementById("imageBox");
const zoomLens = document.getElementById("zoomLens");
const zoomResult = document.getElementById("zoomResult");
const arViewer = document.getElementById("ar-viewer");

// URL'den Ürün ID'sini Al
function getProductIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id") || "zenna";
}

// Sayfa Yenilenmeden Anlık Ürün Değişimi (SPA Motoru)
async function switchProduct(productId) {
  const newUrl = `${window.location.pathname}?id=${productId}`;
  window.history.pushState({ id: productId }, "", newUrl);

  document
    .querySelectorAll(".nav-item, .switch-chip")
    .forEach((el) => el.classList.remove("active"));
  const activeNav = document.getElementById(`nav-${productId}`);
  const activeChip = document.getElementById(`chip-${productId}`);
  if (activeNav) activeNav.classList.add("active");
  if (activeChip) activeChip.classList.add("active");

  await fetchAndRender(productId);
}

// Veritabanından Çek ve Ekrana Bas
async function fetchAndRender(productId) {
  try {
    const { data, error } = await supabaseClient
      .from("products")
      .select("*")
      .eq("id", productId)
      .single();

    if (error || !data) {
      console.warn(
        "Supabase verisi alınamadı, yedek veri şablonu yükleniyor:",
        error,
      );
      loadFallbackProduct(productId);
      return;
    }

    currentProduct = data;
    renderProductData(data);
  } catch (err) {
    console.error("Bağlantı hatası:", err);
    loadFallbackProduct(productId);
  }
}

// Yerel Yedek Veri (Offline veya Veritabanı Gecikmesi Durumunda Asla Boş Kalmaz)
function loadFallbackProduct(id) {
  const fallbacks = {
    zenna: {
      id: "zenna",
      title: "LEGACY ZENNA Masif Detaylı İskandinav Orta Sehpa (Mat Beyaz)",
      brand: "LEGACY HOME",
      price: 349.0,
      rating: 4.8,
      review_count: 48,
      description:
        "Legacy Home imzasını taşıyan Zenna Serisi; sürdürülebilir doğal ahşap dokusu ve modern minimalist hatlarıyla evinize zarif bir derinlik katar.",
      specs:
        "Genişlik: 90 cm | Derinlik: 60 cm | Yükseklik: 42 cm | E1 Kalite Masif Ahşap",
      images: [
        "assets/images/image_2560.webp",
        "assets/images/image_1512.webp",
      ],
      glb_url: "assets/models/sehpa.glb",
      usdz_url: "assets/models/sehpa.usdz",
    },
    ying: {
      id: "ying",
      title: "LEGACY YING Modüler Açılabilir Çok Fonksiyonlu Orta Sehpa",
      brand: "LEGACY HOME",
      price: 399.0,
      rating: 5.0,
      review_count: 32,
      description:
        "Legacy Home tasarım stüdyosunun dinamik yaşam alanları için geliştirdiği Ying Modüler Sehpa; açılabilir çift kademeli yapısıyla alanınızı optimize eder.",
      specs:
        "Genişlik: 70 cm | Derinlik: 70 cm | Yükseklik: 38 cm | Akıllı Modüler Kilit",
      images: ["assets/images/ying1.webp", "assets/images/ying2.webp"],
      glb_url: "assets/models/ying.glb",
      usdz_url: "assets/models/ying.usdz",
    },
  };

  const selected = fallbacks[id] || fallbacks.zenna;
  currentProduct = selected;
  renderProductData(selected);
}

// Arayüz Elemanlarını Doldurma
function renderProductData(prod) {
  document.title = `${prod.title} - LEGACY HOME`;
  document.getElementById("productBrand").innerText = prod.brand;
  document.getElementById("productTitle").innerText = prod.title;
  document.getElementById("productPrice").innerText =
    `₺ ${parseFloat(prod.price).toFixed(2)}`;
  document.getElementById("productReviews").innerText =
    `(${prod.review_count} Değerlendirme)`;
  document.getElementById("productDescription").innerText = prod.description;
  document.getElementById("productSpecs").innerHTML =
    `<strong>Teknik Ölçüler:</strong> ${prod.specs || ""}`;
  document.getElementById("variantLabel").innerText =
    prod.id === "zenna"
      ? "Mat Beyaz / Doğal Ahşap"
      : "Doğal Meşe / Antrasit Gövde";

  // 3D Model Dosyası
  arViewer.setAttribute("src", prod.glb_url);

  // Görseller
  activeImages = prod.images;
  currentIndex = 0;

  const thumbList = document.getElementById("thumbList");
  thumbList.innerHTML = "";

  activeImages.forEach((imgSrc, idx) => {
    const card = document.createElement("div");
    card.className = `thumb-card ${idx === 0 ? "active" : ""}`;
    card.onclick = () => updateGallery(idx);
    card.innerHTML = `<img src="${imgSrc}" alt="${prod.title} ${idx + 1}">`;
    thumbList.appendChild(card);
  });

  updateGallery(0);
}

// Galeri ve Slider
function updateGallery(index) {
  if (!activeImages.length) return;
  currentIndex = index;
  mainImage.src = activeImages[currentIndex];

  const cards = document.querySelectorAll(".thumb-card");
  cards.forEach((card, i) => {
    card.classList.toggle("active", i === index);
  });

  zoomResult.style.backgroundImage = `url('${activeImages[currentIndex]}')`;
}

function prevImage(e) {
  if (e) e.stopPropagation();
  if (!activeImages.length) return;
  currentIndex = (currentIndex - 1 + activeImages.length) % activeImages.length;
  updateGallery(currentIndex);
}

function nextImage(e) {
  if (e) e.stopPropagation();
  if (!activeImages.length) return;
  currentIndex = (currentIndex + 1) % activeImages.length;
  updateGallery(currentIndex);
}

// Flyout Büyüteç Motoru
function setupZoom() {
  imageBox.addEventListener("mouseenter", (e) => {
    if (window.innerWidth <= 900) return;
    if (e.target.closest(".slider-arrow")) return;
    zoomLens.classList.add("visible");
    zoomResult.classList.add("visible");
    zoomResult.style.backgroundImage = `url('${mainImage.src}')`;
  });

  imageBox.addEventListener("mouseleave", () => {
    zoomLens.classList.remove("visible");
    zoomResult.classList.remove("visible");
  });

  imageBox.addEventListener("mousemove", (e) => {
    if (window.innerWidth <= 900) return;
    if (e.target.closest(".slider-arrow")) {
      zoomLens.classList.remove("visible");
      zoomResult.classList.remove("visible");
      return;
    } else {
      zoomLens.classList.add("visible");
      zoomResult.classList.add("visible");
      zoomResult.style.backgroundImage = `url('${mainImage.src}')`;
    }

    const rect = imageBox.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;

    const lensW = zoomLens.offsetWidth || 140;
    const lensH = zoomLens.offsetHeight || 140;

    let posX = x - lensW / 2;
    let posY = y - lensH / 2;

    if (posX < 0) posX = 0;
    if (posY < 0) posY = 0;
    if (posX > imageBox.offsetWidth - lensW)
      posX = imageBox.offsetWidth - lensW;
    if (posY > imageBox.offsetHeight - lensH)
      posY = imageBox.offsetHeight - lensH;

    zoomLens.style.left = posX + "px";
    zoomLens.style.top = posY + "px";

    const zoomFactor = 2.4;
    zoomResult.style.backgroundSize = `${imageBox.offsetWidth * zoomFactor}px ${imageBox.offsetHeight * zoomFactor}px`;
    zoomResult.style.backgroundPosition = `-${posX * zoomFactor}px -${posY * zoomFactor}px`;
  });
}

// iOS Quick Look AR Motoru (Cache Buster ile)
function startAR() {
  if (!currentProduct) return;

  const isIOS =
    (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) &&
    !window.MSStream;

  if (isIOS) {
    const cleanTimestamp = new Date().getTime();
    const usdzUrlWithTime = currentProduct.usdz_url.includes("?")
      ? `${currentProduct.usdz_url}&v=${cleanTimestamp}`
      : `${currentProduct.usdz_url}?v=${cleanTimestamp}`;
    arViewer.setAttribute("ios-src", usdzUrlWithTime);
  }

  if (typeof arViewer.activateAR === "function") {
    arViewer.activateAR();
  } else {
    alert("AR desteği bu cihazda aktif değil veya model henüz indiriliyor.");
  }
}

// Tarayıcı İleri/Geri Butonları
window.addEventListener("popstate", () => {
  const id = getProductIdFromUrl();
  switchProduct(id);
});

// Başlatma
setupZoom();
window.addEventListener("DOMContentLoaded", () => {
  const initialId = getProductIdFromUrl();
  switchProduct(initialId);
});
