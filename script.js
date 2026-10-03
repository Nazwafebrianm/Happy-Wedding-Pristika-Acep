const DATA_URL = "data.json";
let galleryItems = [];
let currentIndex = 0;

const $ = (s) => document.querySelector(s);

async function loadData(){
  const res = await fetch(DATA_URL);
  if(!res.ok) throw new Error("data.json tidak dapat dimuat");
  return res.json();
}

function renderGallery(data){
  const gallery = $("#gallery");
  gallery.innerHTML = data.gallery.map((item, i) => `
    <figure class="gallery-item reveal" data-index="${i}">
      <img src="${item.src}" alt="${item.alt}" loading="${i < 2 ? "eager" : "lazy"}">
    </figure>
  `).join("");

  galleryItems = [...gallery.querySelectorAll(".gallery-item")];
  galleryItems.forEach(item => item.addEventListener("click", () => openLightbox(+item.dataset.index)));
}

function renderRemoteVisuals(data){
  $("#remoteVisuals").innerHTML = data.remoteImages.map(item => `
    <figure class="remote-card">
      <img src="${item.url}" alt="${item.alt}" loading="lazy" referrerpolicy="no-referrer">
    </figure>
  `).join("");
}

function updateLocalTime(){
  const now = new Date();
  const time = new Intl.DateTimeFormat(undefined, {
    hour:"2-digit", minute:"2-digit", second:"2-digit", hour12:false
  }).format(now);
  const date = new Intl.DateTimeFormat("id-ID", {
    weekday:"long", day:"numeric", month:"long", year:"numeric"
  }).format(now);
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone || "Local time";
  $("#clock").textContent = time;
  $("#dateNow").textContent = date;
  $("#localZone").textContent = zone.replaceAll("_"," ");
}

function updateWeddingStatus(data){
  const target = new Date(data.event.dateISO);
  const now = new Date();
  const diff = now - target;
  const absDays = Math.floor(Math.abs(diff) / 86400000);
  const status = $("#weddingStatus");
  const detail = $("#statusDetail");

  if(diff < 0){
    const remaining = Math.ceil(Math.abs(diff)/86400000);
    status.textContent = `${remaining} hari lagi`;
    detail.textContent = "Menuju hari bahagia";
  }else if(absDays === 0){
    status.textContent = "Hari ini";
    detail.textContent = "Selamat atas hari yang istimewa 🤍";
  }else{
    status.textContent = `${absDays} hari telah berlalu`;
    detail.textContent = "Kenangan indah dari 20 September 2026";
  }
}

function setupReveal(){
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, {threshold:.12});
  document.querySelectorAll(".reveal").forEach(el => observer.observe(el));
}

function openLightbox(index){
  currentIndex = index;
  const item = galleryItems[currentIndex].querySelector("img");
  $("#lightboxImg").src = item.src;
  $("#lightboxImg").alt = item.alt;
  $("#lightbox").classList.add("open");
  $("#lightbox").setAttribute("aria-hidden","false");
  document.body.style.overflow = "hidden";
}
function closeLightbox(){
  $("#lightbox").classList.remove("open");
  $("#lightbox").setAttribute("aria-hidden","true");
  document.body.style.overflow = "";
}
function nextImage(dir){
  currentIndex = (currentIndex + dir + galleryItems.length) % galleryItems.length;
  openLightbox(currentIndex);
}

function setupUI(){
  $("#lightboxClose").onclick = closeLightbox;
  $("#lightboxPrev").onclick = () => nextImage(-1);
  $("#lightboxNext").onclick = () => nextImage(1);
  $("#lightbox").addEventListener("click", e => { if(e.target.id === "lightbox") closeLightbox(); });
  document.addEventListener("keydown", e => {
    if(!$("#lightbox").classList.contains("open")) return;
    if(e.key === "Escape") closeLightbox();
    if(e.key === "ArrowRight") nextImage(1);
    if(e.key === "ArrowLeft") nextImage(-1);
  });

  $("#soundlessBtn").onclick = () => {
    document.body.classList.toggle("focus");
    $("#soundlessBtn").textContent = document.body.classList.contains("focus") ? "○" : "✦";
  };

  $("#backTop").onclick = () => window.scrollTo({top:0,behavior:"smooth"});
  window.addEventListener("scroll", () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    $("#progress").style.width = `${max ? scrollY/max*100 : 0}%`;
    $("#backTop").classList.toggle("show", scrollY > 700);
  }, {passive:true});
}

(async function(){
  try{
    const data = await loadData();
    renderGallery(data);
    renderRemoteVisuals(data);
    updateWeddingStatus(data);
    setupReveal();
  }catch(err){
    console.error(err);
    $("#gallery").innerHTML = "<p style='color:#9ba9bd'>Galeri belum dapat dimuat. Coba jalankan melalui GitHub Pages atau server lokal.</p>";
  }
  updateLocalTime();
  setInterval(updateLocalTime, 1000);
  setupUI();
})();
