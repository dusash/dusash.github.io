/* ============================================================
   dusash blog — visual revamp
   保留 Fluid 原有交互，增量提供：
   页面上下文、导航状态、滚动显现、阅读进度、克制的主标语动效，
   以及按需加载 / 自动暂停的首屏视频。
   ============================================================ */
(function () {
  'use strict';

  var root = document.documentElement;
  var motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  var mobileQuery = window.matchMedia('(max-width: 991px)');
  var destroyHeroVideo = null;
  var finishSlogan = null;
  var requestScrollUpdate = function () {};

  function ready(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback, { once: true });
    } else {
      callback();
    }
  }

  function canonicalPath(pathname) {
    var path = (pathname || '/').replace(/\/+$/, '');
    return path === '' ? '/' : path;
  }

  function getPageType() {
    var path = canonicalPath(window.location.pathname);

    if (document.querySelector('.post-content')) return 'post';
    if (document.querySelector('.about-content')) return 'about';
    if (document.querySelector('.index-card') || path === '/') return 'home';
    if (path.indexOf('/archives') === 0) return 'archive';
    if (path.indexOf('/categories') === 0) return 'category';
    if (path.indexOf('/tags') === 0) return 'tag';
    return 'page';
  }

  function addHeroKicker(pageType) {
    var bannerText = document.querySelector('#banner .banner-text');
    if (!bannerText || bannerText.querySelector('.hero-kicker')) return;

    var labels = {
      home: 'DUSASH / NOTES & IDEAS',
      post: 'DUSASH / JOURNAL',
      archive: 'DUSASH / ARCHIVE',
      category: 'DUSASH / CATEGORIES',
      tag: 'DUSASH / TAGS',
      about: 'DUSASH / ABOUT',
      page: 'DUSASH / BLOG'
    };
    var kicker = document.createElement('span');
    kicker.className = 'hero-kicker';
    kicker.setAttribute('aria-hidden', 'true');
    kicker.textContent = labels[pageType] || labels.page;
    bannerText.insertBefore(kicker, bannerText.firstChild);
  }

  function updateNavigation(pageType) {
    var currentPath = canonicalPath(window.location.pathname);
    var links = document.querySelectorAll(
      '#navbar .navbar-nav a[href], #mobile-grid-menu a[href]'
    );

    Array.prototype.forEach.call(links, function (link) {
      var url;
      try {
        url = new URL(link.getAttribute('href'), window.location.href);
      } catch (error) {
        return;
      }

      if (url.origin !== window.location.origin) return;
      if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

      var linkPath = canonicalPath(url.pathname);
      var isExact = currentPath === linkPath;
      var isSection = linkPath !== '/' &&
        (currentPath === linkPath || currentPath.indexOf(linkPath + '/') === 0);
      var isActive = linkPath === '/'
        ? (pageType === 'home' || pageType === 'post')
        : isSection;

      link.classList.toggle('active', isActive);
      if (isExact) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  function setPageContext() {
    var pageType = getPageType();
    document.body.setAttribute('data-page', pageType);
    root.classList.add('site-ready');
    root.classList.toggle('motion-ready', !motionQuery.matches);
    addHeroKicker(pageType);
    updateNavigation(pageType);
  }

  function initSlogan() {
    if (document.body.getAttribute('data-page') !== 'home') return;

    var subtitle = document.getElementById('subtitle');
    if (!subtitle) return;

    var text = subtitle.textContent.replace(/\s+/g, ' ').trim();
    if (!text) return;

    subtitle.setAttribute('aria-label', text);
    subtitle.setAttribute('aria-live', 'off');

    if (motionQuery.matches) return;

    var timer = null;
    var cursor = null;
    var index = 0;
    var started = false;
    var finished = false;

    function finish() {
      if (timer) window.clearTimeout(timer);
      timer = null;
      finished = true;
      subtitle.textContent = text;
      if (cursor && cursor.parentNode) cursor.parentNode.removeChild(cursor);
      cursor = null;
      finishSlogan = null;
    }

    function beginIfVisible() {
      if (finished || motionQuery.matches) {
        finish();
        return;
      }
      if (document.hidden) {
        timer = window.setTimeout(beginIfVisible, 220);
        return;
      }

      if (!started) {
        started = true;
        subtitle.textContent = '';
        cursor = document.createElement('span');
        cursor.className = 'typed-cursor visual-typed-cursor';
        cursor.setAttribute('aria-hidden', 'true');
        cursor.textContent = '_';
        if (subtitle.parentNode) subtitle.parentNode.appendChild(cursor);
      }
      typeNext();
    }

    function typeNext() {
      if (finished || motionQuery.matches) {
        finish();
        return;
      }
      if (document.hidden) {
        timer = window.setTimeout(typeNext, 220);
        return;
      }
      if (index >= text.length) {
        if (timer) window.clearTimeout(timer);
        timer = null;
        return;
      }

      index += 1;
      subtitle.textContent = text.slice(0, index);
      timer = window.setTimeout(typeNext, 52);
    }

    finishSlogan = finish;
    timer = window.setTimeout(beginIfVisible, 180);
  }

  function initReveal() {
    var items = document.querySelectorAll(
      '.index-card, #board .list-group-item, #board .category-count,' +
      ' .post-content, .about-content, .tagcloud'
    );
    if (!items.length) return;

    Array.prototype.forEach.call(items, function (item, index) {
      item.classList.add('reveal-item');
      item.style.setProperty('--reveal-order', String(Math.min(index % 5, 4)));
    });

    if (motionQuery.matches || !('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(items, function (item) {
        item.classList.add('is-revealed');
      });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      });
    }, {
      rootMargin: '0px 0px -6% 0px',
      threshold: 0.06
    });

    Array.prototype.forEach.call(items, function (item) {
      observer.observe(item);
    });
  }

  function initScrollFeedback() {
    if (!document.querySelector('.scroll-progress')) {
      var progress = document.createElement('div');
      progress.className = 'scroll-progress';
      progress.setAttribute('aria-hidden', 'true');
      document.body.appendChild(progress);
    }

    var cue = document.querySelector('.scroll-down-bar');
    if (cue) {
      cue.setAttribute('role', 'button');
      cue.setAttribute('aria-label', '向下滚动到正文');
      cue.setAttribute('tabindex', '0');
      cue.addEventListener('keydown', function (event) {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        cue.click();
      });
    }

    var scheduled = false;

    function update() {
      scheduled = false;
      var max = root.scrollHeight - window.innerHeight;
      var ratio = max > 0 ? window.pageYOffset / max : 0;
      ratio = Math.min(1, Math.max(0, ratio));
      root.style.setProperty('--scroll-progress', ratio.toFixed(4));
      document.body.classList.toggle('is-scrolled', window.pageYOffset > 24);
    }

    requestScrollUpdate = function () {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(update);
    };

    window.addEventListener('scroll', requestScrollUpdate, { passive: true });
    window.addEventListener('resize', requestScrollUpdate, { passive: true });
    requestScrollUpdate();
  }

  function mountHeroVideo() {
    var banner = document.getElementById('banner');
    if (!banner || destroyHeroVideo || motionQuery.matches || mobileQuery.matches) return;
    if (banner.querySelector('.hero-video')) return;

    var video = document.createElement('video');
    var inView = true;
    var loaded = false;
    var destroyed = false;
    var idleId = null;
    var fallbackTimer = null;
    var observer = null;

    video.className = 'hero-video';
    video.muted = true;
    video.defaultMuted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = 'metadata';
    video.tabIndex = -1;
    video.poster = '/img/hero-poster.jpg';
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.setAttribute('disablepictureinpicture', '');
    video.setAttribute('aria-hidden', 'true');

    function reveal() {
      if (!destroyed) video.classList.add('is-ready');
    }

    function syncPlayback() {
      if (destroyed || !loaded) return;
      if (document.hidden || !inView || motionQuery.matches || mobileQuery.matches) {
        video.pause();
        return;
      }

      var promise = video.play();
      if (promise && promise.catch) {
        promise.catch(function () {
          /* 自动播放被浏览器拒绝时保留海报，不打扰阅读。 */
        });
      }
    }

    function loadVideo() {
      if (destroyed || loaded || motionQuery.matches || mobileQuery.matches) return;
      loaded = true;
      video.src = '/video/hero-loop.mp4';
      video.load();
      syncPlayback();
    }

    function onVisibilityChange() {
      syncPlayback();
    }

    function onVideoError() {
      if (!destroyed && destroyHeroVideo) destroyHeroVideo();
    }

    video.addEventListener('playing', reveal);
    video.addEventListener('canplay', reveal);
    video.addEventListener('error', onVideoError);
    document.addEventListener('visibilitychange', onVisibilityChange);
    banner.insertBefore(video, banner.firstChild);

    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(function (entries) {
        inView = entries[0].isIntersecting;
        syncPlayback();
      }, { threshold: 0.04 });
      observer.observe(banner);
    }

    if ('requestIdleCallback' in window) {
      idleId = window.requestIdleCallback(loadVideo, { timeout: 1400 });
    } else {
      fallbackTimer = window.setTimeout(loadVideo, 300);
    }

    destroyHeroVideo = function () {
      if (destroyed) return;
      destroyed = true;
      destroyHeroVideo = null;

      if (idleId !== null && 'cancelIdleCallback' in window) {
        window.cancelIdleCallback(idleId);
      }
      if (fallbackTimer) window.clearTimeout(fallbackTimer);
      if (observer) observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      video.removeEventListener('playing', reveal);
      video.removeEventListener('canplay', reveal);
      video.removeEventListener('error', onVideoError);
      video.pause();
      video.removeAttribute('src');
      video.load();
      if (video.parentNode) video.parentNode.removeChild(video);
    };
  }

  function onMediaChange(query) {
    if (query.addEventListener) {
      query.addEventListener('change', handleMediaChange);
    } else if (query.addListener) {
      query.addListener(handleMediaChange);
    }
  }

  function handleMediaChange() {
    root.classList.toggle('motion-ready', !motionQuery.matches);

    if (motionQuery.matches) {
      document.querySelectorAll('.reveal-item').forEach(function (item) {
        item.classList.add('is-revealed');
      });
      if (finishSlogan) finishSlogan();
    }

    if ((motionQuery.matches || mobileQuery.matches) && destroyHeroVideo) {
      destroyHeroVideo();
    } else if (!motionQuery.matches && !mobileQuery.matches) {
      mountHeroVideo();
    }
  }

  ready(function () {
    setPageContext();
    initSlogan();
    initReveal();
    initScrollFeedback();
    onMediaChange(motionQuery);
    onMediaChange(mobileQuery);
    mountHeroVideo();

    window.addEventListener('pagehide', function () {
      if (destroyHeroVideo) destroyHeroVideo();
      if (finishSlogan) finishSlogan();
    });

    window.addEventListener('pageshow', function () {
      requestScrollUpdate();
      mountHeroVideo();
    });
  });
})();
