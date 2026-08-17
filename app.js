const GAS_URL = 'https://script.google.com/macros/s/AKfycbw1vKFcrAEHBX7CVpYdDxtAkvc1SYB0WHivhOpC7RyIKk56TyhPRbw7nzLlLbGAdMVGQg/exec';

const frame = document.getElementById('assessmentFrame');
const loadingState = document.getElementById('loadingState');
const reloadButton = document.getElementById('reloadButton');
const openSystemButton = document.getElementById('openSystemButton');

function hideLoading() {
  loadingState?.classList.add('is-hidden');
}

function showLoading() {
  loadingState?.classList.remove('is-hidden');
}

function reloadSystem() {
  if (!frame) return;
  showLoading();
  frame.src = `${GAS_URL}${GAS_URL.includes('?') ? '&' : '?'}t=${Date.now()}`;
}

frame?.addEventListener('load', () => {
  window.setTimeout(hideLoading, 250);
});

reloadButton?.addEventListener('click', reloadSystem);

openSystemButton?.addEventListener('click', () => {
  openSystemButton.blur();
});

window.setTimeout(() => {
  hideLoading();
}, 12000);
