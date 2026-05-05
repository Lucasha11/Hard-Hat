(function () {
  'use strict';

  const input = document.getElementById('site-search');
  const dropdown = document.getElementById('search-dropdown');
  if (!input || !dropdown) return;

  let debounceTimer = null;
  let activeIndex = -1;

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function closeDropdown() {
    dropdown.hidden = true;
    dropdown.innerHTML = '';
    activeIndex = -1;
  }

  function getItems() {
    return Array.from(dropdown.querySelectorAll('li[role="option"]'));
  }

  function setActive(index) {
    const items = getItems();
    items.forEach((li, i) => {
      li.classList.toggle('search-dropdown__item--active', i === index);
    });
    activeIndex = index;
  }

  function renderResults(results) {
    dropdown.innerHTML = '';
    activeIndex = -1;

    if (results.length === 0) {
      const li = document.createElement('li');
      li.className = 'search-dropdown__empty';
      li.textContent = 'No results found';
      dropdown.appendChild(li);
    } else {
      results.forEach(({ siteId, label, sublabel }) => {
        const li = document.createElement('li');
        li.setAttribute('role', 'option');
        li.className = 'search-dropdown__item';

        const a = document.createElement('a');
        a.href = '/sites/' + encodeURIComponent(siteId);
        a.className = 'search-dropdown__link';
        a.innerHTML =
          '<span class="search-dropdown__label">' + escapeHtml(label) + '</span>' +
          (sublabel
            ? '<span class="search-dropdown__sublabel">' + escapeHtml(sublabel) + '</span>'
            : '');

        li.appendChild(a);
        dropdown.appendChild(li);
      });
    }

    dropdown.hidden = false;
  }

  async function runSearch(q) {
    try {
      const res = await fetch('/api/search?q=' + encodeURIComponent(q));
      if (!res.ok) throw new Error('bad response');
      const { results } = await res.json();
      renderResults(results || []);
    } catch (_) {
      closeDropdown();
    }
  }

  input.addEventListener('input', function () {
    clearTimeout(debounceTimer);
    const q = input.value.trim();
    if (!q) { closeDropdown(); return; }
    debounceTimer = setTimeout(() => runSearch(q), 300);
  });

  input.addEventListener('keydown', function (e) {
    const items = getItems();
    if (!items.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive(Math.min(activeIndex + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive(Math.max(activeIndex - 1, 0));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      const link = items[activeIndex].querySelector('a');
      if (link) window.location.href = link.href;
    } else if (e.key === 'Escape') {
      closeDropdown();
    }
  });

  document.addEventListener('click', function (e) {
    if (!e.target.closest('.search-container')) closeDropdown();
  });
})();
