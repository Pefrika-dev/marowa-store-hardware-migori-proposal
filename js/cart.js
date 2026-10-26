/**
 * Cart page — local demonstration cart only. No checkout or payment.
 */
(function () {
  const Store = Marowa.Store;
  const ui = Marowa.ui;
  const $ = ui.$;
  const $$ = ui.$$;
  const main = $('#cartMain');
  const aside = $('#cartAside');
  if (!main || !aside) return;

  function lineTotal(product, qty) {
    if (typeof product.price !== 'number') return null;
    return product.price * qty;
  }

  function pricesVisible() {
    return Store.getSettings().showIndicativePrices;
  }

  function stockNote(product) {
    if (product.stockStatus === 'out-of-stock')
      return '<span class="cart-line__stock cart-line__stock--out">Out of stock in this demo</span>';
    if (product.stockStatus === 'low-stock')
      return '<span class="cart-line__stock cart-line__stock--low">Low stock in this demo</span>';
    if (product.stockStatus === 'contact')
      return '<span class="cart-line__stock">Availability to confirm</span>';
    return '<span class="cart-line__stock">In stock in this demo</span>';
  }

  function renderLine(line) {
    const product = line.product;
    if (!product) return '';
    const total = lineTotal(product, line.qty);
    return `<article class="cart-line" data-cart-line="${ui.escapeAttribute(product.id)}">
      <a class="cart-line__media" href="${ui.productPath(product)}" aria-hidden="true" tabindex="-1">
        <img src="${ui.escapeAttribute(ui.safeImage(product.image))}"
             alt="${ui.escapeAttribute(product.imageAlt || product.name)}"
             width="192" height="160" loading="lazy" decoding="async">
      </a>
      <div class="cart-line__info">
        <div class="cart-line__meta">${ui.escapeHtml(product.brand)} · ${ui.escapeHtml(product.sku)}</div>
        <h2><a href="${ui.productPath(product)}">${ui.escapeHtml(product.name)}</a></h2>
        <div class="cart-line__unit">${ui.escapeHtml(product.unit)} · ${
      typeof product.price === 'number'
        ? pricesVisible()
          ? `${ui.formatMoney(product.price)} each <span aria-hidden="true">·</span> indicative`
          : 'Indicative price hidden in demo settings'
        : 'Price to confirm'
    }</div>
        ${stockNote(product)}
      </div>
      <div class="cart-line__side">
        <div class="qty-control" aria-label="Quantity for ${ui.escapeAttribute(product.name)}">
          <button type="button" data-cart-step="-1" aria-label="Decrease quantity">${Marowa.icon('minus', 13)}</button>
          <input class="js-cart-qty" type="number" value="${line.qty}" min="1" max="999" inputmode="numeric"
                 aria-label="Quantity for ${ui.escapeAttribute(product.name)}">
          <button type="button" data-cart-step="1" aria-label="Increase quantity">${Marowa.icon('plus', 13)}</button>
        </div>
        <div class="cart-line__total">
          ${
            total === null
              ? 'Confirm price'
              : pricesVisible()
              ? ui.formatMoney(total)
              : 'Hidden in demo'
          }
          <small>${
            total === null
              ? 'excluded from demo total'
              : pricesVisible()
              ? 'indicative demo'
              : 'prices hidden by demo settings'
          }</small>
        </div>
        <button class="cart-line__remove" type="button" data-cart-remove="${ui.escapeAttribute(product.id)}">
          ${Marowa.icon('trash', 13)} Remove
        </button>
      </div>
    </article>`;
  }

  function renderEmpty() {
    main.innerHTML = `<div class="cart-main__head">
        <h1>Your demonstration cart</h1>
        <span class="mono">0 items</span>
      </div>
      <div class="empty-state" style="border:0;border-radius:0;min-height:360px">
        <span class="empty-state__icon">${Marowa.icon('cart', 24)}</span>
        <h2>Your cart is empty.</h2>
        <p>Add demonstration items from the catalogue, or build a quotation request directly. There is no checkout and no payment step.</p>
        <div class="empty-state__actions">
          <a class="btn btn--dark" href="products.html">Browse the catalogue</a>
          <a class="btn btn--outline" href="quotation.html">Build a quotation</a>
        </div>
      </div>`;
  }

  function renderMain(lines) {
    if (!lines.length) {
      renderEmpty();
      return;
    }
    const itemCount = lines.reduce((sum, line) => sum + line.qty, 0);
    main.innerHTML = `<div class="cart-main__head">
        <h1>Your demonstration cart</h1>
        <span class="mono" data-cart-count-label>${itemCount} item${itemCount === 1 ? '' : 's'}</span>
      </div>
      <div class="cart-lines">
        ${lines.map(renderLine).join('')}
      </div>
      <div class="cart-actions">
        <a class="btn btn--ghost btn--sm" href="products.html" style="border-color:var(--line);color:var(--ink)">
          ${Marowa.icon('arrow-left', 15)} Continue browsing
        </a>
        <button class="btn btn--outline btn--sm" type="button" id="clearCart">
          ${Marowa.icon('trash', 14)} Clear cart
        </button>
      </div>`;
  }

  function summarize(lines) {
    const itemCount = lines.reduce((sum, line) => sum + line.qty, 0);
    const priced = lines.filter((line) => line.product && typeof line.product.price === 'number');
    const unpriced = lines.length - priced.length;
    const total = priced.reduce(
      (sum, line) => sum + line.product.price * line.qty,
      0
    );
    return { itemCount, priced: priced.length, unpriced, total };
  }

  function renderAside(lines) {
    const summary = summarize(lines);
    aside.innerHTML = `<div class="summary-card">
      <div class="summary-card__head">
        <h2>Cart summary</h2>
        <p>No payment step · demo values</p>
      </div>
      <div class="summary-card__body">
        <ul class="summary-list">
          <li><span>Products</span><span>${lines.length}</span></li>
          <li><span>Total quantity</span><span>${summary.itemCount}</span></li>
          <li><span>Priced lines</span><span>${summary.priced}</span></li>
          <li><span>Confirm-price lines</span><span>${summary.unpriced}</span></li>
        </ul>
        <div class="summary-total">
          <span>Indicative total</span>
          <strong>${
            pricesVisible()
              ? summary.priced
                ? ui.formatMoney(summary.total)
                : summary.itemCount
                  ? 'Confirm price'
                  : 'KSh 0'
              : 'Hidden in demo settings'
          }</strong>
        </div>
        <p class="summary-card__note">${
          pricesVisible()
            ? 'Sample prices exclude delivery, tax and current-store pricing. Lines marked “Confirm price” are not included in the total.'
            : 'Indicative prices are hidden by the current demo settings. The quotation builder will also hide them until you change the setting.'
        }</p>
      </div>
      <div class="summary-card__foot">
        <button class="btn btn--primary" type="button" id="convertToQuote" ${lines.length ? '' : 'disabled'}>
          ${Marowa.icon('clipboard', 17)} Convert to quotation
        </button>
        <a class="btn btn--outline" href="products.html">Add more products</a>
      </div>
      <div class="summary-card__trust">
        ${Marowa.icon('shield', 18)}
        <span>This cart lives in your browser only. Converting moves the items into the local quotation builder; nothing is sent to the store.</span>
      </div>
    </div>
    <div class="notice notice--demo">
      ${Marowa.icon('info', 18)}
      <p><strong>No payment is taken.</strong> There is no checkout, card form or mobile-money step in this concept. Confirm price and availability with the store directly.</p>
    </div>
    ${
      lines.length
        ? `<div class="notice notice--warning">
            ${Marowa.icon('alert', 18)}
            <p>Some items may show a stock or price state different from a real store. This is demonstration data, not live inventory.</p>
          </div>`
        : ''
    }`;
  }

  function renderAll() {
    const lines = Store.cartLines();
    renderMain(lines);
    renderAside(lines);
    ui.hydrateIcons(main);
    ui.hydrateIcons(aside);
  }

  function productFromLine(node) {
    const card = node.closest('[data-cart-line]');
    return card ? card.getAttribute('data-cart-line') : null;
  }

  main.addEventListener('click', async (event) => {
    const stepButton = event.target.closest('[data-cart-step]');
    if (stepButton) {
      const productId = productFromLine(stepButton);
      const input = stepButton.closest('.qty-control').querySelector('.js-cart-qty');
      const value = Math.max(1, Math.min(999, (Number(input.value) || 1) + Number(stepButton.getAttribute('data-cart-step'))));
      Store.setCartQty(productId, value);
      renderAll();
      return;
    }

    const removeButton = event.target.closest('[data-cart-remove]');
    if (removeButton) {
      const productId = removeButton.getAttribute('data-cart-remove');
      const product = Store.getProduct(productId);
      Store.removeFromCart(productId);
      renderAll();
      ui.toast(`${product ? product.name : 'Item'} removed from the cart.`, { type: 'info' });
      return;
    }

    if (event.target.closest('#clearCart')) {
      const confirmed = await ui.confirm({
        title: 'Clear the demonstration cart?',
        message: 'All items will be removed from this local demo cart. Your quotation list is not affected.',
        confirmLabel: 'Clear cart',
        danger: true
      });
      if (!confirmed) return;
      Store.clearCart();
      renderAll();
      ui.toast('Demonstration cart cleared.', { type: 'info' });
    }
  });

  main.addEventListener('change', (event) => {
    const input = event.target.closest('.js-cart-qty');
    if (!input) return;
    const productId = productFromLine(input);
    const value = Math.max(1, Math.min(999, Math.floor(Number(input.value) || 1)));
    Store.setCartQty(productId, value);
    renderAll();
  });

  aside.addEventListener('click', (event) => {
    const convert = event.target.closest('#convertToQuote');
    if (!convert) return;
    const lines = Store.cartLines();
    if (!lines.length) {
      ui.toast('Add at least one item before converting the cart.', { type: 'error' });
      return;
    }
    let moved = 0;
    let failed = 0;
    lines.forEach((line) => {
      if (!line.product) {
        failed += 1;
        return;
      }
      const result = Store.addToQuote(line.product.id, line.qty);
      if (result.ok) moved += 1;
      else failed += 1;
    });
    if (!moved) {
      ui.toast('None of these items could be moved to a quotation.', { type: 'error' });
      return;
    }
    Store.clearCart();
    ui.toast(
      `${moved} item${moved === 1 ? '' : 's'} moved to the quotation builder${
        failed ? ` (${failed} unavailable)` : ''
      }.`,
      { type: 'success', duration: 2600 }
    );
    window.setTimeout(() => {
      window.location.href = 'quotation.html';
    }, 550);
  });

  renderAll();
})();
