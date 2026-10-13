/* Shared dark / light theme toggle.
   Applies the saved theme before paint (loaded in <head>) and wires every
   [data-theme-toggle] button. Stores only the UI theme preference. */
(function () {
  'use strict';
  var KEY = 'sdr-theme';

  function read() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function save(value) {
    try { localStorage.setItem(KEY, value); } catch (e) { /* ignore */ }
  }
  function apply(value) {
    document.documentElement.setAttribute('data-theme', value);
  }

  apply(read() === 'light' ? 'light' : 'dark');

  function current() {
    return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  }
  function toggle() {
    var next = current() === 'light' ? 'dark' : 'light';
    apply(next);
    save(next);
    refresh();
    return next;
  }
  function refresh() {
    var light = current() === 'light';
    var btns = document.querySelectorAll('[data-theme-toggle]');
    for (var i = 0; i < btns.length; i++) {
      btns[i].textContent = light ? '\uD83C\uDF19 Dark mode' : '\u2600\uFE0F Light mode';
      btns[i].setAttribute('aria-label', light ? 'Switch to dark mode' : 'Switch to light mode');
    }
  }

  window.SDRTheme = { current: current, toggle: toggle };

  document.addEventListener('DOMContentLoaded', function () {
    var btns = document.querySelectorAll('[data-theme-toggle]');
    for (var i = 0; i < btns.length; i++) {
      btns[i].addEventListener('click', toggle);
    }
    refresh();
  });
})();
