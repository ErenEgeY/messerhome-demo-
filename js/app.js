// 1. SUPABASE AYARLARI
const SUPABASE_URL = "https://slsbrbazrilierlvvwdw.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsc2JyYmF6cmlsaWVybHZ2d2R3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIzMzMyNDYsImV4cCI6MjEwNzkwOTI0Nn0.9kKCxbubU7hcBn_xk-RpSIj6MMUUGWlny_RmejPmNac";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Sayfa Değişkenleri
let currentProduct = null;
let activeImages = [];
let currentIndex = 0;

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

// Supabase'den Veri Çek ve Sayfayı Doldur
async function loadProduct() {
  const productId = getProductIdFromUrl();

  // Aktif buton/çip işaretlemesi
  document
    .querySelectorAll(".nav-item, .switch-chip")
    .forEach((el) => el.classList.remove("active"));
  const activeNav = document.getElementById(`nav-${productId}`);
  const activeChip = document.getElementById(`chip-${productId}`);
  if (activeNav) activeNav.classList.add("active");
  if (activeChip) activeChip.classList.add("active");

  try {
    const { data, error } = await supabaseClient
      .from("products")
      .select("*")
      .eq("id", productId)
      .single();

    if (error || !data) {
      console.error(
        "Supabase Hatası:",
        error ? error.message : "Veri bulunamadı",
        "| Kod:",
        error ? error.code : "",
        "| İpucu:",
        error ? error.hint : "",
      );
      document.getElementById("productTitle").innerText = "Ürün Bulunamadı";
      return;
    }

    currentProduct = data;
    renderProductData(data);
  } catch (err) {
    console.error("Supabase bağlantı hatası:", err);
  }
}

// DOM Elemanlarını Güncelle
function renderProductData(prod) {
  document.title = `${prod.title} - MESSER`;
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
    prod.id === "zenna" ? "Beyaz / Ahşap" : "Doğal Ahşap / Siyah Profil";

  // 3D Model Bağlantısı
  arViewer.setAttribute("src", prod.glb_url);

  // Görselleri Render Et
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

// Galeri ve Slider Kontrolleri
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

// Flyout Masaüstü Zoom
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

// iOS Quick Look AR Motoru
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

setupZoom();
window.addEventListener("DOMContentLoaded", loadProduct);
