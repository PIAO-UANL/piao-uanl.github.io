// mobile menu
var menuBtn = document.getElementById('menuBtn');
var navLinks = document.getElementById('navLinks');
var navBackdrop = document.getElementById('navBackdrop');

function openMenu(){
  navLinks.classList.add('open');
  navBackdrop.classList.add('show');
  document.body.classList.add('menu-open');
  menuBtn.setAttribute('aria-expanded', 'true');
}
function closeMenu(){
  navLinks.classList.remove('open');
  navBackdrop.classList.remove('show');
  document.body.classList.remove('menu-open');
  menuBtn.setAttribute('aria-expanded', 'false');
}
menuBtn.addEventListener('click', function(){
  if(navLinks.classList.contains('open')){ closeMenu(); } else { openMenu(); }
});
navBackdrop.addEventListener('click', closeMenu);
document.addEventListener('keydown', function(e){
  if(e.key === 'Escape') closeMenu();
});
window.addEventListener('resize', function(){
  if(window.innerWidth > 820) closeMenu();
});
document.querySelectorAll('nav.links a').forEach(function(a){
  a.addEventListener('click', closeMenu);
});

// red neuronal del hero: los nodos derivan y las conexiones los siguen
(function(){
  var svg = document.querySelector('.hero-graphic');
  var hero = document.querySelector('.hero');
  if(!svg || !hero) return;
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var VIEW_W = 1200, VIEW_H = 600, MARGIN = 40, FRAME_MS = 33;

  var points = Array.prototype.map.call(svg.querySelectorAll('circle'), function(circle){
    function drift(){
      var s = 0.12 + Math.random() * 0.2;
      return Math.random() < 0.5 ? -s : s;
    }
    return {
      el: circle,
      x: parseFloat(circle.getAttribute('cx')),
      y: parseFloat(circle.getAttribute('cy')),
      vx: drift(),
      vy: drift()
    };
  });

  var edges = Array.prototype.map.call(svg.querySelectorAll('line'), function(line){
    return { el: line, a: points[+line.dataset.a], b: points[+line.dataset.b] };
  }).filter(function(edge){ return edge.a && edge.b; });

  var running = false, lastFrame = 0;

  function step(now){
    if(!running) return;
    if(now - lastFrame >= FRAME_MS){
      lastFrame = now;
      points.forEach(function(p){
        p.x += p.vx;
        p.y += p.vy;
        if(p.x < MARGIN || p.x > VIEW_W - MARGIN) p.vx = -p.vx;
        if(p.y < MARGIN || p.y > VIEW_H - MARGIN) p.vy = -p.vy;
        p.el.setAttribute('cx', p.x.toFixed(1));
        p.el.setAttribute('cy', p.y.toFixed(1));
      });
      edges.forEach(function(e){
        e.el.setAttribute('x1', e.a.x.toFixed(1));
        e.el.setAttribute('y1', e.a.y.toFixed(1));
        e.el.setAttribute('x2', e.b.x.toFixed(1));
        e.el.setAttribute('y2', e.b.y.toFixed(1));
      });
    }
    requestAnimationFrame(step);
  }

  function setRunning(on){
    if(on === running) return;
    running = on;
    if(on) requestAnimationFrame(step);
  }

  // solo se anima mientras el hero está a la vista
  new IntersectionObserver(function(entries){
    setRunning(entries[0].isIntersecting);
  }).observe(hero);

  setRunning(true);
})();

// scroll progress + nav shadow + back to top
var progress = document.getElementById('progress');
var header = document.querySelector('header.nav');
var toTop = document.getElementById('toTop');
function onScroll(){
  var h = document.documentElement;
  var scrolled = (h.scrollTop) / (h.scrollHeight - h.clientHeight) * 100;
  progress.style.width = scrolled + '%';
  header.classList.toggle('scrolled', h.scrollTop > 8);
  toTop.classList.toggle('show', h.scrollTop > 500);
}
document.addEventListener('scroll', onScroll, {passive:true});
onScroll();
toTop.addEventListener('click', function(){ window.scrollTo({top:0, behavior:'smooth'}); });

// active nav link on scroll + sliding indicator
var sections = ['licenciatura','maestria','doctorado','profesorado'].map(function(id){ return document.getElementById(id); });
var navA = Array.from(document.querySelectorAll('nav.links a'));
var navIndicator = document.getElementById('navIndicator');
function updateIndicator(){
  if(!navIndicator) return;
  var activeLink = navA.filter(function(a){ return a.classList.contains('active'); })[0];
  if(!activeLink || window.innerWidth <= 820){
    navIndicator.style.transform = 'translateX(0) scaleX(0)';
    return;
  }
  navIndicator.style.transform = 'translateX(' + activeLink.offsetLeft + 'px) scaleX(' + activeLink.offsetWidth + ')';
}
var io = new IntersectionObserver(function(entries){
  entries.forEach(function(entry){
    if(entry.isIntersecting){
      var id = entry.target.id;
      navA.forEach(function(a){ a.classList.toggle('active', a.getAttribute('href') === '#'+id); });
      updateIndicator();
    }
  });
}, {rootMargin:'-45% 0px -45% 0px'});
sections.forEach(function(s){ if(s) io.observe(s); });
window.addEventListener('resize', updateIndicator);

// reveal on scroll (with staggered entrance for repeated lists)
var revealIO = new IntersectionObserver(function(entries){
  entries.forEach(function(entry){
    if(entry.isIntersecting){ entry.target.classList.add('in-view'); revealIO.unobserve(entry.target); }
  });
}, {threshold:0.12});
document.querySelectorAll('.reveal').forEach(function(el){ revealIO.observe(el); });

function staggerReveal(containerSelector, stepMs, maxSteps){
  document.querySelectorAll(containerSelector).forEach(function(container){
    Array.from(container.children).forEach(function(item, i){
      item.style.transitionDelay = (Math.min(i, maxSteps) * stepMs) + 'ms';
      revealIO.observe(item);
    });
  });
}
staggerReveal('.optativas-grid', 60, 6);
staggerReveal('.faculty-grid', 45, 8);

// fotos del profesorado en móvil: como no hay hover, la que queda en el centro
// de la pantalla se enciende a color y las demás se apagan a gris, una por una
(function(){
  var section = document.getElementById('profesorado');
  var cards = Array.from(document.querySelectorAll('.fac-card'));
  if(!section || !cards.length) return;
  if(!window.matchMedia('(hover: none)').matches) return;

  var active = false, ticking = false;

  function update(){
    ticking = false;
    var doc = document.documentElement;
    // si no queda más scroll (o casi), no hay forma de que el centro de la
    // pantalla llegue a coincidir con la última/primera foto: se fuerza
    var atBottom = window.innerHeight + window.scrollY >= doc.scrollHeight - 4;
    var atTop = window.scrollY <= 4;
    var closest;
    if(atBottom){
      closest = cards[cards.length - 1];
    } else if(atTop){
      closest = cards[0];
    } else {
      var centerY = window.innerHeight / 2;
      var closestDist = Infinity;
      cards.forEach(function(card){
        var r = card.getBoundingClientRect();
        if(r.bottom < 0 || r.top > window.innerHeight) return;
        var dist = Math.abs((r.top + r.height / 2) - centerY);
        if(dist < closestDist){ closestDist = dist; closest = card; }
      });
    }
    cards.forEach(function(card){
      var wrap = card.querySelector('.fac-photo-wrap');
      if(wrap) wrap.classList.toggle('is-revealed', card === closest);
    });
  }
  function onScroll(){
    if(!ticking){ ticking = true; requestAnimationFrame(update); }
  }
  function setActive(on){
    if(on === active) return;
    active = on;
    if(on){ update(); document.addEventListener('scroll', onScroll, {passive:true}); }
    else{
      document.removeEventListener('scroll', onScroll, {passive:true});
      cards.forEach(function(card){
        var wrap = card.querySelector('.fac-photo-wrap');
        if(wrap) wrap.classList.remove('is-revealed');
      });
    }
  }
  // solo se calcula mientras la sección de docentes está a la vista
  new IntersectionObserver(function(entries){
    setActive(entries[0].isIntersecting);
  }).observe(section);
})();

// se bloquea el menú de guardar/copiar imagen al mantener presionado
document.querySelectorAll('.fac-photo').forEach(function(img){
  img.addEventListener('contextmenu', function(e){ e.preventDefault(); });
});

// accordion (plan de estudios, catálogo, guía de examen)
document.querySelectorAll('.acc-item').forEach(function(item){
  var trigger = item.querySelector('.acc-trigger');
  trigger.addEventListener('click', function(){
    var isOpen = item.classList.contains('open');
    item.classList.toggle('open', !isOpen);
    trigger.setAttribute('aria-expanded', String(!isOpen));
  });
});
