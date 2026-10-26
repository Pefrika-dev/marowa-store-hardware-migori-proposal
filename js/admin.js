/**
 * Admin demonstration.
 *
 * All figures are computed from the local demonstration store. There is no API,
 * no login server and no real customer data. The gate in auth.js is a demo gate.
 */
(function () {
  const Store = Marowa.Store;
  const ui = Marowa.ui;
  const CFG = Marowa.config;
  const $ = ui.$;
  const $$ = ui.$$;
  const esc = ui.escapeHtml;
  const attr = ui.escapeAttribute;

  if (Marowa.Auth && !Marowa.Auth.current()) return;

  const categories = Store.getCategories();
  const brands = Store.getBrands();
  const categoryNames = new Map(categories.map((c) => [c.id, c.name]));

  const views = ['overview', 'products', 'inventory', 'quotations', 'inquiries', 'analytics', 'settings'];
  const viewTitles = {
    overview: 'Overview',
    products: 'Products',
    inventory: 'Inventory',
    quotations: 'Quotations',
    inquiries: 'Inquiries',
    analytics: 'Analytics',
    settings: 'Settings'
  };

  const STATUS_COLORS = {
    New: '#2d5b7a',
    'Under Review': '#b07318',
    'Draft Prepared': '#6b5ca5',
    'Awaiting Customer': '#367c78',
    Closed: '#8a9298'
  };
  const STOCK_COLORS = {
    'in-stock': '#2f7d55',
    'low-stock': '#b07318',
    'out-of-stock': '#b3261e',
    contact: '#7a858c'
  };
  const STOCK_LABELS = {
    'in-stock': 'In stock',
    'low-stock': 'Low stock',
    'out-of-stock': 'Out of stock',
    contact: 'Not configured'
  };

  let currentView = 'overview';
  let currentQuotationId = null;
  let currentInquiryId = null;
  const filters = {
    productQuery: '',
    productCategory: '',
    productStatus: '',
    inventoryQuery: '',
    inventoryStatus: '',
    quotationQuery: '',
    quotationStatus: '',
    inquiryQuery: '',
    inquiryStatus: ''
  };

  /* ----------------------------------------------------------------------- *
   * Small helpers
   * ----------------------------------------------------------------------- */
  function slug(value) {
    return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  function stockPill(status) {
    return `<span class="status status--${status}">${STOCK_LABELS[status] || 'Unknown'}</span>`;
  }

  function quotePill(status) {
    return `<span class="status status--${slug(status)}">${esc(status)}</span>`;
  }

  function qtyLabel(product) {
    if (product.stockQty === null || product.stockQty === undefined) return 'Not configured';
    return `${ui.formatNumber(product.stockQty)} ${product.unit}`;
  }

  function priceLabel(product) {
    return typeof product.price === 'number' ? ui.formatMoney(product.price) : 'Confirm';
  }

  function userContact(record) {
    return `<a href="tel:${attr(String(record.phone || '').replace(/[^\d+]/g, ''))}">${esc(
      record.phone || 'No phone'
    )}</a><br>${record.email ? `<a href="mailto:${attr(record.email)}">${esc(record.email)}</a>` : '<span class="muted">No email</span>'}`;
  }

  function emptyRow(columns, title, message) {
    return `<tr><td colspan="${columns}"><div class="admin-empty">
      ${Marowa.icon('inbox', 24)}
      <strong>${esc(title)}</strong>
      <span>${esc(message)}</span>
    </div></td></tr>`;
  }

  function downloadFile(filename, content, type = 'application/json') {
    try {
      const blob = new Blob([content], { type });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1200);
      ui.toast('Demonstration data exported as a local JSON file.', { type: 'success' });
      return true;
    } catch {
      ui.toast('The browser blocked the download. Export again or copy the data from the import box.', {
        type: 'error'
      });
      return false;
    }
  }

  function exportJson() {
    return Store.exportData();
  }

  function dateStamp() {
    return new Date().toISOString().slice(0, 10);
  }

  /* ----------------------------------------------------------------------- *
   * Charts (CSS-only, computed from local data)
   * ----------------------------------------------------------------------- */
  function renderBarChart(host, items, options = {}) {
    if (!host) return;
    const values = items.flatMap((item) => [Number(item.value) || 0, Number(item.secondary) || 0]);
    const max = Math.max(0, ...values);
    if (!max) {
      host.innerHTML = `<div class="chart-empty">${esc(
        options.empty || 'No demonstration records yet.'
      )}</div>`;
      return;
    }
    const legend = options.secondaryLabel
      ? `<div class="chart__legend">
          <span><i></i> ${esc(options.valueLabel || 'Requests')}</span>
          <span><i class="is-muted"></i> ${esc(options.secondaryLabel)}</span>
        </div>`
      : '';
    const bars = items
      .map((item) => {
        const value = Number(item.value) || 0;
        const secondary = Number(item.secondary) || 0;
        const primaryHeight = value ? Math.max(3, (value / max) * 100) : 0;
        const secondaryHeight = secondary ? Math.max(3, (secondary / max) * 100) : 0;
        return `<div class="bar-chart__item">
          <span class="bar-chart__value">${value || ''}</span>
          <div class="bar-chart__stack">
            <div class="bar" style="height:${primaryHeight}%" title="${attr(
          `${item.label}: ${value}`
        )}"></div>
            ${
              options.secondaryLabel
                ? `<div class="bar bar--muted" style="height:${secondaryHeight}%" title="${attr(
                    `${options.secondaryLabel}: ${secondary}`
                  )}"></div>`
                : ''
            }
          </div>
          <span class="bar-chart__label">${esc(item.label)}</span>
        </div>`;
      })
      .join('');
    host.innerHTML = `<div class="chart">${legend}
      <div class="bar-chart" role="img" aria-label="${attr(options.ariaLabel || 'Bar chart of local demo data')}">
        ${bars}
      </div>
    </div>`;
  }

  function renderDonut(host, parts, centerSub, emptyMessage) {
    if (!host) return;
    const clean = parts.filter((part) => Number(part.value) > 0);
    const total = clean.reduce((sum, part) => sum + Number(part.value), 0);
    if (!total) {
      host.innerHTML = `<div class="chart-empty">${esc(emptyMessage || 'No demonstration records yet.')}</div>`;
      return;
    }
    let angle = 0;
    const stops = clean
      .map((part) => {
        const start = angle;
        angle += (Number(part.value) / total) * 360;
        return `${part.color} ${start.toFixed(2)}deg ${angle.toFixed(2)}deg`;
      })
      .join(', ');
    host.innerHTML = `<div class="donut-wrap">
      <div class="donut" style="background:conic-gradient(${stops})" role="img" aria-label="${attr(
      clean.map((part) => `${part.label}: ${part.value}`).join(', ')
    )}">
        <div class="donut__label"><strong>${total}</strong><span>${esc(centerSub || 'records')}</span></div>
      </div>
      <ul class="donut-legend">
        ${clean
          .map(
            (part) => `<li><i style="background:${part.color}"></i>${esc(part.label)}<span>${part.value}</span></li>`
          )
          .join('')}
      </ul>
    </div>`;
  }

  function renderStatusBars(host, items, options = {}) {
    if (!host) return;
    if (!items.length) {
      host.innerHTML = `<div class="chart-empty">${esc(
        options.empty || 'No demonstration records yet.'
      )}</div>`;
      return;
    }
    const max = Math.max(1, ...items.map((item) => Number(item.value) || 0));
    host.innerHTML = `<div class="status-bars">
      ${items
        .map(
          (item) => `<div class="status-bar">
            <div class="status-bar__top"><span>${esc(item.label)}</span><b>${item.value}${
            item.suffix ? ` ${esc(item.suffix)}${Number(item.value) === 1 ? '' : 's'}` : ''
          }</b></div>
            <div class="status-bar__track"><div class="status-bar__fill ${
              item.className || ''
            }" style="width:${Math.max(2, ((Number(item.value) || 0) / max) * 100).toFixed(1)}%"></div></div>
          </div>`
        )
        .join('')}
    </div>`;
  }

  /* ----------------------------------------------------------------------- *
   * Navigation / view routing
   * ----------------------------------------------------------------------- */
  function closeSidebar() {
    const sidebar = $('#adminSidebar');
    const overlay = $('#adminOverlay');
    const menu = $('#adminMenuBtn');
    if (sidebar) sidebar.classList.remove('is-open');
    if (overlay) overlay.classList.remove('is-open');
    if (menu) menu.setAttribute('aria-expanded', 'false');
  }

  function openSidebar() {
    const sidebar = $('#adminSidebar');
    const overlay = $('#adminOverlay');
    const menu = $('#adminMenuBtn');
    if (sidebar) sidebar.classList.add('is-open');
    if (overlay) overlay.classList.add('is-open');
    if (menu) menu.setAttribute('aria-expanded', 'true');
    const close = $('#adminSidebarClose');
    if (close) window.setTimeout(() => close.focus(), 60);
  }

  function showView(view, updateHash = true) {
    if (!views.includes(view)) view = 'overview';
    currentView = view;
    $$('.admin-view').forEach((section) => {
      section.hidden = section.id !== `view-${view}`;
    });
    $$('[data-view]').forEach((button) => {
      const active = button.getAttribute('data-view') === view;
      button.classList.toggle('is-active', active);
      if (active) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
    const crumb = $('#adminCrumb');
    if (crumb) crumb.textContent = viewTitles[view] || 'Overview';
    if (updateHash) {
      try {
        window.history.replaceState(null, '', `#${view}`);
      } catch {
        /* ignore */
      }
    }
    closeSidebar();
    if (view === 'settings') populateSettings();
  }

  /* ----------------------------------------------------------------------- *
   * Navigation counts
   * ----------------------------------------------------------------------- */
  function renderNavCounts() {
    const products = Store.getProducts();
    const low = products.filter(
      (product) => product.active && ['low-stock', 'out-of-stock'].includes(product.stockStatus)
    ).length;
    const quotations = Store.getQuotations();
    const openQuotes = quotations.filter((quote) => quote.status !== 'Closed').length;
    const inquiries = Store.getInquiries();
    const newInquiries = inquiries.filter((inquiry) => inquiry.status === 'New').length;
    const set = (selector, value) => {
      const el = $(selector);
      if (el) el.textContent = String(value);
    };
    set('[data-count-products]', products.length);
    set('[data-count-low]', low);
    set('[data-count-quotes]', openQuotes);
    set('[data-count-inquiries]', newInquiries);
  }

  /* ----------------------------------------------------------------------- *
   * Overview
   * ----------------------------------------------------------------------- */
  function renderOverview() {
    const allProducts = Store.getProducts();
    const active = allProducts.filter((product) => product.active);
    const low = active.filter((product) => ['low-stock', 'out-of-stock'].includes(product.stockStatus));
    const contact = active.filter((product) => product.stockStatus === 'contact');
    const quotations = Store.getQuotations();
    const openQuotes = quotations.filter((quote) => quote.status !== 'Closed');
    const pipeline = openQuotes.reduce((sum, quote) => sum + (Number(quote.indicativeTotal) || 0), 0);
    const newQuotes = quotations.filter((quote) => quote.status === 'New').length;

    const set = (selector, value) => {
      const el = $(selector);
      if (el) el.textContent = value;
    };
    set('[data-metric="products"]', String(active.length));
    set('[data-metric="products-note"]', `of ${allProducts.length} demo records`);
    set('[data-metric="low-stock"]', String(low.length));
    set('[data-metric="low-stock-note"]', `${contact.length} also need a stock count`);
    set('[data-metric="open-quotes"]', String(openQuotes.length));
    set('[data-metric="open-quotes-note"]', `${newQuotes} new in the demo queue`);
    set('[data-metric="pipeline"]', ui.formatMoney(pipeline));

    // Last six months: quotations received and closed.
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        key: `${date.getFullYear()}-${date.getMonth()}`,
        label: new Intl.DateTimeFormat('en-KE', { month: 'short' }).format(date),
        received: 0,
        closed: 0
      });
    }
    quotations.forEach((quote) => {
      const date = new Date(quote.receivedAt);
      if (Number.isNaN(date.getTime())) return;
      const bucket = months.find((month) => month.key === `${date.getFullYear()}-${date.getMonth()}`);
      if (!bucket) return;
      bucket.received += 1;
      if (quote.status === 'Closed') bucket.closed += 1;
    });
    renderBarChart(
      $('#quoteChart'),
      months.map((month) => ({ label: month.label, value: month.received, secondary: month.closed })),
      {
        secondaryLabel: 'Closed',
        valueLabel: 'Requests received',
        ariaLabel: 'Quotation requests received and closed in the last six months',
        empty: 'No quotation requests recorded in this demo.'
      }
    );

    const statusParts = Store.validStatuses.map((status) => ({
      label: status,
      value: quotations.filter((quote) => quote.status === status).length,
      color: STATUS_COLORS[status]
    }));
    renderDonut($('#statusDonut'), statusParts, 'requests', 'No quotation requests yet.');

    // Recent quotations
    const recentBody = $('#recentQuotationsBody');
    if (recentBody) {
      recentBody.innerHTML = quotations.length
        ? quotations
            .slice(0, 5)
            .map(
              (quote) => `<tr>
                <td><button class="row-btn" type="button" data-open-quotation="${attr(quote.id)}"
                  style="height:auto;padding:0;color:var(--admin-ink);font-family:var(--font-mono);font-size:.64rem">
                  ${esc(quote.reference)}</button></td>
                <td>${esc(quote.customerName)}</td>
                <td class="num">${quote.items.length}</td>
                <td class="num">${ui.formatMoney(quote.indicativeTotal)}</td>
                <td>${quotePill(quote.status)}</td>
              </tr>`
            )
            .join('')
        : emptyRow(5, 'No quotation requests', 'Storefront demo requests will appear here.');
    }

    // Low stock signals
    const lowHost = $('#lowStockList');
    if (lowHost) {
      lowHost.innerHTML = low.length
        ? `<ul class="activity-list">${low
            .sort((a, b) => Number(a.stockQty || 0) - Number(b.stockQty || 0))
            .slice(0, 6)
            .map(
              (product) => `<li>
                <span class="activity-list__icon">${Marowa.icon('layers', 14)}</span>
                <div style="flex:1;min-width:0">
                  <p><strong>${esc(product.name)}</strong></p>
                  <time>${esc(product.sku)} · ${esc(qtyLabel(product))} · threshold ${product.lowStockThreshold}</time>
                </div>
                <button class="row-btn" type="button" data-open-inventory="${attr(product.id)}"
                  aria-label="Update stock for ${attr(product.name)}">Update</button>
              </li>`
            )
            .join('')}</ul>`
        : `<div class="admin-empty">${Marowa.icon('check-circle', 24)}<strong>No low-stock signals.</strong><span>Published demo records are above their thresholds.</span></div>`;
    }

    // Activity
    const activityHost = $('#activityList');
    if (activityHost) {
      const activity = Store.getActivity().slice(0, 6);
      const icons = {
        product: 'package',
        inventory: 'layers',
        quotation: 'clipboard',
        inquiry: 'inbox',
        settings: 'settings'
      };
      activityHost.innerHTML = activity.length
        ? activity
            .map(
              (entry) => `<li>
                <span class="activity-list__icon">${Marowa.icon(icons[entry.type] || 'info', 14)}</span>
                <div><p>${esc(entry.message)}</p><time>${esc(ui.timeAgo(entry.at))} · demonstration log</time></div>
              </li>`
            )
            .join('')
        : `<li><div class="admin-empty">${Marowa.icon('clock', 22)}<strong>No activity yet.</strong><span>Changes made in the demo will be listed here.</span></div></li>`;
    }

    // Catalogue snapshot
    const snapshot = $('#catalogueSnapshot');
    if (snapshot) {
      const counts = categories
        .map((category) => ({
          label: category.name,
          value: active.filter((product) => product.category === category.id).length
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);
      renderStatusBars(snapshot, counts, { empty: 'No published demo listings.' });
    }
  }

  /* ----------------------------------------------------------------------- *
   * Products
   * ----------------------------------------------------------------------- */
  function populateProductFilters() {
    const categoryFilter = $('#productCategoryFilter');
    if (categoryFilter && categoryFilter.options.length <= 1) {
      categoryFilter.insertAdjacentHTML(
        'beforeend',
        categories
          .map((category) => `<option value="${attr(category.id)}">${esc(category.name)}</option>`)
          .join('')
      );
    }
    const categorySelect = $('#productCategory');
    if (categorySelect && !categorySelect.options.length) {
      categorySelect.innerHTML =
        '<option value="">Select a department</option>' +
        categories
          .map((category) => `<option value="${attr(category.id)}">${esc(category.name)}</option>`)
          .join('');
    }
    const brandSelect = $('#productBrand');
    if (brandSelect && !brandSelect.options.length) {
      brandSelect.innerHTML =
        '<option value="">Select a brand</option>' +
        brands.map((brand) => `<option value="${attr(brand.name)}">${esc(brand.name)}</option>`).join('');
    }
  }

  function filteredAdminProducts() {
    const query = filters.productQuery.trim().toLowerCase();
    return Store.getProducts().filter((product) => {
      if (filters.productCategory && product.category !== filters.productCategory) return false;
      if (filters.productStatus === 'active' && !product.active) return false;
      if (filters.productStatus === 'draft' && product.active) return false;
      if (filters.productStatus === 'low' && product.stockStatus !== 'low-stock') return false;
      if (filters.productStatus === 'out' && product.stockStatus !== 'out-of-stock') return false;
      if (filters.productStatus === 'contact' && product.stockStatus !== 'contact') return false;
      if (!query) return true;
      const haystack = [
        product.name,
        product.sku,
        product.brand,
        categoryNames.get(product.category) || ''
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });
  }

  function renderProducts() {
    populateProductFilters();
    const body = $('#productsTableBody');
    if (!body) return;
    const all = Store.getProducts();
    const list = filteredAdminProducts();
    body.innerHTML = list.length
      ? list
          .map(
            (product) => `<tr>
              <td>
                <div class="cell-main">
                  <img src="${attr(ui.safeImage(product.image))}" alt="" width="68" height="60" loading="lazy">
                  <div>
                    <strong><a href="product-details.html?id=${encodeURIComponent(product.id)}"
                      title="Open the public demonstration listing">${esc(product.name)}</a></strong>
                    <small>${esc(product.sku)} · ${esc(product.unit)}</small>
                  </div>
                </div>
              </td>
              <td>${esc(categoryNames.get(product.category) || product.category)}</td>
              <td class="num">${typeof product.price === 'number' ? ui.formatMoney(product.price) : 'Confirm'}</td>
              <td>${stockPill(product.stockStatus)}<br><span class="inventory-hint">${esc(qtyLabel(product))}</span></td>
              <td>${
                product.active
                  ? '<span class="status status--active">Published</span>'
                  : '<span class="status status--draft">Unpublished</span>'
              }</td>
              <td>
                <div class="cell-actions">
                  <button class="row-btn" type="button" data-edit-product="${attr(product.id)}"
                    aria-label="Edit ${attr(product.name)}" title="Edit product">${Marowa.icon('edit', 14)}</button>
                  <button class="row-btn" type="button" data-toggle-product="${attr(product.id)}"
                    aria-label="${product.active ? 'Unpublish' : 'Publish'} ${attr(product.name)}"
                    title="${product.active ? 'Unpublish' : 'Publish'}">${Marowa.icon(
              product.active ? 'close' : 'check',
              14
            )}</button>
                  <button class="row-btn row-btn--danger" type="button" data-delete-product="${attr(product.id)}"
                    aria-label="Delete ${attr(product.name)}" title="Delete product">${Marowa.icon('trash', 14)}</button>
                </div>
              </td>
            </tr>`
          )
          .join('')
      : emptyRow(6, 'No products match', 'Adjust the search or filters, or add a demonstration listing.');

    const count = $('#productTableCount');
    if (count) count.textContent = `${list.length} of ${all.length} record${all.length === 1 ? '' : 's'}`;
    const foot = $('#productsTableFoot');
    if (foot)
      foot.textContent = `Showing ${list.length} demonstration record${
        list.length === 1 ? '' : 's'
      }. Published listings are visible on the public storefront.`;
  }

  function productPayload(product, overrides = {}) {
    return {
      id: product.id,
      name: product.name,
      sku: product.sku,
      category: product.category,
      brand: product.brand,
      unit: product.unit,
      description: product.description,
      image: product.image,
      imageAlt: product.imageAlt,
      price: product.price === null || product.price === undefined ? '' : product.price,
      stockQty: product.stockQty === null || product.stockQty === undefined ? '' : product.stockQty,
      lowStockThreshold: product.lowStockThreshold,
      active: product.active,
      featured: product.featured,
      ...overrides
    };
  }

  function setPreview(path) {
    const preview = $('#productImagePreview');
    if (!preview) return;
    const safe =
      path && (String(path).startsWith('assets/') || /^https?:\/\//i.test(String(path)))
        ? String(path)
        : 'assets/img/placeholder.svg';
    preview.src = safe;
  }

  function openProductModal(id) {
    const dialog = $('#productModal');
    const form = $('#productForm');
    if (!dialog || !form) return;
    const title = $('#productModalTitle');
    const error = $('#productFormError');
    error.hidden = true;
    error.textContent = '';
    $$('[aria-invalid="true"]', form).forEach((el) => el.removeAttribute('aria-invalid'));
    form.reset();
    populateProductFilters();

    if (id) {
      const product = Store.getProduct(id);
      if (!product) {
        ui.toast('That demonstration product no longer exists.', { type: 'error' });
        return;
      }
      $('#productId').value = product.id;
      $('#productName').value = product.name;
      $('#productSku').value = product.sku;
      $('#productBrand').value = product.brand;
      $('#productCategory').value = product.category;
      $('#productUnit').value = product.unit;
      $('#productPrice').value = product.price === null || product.price === undefined ? '' : product.price;
      $('#productStockQty').value =
        product.stockQty === null || product.stockQty === undefined ? '' : product.stockQty;
      $('#productThreshold').value = product.lowStockThreshold;
      $('#productImage').value = product.image || '';
      $('#productImageAlt').value = product.imageAlt || '';
      $('#productDescription').value = product.description || '';
      $('#productActive').checked = product.active !== false;
      $('#productFeatured').checked = Boolean(product.featured);
      setPreview(product.image);
      if (title) title.textContent = 'Edit product';
    } else {
      $('#productId').value = '';
      $('#productThreshold').value = Store.getSettings().lowStockThreshold;
      $('#productActive').checked = true;
      $('#productFeatured').checked = false;
      setPreview('assets/img/placeholder.svg');
      if (title) title.textContent = 'Add product';
    }
    if (!dialog.open) dialog.showModal();
    window.setTimeout(() => {
      const name = $('#productName');
      if (name) name.focus();
    }, 60);
  }

  function productFieldElement(field) {
    const map = {
      name: 'productName',
      sku: 'productSku',
      category: 'productCategory',
      brand: 'productBrand',
      unit: 'productUnit',
      description: 'productDescription',
      price: 'productPrice',
      stockQty: 'productStockQty',
      lowStockThreshold: 'productThreshold'
    };
    return map[field] ? document.getElementById(map[field]) : null;
  }

  async function toggleProduct(id) {
    const product = Store.getProduct(id);
    if (!product) return;
    const result = Store.saveProduct(productPayload(product, { active: !product.active }));
    if (!result.ok) {
      ui.toast(result.error || 'The listing could not be updated.', { type: 'error' });
      return;
    }
    ui.toast(
      `${product.name} ${product.active ? 'unpublished from' : 'published to'} the demonstration catalogue.`,
      { type: 'success' }
    );
    renderAll();
  }

  async function deleteProduct(id) {
    const product = Store.getProduct(id);
    if (!product) return;
    const confirmed = await ui.confirm({
      title: 'Delete this demonstration listing?',
      message: `“${product.name}” (${product.sku}) will be removed from the local demo catalogue. Cart and quotation list entries for this product will also be removed. This cannot be undone.`,
      confirmLabel: 'Delete product',
      danger: true
    });
    if (!confirmed) return;
    Store.deleteProduct(id);
    ui.toast(`${product.name} deleted from the local demonstration.`, { type: 'success' });
    renderAll();
  }

  /* ----------------------------------------------------------------------- *
   * Inventory
   * ----------------------------------------------------------------------- */
  function renderInventory() {
    const all = Store.getProducts();
    const active = all.filter((product) => product.active);
    const counts = {
      'in-stock': active.filter((product) => product.stockStatus === 'in-stock').length,
      'low-stock': active.filter((product) => product.stockStatus === 'low-stock').length,
      'out-of-stock': active.filter((product) => product.stockStatus === 'out-of-stock').length,
      contact: active.filter((product) => product.stockStatus === 'contact').length
    };
    const metrics = $('#inventoryMetrics');
    if (metrics) {
      const metric = (label, value, note, icon) => `<article class="metric">
        <div class="metric__label">${Marowa.icon(icon, 13)} ${label}</div>
        <div class="metric__value">${value}</div>
        <div class="metric__foot">${note}</div>
      </article>`;
      metrics.innerHTML =
        metric('In stock', counts['in-stock'], 'Published demo records', 'check-circle') +
        metric('Low stock', counts['low-stock'], 'At or below threshold', 'alert') +
        metric('Out of stock', counts['out-of-stock'], 'Zero quantity', 'close') +
        metric('Not configured', counts.contact, 'Availability to confirm', 'info');
    }

    const body = $('#inventoryTableBody');
    if (!body) return;
    const query = filters.inventoryQuery.trim().toLowerCase();
    const list = all.filter((product) => {
      if (filters.inventoryStatus && product.stockStatus !== filters.inventoryStatus) return false;
      if (!query) return true;
      return [product.name, product.sku, product.brand]
        .join(' ')
        .toLowerCase()
        .includes(query);
    });

    body.innerHTML = list.length
      ? list
          .map(
            (product) => `<tr>
              <td><div class="cell-main">
                <img src="${attr(ui.safeImage(product.image))}" alt="" width="68" height="60" loading="lazy">
                <div><strong>${esc(product.name)}</strong><small>${esc(product.brand)}</small></div>
              </div></td>
              <td><span class="mono" style="font-size:.64rem">${esc(product.sku)}</span></td>
              <td class="num">${product.stockQty === null ? 'Not set' : ui.formatNumber(product.stockQty)}</td>
              <td class="num">${product.lowStockThreshold}</td>
              <td>${stockPill(product.stockStatus)}</td>
              <td class="num">${esc(ui.formatDate(product.updatedAt))}</td>
              <td><div class="cell-actions">
                <button class="row-btn" type="button" data-open-inventory="${attr(product.id)}"
                  aria-label="Update stock for ${attr(product.name)}">${Marowa.icon('edit', 13)} Update</button>
              </div></td>
            </tr>`
          )
          .join('')
      : emptyRow(7, 'No inventory records match', 'Adjust the search or stock filter.');

    const count = $('#inventoryTableCount');
    if (count) count.textContent = `${list.length} record${list.length === 1 ? '' : 's'}`;
  }

  function openInventoryModal(id) {
    const product = Store.getProduct(id);
    const dialog = $('#inventoryModal');
    if (!product || !dialog) return;
    $('#inventoryProductId').value = product.id;
    $('#inventoryModalTitle').textContent = 'Update inventory';
    $('#inventoryModalSubtitle').textContent = `${product.name} · ${product.sku}`;
    $('#inventoryQty').value =
      product.stockQty === null || product.stockQty === undefined ? '' : product.stockQty;
    $('#inventoryThreshold').value = product.lowStockThreshold;
    $('#inventoryNote').value = '';
    const error = $('#inventoryFormError');
    error.hidden = true;
    error.textContent = '';
    if (!dialog.open) dialog.showModal();
    window.setTimeout(() => $('#inventoryQty').focus(), 60);
  }

  /* ----------------------------------------------------------------------- *
   * Quotations
   * ----------------------------------------------------------------------- */
  function filteredQuotations() {
    const query = filters.quotationQuery.trim().toLowerCase();
    return Store.getQuotations().filter((quote) => {
      if (filters.quotationStatus && quote.status !== filters.quotationStatus) return false;
      if (!query) return true;
      return [quote.reference, quote.customerName, quote.phone, quote.projectType]
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
  }

  function renderQuotations() {
    const body = $('#quotationsTableBody');
    if (!body) return;
    const list = filteredQuotations();
    body.innerHTML = list.length
      ? list
          .map(
            (quote) => `<tr>
              <td><button class="row-btn" type="button" data-open-quotation="${attr(quote.id)}"
                style="height:auto;padding:0;color:var(--admin-ink);font-family:var(--font-mono);font-size:.64rem">
                ${esc(quote.reference)}</button></td>
              <td><strong style="font-weight:600">${esc(quote.customerName)}</strong><br>
                <span class="inventory-hint">${esc(quote.phone)}</span></td>
              <td>${esc(quote.projectType || 'Not specified')}</td>
              <td class="num">${quote.items.length}</td>
              <td class="num">${ui.formatMoney(quote.indicativeTotal)}</td>
              <td>${quotePill(quote.status)}</td>
              <td class="num">${esc(ui.formatDate(quote.receivedAt))}</td>
              <td><div class="cell-actions">
                <button class="row-btn" type="button" data-open-quotation="${attr(quote.id)}">Open</button>
              </div></td>
            </tr>`
          )
          .join('')
      : emptyRow(8, 'No quotation requests match', 'Adjust the search or status filter.');
    const count = $('#quotationTableCount');
    if (count) count.textContent = `${list.length} request${list.length === 1 ? '' : 's'}`;
  }

  function renderQuotationDetail(quote) {
    const lines = quote.items
      .map(
        (item) => `<tr>
          <td>${esc(item.name)}<span class="detail-items__note">${esc(item.sku)} · ${esc(item.unit)}${
          item.note ? ` · ${esc(item.note)}` : ''
        }</span></td>
          <td class="num">${item.qty}</td>
          <td class="num">${
            typeof item.indicativePrice === 'number' ? ui.formatMoney(item.indicativePrice) : 'Confirm'
          }</td>
          <td class="num">${
            typeof item.indicativePrice === 'number'
              ? ui.formatMoney(item.indicativePrice * item.qty)
              : '—'
          }</td>
        </tr>`
      )
      .join('');

    $('#quotationModalBody').innerHTML = `<div class="detail-grid">
      <div>
        <div class="detail-block">
          <h3>Customer</h3>
          <p><strong>${esc(quote.customerName)}</strong><br>${userContact(quote)}<br>
          <span class="muted">Preferred contact: ${esc(quote.contactMethod || 'Not specified')}</span></p>
        </div>
        <div class="detail-block">
          <h3>Project</h3>
          <p><strong>${esc(quote.projectType || 'Not specified')}</strong><br>
          <span class="muted">Needed by ${esc(quote.neededBy || 'not specified')} · ${esc(
      quote.preferredBranch || 'Migori Main'
    )}</span></p>
          <p style="white-space:pre-line">${esc(quote.projectDescription)}</p>
        </div>
        <div class="detail-block">
          <h3>Requested items</h3>
          <div class="detail-items">
            <table>
              <thead><tr><th>Item</th><th class="num">Qty</th><th class="num">Indicative</th><th class="num">Line</th></tr></thead>
              <tbody>${lines}</tbody>
            </table>
            <div class="detail-total"><span>Indicative demo total</span><strong>${ui.formatMoney(
              quote.indicativeTotal
            )}</strong></div>
          </div>
          ${
            quote.hasUnpricedItems
              ? '<p class="detail-note" style="margin-top:.4rem">Some lines are marked “Confirm” and are excluded from the indicative total.</p>'
              : ''
          }
        </div>
        <div class="detail-block">
          <h3>Demo metadata</h3>
          <p class="detail-note">Received ${esc(ui.formatDateTime(quote.receivedAt))} · Last updated ${esc(
      ui.formatDateTime(quote.updatedAt)
    )} · Source: ${esc(quote.source || 'demo')} · Record ID ${esc(quote.id)}</p>
        </div>
      </div>
      <div class="detail-side">
        <div class="field">
          <label for="quoteStatus">Quotation status</label>
          <select id="quoteStatus">
            ${Store.validStatuses.map(
              (status) => `<option value="${attr(status)}" ${
                quote.status === status ? 'selected' : ''
              }>${esc(status)}</option>`
            ).join('')}
          </select>
          <p class="field__hint">Status changes are local to this demo.</p>
        </div>
        <div class="field">
          <label for="quoteNotes">Internal notes</label>
          <textarea id="quoteNotes" maxlength="2000" placeholder="Demo-only internal note…">${esc(
            quote.internalNotes || ''
          )}</textarea>
          <p class="field__hint">Never shown on the storefront. Stored locally.</p>
        </div>
        <div class="notice notice--warning" style="margin:0">
          ${Marowa.icon('alert', 16)}
          <p>No message is sent to the customer. This queue is a demonstration only.</p>
        </div>
      </div>
    </div>`;
  }

  function openQuotation(id) {
    const quote = Store.getQuotations().find((record) => record.id === id);
    const dialog = $('#quotationModal');
    if (!quote || !dialog) return;
    currentQuotationId = quote.id;
    $('#quotationModalTitle').textContent = quote.reference;
    $('#quotationModalMeta').textContent = `Received ${ui.formatDate(quote.receivedAt)} · ${
      quote.items.length
    } line${quote.items.length === 1 ? '' : 's'} · demonstration record`;
    renderQuotationDetail(quote);
    ui.hydrateIcons($('#quotationModalBody'));
    if (!dialog.open) dialog.showModal();
  }

  function saveQuotation() {
    if (!currentQuotationId) return;
    const status = $('#quoteStatus').value;
    const notes = $('#quoteNotes').value;
    const result = Store.updateQuotation(currentQuotationId, { status, internalNotes: notes });
    if (!result.ok) {
      ui.toast(result.error || 'The quotation could not be updated.', { type: 'error' });
      return;
    }
    ui.toast('Demonstration quotation updated locally.', { type: 'success' });
    renderAll();
    openQuotation(currentQuotationId);
  }

  function printQuotation() {
    const quote = Store.getQuotations().find((record) => record.id === currentQuotationId);
    if (!quote) return;
    const rows = quote.items
      .map(
        (item) => `<tr>
          <td>${esc(item.name)}<br><span class="muted">${esc(item.sku)}</span></td>
          <td>${esc(item.unit)}</td>
          <td class="num">${item.qty}</td>
          <td class="num">${
            typeof item.indicativePrice === 'number' ? ui.formatMoney(item.indicativePrice) : 'Confirm'
          }</td>
          <td class="num">${
            typeof item.indicativePrice === 'number'
              ? ui.formatMoney(item.indicativePrice * item.qty)
              : '—'
          }</td>
        </tr>`
      )
      .join('');
    const body = `<div class="doc-head">
        <div><div class="doc-brand">MAROWA STORE<small>Demonstration concept · Migori Town</small></div></div>
        <div class="doc-meta">
          <div>Reference <strong>${esc(quote.reference)}</strong></div>
          <div>Received ${esc(ui.formatDate(quote.receivedAt))}</div>
          <div>Status: ${esc(quote.status)}</div>
        </div>
      </div>
      <div class="stamp">Demonstration — not an official quotation</div>
      <div class="notice">
        <strong>This is a demonstration document.</strong> It was generated from an independent
        frontend concept. It is not issued by Marowa Store, prices are sample data, and no order,
        reservation or payment exists.
      </div>
      <div class="grid">
        <div class="panel">
          <div class="label">Customer</div>
          <strong>${esc(quote.customerName)}</strong><br>
          ${esc(quote.phone)}${quote.email ? `<br>${esc(quote.email)}` : ''}<br>
          <span class="muted">Preferred contact: ${esc(quote.contactMethod || 'Not specified')}</span>
        </div>
        <div class="panel">
          <div class="label">Project</div>
          <strong>${esc(quote.projectType || 'Not specified')}</strong><br>
          <span class="muted">Needed by: ${esc(quote.neededBy || 'Not specified')}<br>
          Branch: ${esc(quote.preferredBranch || 'Migori Main')}</span>
        </div>
      </div>
      <h2>Requested items</h2>
      <table>
        <thead><tr><th>Item</th><th>Unit</th><th class="num">Qty</th><th class="num">Indicative</th><th class="num">Line</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="total"><span>Indicative demo total</span><span>${ui.formatMoney(
        quote.indicativeTotal
      )}</span></div>
      <p class="muted">Confirm-price lines are excluded. Delivery, tax and current-store pricing are not included.</p>
      <h2>Project notes</h2>
      <p>${esc(quote.projectDescription)}</p>
      ${
        quote.internalNotes
          ? `<h2>Internal demo note</h2><p>${esc(quote.internalNotes)}</p>`
          : ''
      }
      <div class="footer">Independent digital commerce concept. Not affiliated with, commissioned by or operated by Marowa Store. Generated ${esc(
        ui.formatDateTime(new Date().toISOString())
      )}.</div>`;
    ui.printHtml(`Demo quotation ${quote.reference}`, body);
  }

  /* ----------------------------------------------------------------------- *
   * Inquiries
   * ----------------------------------------------------------------------- */
  function filteredInquiries() {
    const query = filters.inquiryQuery.trim().toLowerCase();
    return Store.getInquiries().filter((inquiry) => {
      if (filters.inquiryStatus && inquiry.status !== filters.inquiryStatus) return false;
      if (!query) return true;
      return [inquiry.reference, inquiry.customerName, inquiry.topic, inquiry.message, inquiry.phone]
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
  }

  function renderInquiries() {
    const body = $('#inquiriesTableBody');
    if (!body) return;
    const list = filteredInquiries();
    body.innerHTML = list.length
      ? list
          .map(
            (inquiry) => `<tr>
              <td><button class="row-btn" type="button" data-open-inquiry="${attr(inquiry.id)}"
                style="height:auto;padding:0;color:var(--admin-ink);font-family:var(--font-mono);font-size:.64rem">
                ${esc(inquiry.reference)}</button></td>
              <td><strong style="font-weight:600">${esc(inquiry.customerName)}</strong><br>
                <span class="inventory-hint">${esc(inquiry.phone || inquiry.email || 'No contact')}</span></td>
              <td>${esc(inquiry.topic)}</td>
              <td><span class="status status--${slug(inquiry.status)}">${esc(inquiry.status)}</span></td>
              <td class="num">${esc(ui.formatDate(inquiry.receivedAt))}</td>
              <td><div class="cell-actions">
                <button class="row-btn" type="button" data-open-inquiry="${attr(inquiry.id)}">Open</button>
              </div></td>
            </tr>`
          )
          .join('')
      : emptyRow(6, 'No inquiries match', 'Adjust the search or status filter.');
    const count = $('#inquiryTableCount');
    if (count) count.textContent = `${list.length} inquir${list.length === 1 ? 'y' : 'ies'}`;
  }

  function openInquiry(id) {
    const inquiry = Store.getInquiries().find((record) => record.id === id);
    const dialog = $('#inquiryModal');
    if (!inquiry || !dialog) return;
    currentInquiryId = inquiry.id;
    $('#inquiryModalTitle').textContent = inquiry.reference;
    $('#inquiryModalMeta').textContent = `Received ${ui.formatDate(inquiry.receivedAt)} · ${
      inquiry.topic
    } · demonstration record`;
    $('#inquiryModalBody').innerHTML = `<div class="detail-grid">
      <div>
        <div class="detail-block">
          <h3>Customer</h3>
          <p><strong>${esc(inquiry.customerName)}</strong><br>${userContact(inquiry)}</p>
        </div>
        <div class="detail-block">
          <h3>Message</h3>
          <p style="white-space:pre-line">${esc(inquiry.message)}</p>
        </div>
        <div class="detail-block">
          <h3>Demo metadata</h3>
          <p class="detail-note">Received ${esc(ui.formatDateTime(inquiry.receivedAt))} · Source: ${esc(
      inquiry.source || 'demo'
    )} · Record ID ${esc(inquiry.id)}</p>
        </div>
      </div>
      <div class="detail-side">
        <div class="field">
          <label for="inquiryStatus">Inquiry status</label>
          <select id="inquiryStatus">
            ${Store.validInquiryStatuses.map(
              (status) => `<option value="${attr(status)}" ${
                inquiry.status === status ? 'selected' : ''
              }>${esc(status)}</option>`
            ).join('')}
          </select>
          <p class="field__hint">Local demo status only.</p>
        </div>
        <div class="field">
          <label for="inquiryNotes">Internal notes</label>
          <textarea id="inquiryNotes" maxlength="2000" placeholder="Demo-only follow-up note…">${esc(
            inquiry.internalNotes || ''
          )}</textarea>
        </div>
        <div class="notice notice--warning" style="margin:0">
          ${Marowa.icon('alert', 16)}
          <p>No reply is sent from this interface.</p>
        </div>
      </div>
    </div>`;
    ui.hydrateIcons($('#inquiryModalBody'));
    if (!dialog.open) dialog.showModal();
  }

  function saveInquiry() {
    if (!currentInquiryId) return;
    const status = $('#inquiryStatus').value;
    const notes = $('#inquiryNotes').value;
    const result = Store.updateInquiry(currentInquiryId, { status, internalNotes: notes });
    if (!result.ok) {
      ui.toast(result.error || 'The inquiry could not be updated.', { type: 'error' });
      return;
    }
    ui.toast('Demonstration inquiry updated locally.', { type: 'success' });
    renderAll();
    openInquiry(currentInquiryId);
  }

  /* ----------------------------------------------------------------------- *
   * Analytics
   * ----------------------------------------------------------------------- */
  function renderAnalytics() {
    const all = Store.getProducts();
    const active = all.filter((product) => product.active);
    const quotations = Store.getQuotations();

    renderStatusBars(
      $('#categoryChart'),
      categories
        .map((category) => ({
          label: category.name,
          value: active.filter((product) => product.category === category.id).length
        }))
        .sort((a, b) => b.value - a.value),
      { empty: 'No published catalogue records.' }
    );

    renderDonut(
      $('#stockDonut'),
      ['in-stock', 'low-stock', 'out-of-stock', 'contact'].map((status) => ({
        label: STOCK_LABELS[status],
        value: all.filter((product) => product.stockStatus === status).length,
        color: STOCK_COLORS[status]
      })),
      'records',
      'No catalogue records.'
    );

    const valueByCategory = categories
      .map((category) => {
        const value = active
          .filter((product) => product.category === category.id)
          .reduce((sum, product) => {
            if (typeof product.price !== 'number' || product.stockQty === null) return sum;
            return sum + product.price * product.stockQty;
          }, 0);
        return {
          label: category.name,
          value: value,
          display: ui.formatMoney(value)
        };
      })
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value);

    if (valueByCategory.length) {
      const max = Math.max(...valueByCategory.map((item) => item.value));
      // A dedicated proportional list is used because these bars represent
      // currency values rather than counts.
      $('#valueChart').innerHTML = `<div class="status-bars">${valueByCategory
        .map(
          (item) => `<div class="status-bar">
            <div class="status-bar__top"><span>${esc(item.label)}</span><b>${esc(item.display)}</b></div>
            <div class="status-bar__track"><div class="status-bar__fill status-bar__fill--draft"
              style="width:${Math.max(2, (item.value / max) * 100).toFixed(1)}%"></div></div>
          </div>`
        )
        .join('')}</div>`;
    } else {
      renderStatusBars($('#valueChart'), [], { empty: 'No priced stock to value.' });
    }

    const funnel = Store.validStatuses.map((status) => ({
      label: status,
      value: quotations.filter((quote) => quote.status === status).length,
      suffix: 'request',
      className: `status-bar__fill--${
        status === 'New'
          ? 'new'
          : status === 'Under Review'
          ? 'review'
          : status === 'Draft Prepared'
          ? 'draft'
          : status === 'Awaiting Customer'
          ? 'awaiting'
          : 'closed'
      }`
    }));
    renderStatusBars($('#funnelChart'), funnel, { empty: 'No quotation requests yet.' });

    renderStatusBars(
      $('#brandChart'),
      brands
        .map((brand) => ({
          label: brand.name,
          value: active.filter((product) => product.brand === brand.name).length
        }))
        .filter((item) => item.value > 0)
        .sort((a, b) => b.value - a.value),
      { empty: 'No published brand records.' }
    );
  }

  /* ----------------------------------------------------------------------- *
   * Settings / data management
   * ----------------------------------------------------------------------- */
  function populateSettings() {
    const settings = Store.getSettings();
    const set = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.value = value;
    };
    set('settingBusinessName', settings.businessName);
    set('settingPhone', settings.phone);
    set('settingEmail', settings.email);
    set('settingLocation', settings.location);
    set('settingCurrency', settings.currency);
    set('settingPageSize', settings.pageSize);
    set('settingLowStock', settings.lowStockThreshold);
    set('settingQuotePrefix', settings.quotationPrefix);
    set('settingInquiryPrefix', settings.inquiryPrefix);
    set('settingBranchName', settings.branch.name);
    set('settingBranchAddress', settings.branch.address);
    const prices = document.getElementById('settingShowPrices');
    if (prices) prices.checked = Boolean(settings.showIndicativePrices);
    const error = $('#settingsError');
    if (error) {
      error.hidden = true;
      error.textContent = '';
    }
    $$('#settingsForm [aria-invalid="true"]').forEach((el) => el.removeAttribute('aria-invalid'));
    renderStorage();
  }

  function renderStorage() {
    const value = $('#storageValue');
    const fill = $('#storageFill');
    if (!value || !fill) return;
    let bytes = 0;
    try {
      bytes = new Blob([JSON.stringify(Store.getState())]).size;
    } catch {
      bytes = JSON.stringify(Store.getState()).length;
    }
    const quota = 5 * 1024 * 1024;
    const percent = Math.min(100, (bytes / quota) * 100);
    const kb = Math.max(1, Math.round(bytes / 1024));
    value.textContent = `${kb} KB of ~5 MB (${percent < 1 ? '<1' : percent.toFixed(1)}%)`;
    fill.style.width = `${Math.max(1, percent)}%`;
    fill.className = `storage-meter__fill${
      percent > 90 ? ' storage-meter__fill--danger' : percent > 70 ? ' storage-meter__fill--warn' : ''
    }`;
  }

  function saveSettings(event) {
    event.preventDefault();
    const error = $('#settingsError');
    if (error) {
      error.hidden = true;
      error.textContent = '';
    }
    $$('#settingsForm [aria-invalid="true"]').forEach((el) => el.removeAttribute('aria-invalid'));
    const settingIds = {
      businessName: 'settingBusinessName',
      phone: 'settingPhone',
      email: 'settingEmail',
      location: 'settingLocation',
      currency: 'settingCurrency',
      pageSize: 'settingPageSize',
      lowStockThreshold: 'settingLowStock',
      quotationPrefix: 'settingQuotePrefix',
      inquiryPrefix: 'settingInquiryPrefix',
      branchName: 'settingBranchName'
    };
    const result = Store.saveSettings({
      businessName: $('#settingBusinessName').value,
      phone: $('#settingPhone').value,
      email: $('#settingEmail').value,
      location: $('#settingLocation').value,
      currency: $('#settingCurrency').value,
      pageSize: $('#settingPageSize').value,
      lowStockThreshold: $('#settingLowStock').value,
      quotationPrefix: $('#settingQuotePrefix').value,
      inquiryPrefix: $('#settingInquiryPrefix').value,
      showIndicativePrices: $('#settingShowPrices').checked,
      branch: {
        name: $('#settingBranchName').value,
        address: $('#settingBranchAddress').value
      }
    });
    if (!result.ok) {
      if (error) {
        error.hidden = false;
        error.textContent = result.error || 'The settings could not be saved.';
      }
      const field = settingIds[result.field];
      const input = field ? document.getElementById(field) : null;
      if (input) {
        input.setAttribute('aria-invalid', 'true');
        input.focus();
      }
      return;
    }
    ui.toast('Demonstration settings saved locally.', { type: 'success' });
    renderAll();
    populateSettings();
  }

  /* ----------------------------------------------------------------------- *
   * Full render
   * ----------------------------------------------------------------------- */
  function renderAll() {
    renderNavCounts();
    renderOverview();
    renderProducts();
    renderInventory();
    renderQuotations();
    renderInquiries();
    renderAnalytics();
    renderStorage();
  }

  /* ----------------------------------------------------------------------- *
   * Event wiring
   * ----------------------------------------------------------------------- */
  function init() {
    renderAll();
    populateSettings();

    const hash = (window.location.hash || '').replace('#', '');
    showView(views.includes(hash) ? hash : 'overview', false);

    document.addEventListener('click', (event) => {
      const viewButton = event.target.closest('[data-view]');
      if (viewButton) {
        event.preventDefault();
        showView(viewButton.getAttribute('data-view'));
        return;
      }
      const goto = event.target.closest('[data-goto]');
      if (goto) {
        event.preventDefault();
        showView(goto.getAttribute('data-goto'));
      }
    });

    window.addEventListener('hashchange', () => {
      const next = (window.location.hash || '').replace('#', '');
      if (views.includes(next) && next !== currentView) showView(next, false);
    });

    const menuBtn = $('#adminMenuBtn');
    if (menuBtn) menuBtn.addEventListener('click', openSidebar);
    const closeBtn = $('#adminSidebarClose');
    if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
    const overlay = $('#adminOverlay');
    if (overlay) overlay.addEventListener('click', closeSidebar);
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeSidebar();
    });

    const logout = $('#adminLogout');
    if (logout) {
      logout.addEventListener('click', () => {
        if (Marowa.Auth) Marowa.Auth.logout();
        window.location.assign('login.html');
      });
    }

    // Product filters
    const productSearch = $('#productSearch');
    if (productSearch) {
      productSearch.addEventListener('input', () => {
        filters.productQuery = productSearch.value;
        renderProducts();
      });
    }
    const productCategory = $('#productCategoryFilter');
    if (productCategory) {
      productCategory.addEventListener('change', () => {
        filters.productCategory = productCategory.value;
        renderProducts();
      });
    }
    const productStatus = $('#productStatusFilter');
    if (productStatus) {
      productStatus.addEventListener('change', () => {
        filters.productStatus = productStatus.value;
        renderProducts();
      });
    }

    // Product actions
    const productsBody = $('#productsTableBody');
    if (productsBody) {
      productsBody.addEventListener('click', (event) => {
        const edit = event.target.closest('[data-edit-product]');
        if (edit) {
          openProductModal(edit.getAttribute('data-edit-product'));
          return;
        }
        const toggle = event.target.closest('[data-toggle-product]');
        if (toggle) {
          toggleProduct(toggle.getAttribute('data-toggle-product'));
          return;
        }
        const remove = event.target.closest('[data-delete-product]');
        if (remove) deleteProduct(remove.getAttribute('data-delete-product'));
      });
    }

    ['#addProductBtn', '#overviewAddProduct'].forEach((selector) => {
      const button = $(selector);
      if (button) button.addEventListener('click', () => openProductModal(null));
    });

    const productForm = $('#productForm');
    if (productForm) {
      productForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const error = $('#productFormError');
        error.hidden = true;
        error.textContent = '';
        $$('[aria-invalid="true"]', productForm).forEach((el) => el.removeAttribute('aria-invalid'));
        const result = Store.saveProduct({
          id: $('#productId').value || undefined,
          name: $('#productName').value,
          sku: $('#productSku').value,
          brand: $('#productBrand').value,
          category: $('#productCategory').value,
          unit: $('#productUnit').value,
          price: $('#productPrice').value,
          stockQty: $('#productStockQty').value,
          lowStockThreshold: $('#productThreshold').value,
          image: $('#productImage').value,
          imageAlt: $('#productImageAlt').value,
          description: $('#productDescription').value,
          active: $('#productActive').checked,
          featured: $('#productFeatured').checked
        });
        if (!result.ok) {
          error.hidden = false;
          error.textContent = result.error || 'The product could not be saved.';
          const field = productFieldElement(result.field);
          if (field) {
            field.setAttribute('aria-invalid', 'true');
            field.focus();
          }
          return;
        }
        const dialog = $('#productModal');
        if (dialog && dialog.open) dialog.close();
        ui.toast(
          `${result.product.name} ${$('#productId').value ? 'updated' : 'created'} in the local demo.`,
          { type: 'success' }
        );
        renderAll();
      });
    }

    const imageInput = $('#productImage');
    if (imageInput) imageInput.addEventListener('input', () => setPreview(imageInput.value));

    // Inventory filters
    const inventorySearch = $('#inventorySearch');
    if (inventorySearch) {
      inventorySearch.addEventListener('input', () => {
        filters.inventoryQuery = inventorySearch.value;
        renderInventory();
      });
    }
    const inventoryFilter = $('#inventoryFilter');
    if (inventoryFilter) {
      inventoryFilter.addEventListener('change', () => {
        filters.inventoryStatus = inventoryFilter.value;
        renderInventory();
      });
    }

    const lowStockHost = $('#lowStockList');
    if (lowStockHost) {
      lowStockHost.addEventListener('click', (event) => {
        const button = event.target.closest('[data-open-inventory]');
        if (button) openInventoryModal(button.getAttribute('data-open-inventory'));
      });
    }

    const inventoryBody = $('#inventoryTableBody');
    if (inventoryBody) {
      inventoryBody.addEventListener('click', (event) => {
        const button = event.target.closest('[data-open-inventory]');
        if (button) openInventoryModal(button.getAttribute('data-open-inventory'));
      });
    }

    const inventoryForm = $('#inventoryForm');
    if (inventoryForm) {
      inventoryForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const id = $('#inventoryProductId').value;
        const error = $('#inventoryFormError');
        error.hidden = true;
        error.textContent = '';
        const result = Store.updateInventory(id, {
          stockQty: $('#inventoryQty').value,
          lowStockThreshold: $('#inventoryThreshold').value,
          note: $('#inventoryNote').value
        });
        if (!result.ok) {
          error.hidden = false;
          error.textContent = result.error || 'Stock could not be updated.';
          return;
        }
        const dialog = $('#inventoryModal');
        if (dialog && dialog.open) dialog.close();
        ui.toast(`Stock updated for ${result.product.name}.`, { type: 'success' });
        renderAll();
      });
    }

    // Quotation filters
    const quotationSearch = $('#quotationSearch');
    if (quotationSearch) {
      quotationSearch.addEventListener('input', () => {
        filters.quotationQuery = quotationSearch.value;
        renderQuotations();
      });
    }
    const quotationStatus = $('#quotationStatusFilter');
    if (quotationStatus) {
      quotationStatus.addEventListener('change', () => {
        filters.quotationStatus = quotationStatus.value;
        renderQuotations();
      });
    }

    ['#quotationsTableBody', '#recentQuotationsBody'].forEach((selector) => {
      const host = $(selector);
      if (host) {
        host.addEventListener('click', (event) => {
          const button = event.target.closest('[data-open-quotation]');
          if (button) openQuotation(button.getAttribute('data-open-quotation'));
        });
      }
    });

    const saveQuote = $('#saveQuotation');
    if (saveQuote) saveQuote.addEventListener('click', saveQuotation);
    const printQuote = $('#printQuotation');
    if (printQuote) printQuote.addEventListener('click', printQuotation);

    // Inquiry filters
    const inquirySearch = $('#inquirySearch');
    if (inquirySearch) {
      inquirySearch.addEventListener('input', () => {
        filters.inquiryQuery = inquirySearch.value;
        renderInquiries();
      });
    }
    const inquiryStatus = $('#inquiryStatusFilter');
    if (inquiryStatus) {
      inquiryStatus.addEventListener('change', () => {
        filters.inquiryStatus = inquiryStatus.value;
        renderInquiries();
      });
    }
    const inquiryBody = $('#inquiriesTableBody');
    if (inquiryBody) {
      inquiryBody.addEventListener('click', (event) => {
        const button = event.target.closest('[data-open-inquiry]');
        if (button) openInquiry(button.getAttribute('data-open-inquiry'));
      });
    }
    const saveInq = $('#saveInquiry');
    if (saveInq) saveInq.addEventListener('click', saveInquiry);

    // Analytics refresh
    const refresh = $('#analyticsRefresh');
    if (refresh) {
      refresh.addEventListener('click', () => {
        renderAnalytics();
        ui.toast('Analytics recomputed from local demonstration data.', { type: 'success' });
      });
    }

    // Settings
    const settingsForm = $('#settingsForm');
    if (settingsForm) settingsForm.addEventListener('submit', saveSettings);
    const settingsReset = $('#settingsReset');
    if (settingsReset) {
      settingsReset.type = 'button';
      settingsReset.addEventListener('click', populateSettings);
    }

    const exportButtons = ['#exportData', '#downloadBackup', '#exportProducts', '#inventoryExport'];
    exportButtons.forEach((selector) => {
      const button = $(selector);
      if (!button) return;
      button.addEventListener('click', () => {
        const data = exportJson();
        if (selector === '#exportData') {
          const area = $('#importData');
          if (area) area.value = data;
        }
        downloadFile(`marowa-demo-${dateStamp()}.json`, data);
      });
    });

    const importButton = $('#importDataBtn');
    if (importButton) {
      importButton.addEventListener('click', () => {
        const area = $('#importData');
        const result = Store.importData(area ? area.value : '');
        if (!result.ok) {
          ui.toast(result.error, { type: 'error' });
          return;
        }
        ui.toast('Demonstration data imported locally.', { type: 'success' });
        renderAll();
        populateSettings();
      });
    }

    const importFile = $('#importFile');
    if (importFile) {
      importFile.addEventListener('change', () => {
        const file = importFile.files && importFile.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          const area = $('#importData');
          if (area) area.value = String(reader.result || '');
          const result = Store.importData(String(reader.result || ''));
          if (!result.ok) {
            ui.toast(result.error, { type: 'error' });
            return;
          }
          ui.toast('Demonstration backup imported locally.', { type: 'success' });
          renderAll();
          populateSettings();
        };
        reader.onerror = () => ui.toast('The selected file could not be read.', { type: 'error' });
        reader.readAsText(file);
      });
    }

    const reset = $('#resetDemo');
    if (reset) {
      reset.addEventListener('click', async () => {
        const confirmed = await ui.confirm({
          title: 'Reset all demonstration data?',
          message:
            'This restores the original sample products, quotations, inquiries, settings and activity. Cart and quotation list are cleared. Export a backup first if you want to keep the current state.',
          confirmLabel: 'Reset demo data',
          danger: true
        });
        if (!confirmed) return;
        Store.resetDemo();
        renderAll();
        populateSettings();
        ui.toast('Demonstration data reset to the original sample state.', { type: 'success' });
      });
    }

    // Close buttons and backdrop clicks for admin modals.
    $$('[data-close-admin-modal]').forEach((button) => {
      button.addEventListener('click', () => {
        const dialog = button.closest('dialog');
        if (dialog) dialog.close();
      });
    });
    $$('dialog.admin-modal').forEach((dialog) => {
      dialog.addEventListener('click', (event) => {
        if (event.target === dialog) dialog.close();
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
