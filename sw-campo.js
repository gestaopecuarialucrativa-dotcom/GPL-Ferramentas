/* =====================================================================
   GPL — Anotar no campo: abrir SEM INTERNET (service worker)
   - Só cuida da página campo-gpl.html (escopo /campo-gpl). Não mexe em
     nenhuma outra ferramenta do site.
   - Página: busca a versão nova na internet; sem sinal, usa a última guardada.
   - Planilha (script.google.com): nunca passa por aqui.
   Para forçar atualizar este arquivo no celular: mude a VERSAO.
   ===================================================================== */
var VERSAO = 'gpl-campo-v2';
var PAGINA = '/campo-gpl.html';

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(VERSAO).then(function (c) {
      return fetch(PAGINA, { cache: 'reload' }).then(function (r) { if (r && r.ok) return c.put(PAGINA, r); }).catch(function () {});
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (ks) {
      return Promise.all(ks.filter(function (k) { return k.indexOf('gpl-campo-') === 0 && k !== VERSAO; })
                           .map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin || !/^\/campo-gpl(\.html)?$/.test(url.pathname)) return;
  e.respondWith(
    fetch(req).then(function (r) {
      if (r && r.ok) { var copia = r.clone(); caches.open(VERSAO).then(function (c) { c.put(PAGINA, copia); }); }
      return r;
    }).catch(function () {
      return caches.open(VERSAO).then(function (c) { return c.match(PAGINA); }).then(function (r) {
        return r || new Response('<h3 style="font-family:Arial;padding:20px">Sem internet e esta página ainda não foi aberta neste celular com sinal.<br>Abra uma vez com internet que depois ela abre sem.</h3>', { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
      });
    })
  );
});
