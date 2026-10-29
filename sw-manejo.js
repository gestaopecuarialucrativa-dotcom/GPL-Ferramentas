/* =====================================================================
   GPL — Manejo do Curral: abrir SEM INTERNET (service worker)
   - Só cuida da página do manejo (escopo /manejo-curral). Não mexe em
     nenhuma outra ferramenta do site.
   - Página: busca a versão nova na internet; sem sinal, usa a última
     guardada.
   - Planilha (script.google.com): NUNCA passa por aqui — vai direto,
     do jeito que já funcionava.
   Para forçar atualizar este arquivo no celular: mude a VERSAO.
   ===================================================================== */
var VERSAO = 'gpl-manejo-v1';
var BIBLIOTECAS = [];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(VERSAO).then(function (c) {
      // guarda JÁ NA PRIMEIRA ABERTURA: a própria página + as bibliotecas (se falhar uma, não trava)
      var pagina = fetch('/manejo-curral.html', { cache: 'reload' })
        .then(function (r) { if (r && r.ok) return c.put('/manejo-curral.html', r); }).catch(function () {});
      return Promise.all([pagina].concat(BIBLIOTECAS.map(function (u) {
        return fetch(u, { mode: 'no-cors' }).then(function (r) { return c.put(u, r); }).catch(function () {});
      })));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (ks) {
      return Promise.all(ks.filter(function (k) { return k.indexOf('gpl-manejo-') === 0 && k !== VERSAO; })
                           .map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

function ehPaginaManejo(url) {
  return url.origin === self.location.origin && /^\/manejo-curral(\.html)?$/.test(url.pathname);
}

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;                       // POST pra planilha: direto
  var url = new URL(req.url);

  // 1) a página do manejo: internet primeiro, sem sinal usa a guardada
  if (ehPaginaManejo(url)) {
    e.respondWith(
      fetch(req).then(function (r) {
        if (r && r.ok) {
          var copia = r.clone();
          caches.open(VERSAO).then(function (c) { c.put('/manejo-curral.html', copia); });
        }
        return r;
      }).catch(function () {
        return caches.open(VERSAO).then(function (c) { return c.match('/manejo-curral.html'); })
          .then(function (r) { return r || new Response('<h3 style="font-family:Arial">Sem internet e o manejo ainda não foi aberto neste celular com sinal.<br>Abra uma vez com internet que depois ela abre sem.</h3>', { headers: { 'Content-Type': 'text/html; charset=utf-8' } }); });
      })
    );
    return;
  }

  // 2) as 2 bibliotecas: usa a guardada (são versões fixas, não mudam)
  if (BIBLIOTECAS.indexOf(req.url) >= 0) {
    e.respondWith(
      caches.open(VERSAO).then(function (c) {
        return c.match(req.url).then(function (r) {
          return r || fetch(req).then(function (n) { c.put(req.url, n.clone()); return n; });
        });
      })
    );
    return;
  }
  // 3) todo o resto (planilha, outras ferramentas): não mexe
});
