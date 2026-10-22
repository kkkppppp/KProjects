/* Prepared local copy; no translation service or API key is used. */
(() => {
  'use strict';
  const languages = ['en', 'es', 'pt', 'fr'];
  const nativeNames = { en: 'English', es: 'Español', pt: 'Português', fr: 'Français' };
  const labels = {
    en: ['Language', 'Automatic'], es: ['Idioma', 'Automático'],
    pt: ['Idioma', 'Automático'], fr: ['Langue', 'Automatique']
  };
  const key = 'kprojects.language.v1';
  const normalize = text => text.replace(/\s+/g, ' ').trim();
  const dictionary = window.KP_TRANSLATIONS || {};
  const safeRead = (storage, name) => { try { return window[storage].getItem(name); } catch { return null; } };
  const safeWrite = (storage, name, value) => { try { value === null ? window[storage].removeItem(name) : window[storage].setItem(name, value); } catch {} };
  const browserLanguage = () => (navigator.languages || [navigator.language || 'en'])
    .map(v => v.toLowerCase().split('-')[0]).find(v => languages.includes(v)) || 'en';
  const countryLanguage = (country, fallback) => {
    if ('ES MX AR BO CL CO CR CU DO EC SV GT HN NI PA PY PE PR UY VE GQ'.split(' ').includes(country)) return 'es';
    if ('PT BR AO MZ CV GW ST TL'.split(' ').includes(country)) return 'pt';
    if ('FR MC BF BJ CD CG CI GA GN ML NE SN TG GF GP MQ RE YT PF NC'.split(' ').includes(country)) return 'fr';
    // Multilingual countries follow a supported browser preference before a regional default.
    if (['BE', 'CH', 'LU', 'CA', 'CM', 'HT'].includes(country)) return fallback;
    return fallback;
  };
  let manual = safeRead('localStorage', key);
  if (!languages.includes(manual)) manual = null;
  let language = manual || browserLanguage();
  let detected = browserLanguage();
  let revision = 0;
  let queued = false;
  const textSources = new WeakMap();
  const attrSources = new WeakMap();
  const ignored = 'script,style,textarea,code,pre,x-dc,kp-language,[translate="no"],[data-no-translate]';
  function translate(source) {
    if (language === 'en') return source;
    const clean = normalize(source);
    let value = dictionary[clean]?.[language];
    const studies = clean.match(/^· (\d+) peer-reviewed studies$/);
    if (studies) value = '· ' + studies[1] + ' ' + { es: 'estudios revisados por pares', pt: 'estudos com revisão por pares', fr: 'études évaluées par les pairs' }[language];
    if (!value && clean.startsWith('Play ')) value = dictionary.Play[language] + ' ' + (dictionary[clean.slice(5)]?.[language] || clean.slice(5));
    return value ? source.match(/^\s*/)[0] + value + source.match(/\s*$/)[0] : source;
  }
  function applyText(node) {
    if (!node.parentElement || node.parentElement.closest(ignored)) return;
    const current = node.nodeValue;
    let record = textSources.get(node);
    if (!record || current !== record.output) record = { source: current };
    record.output = translate(record.source);
    textSources.set(node, record);
    if (current !== record.output) node.nodeValue = record.output;
  }
  function applyAttributes(element) {
    if (element.closest(ignored)) return;
    let records = attrSources.get(element);
    if (!records) attrSources.set(element, records = {});
    for (const name of ['alt', 'title', 'aria-label']) {
      if (!element.hasAttribute(name)) continue;
      const current = element.getAttribute(name);
      let record = records[name];
      if (!record || current !== record.output) record = { source: current };
      record.output = translate(record.source);
      records[name] = record;
      if (current !== record.output) element.setAttribute(name, record.output);
    }
  }
  function apply() {
    queued = false;
    const root = document.getElementById('dc-root');
    if (root) {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) applyText(walker.currentNode);
      root.querySelectorAll('[alt],[title],[aria-label]').forEach(applyAttributes);
    }
    document.documentElement.lang = language;
    document.title = translate('KProjects — Music Projects Catalogue');
    const description = document.querySelector('meta[name="description"]');
    if (description) description.content = translate('International artists, music projects and collaborations. Explore the KProjects catalogue and contact producer Kate Podakin.');
    document.querySelectorAll('kp-language').forEach(control => control.refresh());
  }
  function schedule() {
    if (!queued) { queued = true; requestAnimationFrame(apply); }
  }
  function select(value) {
    revision++;
    manual = languages.includes(value) ? value : null;
    safeWrite('localStorage', key, manual);
    language = manual || detected;
    apply();
    if (!manual) detectCountry();
  }
  const boundSelectors = new WeakSet();
  class LanguageControl extends HTMLElement {
    connectedCallback() {
      // Do not populate the raw template: its descendants are later cloned by React.
      if (this.closest?.('x-dc')) return;
      let selectElement = this.querySelector('select');
      if (!selectElement) {
        selectElement = document.createElement('select');
        for (const value of ['auto', ...languages]) {
          const option = document.createElement('option'); option.value = value;
          option.textContent = value === 'auto' ? labels[language][1] : nativeNames[value];
          selectElement.appendChild(option);
        }
        this.appendChild(selectElement);
      }
      // Bind an existing/cloned select too, exactly once per actual DOM element.
      if (!boundSelectors.has(selectElement)) {
        selectElement.addEventListener('change', event => select(event.target.value));
        boundSelectors.add(selectElement);
      }
      this.refresh();
    }
    refresh() {
      const selectElement = this.querySelector('select'); if (!selectElement) return;
      selectElement.setAttribute('aria-label', labels[language][0]);
      selectElement.options[0].textContent = `${labels[language][1]} · ${language.toUpperCase()}`;
      selectElement.value = manual || 'auto';
      this.setAttribute('data-language', language.toUpperCase());
    }
  }
  customElements.define('kp-language', LanguageControl);
  async function detectCountry() {
    if (manual) return;
    const ticket = revision;
    let country;
    try {
      const cached = JSON.parse(safeRead('sessionStorage', 'kprojects.country.v1'));
      if (cached && Date.now() - cached.time < 21600000 && /^[A-Z]{2}$/.test(cached.country)) country = cached.country;
    } catch {}
    if (!country) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2200);
      try {
        // Country-level IP lookup only; no GPS, cookies, or retained IP addresses.
        const response = await fetch('https://api.country.is/', { signal: controller.signal, credentials: 'omit', referrerPolicy: 'no-referrer' });
        if (!response.ok) throw new Error('Country unavailable');
        const result = await response.json();
        if (/^[A-Z]{2}$/.test(result.country)) {
          country = result.country;
          safeWrite('sessionStorage', 'kprojects.country.v1', JSON.stringify({ country, time: Date.now() }));
        }
      } catch {} finally { clearTimeout(timer); }
    }
    if (ticket !== revision || manual) return;
    detected = countryLanguage(country, browserLanguage());
    language = detected;
    apply();
  }
  new MutationObserver(records => {
    if (records.some(record => !record.target.parentElement?.closest('kp-language') &&
      !(record.target.nodeType === 1 && record.target.closest?.('kp-language')))) schedule();
  }).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['alt', 'title', 'aria-label'] });
  apply();
  detectCountry();
})();
