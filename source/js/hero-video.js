(function () {
  function mount() {
    var banner = document.getElementById('banner');
    if (!banner) return;
    if (banner.querySelector('.hero-video')) return;
    if (window.matchMedia('(max-width: 991px)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var v = document.createElement('video');
    v.className = 'hero-video';
    v.muted = true;
    v.defaultMuted = true;
    v.loop = true;
    v.autoplay = true;
    v.playsInline = true;
    v.preload = 'auto';
    v.setAttribute('muted', '');
    v.setAttribute('playsinline', '');
    v.setAttribute('webkit-playsinline', '');
    v.setAttribute('disablepictureinpicture', '');
    v.src = '/video/hero-loop.mp4';
    v.poster = '/img/hero-poster.jpg';

    function reveal() {
      v.classList.add('is-ready');
    }
    v.addEventListener('playing', reveal);
    v.addEventListener('canplay', reveal);

    banner.insertBefore(v, banner.firstChild);

    var p = v.play();
    if (p && p.catch) {
      p.catch(function () {});
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
