/**
 * Shared storefront behaviour and UI helpers.
 */
(function () {
  document.documentElement.classList.add('js');

  const CFG = Marowa.config;
  const Store = Marowa.Store;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function escapeAttribute(value) {
    return escapeHtml(value).replace(/`/g, '&#96;');
  }

  function currencyLabel(currency) {
    return currency === 'KES' ? 'KSh' : currency || 'KSh';
  }

  function formatMoney(value) {
    if (value === null || value === undefined || value === '' || Number.isNaN(Number(value))) return '';
    const settings = Store.getSettings();
    const number = Number(value);
    const formatted = new Intl.NumberFormat('en-KE', { maximumFractionDigits: 0 }).format(number);
    return `${currencyLabel(settings.currency)} ${formatted}`;
  }

  function formatNumber(value) {
    return new Intl.NumberFormat('en-KE').format(Number(value) || 0);
  }

  function formatDate(value, options) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('en-KE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      ...(options || {})
    }).format(date);
  }

  function formatDateTime(value) {
    return formatDate(value, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  function timeAgo(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const seconds = Math.round((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours} hr${hours === 1 ? '' : 's'} ago`;
    const days = Math.round(hours / 24);
    if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
    return formatDate(value);
  }

  const STOCK = {
    'in-stock': { label: 'In stock', className: 'in-stock' },
    'low-stock': { label: 'Low stock', className: 'low-stock' },
    'out-of-stock': { label: 'Out of stock', className: 'out-of-stock' },
    contact: { label: 'Confirm availability', className: 'contact' }
  };

  function stockMeta(status) {
    return STOCK[status] || STOCK.contact;
  }

  function categoryName(id) {
    const found = Store.getCategories().find((c) => c.id === id);
    return found ? found.name : id;
  }

  function categoryById(id) {
    return Store.getCategories().find((c) => c.id === id) || null;
  }

  function productPath(product) {
    return `product-details.html?id=${encodeURIComponent(product.id)}`;
  }

  function safeImage(path) {
    if (!path) return 'assets/img/placeholder.svg';
    if (path.startsWith('assets/') || /^https?:\/\//i.test(path)) return path;
    return 'assets/img/placeholder.svg';
  }

  function priceBlock(product, compact) {
    const settings = Store.getSettings();
    const hasPrice = typeof product.price === 'number';
    if (hasPrice && settings.showIndicativePrices) {
      return (
        `<div class="price-block"><span class="price">${formatMoney(product.price)}</span>` +
        `<span class="price-note">Indicative demo price</span></div>`
      );
    }
    if (hasPrice) {
      return (
        `<div class="price-block"><span class="price price--request">Price hidden</span>` +
        `<span class="price-note">Indicative demo prices are hidden in demo settings</span></div>`
      );
    }
    return (
      `<div class="price-block"><span class="price price--request">Confirm price</span>` +
      `<span class="price-note">Contact us to confirm current price &amp; availability</span></div>`
    );
  }

  function renderProductCard(product, options = {}) {
    const stock = stockMeta(product.stockStatus);
    const canAddToCart = product.stockStatus !== 'out-of-stock';
    const category = categoryName(product.category);
    const image = safeImage(product.image);
    const compactClass = options.compact ? ' product-card--compact' : '';
    return `
      <article class="product-card${compactClass}" data-product-card="${escapeAttribute(product.id)}">
        <div class="product-card__media">
          <a href="${productPath(product)}" class="product-card__image-link" tabindex="-1" aria-hidden="true">
            <img src="${escapeAttribute(image)}" alt="${escapeAttribute(product.imageAlt || product.name)}"
                 width="900" height="675" loading="lazy" decoding="async">
          </a>
          <span class="demo-chip" title="Demonstration catalogue entry">Demo</span>
          <span class="stock-badge stock-badge--${stock.className}">${escapeHtml(stock.label)}</span>
        </div>
        <div class="product-card__body">
          <div class="product-card__meta">
            <span>${escapeHtml(product.brand)}</span>
            <span class="mono">${escapeHtml(product.sku)}</span>
          </div>
          <h3 class="product-card__title"><a href="${productPath(product)}">${escapeHtml(product.name)}</a></h3>
          <p class="product-card__sub">${escapeHtml(category)} · ${escapeHtml(product.unit)}</p>
          ${priceBlock(product)}
          <div class="product-card__actions">
            <button class="btn btn--sm btn--outline btn--quote" type="button"
                    data-add-quote="${escapeAttribute(product.id)}"
                    aria-label="Add ${escapeAttribute(product.name)} to quotation request">
              ${Marowa.icon('clipboard', 15)} <span>Add to quote</span>
            </button>
            <button class="btn btn--icon btn--dark" type="button"
                    data-add-cart="${escapeAttribute(product.id)}"
                    aria-label="Add ${escapeAttribute(product.name)} to cart"
                    ${canAddToCart ? '' : 'disabled'}
                    title="${canAddToCart ? 'Add to cart' : 'Out of stock in this demonstration'}">
              ${Marowa.icon('cart', 18)}
            </button>
          </div>
        </div>
      </article>`;
  }

  function renderCategoryCard(category, count, index) {
    return `
      <a class="category-card" href="products.html?category=${encodeURIComponent(category.id)}">
        <div class="category-card__media">
          <img src="${escapeAttribute(safeImage(category.image))}" alt="${escapeAttribute(category.imageAlt)}"
               width="800" height="600" loading="lazy" decoding="async">
          <span class="category-card__index mono">${String(index + 1).padStart(2, '0')}</span>
        </div>
        <div class="category-card__body">
          <span class="eyebrow">${escapeHtml(category.eyebrow)}</span>
          <h3>${escapeHtml(category.name)}</h3>
          <p>${escapeHtml(category.description)}</p>
          <span class="category-card__link">
            <span>${count} demo listing${count === 1 ? '' : 's'}</span>
            ${Marowa.icon('arrow-right', 16)}
          </span>
        </div>
      </a>`;
  }

  function hydrateIcons(root = document) {
    $$('[data-icon]', root).forEach((node) => {
      const name = node.getAttribute('data-icon');
      const size = Number(node.getAttribute('data-icon-size')) || 20;
      node.innerHTML = Marowa.icon(name, size);
    });
  }

  /* ----------------------------------------------------------------------- *
   * Toasts and dialogs
   * ----------------------------------------------------------------------- */
  function toastRegion() {
    let region = $('#toastRegion');
    if (!region) {
      region = document.createElement('div');
      region.id = 'toastRegion';
      region.className = 'toast-region';
      region.setAttribute('aria-live', 'polite');
      region.setAttribute('aria-atomic', 'false');
      document.body.appendChild(region);
    }
    return region;
  }

  function toast(message, options = {}) {
    const type = options.type || 'info';
    const duration = options.duration || (type === 'error' ? 7000 : 4800);
    const region = toastRegion();
    const el = document.createElement('div');
    el.className = `toast toast--${type}`;
    el.setAttribute('role', type === 'error' ? 'alert' : 'status');
    const iconName = type === 'success' ? 'check-circle' : type === 'error' ? 'alert' : 'info';
    el.innerHTML = `
      <span class="toast__icon">${Marowa.icon(iconName, 20)}</span>
      <p class="toast__message">${escapeHtml(message)}</p>
      ${options.action && options.action.href
        ? `<a class="toast__action" href="${escapeAttribute(options.action.href)}">${escapeHtml(options.action.label || 'View')}</a>`
        : ''}
      <button class="toast__close" type="button" aria-label="Dismiss notification">${Marowa.icon('close', 16)}</button>`;
    region.appendChild(el);
    const remove = () => {
      el.classList.add('is-leaving');
      window.setTimeout(() => el.remove(), 180);
    };
    $('.toast__close', el).addEventListener('click', remove);
    let timer = window.setTimeout(remove, duration);
    el.addEventListener('mouseenter', () => window.clearTimeout(timer));
    el.addEventListener('mouseleave', () => {
      timer = window.setTimeout(remove, 1800);
    });
    return el;
  }

  let confirmDialog = null;
  let activeConfirmCancel = null;
  function buildConfirmDialog() {
    if (confirmDialog) return confirmDialog;
    confirmDialog = document.createElement('dialog');
    confirmDialog.className = 'confirm-dialog';
    confirmDialog.innerHTML = `
      <form method="dialog" class="confirm-dialog__inner">
        <div class="confirm-dialog__icon" id="confirmDialogIcon"></div>
        <h2 id="confirmDialogTitle">Confirm action</h2>
        <p id="confirmDialogMessage"></p>
        <div class="confirm-dialog__actions">
          <button class="btn btn--outline" type="button" value="cancel" id="confirmCancel">Cancel</button>
          <button class="btn btn--dark" type="button" value="confirm" id="confirmConfirm">Confirm</button>
        </div>
      </form>`;
    document.body.appendChild(confirmDialog);
    return confirmDialog;
  }

  function confirmAction(options = {}) {
    const dialog = buildConfirmDialog();
    $('#confirmDialogTitle', dialog).textContent = options.title || 'Confirm action';
    $('#confirmDialogMessage', dialog).textContent = options.message || 'Are you sure?';
    const confirmBtn = $('#confirmConfirm', dialog);
    const cancelBtn = $('#confirmCancel', dialog);
    confirmBtn.textContent = options.confirmLabel || 'Confirm';
    confirmBtn.className = `btn ${options.danger ? 'btn--danger' : 'btn--dark'}`;
    cancelBtn.textContent = options.cancelLabel || 'Cancel';
    $('#confirmDialogIcon', dialog).innerHTML = Marowa.icon(options.danger ? 'alert' : 'info', 24);

    // If a previous confirmation is still open, settle it before reusing the
    // single dialog instance.
    if (activeConfirmCancel) activeConfirmCancel();

    dialog.returnValue = 'cancel';
    return new Promise((resolve) => {
      let settled = false;
      const cleanup = () => {
        confirmBtn.removeEventListener('click', onConfirm);
        cancelBtn.removeEventListener('click', onCancel);
        dialog.removeEventListener('click', onBackdrop);
        dialog.removeEventListener('cancel', onNativeCancel);
        dialog.removeEventListener('close', onClose);
        if (activeConfirmCancel === cancel) activeConfirmCancel = null;
      };
      const settle = (value) => {
        if (settled) return;
        settled = true;
        cleanup();
        dialog.returnValue = value;
        if (dialog.open) dialog.close(value);
        resolve(value === 'confirm');
      };
      const onConfirm = (event) => {
        event.preventDefault();
        settle('confirm');
      };
      const onCancel = (event) => {
        event.preventDefault();
        settle('cancel');
      };
      const onBackdrop = (event) => {
        if (event.target === dialog) settle('cancel');
      };
      const onNativeCancel = (event) => {
        event.preventDefault();
        settle('cancel');
      };
      const onClose = () => {
        if (!settled) settle(dialog.returnValue === 'confirm');
      };
      const cancel = () => settle('cancel');
      activeConfirmCancel = cancel;
      confirmBtn.addEventListener('click', onConfirm);
      cancelBtn.addEventListener('click', onCancel);
      dialog.addEventListener('click', onBackdrop);
      dialog.addEventListener('cancel', onNativeCancel);
      dialog.addEventListener('close', onClose);
      dialog.showModal();
      window.setTimeout(() => cancelBtn.focus(), 30);
    });
  }

  function setButtonBusy(button, busy, label) {
    if (!button) return;
    if (busy) {
      if (!button.dataset.originalHtml) button.dataset.originalHtml = button.innerHTML;
      button.disabled = true;
      button.innerHTML = `<span class="btn-spinner" aria-hidden="true"></span> ${escapeHtml(label || 'Working…')}`;
    } else {
      button.disabled = false;
      if (button.dataset.originalHtml) {
        button.innerHTML = button.dataset.originalHtml;
        delete button.dataset.originalHtml;
      }
    }
  }

  /* ----------------------------------------------------------------------- *
   * Print helper (browser print → PDF)
   * ----------------------------------------------------------------------- */
  function printHtml(title, bodyHtml) {
    const win = window.open('', '_blank');
    if (!win) {
      toast('Allow pop-ups for this site to open the printable document.', { type: 'error' });
      return false;
    }
    try {
      win.opener = null;
    } catch {
      /* ignore */
    }
    const styles = `
      :root { color-scheme: light; }
      * { box-sizing: border-box; }
      html, body { margin: 0; padding: 0; background: #fff; color: #101820; }
      body { font-family: "Inter", Arial, Helvetica, sans-serif; font-size: 12px; line-height: 1.55; padding: 28px; }
      h1, h2, h3, h4 { font-family: Arial, Helvetica, sans-serif; margin: 0; line-height: 1.15; letter-spacing: -0.02em; }
      h1 { font-size: 24px; }
      h2 { font-size: 16px; margin-bottom: 8px; }
      h3 { font-size: 13px; }
      p { margin: 0 0 8px; }
      .doc { max-width: 820px; margin: 0 auto; }
      .doc-head { display: flex; justify-content: space-between; gap: 24px; border-bottom: 2px solid #101820; padding-bottom: 16px; margin-bottom: 18px; }
      .doc-brand { font-size: 25px; font-weight: 800; letter-spacing: -0.04em; }
      .doc-brand small { display: block; font-size: 10px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; color: #6c757c; margin-top: 3px; }
      .doc-meta { text-align: right; font-size: 11px; color: #4d575e; }
      .doc-meta strong { color: #101820; }
      .stamp { display: inline-block; border: 2px solid #c94a1a; color: #c94a1a; padding: 5px 9px; font-size: 10px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 12px; }
      .notice { background: #fff3ec; border-left: 4px solid #e85d24; padding: 10px 12px; margin: 14px 0; font-size: 11px; }
      .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin: 14px 0; }
      .panel { border: 1px solid #d9d6ce; padding: 12px; }
      .label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.12em; color: #6c757c; font-weight: 700; margin-bottom: 3px; }
      table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 11px; }
      th { text-align: left; background: #f2f0eb; border-bottom: 1px solid #c9c6bd; padding: 7px 6px; font-size: 9px; text-transform: uppercase; letter-spacing: 0.08em; }
      td { border-bottom: 1px solid #e6e3dc; padding: 7px 6px; vertical-align: top; }
      td.num, th.num { text-align: right; }
      .total { display: flex; justify-content: flex-end; gap: 14px; font-size: 14px; font-weight: 800; margin-top: 8px; }
      .muted { color: #6c757c; }
      .footer { border-top: 1px solid #d9d6ce; margin-top: 24px; padding-top: 10px; font-size: 9.5px; color: #6c757c; }
      .signature { margin-top: 28px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
      .signature div { border-top: 1px solid #101820; padding-top: 6px; font-size: 10px; }
      @page { size: A4; margin: 12mm; }
      @media print { body { padding: 0; } .no-print { display: none !important; } }
    `;
    win.document.open();
    win.document.write(`<!doctype html><html lang="en"><head><meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>${escapeHtml(title)}</title><style>${styles}</style></head>
      <body><div class="doc">${bodyHtml}</div></body></html>`);
    win.document.close();
    win.focus();
    window.setTimeout(() => {
      try {
        win.print();
      } catch {
        /* the user can print manually */
      }
    }, 450);
    return true;
  }

  /* ----------------------------------------------------------------------- *
   * Header, navigation, search
   * ----------------------------------------------------------------------- */
  function whatsAppHref(message) {
    const settings = Store.getSettings();
    let digits = String(settings.phone || CFG.business.phoneDisplay).replace(/\D/g, '');
    if (digits.startsWith('0')) digits = '254' + digits.slice(1);
    if (!digits.startsWith('254')) digits = CFG.business.whatsappNumber;
    return `https://wa.me/${digits}?text=${encodeURIComponent(message || 'Hello Marowa Store, I would like to make an enquiry.')}`;
  }

  function initBusinessDetails() {
    const settings = Store.getSettings();
    $$('[data-biz-name]').forEach((el) => (el.textContent = settings.businessName));
    $$('[data-biz-phone]').forEach((el) => {
      el.textContent = settings.phone;
      if (el.tagName === 'A') el.href = `tel:${settings.phone.replace(/\s/g, '')}`;
    });
    $$('[data-biz-email]').forEach((el) => {
      el.textContent = settings.email;
      if (el.tagName === 'A') el.href = `mailto:${settings.email}`;
    });
    $$('[data-biz-location]').forEach((el) => (el.textContent = settings.location));
    $$('[data-whatsapp]').forEach((el) => {
      el.href = whatsAppHref(el.getAttribute('data-whatsapp-message') || undefined);
      el.target = '_blank';
      el.rel = 'noopener noreferrer';
    });
    $$('[data-tel]').forEach((el) => {
      el.href = `tel:${String(settings.phone).replace(/\s/g, '')}`;
    });
    $$('[data-maps]').forEach((el) => {
      el.href = CFG.business.mapsUrl;
      el.target = '_blank';
      el.rel = 'noopener noreferrer';
    });
    $$('[data-year]').forEach((el) => (el.textContent = new Date().getFullYear()));
  }

  function initNavigation() {
    const page = document.body.getAttribute('data-page');
    $$('.main-nav a').forEach((link) => {
      if (link.getAttribute('data-nav') === page) {
        link.classList.add('is-active');
        link.setAttribute('aria-current', 'page');
      }
    });

    const mobileMenu = document.createElement('dialog');
    mobileMenu.className = 'mobile-menu';
    mobileMenu.id = 'mobileMenu';
    mobileMenu.setAttribute('aria-label', 'Mobile navigation');
    const navLinks = $$('.main-nav a')
      .map(
        (link) =>
          `<a href="${escapeAttribute(link.getAttribute('href'))}"${
            link.getAttribute('data-nav') === page ? ' class="is-active" aria-current="page"' : ''
          }>${escapeHtml(link.textContent)} ${Marowa.icon('arrow-right', 16)}</a>`
      )
      .join('');
    mobileMenu.innerHTML = `
      <div class="mobile-menu__head">
        <a href="index.html" class="brand brand--mobile" aria-label="Marowa Store home">
          <span class="brand__mark" aria-hidden="true">
            <svg viewBox="0 0 40 40"><rect width="40" height="40" fill="#E85D24"/><path d="M9 30V11h5l6 9 6-9h5v19h-5V19l-6 8-6-8v11z" fill="#fff"/></svg>
          </span>
          <span class="brand__text"><span class="brand__name">MAROWA</span><span class="brand__sub">STORE · MIGORI</span></span>
        </a>
        <button class="icon-btn" type="button" data-close-dialog aria-label="Close menu">${Marowa.icon('close', 22)}</button>
      </div>
      <nav class="mobile-menu__nav" aria-label="Mobile primary">${navLinks}</nav>
      <div class="mobile-menu__actions">
        <a class="btn btn--primary" href="quotation.html">${Marowa.icon('clipboard', 18)} Request a quotation</a>
        <a class="btn btn--outline" href="cart.html">${Marowa.icon('cart', 18)} View cart <span class="badge" data-cart-count>0</span></a>
      </div>
      <div class="mobile-menu__foot">
        <p class="eyebrow">Migori Town</p>
        <a href="tel:${escapeAttribute(Store.getSettings().phone.replace(/\s/g, ''))}">${Marowa.icon('phone', 16)} ${escapeHtml(Store.getSettings().phone)}</a>
        <a href="${escapeAttribute(whatsAppHref())}" target="_blank" rel="noopener noreferrer">${Marowa.icon('whatsapp', 16)} WhatsApp the store</a>
        <a href="login.html" class="mobile-menu__admin">Admin demonstration ${Marowa.icon('arrow-up-right', 14)}</a>
      </div>`;
    document.body.appendChild(mobileMenu);

    const menuToggle = $('#menuToggle');
    if (menuToggle) {
      menuToggle.addEventListener('click', () => {
        mobileMenu.showModal();
        document.body.classList.add('has-open-dialog');
      });
    }
    mobileMenu.addEventListener('close', () => document.body.classList.remove('has-open-dialog'));
    mobileMenu.addEventListener('click', (event) => {
      if (event.target === mobileMenu) mobileMenu.close();
    });

    // Search dialog
    const searchDialog = document.createElement('dialog');
    searchDialog.className = 'search-modal';
    searchDialog.id = 'searchModal';
    searchDialog.setAttribute('aria-labelledby', 'searchModalTitle');
    searchDialog.innerHTML = `
      <div class="search-modal__inner">
        <div class="search-modal__head">
          <span class="eyebrow">Search the demonstration catalogue</span>
          <button type="button" class="icon-btn" data-close-dialog aria-label="Close search">${Marowa.icon('close', 22)}</button>
        </div>
        <form class="search-modal__form" action="products.html" method="get" role="search">
          ${Marowa.icon('search', 22)}
          <input type="search" name="q" id="globalSearchInput" placeholder="Search by product, SKU or brand…"
                 autocomplete="off" spellcheck="false" aria-label="Search products by name, SKU or brand">
          <button class="btn btn--dark btn--sm" type="submit">Search</button>
        </form>
        <div class="search-modal__body">
          <p id="searchModalTitle" class="search-modal__label">Browse departments</p>
          <div id="searchResults" class="search-results" aria-live="polite"></div>
        </div>
        <div class="search-modal__foot">
          <span>Tip: press <kbd>/</kbd> or <kbd>Ctrl</kbd> + <kbd>K</kbd> to search.</span>
          <a href="products.html">View all products ${Marowa.icon('arrow-right', 14)}</a>
        </div>
      </div>`;
    document.body.appendChild(searchDialog);

    const results = $('#searchResults', searchDialog);
    const input = $('#globalSearchInput', searchDialog);
    const label = $('.search-modal__label', searchDialog);

    function renderSearchDefault() {
      label.textContent = 'Browse departments';
      const categories = Store.getCategories();
      const products = Store.getProducts({ activeOnly: true });
      results.innerHTML = `
        <div class="search-quick">
          ${categories
            .map((cat) => {
              const count = products.filter((p) => p.category === cat.id).length;
              return `<a href="products.html?category=${encodeURIComponent(cat.id)}" class="search-quick__link">
                <span>${escapeHtml(cat.name)}</span><small>${count}</small></a>`;
            })
            .join('')}
        </div>
        <p class="search-modal__hint">Search by product name, SKU or brand. All product data is demonstration data.</p>`;
    }

    function renderSearchResults(query) {
      const value = query.trim().toLowerCase();
      if (value.length < 2) {
        renderSearchDefault();
        return;
      }
      const categories = Store.getCategories();
      const matches = Store.getProducts({ activeOnly: true })
        .filter((product) => {
          const cat = categories.find((c) => c.id === product.category);
          return [product.name, product.sku, product.brand, cat ? cat.name : '']
            .join(' ')
            .toLowerCase()
            .includes(value);
        })
        .slice(0, 7);
      label.textContent = matches.length ? `${matches.length} matching product${matches.length === 1 ? '' : 's'}` : 'No matches';
      if (!matches.length) {
        results.innerHTML = `<div class="search-empty">
          <p>No demonstration products match “${escapeHtml(query.trim())}”.</p>
          <a class="btn btn--outline btn--sm" href="products.html?q=${encodeURIComponent(query.trim())}">Search the full catalogue</a>
        </div>`;
        return;
      }
      results.innerHTML = matches
        .map(
          (product) => `
          <a class="search-result" href="${productPath(product)}">
            <img src="${escapeAttribute(safeImage(product.image))}" alt="" width="64" height="64" loading="lazy">
            <span class="search-result__main">
              <span class="search-result__brand">${escapeHtml(product.brand)} · ${escapeHtml(product.sku)}</span>
              <strong>${escapeHtml(product.name)}</strong>
              <span class="search-result__meta">${escapeHtml(categoryName(product.category))} · ${escapeHtml(product.unit)}</span>
            </span>
            <span class="search-result__price">${
              typeof product.price === 'number'
                ? Store.getSettings().showIndicativePrices
                  ? formatMoney(product.price)
                  : 'Price hidden'
                : 'Confirm price'
            }</span>
          </a>`
        )
        .join('');
      const all = document.createElement('a');
      all.className = 'search-all';
      all.href = `products.html?q=${encodeURIComponent(query.trim())}`;
      all.innerHTML = `View all results for “${escapeHtml(query.trim())}” ${Marowa.icon('arrow-right', 15)}`;
      results.appendChild(all);
    }

    function openSearch() {
      if (!searchDialog.open) {
        searchDialog.showModal();
        document.body.classList.add('has-open-dialog');
      }
      window.setTimeout(() => input.focus(), 40);
    }

    const searchToggle = $('#searchToggle');
    if (searchToggle) searchToggle.addEventListener('click', openSearch);
    searchDialog.addEventListener('close', () => document.body.classList.remove('has-open-dialog'));
    searchDialog.addEventListener('click', (event) => {
      if (event.target === searchDialog) searchDialog.close();
    });
    input.addEventListener('input', () => renderSearchResults(input.value));
    searchDialog.querySelector('form').addEventListener('submit', (event) => {
      if (!input.value.trim()) {
        event.preventDefault();
        input.focus();
      }
    });

    document.addEventListener('keydown', (event) => {
      const tag = (event.target.tagName || '').toLowerCase();
      const typing = ['input', 'textarea', 'select'].includes(tag) || event.target.isContentEditable;
      if ((event.key === '/' && !typing) || ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k')) {
        event.preventDefault();
        openSearch();
      }
    });

    $$('[data-close-dialog]').forEach((button) => {
      button.addEventListener('click', () => {
        const dialog = button.closest('dialog');
        if (dialog) dialog.close();
      });
    });
  }

  function initHeaderScroll() {
    const header = $('#siteHeader');
    if (!header) return;
    const update = () => header.classList.toggle('is-scrolled', window.scrollY > 12);
    update();
    window.addEventListener('scroll', update, { passive: true });
  }

  function initHeaderQuote() {
    $$('.header__quote').forEach((link) => {
      if (!link.getAttribute('aria-label')) link.setAttribute('aria-label', 'Request a quotation');
      if (link.querySelector('.header__quote-icon')) return;
      const icon = document.createElement('span');
      icon.className = 'header__quote-icon';
      icon.setAttribute('aria-hidden', 'true');
      icon.innerHTML = Marowa.icon('clipboard', 15);
      link.insertBefore(icon, link.firstChild);
    });
  }

  function initCounts() {
    const update = () => {
      const cart = Store.getCart().reduce((sum, item) => sum + item.qty, 0);
      const quote = Store.getQuoteList().reduce((sum, item) => sum + item.qty, 0);
      $$('[data-cart-count]').forEach((node) => {
        node.textContent = cart;
        node.hidden = cart === 0;
      });
      $$('[data-quote-count]').forEach((node) => {
        node.textContent = quote;
        node.hidden = quote === 0;
      });
      $$('[data-cart-count-label]').forEach((node) => {
        node.textContent = `${cart} item${cart === 1 ? '' : 's'}`;
      });
      $$('[data-quote-count-label]').forEach((node) => {
        node.textContent = `${quote} item${quote === 1 ? '' : 's'}`;
      });
    };
    update();
    Store.subscribe(update);
  }

  function initGlobalActions() {
    document.addEventListener('click', (event) => {
      const quoteButton = event.target.closest('[data-add-quote]');
      if (quoteButton) {
        event.preventDefault();
        const productId = quoteButton.getAttribute('data-add-quote');
        const qtySource = quoteButton.getAttribute('data-qty-source');
        const qty = qtySource ? Number(($(qtySource) || {}).value) || 1 : 1;
        const result = Store.addToQuote(productId, qty);
        if (result.ok) {
          const product = Store.getProduct(productId);
          toast(`${product ? product.name : 'Item'} added to your quotation request.`, {
            type: 'success',
            action: { label: 'Review request', href: 'quotation.html' }
          });
        } else {
          toast(result.error || 'Unable to add this item.', { type: 'error' });
        }
        return;
      }

      const cartButton = event.target.closest('[data-add-cart]');
      if (cartButton) {
        event.preventDefault();
        if (cartButton.disabled) return;
        const productId = cartButton.getAttribute('data-add-cart');
        const qtySource = cartButton.getAttribute('data-qty-source');
        const qty = qtySource ? Number(($(qtySource) || {}).value) || 1 : 1;
        const result = Store.addToCart(productId, qty);
        if (result.ok) {
          const product = Store.getProduct(productId);
          toast(`${product ? product.name : 'Item'} added to the cart.`, {
            type: 'success',
            action: { label: 'View cart', href: 'cart.html' }
          });
        } else {
          toast(result.error || 'Unable to add this item.', { type: 'error' });
        }
      }
    });
  }

  function initImageFallback() {
    document.addEventListener(
      'error',
      (event) => {
        const img = event.target;
        if (!(img instanceof HTMLImageElement)) return;
        if (img.dataset.fallbackApplied) return;
        img.dataset.fallbackApplied = '1';
        img.src = 'assets/img/placeholder.svg';
        img.classList.add('img-fallback');
      },
      true
    );
  }

  function initCanonical() {
    const base = (CFG.seo.siteUrl || '').replace(/\/$/, '');
    if (!base) return;
    const file = (window.location.pathname.split('/').pop() || 'index.html').split('?')[0];
    let canonical = $('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = `${base}/${file}`;
    $$('meta[property="og:url"]').forEach((meta) => (meta.content = `${base}/${file}`));
    $$('meta[property="og:image"]').forEach(
      (meta) => (meta.content = `${base}/${CFG.seo.defaultImage}`)
    );
  }

  function initReveal() {
    const elements = $$('[data-reveal]');
    if (!elements.length) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || !('IntersectionObserver' in window)) {
      elements.forEach((el) => el.classList.add('is-revealed'));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px' }
    );
    elements.forEach((el) => observer.observe(el));
  }

  function initStorageWarning() {
    if (Store.isStorageAvailable()) return;
    const main = $('main');
    if (!main) return;
    const warning = document.createElement('div');
    warning.className = 'storage-warning';
    warning.innerHTML = `${Marowa.icon('alert', 18)}
      <p><strong>Browser storage is unavailable.</strong> Changes will last for this tab only. Run the demo through <code>npm start</code> or expose localStorage for persistence.</p>`;
    main.insertBefore(warning, main.firstChild);
  }

  function initHome() {
    if (document.body.getAttribute('data-page') !== 'home') return;
    const products = Store.getProducts({ activeOnly: true });
    const categories = Store.getCategories();

    const categoryGrid = $('[data-home-categories]');
    if (categoryGrid) {
      categoryGrid.innerHTML = categories
        .map((category, index) => {
          const count = products.filter((p) => p.category === category.id).length;
          return renderCategoryCard(category, count, index);
        })
        .join('');
    }

    const featuredGrid = $('[data-featured-grid]');
    if (featuredGrid) {
      const featured = products.filter((p) => p.featured).slice(0, 8);
      featuredGrid.innerHTML = featured.map((p) => renderProductCard(p)).join('');
    }

    const brandStrip = $('[data-brand-strip]');
    if (brandStrip) {
      const brands = Store.getBrands();
      brandStrip.innerHTML = brands
        .map((brand) => {
          const count = products.filter((p) => p.brand === brand.name).length;
          return `<a class="brand-tile" href="products.html?brand=${encodeURIComponent(brand.name)}">
            <span class="brand-tile__name">${escapeHtml(brand.name)}</span>
            <span class="brand-tile__meta">${count} demo listing${count === 1 ? '' : 's'} ${Marowa.icon('arrow-up-right', 14)}</span>
          </a>`;
        })
        .join('');
    }

    $$('[data-catalogue-count]').forEach((el) => (el.textContent = products.length));
    $$('[data-category-count]').forEach((el) => (el.textContent = categories.length));

    const heroLines = $('[data-hero-quote-lines]');
    if (heroLines) {
      const picks = ['cordless-drill-driver', 'tape-measure-8m', 'safety-helmet']
        .map((id) => products.find((p) => p.id === id))
        .filter(Boolean);
      const total = picks.reduce((sum, p) => sum + (typeof p.price === 'number' ? p.price : 0), 0);
      heroLines.innerHTML = picks
        .map(
          (p) => `<div class="hero-ticket__line">
            <span>${escapeHtml(p.name)}</span>
            <span class="mono">×1</span>
          </div>`
        )
        .join('');
      const totalEl = $('[data-hero-quote-total]');
      if (totalEl) {
        totalEl.textContent = Store.getSettings().showIndicativePrices
          ? total
            ? formatMoney(total)
            : 'Confirm'
          : 'Hidden in demo';
      }
    }

    const year = new Date().getFullYear();
    $$('[data-year]').forEach((el) => (el.textContent = year));
  }

  function init() {
    hydrateIcons();
    initBusinessDetails();
    initNavigation();
    initHeaderScroll();
    initHeaderQuote();
    initCounts();
    initGlobalActions();
    initImageFallback();
    initCanonical();
    initReveal();
    initStorageWarning();
    initHome();
    $$('[data-year]').forEach((el) => (el.textContent = new Date().getFullYear()));
  }

  Marowa.ui = {
    $,
    $$,
    escapeHtml,
    escapeAttribute,
    formatMoney,
    formatNumber,
    formatDate,
    formatDateTime,
    timeAgo,
    stockMeta,
    categoryName,
    categoryById,
    productPath,
    safeImage,
    renderProductCard,
    renderCategoryCard,
    toast,
    confirm: confirmAction,
    setButtonBusy,
    printHtml,
    whatsAppHref,
    hydrateIcons
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
