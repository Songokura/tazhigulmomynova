(function () {
  'use strict';

  var doc = document;
  var body = doc.body;
  var WA = '77476686475';

  /* интро: шов под заголовком и появление портрета после загрузки шрифтов */
  function loaded() { body.classList.add('is-loaded'); }
  if (doc.fonts && doc.fonts.ready) { doc.fonts.ready.then(loaded, loaded); } else { setTimeout(loaded, 300); }
  setTimeout(loaded, 1500);

  /* шапка */
  var hdr = doc.querySelector('.hdr');
  var burger = doc.querySelector('.burger');
  var menu = doc.getElementById('menu');

  function onScroll() { hdr.classList.toggle('is-scrolled', window.scrollY > 8); }
  onScroll();

  function setMenu(open) {
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    menu.hidden = !open;
    body.classList.toggle('menu-open', open);
  }
  burger.addEventListener('click', function () { setMenu(menu.hidden); });
  menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) setMenu(false); });
  window.addEventListener('resize', function () { if (window.innerWidth >= 1024 && !menu.hidden) setMenu(false); });

  /* язык: словарь казахской версии подключается отдельным файлом по выбору KZ */
  var langBtns = doc.querySelectorAll('.lang button');
  langBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      var lang = b.getAttribute('data-lang');
      if (window.setLang) { window.setLang(lang); return; }
      langBtns.forEach(function (x) {
        var on = x === b;
        x.classList.toggle('is-active', on);
        x.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
    });
  });

  /* золотой шов в блоке «С чем вы приходите»: прогресс по прокрутке */
  var symList = doc.querySelector('.sym-list');
  var symItems = Array.prototype.slice.call(doc.querySelectorAll('.sym-item'));
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ticking = false;

  function measure() {
    ticking = false;
    onScroll();
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

  /* тихое проявление фотографий */
  var rv = doc.querySelectorAll('.rv');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.15 });
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
      var name = (form.elements.name.value || '').trim();
      var fmt = form.querySelector('input[name="format"]:checked');
      var msg = (form.elements.message.value || '').trim();
      var text = 'Здравствуйте, Тажигуль! Хочу записаться на диагностику.' +
        (name ? '\nИмя: ' + name : '') +
        '\nТелефон: ' + phone.value.trim() +
        (fmt ? '\nФормат: ' + fmt.value : '') +
        (msg ? '\n' + msg : '');
      window.open('https://wa.me/' + WA + '?text=' + encodeURIComponent(text), '_blank', 'noopener');
      var ok = form.querySelector('.form-ok');
      ok.hidden = false;
      ok.focus && ok.focus();
    });
    form.elements.phone.addEventListener('input', function () { this.classList.remove('is-err'); });
  }

  /* плавный переход по якорям с учётом шапки */
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
