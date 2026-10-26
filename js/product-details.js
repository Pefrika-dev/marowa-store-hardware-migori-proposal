/**
 * Product detail page — rendered from the local demonstration store.
 */
(function () {
  const Store = Marowa.Store;
  const ui = Marowa.ui;
  const $ = ui.$;
  const $$ = ui.$$;
  const host = $('#productDetail');
  if (!host) return;

  function param(name) {
    try {
      return new URLSearchParams(window.location.search).get(name);
    } catch {
      return null;
    }
  }

  function setMeta(product) {
    document.title = `${product.name} — Marowa Store Concept`;
    const description =
      `${product.brand} ${product.name} (${product.sku}) in the independent Marowa Store demonstration catalogue. ` +
      'Sample price and stock data only.';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', description.slice(0, 300));
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', `${product.name} — Marowa Store Concept`);
    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) ogDescription.setAttribute('content', description.slice(0, 300));
    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage) ogImage.setAttribute('content', product.image);
  }

  function renderNotFound() {
    document.title = 'Product not found — Marowa Store Concept';
    host.innerHTML = `<div class="container" style="padding-block:clamp(2rem,5vw,4rem)">
      <nav class="product-breadcrumb" aria-label="Breadcrumb">
        <a href="index.html">Home</a>${Marowa.icon('chevron-right', 11)}
        <a href="products.html">Products</a>${Marowa.icon('chevron-right', 11)}
        <span aria-current="page">Not found</span>
      </nav>
      <div class="empty-state" style="margin-top:1.5rem">
        <span class="empty-state__icon">${Marowa.icon('package', 24)}</span>
        <h1>That demonstration listing is not available.</h1>
        <p>The product may have been unpublished or removed in the local demo data. The public catalogue only shows published sample listings.</p>
        <div class="empty-state__actions">
          <a class="btn btn--dark" href="products.html">Browse the catalogue</a>
          <a class="btn btn--outline" href="index.html">Return home</a>
        </div>
      </div>
    </div>`;
  }

  function stockDetail(product) {
    const meta = ui.stockMeta(product.stockStatus);
    let detail = 'Stock state is demonstration data.';
    if (product.stockStatus === 'contact') {
      detail = 'Availability is not configured for this demo listing. Confirm with the store.';
    } else if (product.stockStatus === 'out-of-stock') {
      detail = 'Shown as 0 in this demonstration. Do not treat this as live stock.';
    } else if (typeof product.stockQty === 'number') {
      detail = `${product.stockQty} ${product.unit} shown in this demonstration.`;
    }
    return `<span class="stock-line stock-line--${meta.className}">
      <span>${meta.label}<small>${ui.escapeHtml(detail)}</small></span>
    </span>`;
  }

  function relatedProducts(product) {
    const products = Store.getProducts({ activeOnly: true }).filter((p) => p.id !== product.id);
    const sameCategory = products.filter((p) => p.category === product.category);
    const featured = products.filter((p) => p.featured && p.category !== product.category);
    const seen = new Set();
    return [...sameCategory, ...featured]
      .filter((p) => {
        if (seen.has(p.id)) return false;
        seen.add(p.id);
        return true;
      })
      .slice(0, 4);
  }

  function renderProduct(product) {
    const settings = Store.getSettings();
    const category = ui.categoryById(product.category);
    const meta = ui.stockMeta(product.stockStatus);
    const isPublished = product.active !== false;
    const canBuy = isPublished && product.stockStatus !== 'out-of-stock';
    const hasPrice = typeof product.price === 'number' && settings.showIndicativePrices;
    const related = relatedProducts(product);

    const specs = Array.isArray(product.specifications) && product.specifications.length
      ? product.specifications
      : [
          { label: 'Brand', value: product.brand },
          { label: 'Department', value: category ? category.name : product.category },
          { label: 'Unit of sale', value: product.unit },
          { label: 'SKU', value: product.sku }
        ];

    host.innerHTML = `
      <div class="container">
        <nav class="product-breadcrumb" aria-label="Breadcrumb">
          <a href="index.html">Home</a>${Marowa.icon('chevron-right', 11)}
          <a href="products.html">Products</a>${Marowa.icon('chevron-right', 11)}
          ${
            category
              ? `<a href="products.html?category=${encodeURIComponent(category.id)}">${ui.escapeHtml(
                  category.name
                )}</a>${Marowa.icon('chevron-right', 11)}`
              : ''
          }
          <span aria-current="page">${ui.escapeHtml(product.name)}</span>
        </nav>
      </div>

      <section class="product-detail">
        <div class="container product-detail__grid">
          <div class="product-gallery">
            <div class="product-gallery__frame">
              <img src="${ui.escapeAttribute(ui.safeImage(product.image))}"
                   alt="${ui.escapeAttribute(product.imageAlt || product.name)}"
                   width="1000" height="838" fetchpriority="high" decoding="async">
              <span class="product-gallery__tag">Demonstration image</span>
            </div>
            <div class="product-gallery__caption">
              <span>Illustrative photography — not a verified product photo.</span>
              <a href="credits.html">Image credits</a>
            </div>
            <div class="product-gallery__note">
              ${Marowa.icon('info', 16)}
              <span>This is a concept listing. Confirm the exact model, accessories, price and availability with the store before travelling.</span>
            </div>
          </div>

          <div class="product-info">
            <div class="product-info__meta">
              <span>${ui.escapeHtml(product.brand)}</span>
              <span class="mono">${ui.escapeHtml(product.sku)}</span>
              <span>${ui.escapeHtml(category ? category.name : product.category)}</span>
            </div>
            <h1>${ui.escapeHtml(product.name)}</h1>
            <p class="product-info__lede">${ui.escapeHtml(product.description)}</p>

            ${
              !isPublished
                ? `<div class="notice notice--warning" style="margin-bottom:1rem">
                    ${Marowa.icon('alert', 18)}
                    <p><strong>Unpublished demonstration listing.</strong> This record is visible from the demo admin but is not part of the public catalogue.</p>
                  </div>`
                : ''
            }

            <div class="product-buybox">
              <div class="product-buybox__top">
                ${
                  hasPrice
                    ? `<div class="product-buybox__price">
                        <span class="price">${ui.formatMoney(product.price)}</span>
                        <span class="price-note">Indicative demo price · ${ui.escapeHtml(product.unit)}</span>
                      </div>`
                    : `<div class="product-buybox__price">
                        <span class="price price--request">${
                          typeof product.price === 'number' && !settings.showIndicativePrices
                            ? 'Price hidden'
                            : 'Confirm price'
                        }</span>
                        <span class="price-note">${
                          settings.showIndicativePrices
                            ? 'Not configured in the demo catalogue'
                            : typeof product.price === 'number'
                              ? 'Indicative prices are hidden in demo settings'
                              : 'Not configured · indicative prices are hidden in demo settings'
                        }</span>
                      </div>`
                }
                ${stockDetail(product)}
              </div>

              <div class="product-buybox__controls">
                <div class="qty-field">
                  <label for="detailQty">Quantity</label>
                  <div class="qty-control">
                    <button type="button" data-qty-step="-1" aria-label="Decrease quantity" ${canBuy ? '' : 'disabled'}>
                      ${Marowa.icon('minus', 14)}
                    </button>
                    <input type="number" id="detailQty" value="1" min="1" max="999" inputmode="numeric"
                           ${canBuy ? '' : 'disabled'} aria-label="Quantity for ${ui.escapeAttribute(product.name)}">
                    <button type="button" data-qty-step="1" aria-label="Increase quantity" ${canBuy ? '' : 'disabled'}>
                      ${Marowa.icon('plus', 14)}
                    </button>
                  </div>
                </div>
                <button class="btn btn--primary" type="button"
                        data-add-cart="${ui.escapeAttribute(product.id)}"
                        data-qty-source="#detailQty"
                        ${canBuy ? '' : 'disabled'}>
                  ${Marowa.icon('cart', 17)} Add to cart
                </button>
                <button class="btn btn--outline" type="button"
                        data-add-quote="${ui.escapeAttribute(product.id)}"
                        data-qty-source="#detailQty"
                        ${isPublished ? '' : 'disabled'}>
                  ${Marowa.icon('clipboard', 17)} Add to quote
                </button>
              </div>

              <div class="product-buybox__foot">
                <strong>No payment is taken.</strong> The cart and quotation request are demonstration tools.
                Price and stock are sample data and must be confirmed with the store.
                ${product.stockStatus === 'out-of-stock' ? ' Adding to the cart is disabled while this demo item is out of stock.' : ''}
              </div>
            </div>

            <ul class="assurance-list">
              <li>${Marowa.icon('phone', 17)} <span>Call <a href="tel:+254716865976" data-tel><span data-biz-phone>0716 865 976</span></a> to confirm the item before visiting.</span></li>
              <li>${Marowa.icon('shield', 17)} <span>Quotation-first: build a request instead of paying online.</span></li>
              <li>${Marowa.icon('pin', 17)} <span><span data-biz-location>Migori Town, next to Bansi Wholesale</span>.</span></li>
            </ul>
          </div>
        </div>

        <div class="container product-lower">
          <div class="product-copy">
            <span class="eyebrow">About this listing</span>
            <h2>What the demonstration record contains.</h2>
            <p>${ui.escapeHtml(product.description)}</p>
            <p style="margin-top:.7rem">Specifications and descriptions are illustrative and exist to show how a catalogue entry could be structured. They are not manufacturer datasheets and should not be used to make a purchase decision without confirming the physical product with the store.</p>

            <table class="spec-table">
              <tbody>
                ${specs
                  .map(
                    (spec) => `<tr>
                      <th scope="row">${ui.escapeHtml(spec.label)}</th>
                      <td>${ui.escapeHtml(spec.value)}</td>
                    </tr>`
                  )
                  .join('')}
                <tr><th scope="row">SKU</th><td class="mono">${ui.escapeHtml(product.sku)}</td></tr>
                <tr><th scope="row">Unit of sale</th><td>${ui.escapeHtml(product.unit)}</td></tr>
                <tr><th scope="row">Branch</th><td>${ui.escapeHtml(settings.branch.name)} (demonstration)</td></tr>
              </tbody>
            </table>
          </div>

          <aside class="category-aside">
            ${
              category
                ? `<img class="category-aside__image" src="${ui.escapeAttribute(
                    ui.safeImage(category.image)
                  )}" alt="${ui.escapeAttribute(category.imageAlt)}" width="640" height="360" loading="lazy">
                   <span class="eyebrow">Department</span>
                   <h2>${ui.escapeHtml(category.name)}</h2>
                   <p>${ui.escapeHtml(category.description)}</p>
                   <a class="btn btn--outline btn--sm text-link" href="products.html?category=${encodeURIComponent(
                     category.id
                   )}">View department ${Marowa.icon('arrow-right', 15)}</a>`
                : `<span class="eyebrow">Catalogue</span><h2>More demonstration listings</h2><p>Browse the full sample catalogue.</p><a class="btn btn--outline btn--sm text-link" href="products.html">View products</a>`
            }
          </aside>
        </div>

        ${
          related.length
            ? `<div class="container related">
                <div class="related__head">
                  <div><span class="eyebrow">Related demo listings</span><h2>Other items in this catalogue.</h2></div>
                  <a class="section-head__link" href="products.html?category=${encodeURIComponent(
                    product.category
                  )}">View department ${Marowa.icon('arrow-right', 15)}</a>
                </div>
                <div class="product-grid">
                  ${related.map((item) => ui.renderProductCard(item, { compact: true })).join('')}
                </div>
              </div>`
            : ''
        }

        <div class="container" style="margin-top:2rem">
          <div class="notice notice--demo">
            ${Marowa.icon('info', 18)}
            <p><strong>Demonstration listing.</strong> This product, its description, specifications, indicative price and stock state are sample data created for an independent concept. They do not represent verified Marowa Store information, and no order or payment is involved.</p>
          </div>
        </div>
      </section>`;

    // Quantity control
    const qty = $('#detailQty');
    if (qty) {
      const clamp = () => {
        const value = Math.max(1, Math.min(999, Math.floor(Number(qty.value) || 1)));
        qty.value = String(value);
        return value;
      };
      $$('[data-qty-step]').forEach((button) => {
        button.addEventListener('click', () => {
          qty.value = String(
            Math.max(1, Math.min(999, Number(qty.value || 1) + Number(button.getAttribute('data-qty-step'))))
          );
        });
      });
      qty.addEventListener('change', clamp);
    }

    ui.hydrateIcons(host);
    // Business detail hydration already ran; update the newly rendered nodes.
    $$('[data-tel]', host).forEach((el) => {
      el.href = `tel:${String(settings.phone).replace(/\s/g, '')}`;
    });
    $$('[data-biz-phone]', host).forEach((el) => (el.textContent = settings.phone));
    $$('[data-biz-location]', host).forEach((el) => (el.textContent = settings.location));
    setMeta(product);
  }

  const id = param('id');
  if (!id) {
    renderNotFound();
    return;
  }
  const product = Store.getProduct(id);
  if (!product) {
    renderNotFound();
    return;
  }
  if (!product.active) {
    renderProduct(product);
    return;
  }
  renderProduct(product);
})();
