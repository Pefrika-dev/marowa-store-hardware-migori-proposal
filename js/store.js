/**
 * Local demonstration data layer.
 *
 * All data is stored in localStorage under a single versioned key. If storage
 * is unavailable (for example, a restrictive file:// context), the store falls
 * back to in-memory state and reports that limitation to the interface.
 *
 * This is NOT a shared database, NOT a backend and NOT a secure record store.
 */
(function () {
  const CFG = Marowa.config;
  const DATA = Marowa.data;
  const KEY = CFG.demo.storageKey;
  const VERSION = 1;
  const MAX_ACTIVITY = 120;
  const listeners = new Set();
  const validStatuses = ['New', 'Under Review', 'Draft Prepared', 'Awaiting Customer', 'Closed'];
  const validInquiryStatuses = ['New', 'In Progress', 'Resolved', 'Closed'];

  let storageAvailable = true;
  let memoryState = null;

  const clone = (value) => JSON.parse(JSON.stringify(value));
  const nowIso = () => new Date().toISOString();
  const daysAgo = (days, hours = 0) =>
    new Date(Date.now() - days * 86400000 - hours * 3600000).toISOString();
  const makeId = (prefix) =>
    `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

  function slugify(value) {
    return String(value)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60);
  }

  function testStorage() {
    try {
      const probe = '__marowa_storage_probe__';
      window.localStorage.setItem(probe, '1');
      window.localStorage.removeItem(probe);
      return true;
    } catch {
      return false;
    }
  }

  function deriveStockStatus(quantity, threshold) {
    if (quantity === null || quantity === undefined || quantity === '') return 'contact';
    const qty = Number(quantity);
    if (!Number.isFinite(qty)) return 'contact';
    if (qty <= 0) return 'out-of-stock';
    if (qty <= Number(threshold || 0)) return 'low-stock';
    return 'in-stock';
  }

  function moneyTotal(items) {
    let total = 0;
    let priced = 0;
    let unpriced = 0;
    items.forEach((item) => {
      if (typeof item.indicativePrice === 'number') {
        total += item.indicativePrice * item.qty;
        priced += 1;
      } else {
        unpriced += 1;
      }
    });
    return { total, priced, unpriced };
  }

  function baseSettings() {
    return {
      businessName: CFG.business.name,
      phone: CFG.business.phoneDisplay,
      email: CFG.business.email,
      location: CFG.business.location,
      currency: CFG.defaults.currency,
      lowStockThreshold: CFG.defaults.lowStockThreshold,
      quotationPrefix: CFG.defaults.quotationPrefix,
      inquiryPrefix: CFG.defaults.inquiryPrefix,
      pageSize: CFG.defaults.pageSize,
      showIndicativePrices: true,
      branch: {
        id: 'migori-main',
        name: 'Migori Main',
        address: 'Migori Town, next to Bansi Wholesale'
      }
    };
  }

  function normalizeSeedProduct(raw, index) {
    const threshold = Number.isFinite(Number(raw.lowStockThreshold))
      ? Number(raw.lowStockThreshold)
      : CFG.defaults.lowStockThreshold;
    const qty =
      raw.stockQty === null || raw.stockQty === undefined ? null : Number(raw.stockQty);
    return {
      ...clone(raw),
      id: raw.id,
      stockQty: qty,
      lowStockThreshold: threshold,
      stockStatus: deriveStockStatus(qty, threshold),
      branchId: raw.branchId || 'migori-main',
      active: raw.active !== false,
      featured: Boolean(raw.featured),
      demoData: true,
      createdAt: daysAgo(45 - Math.min(index, 35)),
      updatedAt: daysAgo(Math.max(0, 12 - (index % 12)))
    };
  }

  function buildQuotationItem(products, productId, qty, note = '') {
    const product = products.find((p) => p.id === productId);
    if (!product) return null;
    return {
      productId: product.id,
      sku: product.sku,
      name: product.name,
      brand: product.brand,
      unit: product.unit,
      qty,
      indicativePrice: typeof product.price === 'number' ? product.price : null,
      note
    };
  }

  function seedState() {
    const settings = baseSettings();
    const products = DATA.products.map(normalizeSeedProduct);
    const year = new Date().getFullYear();

    const quotationSeeds = [
      {
        n: 1,
        customerName: 'Grace Achieng',
        phone: '0700 000 101',
        email: 'grace.achieng@example.com',
        contactMethod: 'Phone call',
        projectType: 'Home build',
        projectDescription:
          'Three-bedroom build — first-fix plumbing and electrical materials. Please confirm quantities and current pricing before I arrange collection.',
        preferredBranch: 'Migori Main',
        neededBy: '',
        status: 'New',
        days: 2,
        items: [
          ['cement-50kg', 20, 'Confirm current cement brand.'],
          ['pvc-waste-pipe-50mm', 6, ''],
          ['pvc-elbow-50mm', 4, ''],
          ['electrical-cable-25mm', 30, 'Please confirm available colours.']
        ],
        internalNotes: ''
      },
      {
        n: 2,
        customerName: 'Kevin Otieno',
        phone: '0700 000 102',
        email: '',
        contactMethod: 'WhatsApp',
        projectType: 'Workshop fit-out',
        projectDescription:
          'Setting up a small workshop in Migori Town. I need a drill, measuring tapes and two safety helmets. Please advise on alternatives in the same range.',
        preferredBranch: 'Migori Main',
        neededBy: '',
        status: 'Under Review',
        days: 4,
        items: [
          ['cordless-drill-driver', 1, ''],
          ['tape-measure-8m', 2, ''],
          ['safety-helmet', 2, 'Prefer red if available.']
        ],
        internalNotes: 'Demonstration record. Check whether the requested drill configuration is available.'
      },
      {
        n: 3,
        customerName: 'Mama Njeri Construction',
        phone: '0700 000 103',
        email: 'site@example.com',
        contactMethod: 'Phone call',
        projectType: 'Residential construction',
        projectDescription:
          'Materials for a residential wall and slab. Cement quantity is the priority; please confirm the brick price separately.',
        preferredBranch: 'Migori Main',
        neededBy: '',
        status: 'Draft Prepared',
        days: 6,
        items: [
          ['cement-50kg', 80, 'Delivery/collection to be discussed.'],
          ['clay-bricks', 12, 'Price not yet shown in the demo catalogue.'],
          ['pvc-waste-pipe-50mm', 10, ''],
          ['hex-bolts-pack', 5, '']
        ],
        internalNotes:
          'Draft prepared for internal review. No quotation has been sent to the customer in this demonstration.'
      },
      {
        n: 4,
        customerName: 'Peter Ouma',
        phone: '0700 000 104',
        email: 'peter.ouma@example.com',
        contactMethod: 'Email',
        projectType: 'Repainting',
        projectDescription:
          'Repainting a small retail unit. I need rollers, trays and gloves. Email contact is preferred.',
        preferredBranch: 'Migori Main',
        neededBy: '',
        status: 'Awaiting Customer',
        days: 9,
        items: [
          ['paint-roller-9in', 4, ''],
          ['roller-tray-kit', 2, ''],
          ['work-gloves', 6, 'Please confirm sizes.']
        ],
        internalNotes:
          'Demonstration status. In a production system this status would only be used after a staff member had sent the quotation externally.'
      },
      {
        n: 5,
        customerName: 'Migori Builders Ltd',
        phone: '0700 000 105',
        email: 'office@example.com',
        contactMethod: 'Phone call',
        projectType: 'Tool replenishment',
        projectDescription:
          'Replenishing tools for a fabrication team. Please confirm the grinder specification and extension lead cable length.',
        preferredBranch: 'Migori Main',
        neededBy: '',
        status: 'Closed',
        days: 14,
        items: [
          ['angle-grinder', 2, ''],
          ['extension-lead-4way', 3, ''],
          ['wood-screws-box', 10, '']
        ],
        internalNotes: 'Closed demonstration record. No actual customer communication occurred.'
      }
    ];

    const quotations = quotationSeeds.map((seed) => {
      const items = seed.items
        .map(([id, qty, note]) => buildQuotationItem(products, id, qty, note))
        .filter(Boolean);
      const totals = moneyTotal(items);
      return {
        id: makeId('quo'),
        reference: `${settings.quotationPrefix}-${year}-${String(seed.n).padStart(4, '0')}`,
        customerName: seed.customerName,
        phone: seed.phone,
        email: seed.email,
        contactMethod: seed.contactMethod,
        projectType: seed.projectType,
        projectDescription: seed.projectDescription,
        preferredBranch: seed.preferredBranch,
        neededBy: seed.neededBy,
        items,
        indicativeTotal: totals.total,
        hasUnpricedItems: totals.unpriced > 0,
        status: seed.status,
        internalNotes: seed.internalNotes,
        receivedAt: daysAgo(seed.days),
        updatedAt: daysAgo(seed.days, 1),
        draftPreparedAt: seed.status === 'Draft Prepared' ? daysAgo(seed.days - 1) : null,
        source: 'demo-seed',
        demoData: true
      };
    });

    const inquiries = [
      {
        n: 1,
        customerName: 'Anne Atieno',
        phone: '0700 000 201',
        email: '',
        topic: 'Product availability',
        message:
          'Do you have 50mm PVC elbow fittings available? I need a small quantity for a repair in Migori Town.',
        status: 'New',
        days: 1,
        internalNotes: ''
      },
      {
        n: 2,
        customerName: 'Kevin Otieno',
        phone: '0700 000 202',
        email: 'kevin.otieno@example.com',
        topic: 'Quotation follow-up',
        message:
          'Following up on my workshop materials list. I would like to confirm the drill options before travelling to the shop.',
        status: 'In Progress',
        days: 3,
        internalNotes: 'Demonstration inquiry linked to a separate quotation request.'
      },
      {
        n: 3,
        customerName: 'Mercy Awino',
        phone: '0700 000 203',
        email: '',
        topic: 'Visit or collection',
        message:
          'Can I confirm product availability before coming to the Migori Town shop? I would like to collect the items myself.',
        status: 'Resolved',
        days: 8,
        internalNotes: 'Demonstration record. No message was actually sent to the customer.'
      }
    ].map((seed) => ({
      id: makeId('inq'),
      reference: `${settings.inquiryPrefix}-${year}-${String(seed.n).padStart(4, '0')}`,
      customerName: seed.customerName,
      phone: seed.phone,
      email: seed.email,
      topic: seed.topic,
      message: seed.message,
      status: seed.status,
      internalNotes: seed.internalNotes,
      receivedAt: daysAgo(seed.days),
      updatedAt: daysAgo(seed.days, 1),
      source: 'demo-seed',
      demoData: true
    }));

    const activity = [
      {
        id: makeId('act'),
        type: 'inventory',
        message: 'Angle Grinder 850W stock set to 4 units — below the demo low-stock threshold.',
        at: daysAgo(1),
        meta: { productId: 'angle-grinder' }
      },
      {
        id: makeId('act'),
        type: 'quotation',
        message: 'Quotation MRW-Q-' + year + '-0003 marked Draft Prepared (demo record).',
        at: daysAgo(2, 3),
        meta: {}
      },
      {
        id: makeId('act'),
        type: 'product',
        message: 'Draft listing “Masonry Blocks” created and left unpublished.',
        at: daysAgo(3),
        meta: { productId: 'masonry-blocks' }
      },
      {
        id: makeId('act'),
        type: 'inquiry',
        message: 'Inquiry MRW-I-' + year + '-0003 marked Resolved (demo record).',
        at: daysAgo(5),
        meta: {}
      },
      {
        id: makeId('act'),
        type: 'inventory',
        message: 'PVC Fittings Pack stock set to 3 units — low-stock demonstration.',
        at: daysAgo(7),
        meta: { productId: 'pvc-fittings-pack' }
      }
    ];

    return {
      version: VERSION,
      isDemo: true,
      createdAt: nowIso(),
      products,
      quotations,
      inquiries,
      cart: [],
      quoteList: [],
      settings,
      activity,
      lastUpdated: nowIso()
    };
  }

  function hydrateState(raw) {
    if (!raw || raw.version !== VERSION || !Array.isArray(raw.products)) return null;
    const defaults = baseSettings();
    const settings = {
      ...defaults,
      ...(raw.settings || {}),
      branch: { ...defaults.branch, ...((raw.settings && raw.settings.branch) || {}) }
    };
    return {
      ...raw,
      products: raw.products.map((product) => ({
        ...product,
        stockQty:
          product.stockQty === null || product.stockQty === undefined
            ? null
            : Number(product.stockQty),
        lowStockThreshold:
          product.lowStockThreshold === undefined
            ? settings.lowStockThreshold
            : Number(product.lowStockThreshold),
        stockStatus:
          product.stockStatus || deriveStockStatus(product.stockQty, product.lowStockThreshold),
        branchId: product.branchId || settings.branch.id,
        active: product.active !== false,
        demoData: true
      })),
      quotations: Array.isArray(raw.quotations) ? raw.quotations : [],
      inquiries: Array.isArray(raw.inquiries) ? raw.inquiries : [],
      cart: Array.isArray(raw.cart) ? raw.cart : [],
      quoteList: Array.isArray(raw.quoteList) ? raw.quoteList : [],
      activity: Array.isArray(raw.activity) ? raw.activity : [],
      settings
    };
  }

  function persist() {
    if (!storageAvailable) return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(memoryState));
    } catch {
      storageAvailable = false;
    }
  }

  function loadInitial() {
    storageAvailable = testStorage();
    if (!storageAvailable) {
      memoryState = seedState();
      return;
    }
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) {
        const hydrated = hydrateState(JSON.parse(raw));
        if (hydrated) {
          memoryState = hydrated;
          return;
        }
      }
    } catch {
      /* corrupt or blocked storage: fall through to a clean demo state */
    }
    memoryState = seedState();
    persist();
  }

  function getState() {
    return clone(memoryState);
  }

  function emit() {
    const snapshot = getState();
    listeners.forEach((fn) => {
      try {
        fn(snapshot);
      } catch (err) {
        console.error('Store subscriber failed', err);
      }
    });
  }

  function commit() {
    memoryState.lastUpdated = nowIso();
    persist();
    emit();
  }

  function log(type, message, meta = {}) {
    memoryState.activity.unshift({
      id: makeId('act'),
      type,
      message,
      at: nowIso(),
      meta
    });
    memoryState.activity = memoryState.activity.slice(0, MAX_ACTIVITY);
  }

  function getProducts(options = {}) {
    const list = clone(memoryState.products);
    return options.activeOnly ? list.filter((p) => p.active) : list;
  }

  function getProduct(id) {
    const product = memoryState.products.find((p) => p.id === id || p.sku === id);
    return product ? clone(product) : null;
  }

  function getCategories() {
    return clone(DATA.categories);
  }

  function getBrands() {
    return clone(DATA.brands);
  }

  function getSettings() {
    return clone(memoryState.settings);
  }

  function getActivity() {
    return clone(memoryState.activity);
  }

  function getCart() {
    return clone(memoryState.cart);
  }

  function getQuoteList() {
    return clone(memoryState.quoteList);
  }

  function getQuotations() {
    return clone(memoryState.quotations).sort(
      (a, b) => new Date(b.receivedAt) - new Date(a.receivedAt)
    );
  }

  function getInquiries() {
    return clone(memoryState.inquiries).sort(
      (a, b) => new Date(b.receivedAt) - new Date(a.receivedAt)
    );
  }

  function cartLines() {
    return memoryState.cart
      .map((line) => {
        const product = memoryState.products.find((p) => p.id === line.productId);
        return product ? { ...clone(line), product: clone(product) } : null;
      })
      .filter((line) => line && line.product);
  }

  function quoteLines() {
    return memoryState.quoteList
      .map((line) => {
        const product = memoryState.products.find((p) => p.id === line.productId);
        return product ? { ...clone(line), product: clone(product) } : null;
      })
      .filter((line) => line && line.product);
  }

  function saveProduct(input) {
    const name = String(input.name || '').trim();
    const sku = String(input.sku || '').trim().toUpperCase();
    const category = String(input.category || '').trim();
    const brand = String(input.brand || '').trim();
    const unit = String(input.unit || '').trim();
    const description = String(input.description || '').trim();
    const image = String(input.image || '').trim();

    if (name.length < 3) return { ok: false, field: 'name', error: 'Enter a product name of at least 3 characters.' };
    if (!/^[A-Z0-9][A-Z0-9-]{3,23}$/.test(sku))
      return { ok: false, field: 'sku', error: 'Use 4–24 letters, numbers or hyphens. Example: MRW-PT-1004.' };
    if (!DATA.categories.some((c) => c.id === category))
      return { ok: false, field: 'category', error: 'Choose a valid category.' };
    if (!brand) return { ok: false, field: 'brand', error: 'Choose a brand.' };
    if (!unit) return { ok: false, field: 'unit', error: 'Choose a unit of sale.' };
    if (description.length < 10)
      return { ok: false, field: 'description', error: 'Add a description of at least 10 characters.' };

    const duplicate = memoryState.products.find(
      (p) => p.sku.toUpperCase() === sku && p.id !== input.id
    );
    if (duplicate)
      return { ok: false, field: 'sku', error: `SKU ${sku} is already used by ${duplicate.name}.` };

    const priceRaw = input.price;
    const price =
      priceRaw === '' || priceRaw === null || priceRaw === undefined ? null : Number(priceRaw);
    if (price !== null && (!Number.isFinite(price) || price < 0))
      return { ok: false, field: 'price', error: 'Enter a valid price of zero or more, or leave it blank.' };

    const qtyRaw = input.stockQty;
    const stockQty =
      qtyRaw === '' || qtyRaw === null || qtyRaw === undefined ? null : Number(qtyRaw);
    if (stockQty !== null && (!Number.isInteger(stockQty) || stockQty < 0))
      return { ok: false, field: 'stockQty', error: 'Quantity must be a whole number of zero or more, or blank.' };

    const thresholdRaw = input.lowStockThreshold;
    const lowStockThreshold =
      thresholdRaw === '' || thresholdRaw === null || thresholdRaw === undefined
        ? memoryState.settings.lowStockThreshold
        : Number(thresholdRaw);
    if (!Number.isInteger(lowStockThreshold) || lowStockThreshold < 0)
      return { ok: false, field: 'lowStockThreshold', error: 'Low-stock threshold must be a whole number of zero or more.' };

    const existing = input.id
      ? memoryState.products.find((p) => p.id === input.id)
      : null;
    if (input.id && !existing) return { ok: false, error: 'Product not found.' };

    const safeImage =
      image && (image.startsWith('assets/') || /^https?:\/\//i.test(image))
        ? image
        : 'assets/img/placeholder.svg';

    const status = deriveStockStatus(stockQty, lowStockThreshold);
    const product = {
      id: existing ? existing.id : makeId('prd'),
      sku,
      name,
      brand,
      category,
      description,
      unit,
      price,
      currency: memoryState.settings.currency || 'KES',
      stockQty,
      lowStockThreshold,
      stockStatus: status,
      branchId: input.branchId || memoryState.settings.branch.id,
      image: safeImage,
      imageAlt: String(input.imageAlt || `${name} — demonstration product image`).trim(),
      specifications: existing ? existing.specifications || [] : [],
      featured:
        input.featured === undefined ? (existing ? existing.featured : false) : Boolean(input.featured),
      active: input.active !== false,
      demoData: true,
      createdAt: existing ? existing.createdAt : nowIso(),
      updatedAt: nowIso()
    };

    if (existing) {
      const index = memoryState.products.findIndex((p) => p.id === existing.id);
      memoryState.products[index] = product;
      log('product', `Product “${product.name}” updated (${product.sku}).`, { productId: product.id });
    } else {
      memoryState.products.unshift(product);
      log('product', `Product “${product.name}” created (${product.sku}).`, { productId: product.id });
    }
    commit();
    return { ok: true, product: clone(product) };
  }

  function deleteProduct(id) {
    const product = memoryState.products.find((p) => p.id === id);
    if (!product) return { ok: false, error: 'Product not found.' };
    memoryState.products = memoryState.products.filter((p) => p.id !== id);
    memoryState.cart = memoryState.cart.filter((line) => line.productId !== id);
    memoryState.quoteList = memoryState.quoteList.filter((line) => line.productId !== id);
    log('product', `Product “${product.name}” deleted from the demo catalogue.`, {
      productId: product.id
    });
    commit();
    return { ok: true };
  }

  function updateInventory(id, payload) {
    const product = memoryState.products.find((p) => p.id === id);
    if (!product) return { ok: false, error: 'Product not found.' };

    const qtyRaw = payload.stockQty;
    const quantity =
      qtyRaw === '' || qtyRaw === null || qtyRaw === undefined ? null : Number(qtyRaw);
    if (quantity !== null && (!Number.isInteger(quantity) || quantity < 0))
      return { ok: false, field: 'stockQty', error: 'Quantity must be a whole number of zero or more, or blank.' };

    const thresholdRaw = payload.lowStockThreshold;
    const threshold =
      thresholdRaw === '' || thresholdRaw === null || thresholdRaw === undefined
        ? product.lowStockThreshold
        : Number(thresholdRaw);
    if (!Number.isInteger(threshold) || threshold < 0)
      return { ok: false, field: 'lowStockThreshold', error: 'Threshold must be a whole number of zero or more.' };

    const oldQty = product.stockQty;
    product.stockQty = quantity;
    product.lowStockThreshold = threshold;
    product.stockStatus = deriveStockStatus(quantity, threshold);
    product.updatedAt = nowIso();

    const quantityText =
      quantity === null ? 'not configured' : `${quantity} ${product.unit}`;
    const oldText = oldQty === null ? 'not configured' : `${oldQty} ${product.unit}`;
    const note = String(payload.note || '').trim();
    log(
      'inventory',
      `Stock for “${product.name}” changed from ${oldText} to ${quantityText}.${note ? ` Note: ${note}` : ''}`,
      { productId: product.id, oldQty, newQty: quantity }
    );
    commit();
    return { ok: true, product: clone(product) };
  }

  function addToCart(productId, quantity = 1) {
    const product = memoryState.products.find((p) => p.id === productId);
    if (!product || !product.active) return { ok: false, error: 'This product is not available.' };
    if (product.stockStatus === 'out-of-stock')
      return { ok: false, error: 'This demonstration item is out of stock. Add it to a quotation request instead.' };
    const qty = Math.max(1, Math.min(999, Math.floor(Number(quantity) || 1)));
    const line = memoryState.cart.find((item) => item.productId === productId);
    if (line) line.qty = Math.min(999, line.qty + qty);
    else memoryState.cart.push({ productId, qty });
    commit();
    return { ok: true };
  }

  function setCartQty(productId, quantity) {
    const qty = Math.floor(Number(quantity) || 0);
    if (qty <= 0) return removeFromCart(productId);
    const line = memoryState.cart.find((item) => item.productId === productId);
    if (!line) return { ok: false, error: 'Item is not in the cart.' };
    line.qty = Math.min(999, Math.max(1, qty));
    commit();
    return { ok: true };
  }

  function removeFromCart(productId) {
    memoryState.cart = memoryState.cart.filter((item) => item.productId !== productId);
    commit();
    return { ok: true };
  }

  function clearCart() {
    memoryState.cart = [];
    commit();
    return { ok: true };
  }

  function addToQuote(productId, quantity = 1, note = '') {
    const product = memoryState.products.find((p) => p.id === productId);
    if (!product || !product.active) return { ok: false, error: 'This product is not available.' };
    const qty = Math.max(1, Math.min(999, Math.floor(Number(quantity) || 1)));
    const line = memoryState.quoteList.find((item) => item.productId === productId);
    if (line) {
      line.qty = Math.min(999, line.qty + qty);
      if (note) line.note = String(note).trim().slice(0, 240);
    } else {
      memoryState.quoteList.push({ productId, qty, note: String(note || '').trim().slice(0, 240) });
    }
    commit();
    return { ok: true };
  }

  function setQuoteQty(productId, quantity) {
    const qty = Math.floor(Number(quantity) || 0);
    if (qty <= 0) return removeFromQuote(productId);
    const line = memoryState.quoteList.find((item) => item.productId === productId);
    if (!line) return { ok: false, error: 'Item is not in the quotation list.' };
    line.qty = Math.min(999, Math.max(1, qty));
    commit();
    return { ok: true };
  }

  function setQuoteNote(productId, note) {
    const line = memoryState.quoteList.find((item) => item.productId === productId);
    if (!line) return { ok: false, error: 'Item is not in the quotation list.' };
    line.note = String(note || '').trim().slice(0, 240);
    commit();
    return { ok: true };
  }

  function removeFromQuote(productId) {
    memoryState.quoteList = memoryState.quoteList.filter((item) => item.productId !== productId);
    commit();
    return { ok: true };
  }

  function clearQuoteList() {
    memoryState.quoteList = [];
    commit();
    return { ok: true };
  }

  function generateReference(kind) {
    const settings = memoryState.settings;
    const prefix = kind === 'inquiry' ? settings.inquiryPrefix : settings.quotationPrefix;
    const year = new Date().getFullYear();
    const collection = kind === 'inquiry' ? memoryState.inquiries : memoryState.quotations;
    const pattern = new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-${year}-(\\d+)$`);
    const max = collection.reduce((highest, record) => {
      const match = String(record.reference || '').match(pattern);
      return match ? Math.max(highest, Number(match[1])) : highest;
    }, 0);
    return `${prefix}-${year}-${String(max + 1).padStart(4, '0')}`;
  }

  function addQuotation(payload) {
    const name = String(payload.customerName || '').trim();
    const phone = String(payload.phone || '').trim();
    const email = String(payload.email || '').trim();
    const description = String(payload.projectDescription || '').trim();
    const contactMethod = String(payload.contactMethod || 'Phone call').trim();
    if (name.length < 2) return { ok: false, field: 'customerName', error: 'Enter your full name.' };
    if (!/^[+0-9][0-9\s\-()]{6,19}$/.test(phone))
      return { ok: false, field: 'phone', error: 'Enter a valid phone number for follow-up.' };
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return { ok: false, field: 'email', error: 'Enter a valid email address, or leave it blank.' };
    if (contactMethod === 'Email' && !email)
      return { ok: false, field: 'email', error: 'Email is required when email is the preferred contact method.' };
    if (description.length < 15)
      return { ok: false, field: 'projectDescription', error: 'Describe the project in at least 15 characters.' };
    if (!payload.consent)
      return { ok: false, field: 'consent', error: 'Please confirm that this is a request for a quotation, not a confirmed order.' };

    const rawItems = Array.isArray(payload.items) && payload.items.length
      ? payload.items
      : memoryState.quoteList;
    if (!rawItems.length) return { ok: false, field: 'items', error: 'Add at least one product to the request.' };

    const items = rawItems
      .map((line) => {
        const product = memoryState.products.find((p) => p.id === line.productId);
        if (!product) return null;
        const qty = Math.max(1, Math.min(999, Math.floor(Number(line.qty) || 1)));
        return {
          productId: product.id,
          sku: product.sku,
          name: product.name,
          brand: product.brand,
          unit: product.unit,
          qty,
          indicativePrice: typeof product.price === 'number' ? product.price : null,
          note: String(line.note || '').trim().slice(0, 240)
        };
      })
      .filter(Boolean);
    if (!items.length) return { ok: false, field: 'items', error: 'No valid products were found in the request.' };

    const totals = moneyTotal(items);
    const quotation = {
      id: makeId('quo'),
      reference: generateReference('quotation'),
      customerName: name,
      phone,
      email,
      contactMethod,
      projectType: String(payload.projectType || '').trim(),
      projectDescription: description,
      preferredBranch: String(payload.preferredBranch || memoryState.settings.branch.name).trim(),
      neededBy: String(payload.neededBy || '').trim(),
      items,
      indicativeTotal: totals.total,
      hasUnpricedItems: totals.unpriced > 0,
      status: 'New',
      internalNotes: '',
      receivedAt: nowIso(),
      updatedAt: nowIso(),
      draftPreparedAt: null,
      source: 'storefront-demo',
      demoData: true
    };
    memoryState.quotations.unshift(quotation);
    memoryState.quoteList = [];
    log('quotation', `Quotation request ${quotation.reference} created (demo, stored locally).`, {
      quotationId: quotation.id
    });
    commit();
    return { ok: true, quotation: clone(quotation) };
  }

  function updateQuotation(id, patch) {
    const quotation = memoryState.quotations.find((q) => q.id === id);
    if (!quotation) return { ok: false, error: 'Quotation not found.' };
    if (patch.status !== undefined) {
      if (!validStatuses.includes(patch.status))
        return { ok: false, field: 'status', error: 'Choose a valid quotation status.' };
      if (patch.status !== quotation.status) {
        quotation.status = patch.status;
        if (patch.status === 'Draft Prepared') quotation.draftPreparedAt = nowIso();
        log('quotation', `Quotation ${quotation.reference} marked ${patch.status} (demo record).`, {
          quotationId: quotation.id
        });
      }
    }
    if (patch.internalNotes !== undefined) {
      quotation.internalNotes = String(patch.internalNotes).trim().slice(0, 2000);
    }
    quotation.updatedAt = nowIso();
    commit();
    return { ok: true, quotation: clone(quotation) };
  }

  function addInquiry(payload) {
    const name = String(payload.customerName || '').trim();
    const phone = String(payload.phone || '').trim();
    const email = String(payload.email || '').trim();
    const topic = String(payload.topic || 'General inquiry').trim();
    const message = String(payload.message || '').trim();
    if (name.length < 2) return { ok: false, field: 'customerName', error: 'Enter your full name.' };
    if (!phone && !email)
      return { ok: false, field: 'phone', error: 'Enter a phone number or an email address so the store can respond.' };
    if (phone && !/^[+0-9][0-9\s\-()]{6,19}$/.test(phone))
      return { ok: false, field: 'phone', error: 'Enter a valid phone number.' };
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return { ok: false, field: 'email', error: 'Enter a valid email address.' };
    if (message.length < 10) return { ok: false, field: 'message', error: 'Enter a message of at least 10 characters.' };

    const inquiry = {
      id: makeId('inq'),
      reference: generateReference('inquiry'),
      customerName: name,
      phone,
      email,
      topic,
      message,
      status: 'New',
      internalNotes: '',
      receivedAt: nowIso(),
      updatedAt: nowIso(),
      source: 'storefront-demo',
      demoData: true
    };
    memoryState.inquiries.unshift(inquiry);
    log('inquiry', `Inquiry ${inquiry.reference} created (demo, stored locally).`, {
      inquiryId: inquiry.id
    });
    commit();
    return { ok: true, inquiry: clone(inquiry) };
  }

  function updateInquiry(id, patch) {
    const inquiry = memoryState.inquiries.find((i) => i.id === id);
    if (!inquiry) return { ok: false, error: 'Inquiry not found.' };
    if (patch.status !== undefined) {
      if (!validInquiryStatuses.includes(patch.status))
        return { ok: false, field: 'status', error: 'Choose a valid inquiry status.' };
      if (patch.status !== inquiry.status) {
        inquiry.status = patch.status;
        log('inquiry', `Inquiry ${inquiry.reference} marked ${patch.status} (demo record).`, {
          inquiryId: inquiry.id
        });
      }
    }
    if (patch.internalNotes !== undefined)
      inquiry.internalNotes = String(patch.internalNotes).trim().slice(0, 2000);
    inquiry.updatedAt = nowIso();
    commit();
    return { ok: true, inquiry: clone(inquiry) };
  }

  function saveSettings(patch) {
    const settings = memoryState.settings;
    const next = {
      ...settings,
      ...patch,
      branch: { ...settings.branch, ...(patch.branch || {}) }
    };

    next.businessName = String(next.businessName || '').trim();
    next.phone = String(next.phone || '').trim();
    next.email = String(next.email || '').trim();
    next.location = String(next.location || '').trim();
    next.currency = String(next.currency || 'KES').trim().toUpperCase().slice(0, 3);
    next.quotationPrefix = String(next.quotationPrefix || 'MRW-Q').trim().toUpperCase();
    next.inquiryPrefix = String(next.inquiryPrefix || 'MRW-I').trim().toUpperCase();
    next.lowStockThreshold = Number(next.lowStockThreshold);
    next.pageSize = Number(next.pageSize);
    next.branch.name = String(next.branch.name || '').trim();
    next.branch.address = String(next.branch.address || '').trim();
    next.showIndicativePrices = Boolean(next.showIndicativePrices);

    if (next.businessName.length < 2)
      return { ok: false, field: 'businessName', error: 'Enter a business display name.' };
    if (!/^[+0-9][0-9\s\-()]{6,19}$/.test(next.phone))
      return { ok: false, field: 'phone', error: 'Enter a valid phone number.' };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(next.email))
      return { ok: false, field: 'email', error: 'Enter a valid email address.' };
    if (next.location.length < 3)
      return { ok: false, field: 'location', error: 'Enter a location description.' };
    if (!/^[A-Z]{3}$/.test(next.currency))
      return { ok: false, field: 'currency', error: 'Use a three-letter currency code such as KES.' };
    if (!Number.isInteger(next.lowStockThreshold) || next.lowStockThreshold < 0)
      return { ok: false, field: 'lowStockThreshold', error: 'Enter a whole number of zero or more.' };
    if (!Number.isInteger(next.pageSize) || next.pageSize < 3 || next.pageSize > 48)
      return { ok: false, field: 'pageSize', error: 'Choose a page size between 3 and 48.' };
    if (!/^[A-Z0-9-]{2,12}$/.test(next.quotationPrefix))
      return { ok: false, field: 'quotationPrefix', error: 'Use 2–12 letters, numbers or hyphens.' };
    if (!/^[A-Z0-9-]{2,12}$/.test(next.inquiryPrefix))
      return { ok: false, field: 'inquiryPrefix', error: 'Use 2–12 letters, numbers or hyphens.' };
    if (next.branch.name.length < 2)
      return { ok: false, field: 'branchName', error: 'Enter a branch name.' };

    memoryState.settings = next;
    log('settings', 'Demonstration settings updated.');
    commit();
    return { ok: true, settings: clone(next) };
  }

  function resetDemo() {
    memoryState = seedState();
    persist();
    emit();
    return { ok: true };
  }

  function exportData() {
    return JSON.stringify(
      {
        exportedAt: nowIso(),
        note: 'Marowa Store demonstration data — not a production backup.',
        state: getState()
      },
      null,
      2
    );
  }

  function importData(raw) {
    let parsed;
    try {
      parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch {
      return { ok: false, error: 'The file is not valid JSON.' };
    }
    const candidate = parsed && parsed.state ? parsed.state : parsed;
    const hydrated = hydrateState(candidate);
    if (!hydrated) return { ok: false, error: 'This file is not a compatible Marowa demo backup.' };
    memoryState = hydrated;
    persist();
    emit();
    return { ok: true };
  }

  loadInitial();

  Marowa.Store = {
    getState,
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    isStorageAvailable: () => storageAvailable,
    getProducts,
    getProduct,
    getCategories,
    getBrands,
    getSettings,
    getActivity,
    getCart,
    getQuoteList,
    getQuotations,
    getInquiries,
    cartLines,
    quoteLines,
    saveProduct,
    deleteProduct,
    updateInventory,
    addToCart,
    setCartQty,
    removeFromCart,
    clearCart,
    addToQuote,
    setQuoteQty,
    setQuoteNote,
    removeFromQuote,
    clearQuoteList,
    addQuotation,
    updateQuotation,
    addInquiry,
    updateInquiry,
    saveSettings,
    resetDemo,
    exportData,
    importData,
    deriveStockStatus,
    generateReference,
    moneyTotal,
    validStatuses,
    validInquiryStatuses
  };
})();
