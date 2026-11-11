(function () {
  'use strict';

  var doc = document;
  var body = doc.body;
  var WA = '77476686475';
  var ASSET_V = ((doc.currentScript && doc.currentScript.src.match(/[?&]v=([^&]+)/)) || [])[1] || '';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* интро: шов под заголовком и появление портрета после загрузки шрифтов */
  function loaded() { body.classList.add('is-loaded'); fitH1(); }
  if (doc.fonts && doc.fonts.ready) { doc.fonts.ready.then(loaded, loaded); } else { setTimeout(loaded, 300); }
  setTimeout(loaded, 1500);

  /* языки: русский в разметке, казахский словарь грузится отдельным файлом по выбору KZ */
  var I18N = { ru: {}, kk: null };
  var nodes = Array.prototype.slice.call(doc.querySelectorAll('[data-i18n]'));
  var phNodes = Array.prototype.slice.call(doc.querySelectorAll('[data-i18n-ph]'));
  var META = {
    title: doc.title,
    description: (doc.querySelector('meta[name="description"]') || {}).content || ''
  };
  nodes.forEach(function (el) { var k = el.getAttribute('data-i18n'); if (!(k in I18N.ru)) I18N.ru[k] = el.innerHTML; });
  phNodes.forEach(function (el) { var k = el.getAttribute('data-i18n-ph'); if (!(k in I18N.ru)) I18N.ru[k] = el.getAttribute('placeholder') || ''; });

  function loadLang(lang, done) {
    if (lang !== 'kk' || I18N.kk) return done();
    var s = doc.createElement('script');
    s.src = 'assets/lang/kk.js' + (ASSET_V ? '?v=' + ASSET_V : '');
    s.onload = function () { if (window.SITE_KK) I18N.kk = window.SITE_KK; done(); };
    s.onerror = function () { done(); };
    doc.head.appendChild(s);
  }
  function applyLang(lang) {
    var dict = (lang === 'kk' && I18N.kk) ? I18N.kk : null;
    if (lang === 'kk' && !dict) lang = 'ru';
    nodes.forEach(function (el) {
      var k = el.getAttribute('data-i18n');
      var v = dict ? dict[k] : I18N.ru[k];
      if (v == null) v = I18N.ru[k];
      if (v != null && el.innerHTML !== v) el.innerHTML = v;
    });
    phNodes.forEach(function (el) {
      var k = el.getAttribute('data-i18n-ph');
      var v = dict ? dict[k] : I18N.ru[k];
      el.setAttribute('placeholder', v != null ? v : I18N.ru[k]);
    });
    doc.documentElement.lang = lang;
    doc.title = dict && dict['meta.title'] ? dict['meta.title'] : META.title;
    var md = doc.querySelector('meta[name="description"]');
    if (md) md.content = dict && dict['meta.description'] ? dict['meta.description'] : META.description;
    doc.querySelectorAll('.lang button').forEach(function (b) {
      var on = b.getAttribute('data-lang') === lang;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    try { localStorage.setItem('lang', lang); } catch (e) {}
    fitH1();
  }
  function setLang(lang) { loadLang(lang, function () { applyLang(lang); }); }
  window.setLang = setLang;
  doc.querySelectorAll('.lang button').forEach(function (b) {
    b.addEventListener('click', function () { setLang(b.getAttribute('data-lang')); });
  });
  (function initLang() {
    var forced = (location.search.match(/[?&]lang=(ru|kk)/) || [])[1];
    var saved = null;
    try { saved = localStorage.getItem('lang'); } catch (e) {}
    var lang = forced || saved || 'ru';
    if (lang === 'kk') setLang('kk');
  })();

  /* заголовок героя: уменьшать кегль, пока слово не влезает (казахский длиннее) */
  var h1 = doc.querySelector('.hero h1');
  function fitH1() {
    if (!h1) return;
    h1.style.fontSize = '';
    var size = parseFloat(getComputedStyle(h1).fontSize);
    var guard = 0;
    while (h1.scrollWidth > h1.clientWidth + 1 && guard < 10) {
      size *= 0.95; h1.style.fontSize = size + 'px'; guard++;
    }
  }
  var lastW = window.innerWidth;
  window.addEventListener('resize', function () { if (window.innerWidth === lastW) return; lastW = window.innerWidth; fitH1(); });

  /* шапка и меню */
  var hdr = doc.querySelector('.hdr');
  var burger = doc.querySelector('.burger');
  var menu = doc.getElementById('menu');
  function setMenu(open) {
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    menu.hidden = !open;
    body.classList.toggle('menu-open', open);
  }
  burger.addEventListener('click', function () { setMenu(menu.hidden); });
  menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) setMenu(false); });
  window.addEventListener('resize', function () { if (window.innerWidth >= 1024 && !menu.hidden) setMenu(false); });

  /* золотой шов в блоке «С чем вы приходите»: прогресс по прокрутке */
  var symList = doc.querySelector('.sym-list');
  var symItems = Array.prototype.slice.call(doc.querySelectorAll('.sym-item'));
  var ticking = false;
  function measure() {
    ticking = false;
    if (!symList || reduce) return;
    var vh = window.innerHeight;
    var r = symList.getBoundingClientRect();
    if (r.bottom < -200 || r.top > vh + 200) return;
    var start = vh * 0.8;
    var p = (start - r.top) / (r.height + vh * 0.3);
    p = Math.max(0, Math.min(1, p));
    symList.style.setProperty('--p', p.toFixed(4));
    for (var i = 0; i < symItems.length; i++) {
      var ir = symItems[i].getBoundingClientRect();
      symItems[i].classList.toggle('is-on', ir.top + 40 < start);
    }
  }
  function request() { if (!ticking) { ticking = true; requestAnimationFrame(measure); } }
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request);
  measure();
  if (reduce && symList) { symList.style.setProperty('--p', '1'); symItems.forEach(function (el) { el.classList.add('is-on'); }); }

  /* тихое проявление: фото и блик золота на логотипе */
  var rv = doc.querySelectorAll('.rv, .centr-logo');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.25 });
    rv.forEach(function (el) { io.observe(el); });
  } else {
    rv.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* видеоотзыв: ролик грузится только по клику, в модальном плеере */
  var vmodal = doc.getElementById('vmodal');
  if (vmodal) {
    var video = vmodal.querySelector('video');
    var lastFocus = null;
    function openVideo(src) {
      lastFocus = doc.activeElement;
      if (video.getAttribute('src') !== src) video.setAttribute('src', src);
      vmodal.classList.add('is-open');
      vmodal.setAttribute('aria-hidden', 'false');
      body.classList.add('modal-open');
      var p = video.play();
      if (p && p.catch) p.catch(function () {});
      vmodal.querySelector('.vm-x').focus();
    }
    function closeVideo() {
      video.pause();
      vmodal.classList.remove('is-open');
      vmodal.setAttribute('aria-hidden', 'true');
      body.classList.remove('modal-open');
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }
    doc.querySelectorAll('[data-video]').forEach(function (b) {
      b.addEventListener('click', function () { openVideo(b.getAttribute('data-video')); });
    });
    vmodal.querySelectorAll('[data-close]').forEach(function (b) { b.addEventListener('click', closeVideo); });
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && vmodal.classList.contains('is-open')) closeVideo(); });
  }

  /* форма: собирает сообщение и открывает WhatsApp */
  var form = doc.getElementById('form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var phone = form.elements.phone;
      var digits = (phone.value || '').replace(/\D/g, '');
      if (digits.length < 10) {
        phone.classList.add('is-err');
        phone.focus();
        return;
      }
      phone.classList.remove('is-err');
      var agree = form.elements.agree, agreeErr = form.querySelector('.agree-err');
      if (agree && !agree.checked) {
        agree.closest('.agree').classList.add('is-err');
        if (agreeErr) agreeErr.hidden = false;
        agree.focus();
        return;
      }
      var name = (form.elements.name.value || '').trim();
      var fmt = form.querySelector('input[name="format"]:checked');
      var msg = (form.elements.message.value || '').trim();
      var text = 'Здравствуйте, Тажигуль! Хочу записаться на диагностику.' +
        (name ? '\nИмя: ' + name : '') +
        '\nТелефон: ' + phone.value.trim() +
        (fmt ? '\nФормат: ' + fmt.value : '') +
        (msg ? '\n' + msg : '') +
        '\nС договором оферты ознакомлен(а) и согласен(на).';
      if (window.sendConversion) window.sendConversion('form');
      window.open('https://wa.me/' + WA + '?text=' + encodeURIComponent(text), '_blank', 'noopener');
      var ok = form.querySelector('.form-ok');
      ok.hidden = false;
      ok.focus();
    });
    form.elements.phone.addEventListener('input', function () { this.classList.remove('is-err'); });
    if (form.elements.agree) form.elements.agree.addEventListener('change', function () {
      if (!this.checked) return;
      this.closest('.agree').classList.remove('is-err');
      var er = form.querySelector('.agree-err'); if (er) er.hidden = true;
    });
  }

  /* переход по якорям с учётом шапки */
  doc.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href').slice(1);
    if (!id) return;
    var target = doc.getElementById(id);
    if (!target) return;
    e.preventDefault();
    var top = target.getBoundingClientRect().top + window.scrollY - hdr.offsetHeight + 1;
    window.scrollTo({ top: top, behavior: reduce ? 'auto' : 'smooth' });
    if (history.pushState) history.pushState(null, '', '#' + id);
  });
})();

/* ленты со стрелками и просмотр крупно (02.11.2026) */
(function () {
  var d = document;
  d.querySelectorAll('.lane-wrap').forEach(function (w) {
    var lane = w.querySelector('.lane'), prev = w.querySelector('.lane-prev'), next = w.querySelector('.lane-next');
    function step() { var li = lane.querySelector('li'); return li ? li.getBoundingClientRect().width + 18 : 300; }
    function upd() {
      var max = lane.scrollWidth - lane.clientWidth;
      prev.hidden = next.hidden = max <= 2;
      prev.disabled = lane.scrollLeft <= 2;
      next.disabled = lane.scrollLeft >= max - 2;
    }
    prev.addEventListener('click', function () { lane.scrollBy({ left: -step(), behavior: 'smooth' }); });
    next.addEventListener('click', function () { lane.scrollBy({ left: step(), behavior: 'smooth' }); });
    lane.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); next.click(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); prev.click(); }
    });
    lane.addEventListener('scroll', upd, { passive: true });
    window.addEventListener('resize', upd);
    lane.querySelectorAll('img').forEach(function (i) { i.addEventListener('load', upd); });
    var det = w.closest('details');
    if (det) det.addEventListener('toggle', upd);
    upd();
  });
  var box = d.getElementById('lbox'); if (!box) return;
  var img = box.querySelector('img'), list = [], idx = 0, opener = null;
  function show(i) {
    idx = (i + list.length) % list.length; var b = list[idx], im = b.querySelector('img:last-child');
    img.src = b.getAttribute('data-full'); img.alt = b.getAttribute('data-alt') || (im ? im.alt : '');
  }
  function open(b, group, opn) {
    list = Array.prototype.slice.call((group || b.closest('.lane, [data-gallery]')).querySelectorAll('.lane-it'));
    opener = opn || b; show(Math.max(0, list.indexOf(b)));
    box.classList.add('is-open'); box.setAttribute('aria-hidden', 'false'); d.body.style.overflow = 'hidden';
    box.querySelector('.lb-x').focus();
  }
  function close() { box.classList.remove('is-open'); box.setAttribute('aria-hidden', 'true'); d.body.style.overflow = ''; if (opener) opener.focus(); }
  d.querySelectorAll('.lane .lane-it, [data-gallery] .lane-it').forEach(function (b) { b.addEventListener('click', function () { open(b); }); });
  d.querySelectorAll('[data-gallery-open]').forEach(function (t) {
    t.addEventListener('click', function () {
      var g = d.querySelector(t.getAttribute('data-gallery-open'));
      if (g) open(g.querySelector('.lane-it'), g, t);
    });
  });
  box.querySelectorAll('[data-lb-close]').forEach(function (b) { b.addEventListener('click', close); });
  box.querySelector('.lb-prev').addEventListener('click', function () { show(idx - 1); });
  box.querySelector('.lb-next').addEventListener('click', function () { show(idx + 1); });
  d.addEventListener('keydown', function (e) {
    if (!box.classList.contains('is-open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowRight') show(idx + 1);
    if (e.key === 'ArrowLeft') show(idx - 1);
  });
})();

/* счётчик цифр опыта */
(function () {
  var els = document.querySelectorAll('[data-count]');
  if (!els.length || !('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  function fmt(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0'); }
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      var el = e.target, to = +el.getAttribute('data-count'), t0 = null, d = 1600;
      el.style.minWidth = el.getBoundingClientRect().width + 'px';
      function step(t) {
        if (t0 === null) t0 = t;
        var k = Math.min(1, (t - t0) / d), v = Math.round(to * (1 - Math.pow(1 - k, 3)));
        el.textContent = fmt(v);
        if (k < 1) requestAnimationFrame(step);
      }
      el.textContent = '0';
      requestAnimationFrame(step);
    });
  }, { threshold: 0.6 });
  els.forEach(function (el) { io.observe(el); });
})();
