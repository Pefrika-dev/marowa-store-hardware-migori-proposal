/**
 * Catalogue pages: products.html, categories.html, brands.html.
 *
 * Filtering, sorting and pagination happen entirely in the browser against the
 * local demonstration store. No API request is made.
 */
(function () {
  const Store = Marowa.Store;
  const ui = Marowa.ui;
  const $ = ui.$;
  const $$ = ui.$$;
  const page = document.body.getAttribute('data-page');

  const STOCK_LABELS = {
    'in-stock': 'In stock',
    'low-stock': 'Low stock',
    'out-of-stock': 'Out of stock',
    contact: 'Confirm availability'
  };

  /* ----------------------------------------------------------------------- *
   * Categories page
   * ----------------------------------------------------------------------- */
  function renderCategoriesPage() {
    const grid = $('#categoryGrid');
    if (!grid) return;
    const products = Store.getProducts({ activeOnly: true });
    const categories = Store.getCategories();
    grid.innerHTML = categories
      .map((category, index) => {
        const count = products.filter((p) => p.category === category.id).length;
        return ui
          .renderCategoryCard(category, count, index)
          .replace('class="category-card"', 'class="category-card category-card--wide"');
      })
      .join('');
    $$('[data-category-total]').forEach((el) => (el.textContent = categories.length));
  }

  /* ----------------------------------------------------------------------- *
   * Brands page
   * ----------------------------------------------------------------------- */
  function initials(name) {
    return name
      .split(/[\s/]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  }

  function renderBrandsPage() {
    const grid = $('#brandGrid');
    if (!grid) return;
    const products = Store.getProducts({ activeOnly: true });
    const brands = Store.getBrands();
    grid.innerHTML = brands
      .map((brand) => {
        const count = products.filter((p) => p.brand === brand.name).length;
        return `<article class="brand-card">
          <div class="brand-card__top">
            <span class="brand-card__mark" aria-hidden="true">${ui.escapeHtml(initials(brand.name))}</span>
            <span class="brand-card__count">${count} demo listing${count === 1 ? '' : 's'}</span>
          </div>
          <h2>${ui.escapeHtml(brand.name)}</h2>
          <p>${ui.escapeHtml(brand.note)} — sample grouping only.</p>
          <a class="brand-card__link" href="products.html?brand=${encodeURIComponent(brand.name)}">
            View demo listings ${Marowa.icon('arrow-right', 15)}
          </a>
        </article>`;
      })
      .join('');
    $$('[data-brand-total]').forEach((el) => (el.textContent = brands.length));
  }

  /* ----------------------------------------------------------------------- *
   * Products page
   * ----------------------------------------------------------------------- */
  function initCatalogue() {
    const grid = $('#productGrid');
    const filterForm = $('#filtersPanel');
    if (!grid || !filterForm) return;

    const settings = Store.getSettings();
    const categories = Store.getCategories();
    const brands = Store.getBrands();
    const activeProducts = Store.getProducts({ activeOnly: true });
    const categoryNames = new Map(categories.map((c) => [c.id, c.name]));

    const state = {
      q: '',
      category: '',
      brand: '',
      stock: '',
      price: '',
      featured: false,
      sort: 'featured',
      page: 1,
      pageSize: Math.max(3, Number(settings.pageSize) || 9)
    };

    // ---- Read initial state from the URL (shareable filters) ----
    let params;
    try {
      params = new URLSearchParams(window.location.search);
    } catch {
      params = new URLSearchParams('');
    }
    if (params.get('q')) state.q = params.get('q').trim();
    if (params.get('category') && categories.some((c) => c.id === params.get('category')))
      state.category = params.get('category');
    if (params.get('brand') && brands.some((b) => b.name === params.get('brand')))
      state.brand = params.get('brand');
    if (['in-stock', 'low-stock', 'out-of-stock', 'contact'].includes(params.get('stock')))
      state.stock = params.get('stock');
    if (['priced', 'confirm'].includes(params.get('price'))) state.price = params.get('price');
    state.featured = params.get('featured') === '1';
    if (['featured', 'name-asc', 'name-desc', 'price-asc', 'price-desc', 'newest'].includes(params.get('sort')))
      state.sort = params.get('sort');
    const urlPage = Number(params.get('page'));
    if (Number.isInteger(urlPage) && urlPage > 0) state.page = urlPage;

    function countActive(predicate) {
      return activeProducts.filter(predicate).length;
    }

    function stockCount(status) {
      return countActive((p) => p.stockStatus === status);
    }

    // ---- Build filter controls once ----
    function radio(name, value, label, checked, count) {
      return `<label class="filter-option">
        <input type="radio" name="${name}" value="${ui.escapeAttribute(value)}" ${
          checked ? 'checked' : ''
        }>
        <span>${ui.escapeHtml(label)}</span>
        ${typeof count === 'number' ? `<span class="filter-option__count">${count}</span>` : ''}
      </label>`;
    }

    $('#categoryFilters').innerHTML =
      radio('category', '', 'All departments', !state.category, activeProducts.length) +
      categories
        .map((category) => {
          const count = countActive((p) => p.category === category.id);
          return radio('category', category.id, category.name, state.category === category.id, count);
        })
        .join('');

    $('#brandFilters').innerHTML =
      radio('brand', '', 'All brands', !state.brand, activeProducts.length) +
      brands
        .map((brand) => {
          const count = countActive((p) => p.brand === brand.name);
          return radio('brand', brand.name, brand.name, state.brand === brand.name, count);
        })
        .join('');

    $('#stockFilters').innerHTML =
      radio('stock', '', 'Any availability', !state.stock, activeProducts.length) +
      Object.entries(STOCK_LABELS)
        .map(([value, label]) => radio('stock', value, label, state.stock === value, stockCount(value)))
        .join('');

    $('#priceFilters').innerHTML =
      radio('price', '', 'Any price state', !state.price, activeProducts.length) +
      radio(
        'price',
        'priced',
        'Indicative price shown',
        state.price === 'priced',
        countActive((p) => typeof p.price === 'number')
      ) +
      radio(
        'price',
        'confirm',
        'Confirm price',
        state.price === 'confirm',
        countActive((p) => typeof p.price !== 'number')
      );

    $('#otherFilters').innerHTML = `<label class="filter-option">
      <input type="checkbox" name="featured" value="1" ${state.featured ? 'checked' : ''}>
      <span>Featured listings only</span>
      <span class="filter-option__count">${countActive((p) => p.featured)}</span>
    </label>`;

    $('#categoryFilterCount').textContent = `${categories.length}`;
    $('#brandFilterCount').textContent = `${brands.length}`;

    const searchInput = $('#catalogueSearch');
    const sortSelect = $('#sortSelect');
    searchInput.value = state.q;
    sortSelect.value = state.sort;

    // ---- Filtering / sorting ----
    function matchesQuery(product, query) {
      if (!query) return true;
      const haystack = [
        product.name,
        product.sku,
        product.brand,
        categoryNames.get(product.category) || '',
        product.description || ''
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(query.toLowerCase());
    }

    function filteredProducts() {
      const query = state.q.trim();
      let list = activeProducts.filter((product) => {
        if (!matchesQuery(product, query)) return false;
        if (state.category && product.category !== state.category) return false;
        if (state.brand && product.brand !== state.brand) return false;
        if (state.stock && product.stockStatus !== state.stock) return false;
        if (state.price === 'priced' && typeof product.price !== 'number') return false;
        if (state.price === 'confirm' && typeof product.price === 'number') return false;
        if (state.featured && !product.featured) return false;
        return true;
      });

      const byName = (a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' });
      switch (state.sort) {
        case 'name-asc':
          list = list.sort(byName);
          break;
        case 'name-desc':
          list = list.sort((a, b) => byName(b, a));
          break;
        case 'price-asc':
          list = list.sort((a, b) => {
            const ap = typeof a.price === 'number' ? a.price : Infinity;
            const bp = typeof b.price === 'number' ? b.price : Infinity;
            if (ap !== bp) return ap - bp;
            return byName(a, b);
          });
          break;
        case 'price-desc':
          list = list.sort((a, b) => {
            const ap = typeof a.price === 'number' ? a.price : -Infinity;
            const bp = typeof b.price === 'number' ? b.price : -Infinity;
            if (ap !== bp) return bp - ap;
            return byName(a, b);
          });
          break;
        case 'newest':
          list = list.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
          break;
        case 'featured':
        default:
          list = list.sort((a, b) => {
            if (a.featured !== b.featured) return a.featured ? -1 : 1;
            return byName(a, b);
          });
      }
      return list;
    }

    // ---- Active filter chips ----
    function activeFilterChips() {
      const chips = [];
      if (state.q.trim()) chips.push({ key: 'q', label: `“${state.q.trim()}”` });
      if (state.category) chips.push({ key: 'category', label: categoryNames.get(state.category) });
      if (state.brand) chips.push({ key: 'brand', label: state.brand });
      if (state.stock) chips.push({ key: 'stock', label: STOCK_LABELS[state.stock] });
      if (state.price === 'priced') chips.push({ key: 'price', label: 'Priced only' });
      if (state.price === 'confirm') chips.push({ key: 'price', label: 'Confirm price' });
      if (state.featured) chips.push({ key: 'featured', label: 'Featured only' });
      return chips;
    }

    function renderChips() {
      const host = $('#activeFilters');
      const chips = activeFilterChips();
      if (!chips.length) {
        host.innerHTML = '';
        return;
      }
      host.innerHTML =
        chips
          .map(
            (chip) => `<span class="filter-chip">${ui.escapeHtml(chip.label)}
              <button type="button" data-clear-filter="${chip.key}" aria-label="Remove filter ${ui.escapeAttribute(
              chip.label
            )}">${Marowa.icon('close', 11)}</button>
            </span>`
          )
          .join('') +
        `<button class="active-filters__clear" type="button" id="activeClearAll">Clear all</button>`;
    }

    function syncFilterInputs() {
      $$('input[name="category"]', filterForm).forEach((input) => {
        input.checked = input.value === state.category;
      });
      $$('input[name="brand"]', filterForm).forEach((input) => {
        input.checked = input.value === state.brand;
      });
      $$('input[name="stock"]', filterForm).forEach((input) => {
        input.checked = input.value === state.stock;
      });
      $$('input[name="price"]', filterForm).forEach((input) => {
        input.checked = input.value === state.price;
      });
      const featured = $('input[name="featured"]', filterForm);
      if (featured) featured.checked = state.featured;
      if (searchInput.value !== state.q) searchInput.value = state.q;
      if (sortSelect.value !== state.sort) sortSelect.value = state.sort;
    }

    function syncUrl() {
      try {
        const next = new URLSearchParams();
        if (state.q.trim()) next.set('q', state.q.trim());
        if (state.category) next.set('category', state.category);
        if (state.brand) next.set('brand', state.brand);
        if (state.stock) next.set('stock', state.stock);
        if (state.price) next.set('price', state.price);
        if (state.featured) next.set('featured', '1');
        if (state.sort !== 'featured') next.set('sort', state.sort);
        if (state.page > 1) next.set('page', String(state.page));
        const query = next.toString();
        const url = `${window.location.pathname}${query ? `?${query}` : ''}`;
        if (window.location.search !== (query ? `?${query}` : '')) {
          window.history.replaceState(null, '', url);
        }
      } catch {
        /* file:// contexts may block history replacement; filters still work */
      }
    }

    function renderPagination(total, totalPages) {
      const host = $('#pagination');
      if (totalPages <= 1) {
        host.innerHTML = `<span class="pagination__summary">Showing all ${total} matching demonstration listing${
          total === 1 ? '' : 's'
        }.</span>`;
        return;
      }
      const pages = [];
      const add = (value) => {
        if (!pages.includes(value)) pages.push(value);
      };
      add(1);
      for (let i = state.page - 1; i <= state.page + 1; i += 1) {
        if (i > 1 && i < totalPages) add(i);
      }
      add(totalPages);
      pages.sort((a, b) => a - b);

      let numbers = '';
      let previous = 0;
      pages.forEach((number) => {
        if (previous && number - previous > 1) numbers += '<span aria-hidden="true">…</span>';
        numbers += `<button type="button" data-page="${number}" ${
          number === state.page ? 'aria-current="page"' : ''
        } aria-label="Page ${number}">${number}</button>`;
        previous = number;
      });

      const start = (state.page - 1) * state.pageSize + 1;
      const end = Math.min(total, state.page * state.pageSize);
      host.innerHTML = `
        <span class="pagination__summary">Showing ${start}–${end} of ${total} demonstration listings</span>
        <div class="pagination__pages">
          <button type="button" data-page="${state.page - 1}" ${
        state.page === 1 ? 'disabled' : ''
      } aria-label="Previous page">${Marowa.icon('chevron-left', 14)}</button>
          ${numbers}
          <button type="button" data-page="${state.page + 1}" ${
        state.page === totalPages ? 'disabled' : ''
      } aria-label="Next page">${Marowa.icon('chevron-right', 14)}</button>
        </div>`;
    }

    function render() {
      const matches = filteredProducts();
      const totalPages = Math.max(1, Math.ceil(matches.length / state.pageSize));
      if (state.page > totalPages) state.page = totalPages;
      if (state.page < 1) state.page = 1;

      const start = (state.page - 1) * state.pageSize;
      const visible = matches.slice(start, start + state.pageSize);

      grid.innerHTML = visible.map((product) => ui.renderProductCard(product)).join('');
      const empty = $('#emptyState');
      empty.hidden = matches.length > 0;
      grid.hidden = matches.length === 0;

      const summary = $('#resultsSummary');
      if (matches.length === 0) {
        summary.textContent = 'No demonstration listings match these filters.';
      } else {
        const descriptors = [];
        if (state.category) descriptors.push(categoryNames.get(state.category));
        if (state.brand) descriptors.push(state.brand);
        if (state.stock) descriptors.push(STOCK_LABELS[state.stock].toLowerCase());
        summary.innerHTML = `<strong>${matches.length}</strong> demonstration listing${
          matches.length === 1 ? '' : 's'
        }${descriptors.length ? ` · ${ui.escapeHtml(descriptors.join(' · '))}` : ''}`;
      }

      renderChips();
      renderPagination(matches.length, totalPages);
      syncFilterInputs();
      syncUrl();
    }

    function setState(patch, options = {}) {
      Object.assign(state, patch);
      if (!options.keepPage) state.page = 1;
      render();
    }

    function resetFilters() {
      state.q = '';
      state.category = '';
      state.brand = '';
      state.stock = '';
      state.price = '';
      state.featured = false;
      state.sort = 'featured';
      state.page = 1;
      render();
    }

    // ---- Events ----
    filterForm.addEventListener('change', (event) => {
      const input = event.target;
      if (!(input instanceof HTMLInputElement) || !input.name) return;
      if (input.name === 'featured') {
        setState({ featured: input.checked });
        return;
      }
      setState({ [input.name]: input.value });
    });

    sortSelect.addEventListener('change', () => {
      setState({ sort: sortSelect.value });
    });

    $('#catalogueSearchForm').addEventListener('submit', (event) => {
      event.preventDefault();
      setState({ q: searchInput.value.trim() });
      closeFilters();
    });

    searchInput.addEventListener('search', () => {
      if (!searchInput.value) setState({ q: '' });
    });

    const clear = () => resetFilters();
    $('#clearFilters').addEventListener('click', clear);
    $('#filtersClearTop').addEventListener('click', clear);
    $('#emptyClear').addEventListener('click', clear);

    $('#activeFilters').addEventListener('click', (event) => {
      const chip = event.target.closest('[data-clear-filter]');
      if (chip) {
        const key = chip.getAttribute('data-clear-filter');
        if (key === 'featured') setState({ featured: false });
        else setState({ [key]: '' });
        return;
      }
      if (event.target.closest('#activeClearAll')) resetFilters();
    });

    $('#pagination').addEventListener('click', (event) => {
      const button = event.target.closest('[data-page]');
      if (!button || button.disabled) return;
      const next = Number(button.getAttribute('data-page'));
      if (!Number.isInteger(next) || next < 1) return;
      state.page = next;
      render();
      const anchor = $('#resultsSummary');
      if (anchor) {
        const top = anchor.getBoundingClientRect().top + window.scrollY - 110;
        window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
      }
    });

    // Mobile filter drawer
    const toggle = $('#filterToggle');
    function openFilters() {
      filterForm.classList.add('is-open');
      document.body.classList.add('has-open-dialog');
      if (toggle) toggle.setAttribute('aria-expanded', 'true');
      const closeBtn = $('#filtersClose');
      if (closeBtn) window.setTimeout(() => closeBtn.focus(), 50);
    }
    function closeFilters() {
      if (!filterForm.classList.contains('is-open')) return;
      filterForm.classList.remove('is-open');
      document.body.classList.remove('has-open-dialog');
      if (toggle) {
        toggle.setAttribute('aria-expanded', 'false');
        toggle.focus();
      }
    }
    if (toggle) toggle.addEventListener('click', openFilters);
    $('#filtersClose').addEventListener('click', closeFilters);
    $('#applyFilters').addEventListener('click', closeFilters);
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeFilters();
    });

    render();
  }

  if (page === 'products') initCatalogue();
  else if (page === 'categories') renderCategoriesPage();
  else if (page === 'brands') renderBrandsPage();
})();
