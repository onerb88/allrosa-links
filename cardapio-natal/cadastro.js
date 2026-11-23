/* Cadastro do Cardápio de Natal: pede nome e WhatsApp só na primeira visita. */
(function () {
  // Endereço do script da planilha. Vazio = modo prévia, nada é enviado.
  var ENDPOINT = 'https://script.google.com/macros/s/AKfycbz4TfpYp7IkR6A9YhJACEdfOGQsEkBBtkaKOsC57DfIAOtz4oi5oTkHPNvw9MO9fSuQ1w/exec';

  var CHAVE_OK = 'allrosa-natal-2026-cadastro';
  var CHAVE_FILA = 'allrosa-natal-2026-pendente';
  var DDDS = ('11 12 13 14 15 16 17 18 19 21 22 24 27 28 31 32 33 34 35 37 38 41 42 43 44 45 46 47 48 49 51 53 54 55 ' +
    '61 62 63 64 65 66 67 68 69 71 73 74 75 77 79 81 82 83 84 85 86 87 88 89 91 92 93 94 95 96 97 98 99').split(' ');

  function ler(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function gravar(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function apagar(k) { try { localStorage.removeItem(k); } catch (e) {} }

  function enviar(dados) {
    if (!ENDPOINT) return Promise.resolve();
    gravar(CHAVE_FILA, JSON.stringify(dados));
    return fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(dados),
      keepalive: true
    }).then(function (r) { return r.json(); }).then(function (r) {
      // Só mantém na fila o que pode dar certo depois.
      if (r && (r.ok || r.erro === 'invalido')) apagar(CHAVE_FILA);
    }).catch(function () { /* fica na fila e tenta de novo na próxima visita */ });
  }

  function reenviarPendente() {
    var p = ler(CHAVE_FILA);
    if (!p) return;
    try { enviar(JSON.parse(p)); } catch (e) { apagar(CHAVE_FILA); }
  }

  function numeros(v) {
    var n = v.replace(/\D/g, '');
    if (n.length > 11 && n.slice(0, 2) === '55') n = n.slice(2);
    if (n.charAt(0) === '0') n = n.slice(1);
    return n;
  }
  function mascara(v) {
    var n = numeros(v).slice(0, 11);
    if (n.length < 3) return n;
    if (n.length < 7) return '(' + n.slice(0, 2) + ') ' + n.slice(2);
    var corte = n.length === 11 ? 7 : 6;
    return '(' + n.slice(0, 2) + ') ' + n.slice(2, corte) + '-' + n.slice(corte);
  }
  function zapValido(n) {
    return DDDS.indexOf(n.slice(0, 2)) >= 0 && /^\d{2}(9\d{8}|[2-5]\d{7})$/.test(n) && !/^\d{2}9?(\d)\1{7}$/.test(n);
  }
  function nomeValido(v) { return /[A-Za-zÀ-ÿ]{2}/.test(v); }

  var caixa = document.getElementById('cadastro');
  if (!caixa) return;
  // Só na prévia local: abrir com #resetar mostra o popup de novo.
  if (location.hash === '#resetar') { apagar(CHAVE_OK); apagar(CHAVE_FILA); }

  if (ler(CHAVE_OK)) { reenviarPendente(); return; }

  var form = caixa.querySelector('form');
  var nome = form.elements.nome;
  var zap = form.elements.whatsapp;

  function erro(campo, msg) {
    var alvo = document.getElementById(campo.id + '-erro');
    alvo.textContent = msg;
    campo.setAttribute('aria-invalid', msg ? 'true' : 'false');
    return !msg;
  }
  function checarNome() { return erro(nome, nomeValido(nome.value) ? '' : 'Digite seu nome.'); }
  function checarZap() { return erro(zap, zapValido(numeros(zap.value)) ? '' : 'Digite um WhatsApp válido, com DDD.'); }

  zap.addEventListener('input', function () {
    if (zap.selectionStart === zap.value.length) zap.value = mascara(zap.value);
  });
  zap.addEventListener('blur', function () { zap.value = mascara(zap.value); });

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var okNome = checarNome();
    var okZap = checarZap();
    if (!okNome) { nome.focus(); return; }
    if (!okZap) { zap.focus(); return; }
    enviar({
      nome: nome.value.trim(),
      whatsapp: numeros(zap.value),
      novidades: form.elements.novidades.checked,
      site: form.elements.site.value
    });
    gravar(CHAVE_OK, new Date().toISOString());
    fechar();
  });

  // Obrigatório: Esc não fecha.
  caixa.addEventListener('cancel', function (ev) { ev.preventDefault(); });
  caixa.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') ev.preventDefault(); });

  function fechar() {
    document.documentElement.classList.remove('travado');
    if (caixa.close) caixa.close(); else caixa.removeAttribute('open');
  }
  document.documentElement.classList.add('travado');
  if (caixa.showModal) caixa.showModal(); else caixa.setAttribute('open', '');
})();
