/**
 * Quotation builder.
 *
 * Everything is local: validation, reference generation and storage. No request
 * is transmitted anywhere. The confirmation screen says so explicitly.
 */
(function () {
  const Store = Marowa.Store;
  const ui = Marowa.ui;
  const $ = ui.$;
  const $$ = ui.$$;
  const form = $('#quoteForm');
  const linesHost = $('#quoteLines');
  if (!form || !linesHost) return;

  const builderLayout = $('.builder__layout');
  const confirmationHost = $('#quoteConfirmation');
  const formError = $('#quoteFormError');
  let lastQuotation = null;

  const fieldIds = {
    customerName: 'customerName',
    phone: 'phone',
    email: 'email',
    projectDescription: 'projectDescription',
    consent: 'quoteConsent'
  };

  function currencyTotal(value) {
    return ui.formatMoney(value) || 'KSh 0';
  }

  function showPrices() {
    return Store.getSettings().showIndicativePrices;
  }

  function getLines() {
    return Store.quoteLines();
  }

  function lineTotal(line) {
    if (typeof line.product.price !== 'number') return null;
    return line.product.price * line.qty;
  }

  function lineTotalLabel(line) {
    if (typeof line.product.price !== 'number') return 'Confirm price';
    if (!showPrices()) return 'Hidden in demo';
    return ui.formatMoney(lineTotal(line));
  }

  function renderLines() {
    const lines = getLines();
    const empty = $('#quoteEmpty');
    const foot = $('#quoteLinesFoot');
    empty.hidden = lines.length > 0;
    foot.hidden = lines.length === 0;
    $('#quoteLinesCount').textContent = `${lines.length} item${lines.length === 1 ? '' : 's'}`;

    linesHost.innerHTML = lines
      .map((line) => {
        const product = line.product;
        return `<div class="quote-line" data-quote-line="${ui.escapeAttribute(product.id)}">
          <div class="quote-line__media">
            <img src="${ui.escapeAttribute(ui.safeImage(product.image))}"
                 alt="${ui.escapeAttribute(product.imageAlt || product.name)}"
                 width="148" height="124" loading="lazy" decoding="async">
          </div>
          <div class="quote-line__info">
            <div class="quote-line__meta">${ui.escapeHtml(product.brand)} · ${ui.escapeHtml(product.sku)}</div>
            <h3>${ui.escapeHtml(product.name)}</h3>
            <div class="quote-line__price">
              ${ui.escapeHtml(product.unit)} · ${
          typeof product.price === 'number'
            ? showPrices()
              ? `${ui.formatMoney(product.price)} indicative`
              : 'indicative price hidden in demo settings'
            : 'price to confirm'
        }
            </div>
          </div>
          <div class="quote-line__controls">
            <div class="qty-control">
              <button type="button" data-quote-step="-1" aria-label="Decrease quantity for ${ui.escapeAttribute(
                product.name
              )}">${Marowa.icon('minus', 13)}</button>
              <input class="js-quote-qty" type="number" value="${line.qty}" min="1" max="999"
                     inputmode="numeric" aria-label="Quantity for ${ui.escapeAttribute(product.name)}">
              <button type="button" data-quote-step="1" aria-label="Increase quantity for ${ui.escapeAttribute(
                product.name
              )}">${Marowa.icon('plus', 13)}</button>
            </div>
            <span class="js-line-total mono">${lineTotalLabel(line)}</span>
            <button class="quote-line__remove" type="button" data-quote-remove="${ui.escapeAttribute(
              product.id
            )}">${Marowa.icon('trash', 12)} Remove</button>
          </div>
          <div class="quote-line__note">
            <label for="note-${ui.escapeAttribute(product.id)}">Line note</label>
            <input class="js-quote-note" id="note-${ui.escapeAttribute(product.id)}" type="text"
                   maxlength="240" value="${ui.escapeAttribute(line.note || '')}"
                   placeholder="Optional — colour, alternative, collection note…"
                   data-note-for="${ui.escapeAttribute(product.id)}">
          </div>
        </div>`;
      })
      .join('');
  }

  function renderSummary() {
    const lines = getLines();
    const count = lines.length;
    const qty = lines.reduce((sum, line) => sum + line.qty, 0);
    const priced = lines.filter((line) => typeof line.product.price === 'number');
    const unpriced = count - priced.length;
    const total = priced.reduce((sum, line) => sum + line.product.price * line.qty, 0);
    const visible = showPrices();

    $('#summaryLineCount').textContent = String(count);
    $('#summaryQty').textContent = String(qty);
    $('#summaryPriced').textContent = String(priced.length);
    $('#summaryUnpriced').textContent = String(unpriced);
    const totalEl = $('#quoteSummaryTotal');
    totalEl.textContent = !visible
      ? 'Hidden in demo settings'
      : count
        ? priced.length
          ? currencyTotal(total)
          : 'Confirm price'
        : 'KSh 0';
    totalEl.style.fontSize = !visible ? '0.8rem' : '';
  }

  function contactSnapshot() {
    const name = $('#customerName').value.trim();
    const phone = $('#phone').value.trim();
    const method = form.querySelector('input[name="contactMethod"]:checked');
    const parts = [];
    if (name) parts.push(name);
    if (phone) parts.push(phone);
    if ((name || phone) && method) parts.push(method.value);
    return parts.length ? parts.join(' · ') : 'Not entered yet';
  }

  function renderReview() {
    const host = $('#quoteReview');
    const lines = getLines();
    if (!lines.length) {
      host.innerHTML = `<div class="quote-review__empty">
        ${Marowa.icon('clipboard', 20)}
        <p>Add at least one product using <strong>Add to quote</strong> in the catalogue. The review will appear here.</p>
      </div>`;
      return;
    }
    const qty = lines.reduce((sum, line) => sum + line.qty, 0);
    const priced = lines.filter((line) => typeof line.product.price === 'number');
    const total = priced.reduce((sum, line) => sum + line.product.price * line.qty, 0);
    host.innerHTML = `<div class="quote-review__stats">
        <div><span>Lines</span><strong>${lines.length}</strong></div>
        <div><span>Quantity</span><strong>${qty}</strong></div>
        <div><span>Indicative total</span><strong>${
          showPrices() ? (priced.length ? currencyTotal(total) : 'Confirm price') : 'Hidden'
        }</strong></div>
      </div>
      <ul class="quote-review__list">
        ${lines
          .map(
            (line) => `<li>
              <span>${ui.escapeHtml(line.product.name)} <small>${ui.escapeHtml(line.product.sku)}</small></span>
              <span>×${line.qty} · ${lineTotalLabel(line)}</span>
            </li>`
          )
          .join('')}
      </ul>
      <p class="quote-review__contact"><strong>Contact:</strong> ${ui.escapeHtml(contactSnapshot())}</p>
      <p class="quote-review__note">Saving adds a demonstration record to this browser. It does not send a message to Marowa Store.</p>`;
  }

  function renderAll() {
    renderLines();
    renderSummary();
    renderReview();
  }

  function clearErrors() {
    $$('.field__error', form).forEach((el) => (el.textContent = ''));
    $$('[aria-invalid="true"]', form).forEach((el) => el.removeAttribute('aria-invalid'));
    formError.hidden = true;
    formError.textContent = '';
  }

  function setError(field, message, focus = true) {
    const host = form.querySelector(`[data-error-for="${field}"]`);
    if (host) host.textContent = message;
    const id = fieldIds[field];
    const input = id ? document.getElementById(id) : null;
    if (input) {
      input.setAttribute('aria-invalid', 'true');
      if (focus) input.focus();
    }
  }

  function validate(payload, items) {
    const errors = [];
    if (payload.customerName.trim().length < 2) errors.push(['customerName', 'Enter your full name.']);
    if (!/^[+0-9][0-9\s\-()]{6,19}$/.test(payload.phone.trim()))
      errors.push(['phone', 'Enter a valid phone number for follow-up.']);
    if (payload.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email.trim()))
      errors.push(['email', 'Enter a valid email address, or leave it blank.']);
    if (payload.contactMethod === 'Email' && !payload.email.trim())
      errors.push(['email', 'Email is required when email is the preferred contact method.']);
    if (payload.projectDescription.trim().length < 15)
      errors.push(['projectDescription', 'Describe the project in at least 15 characters.']);
    if (!payload.consent)
      errors.push(['consent', 'Confirm that this is a demonstration request, not a confirmed order.']);
    return errors;
  }

  function payloadFromForm() {
    const method = form.querySelector('input[name="contactMethod"]:checked');
    return {
      customerName: $('#customerName').value,
      phone: $('#phone').value,
      email: $('#email').value,
      contactMethod: method ? method.value : 'Phone call',
      projectType: $('#projectType').value,
      projectDescription: $('#projectDescription').value,
      preferredBranch: $('#preferredBranch').value || 'Migori Main',
      neededBy: $('#neededBy').value,
      consent: $('#quoteConsent').checked,
      items: Store.getQuoteList().map((line) => ({
        productId: line.productId,
        qty: line.qty,
        note: line.note || ''
      }))
    };
  }

  function printQuotation(quotation) {
    const settings = Store.getSettings();
    const issueDate = ui.formatDate(quotation.receivedAt);
    const visible = settings.showIndicativePrices;
    const anyPriced = quotation.items.some((item) => typeof item.indicativePrice === 'number');
    const rows = quotation.items
      .map(
        (item) => `<tr>
          <td>${ui.escapeHtml(item.name)}<br><span class="muted">${ui.escapeHtml(item.sku)}</span></td>
          <td>${ui.escapeHtml(item.unit)}</td>
          <td class="num">${item.qty}</td>
          <td class="num">${
            typeof item.indicativePrice === 'number'
              ? visible
                ? ui.formatMoney(item.indicativePrice)
                : '<span class="muted">Hidden</span>'
              : '<span class="muted">Confirm</span>'
          }</td>
          <td class="num">${
            typeof item.indicativePrice === 'number'
              ? visible
                ? ui.formatMoney(item.indicativePrice * item.qty)
                : '<span class="muted">—</span>'
              : '<span class="muted">—</span>'
          }</td>
        </tr>`
      )
      .join('');
    const body = `
      <div class="doc-head">
        <div>
          <div class="doc-brand">MAROWA STORE<small>Demonstration concept · Migori Town</small></div>
        </div>
        <div class="doc-meta">
          <div>Reference <strong>${ui.escapeHtml(quotation.reference)}</strong></div>
          <div>Saved ${ui.escapeHtml(issueDate)}</div>
          <div>Status: ${ui.escapeHtml(quotation.status)}</div>
        </div>
      </div>
      <div class="stamp">Demonstration — not an official quotation</div>
      <div class="notice">
        <strong>This document is not an official Marowa Store quotation.</strong>
        It was generated from a frontend-only demonstration. Prices are sample data and
        no order, reservation or payment exists. Confirm everything with the store directly.
      </div>
      <div class="grid">
        <div class="panel">
          <div class="label">Customer</div>
          <strong>${ui.escapeHtml(quotation.customerName)}</strong><br>
          ${ui.escapeHtml(quotation.phone)}${quotation.email ? `<br>${ui.escapeHtml(quotation.email)}` : ''}<br>
          <span class="muted">Preferred contact: ${ui.escapeHtml(quotation.contactMethod)}</span>
        </div>
        <div class="panel">
          <div class="label">Project</div>
          <strong>${ui.escapeHtml(quotation.projectType || 'Not specified')}</strong><br>
          <span class="muted">Needed by: ${ui.escapeHtml(quotation.neededBy || 'Not specified')}<br>
          Branch: ${ui.escapeHtml(quotation.preferredBranch || 'Migori Main')}</span>
        </div>
      </div>
      <h2>Requested items</h2>
      <table>
        <thead><tr><th>Item</th><th>Unit</th><th class="num">Qty</th><th class="num">Indicative</th><th class="num">Line</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="total"><span>Indicative demo total</span> <span>${
        visible ? (anyPriced ? ui.formatMoney(quotation.indicativeTotal) : 'Confirm price') : 'Hidden in demo settings'
      }</span></div>
      <p class="muted">Confirm-price lines are excluded from this total. Delivery, tax and current-store pricing are not included.</p>
      <h2>Project notes</h2>
      <p>${ui.escapeHtml(quotation.projectDescription)}</p>
      ${
        quotation.items.some((item) => item.note)
          ? `<h2>Line notes</h2><ul>${quotation.items
              .filter((item) => item.note)
              .map((item) => `<li><strong>${ui.escapeHtml(item.name)}:</strong> ${ui.escapeHtml(item.note)}</li>`)
              .join('')}</ul>`
          : ''
      }
      <div class="footer">
        Generated from the independent Marowa Store digital commerce concept.
        Contact details used in this demo: ${ui.escapeHtml(settings.phone)} · ${ui.escapeHtml(settings.email)}.
        This page is stamped as a demonstration; it must not be presented as a store-issued quotation.
      </div>`;
    ui.printHtml(`Demo request ${quotation.reference}`, body);
  }

  function showConfirmation(quotation) {
    lastQuotation = quotation;
    if (builderLayout) builderLayout.hidden = true;
    confirmationHost.hidden = false;
    const qty = quotation.items.reduce((sum, item) => sum + item.qty, 0);
    const anyPriced = quotation.items.some((item) => typeof item.indicativePrice === 'number');
    confirmationHost.innerHTML = `<div class="confirmation">
      <span class="confirmation__icon">${Marowa.icon('check-circle', 28)}</span>
      <span class="eyebrow">Saved locally · demonstration only</span>
      <h1>Your demonstration request is saved.</h1>
      <p>
        A record has been added to this browser's local demonstration data.
        <strong>It has not been sent to Marowa Store</strong>, no message has been transmitted,
        and no order or payment exists.
      </p>
      <div class="reference-box">
        <div><span>Demo reference</span><strong>${ui.escapeHtml(quotation.reference)}</strong></div>
        <span class="tag tag--demo">Demonstration record</span>
      </div>
      <dl class="confirmation__grid">
        <div><dt>Contact</dt><dd>${ui.escapeHtml(quotation.customerName)} · ${ui.escapeHtml(
      quotation.phone
    )}</dd></div>
        <div><dt>Status</dt><dd>${ui.escapeHtml(quotation.status)} (demo queue)</dd></div>
        <div><dt>Items</dt><dd>${quotation.items.length} line${
      quotation.items.length === 1 ? '' : 's'
    } · ${qty} total quantity</dd></div>
        <div><dt>Indicative total</dt><dd>${
          showPrices()
            ? anyPriced
              ? ui.formatMoney(quotation.indicativeTotal)
              : 'Confirm price'
            : 'Hidden in demo settings'
        }</dd></div>
      </dl>
      <div class="notice notice--warning">
        ${Marowa.icon('alert', 18)}
        <p><strong>Next step in reality:</strong> contact the store by phone, WhatsApp or email to confirm price and availability. Nothing in this demonstration will reach them automatically.</p>
      </div>
      <div class="confirmation__actions">
        <button class="btn btn--dark" type="button" id="printDemoRequest">
          ${Marowa.icon('printer', 17)} Print demo request
        </button>
        <a class="btn btn--outline" href="login.html?next=admin.html">
          ${Marowa.icon('dashboard', 16)} Review in admin demo
        </a>
        <a class="btn btn--outline" href="products.html">Browse more products</a>
        <a class="btn btn--ghost" href="quotation.html" style="border-color:var(--line);color:var(--ink)">Start another request</a>
      </div>
    </div>`;
    ui.hydrateIcons(confirmationHost);
    const printButton = $('#printDemoRequest');
    if (printButton) printButton.addEventListener('click', () => printQuotation(quotation));
    window.scrollTo({ top: Math.max(0, confirmationHost.offsetTop - 120), behavior: 'smooth' });
    const heading = $('h1', confirmationHost);
    if (heading) {
      heading.setAttribute('tabindex', '-1');
      heading.focus({ preventScroll: true });
    }
  }

  // ---- Line controls ----
  linesHost.addEventListener('click', async (event) => {
    const stepButton = event.target.closest('[data-quote-step]');
    if (stepButton) {
      const row = stepButton.closest('[data-quote-line]');
      const input = row.querySelector('.js-quote-qty');
      const value = Math.max(
        1,
        Math.min(999, (Number(input.value) || 1) + Number(stepButton.getAttribute('data-quote-step')))
      );
      Store.setQuoteQty(row.getAttribute('data-quote-line'), value);
      renderAll();
      return;
    }

    const removeButton = event.target.closest('[data-quote-remove]');
    if (removeButton) {
      const productId = removeButton.getAttribute('data-quote-remove');
      const product = Store.getProduct(productId);
      Store.removeFromQuote(productId);
      renderAll();
      ui.toast(`${product ? product.name : 'Item'} removed from the quotation list.`, { type: 'info' });
    }
  });

  linesHost.addEventListener('change', (event) => {
    const input = event.target.closest('.js-quote-qty');
    if (input) {
      const row = input.closest('[data-quote-line]');
      const value = Math.max(1, Math.min(999, Math.floor(Number(input.value) || 1)));
      Store.setQuoteQty(row.getAttribute('data-quote-line'), value);
      renderAll();
      return;
    }
    const note = event.target.closest('.js-quote-note');
    if (note) {
      Store.setQuoteNote(note.getAttribute('data-note-for'), note.value);
    }
  });

  $('#clearQuoteList').addEventListener('click', async () => {
    const confirmed = await ui.confirm({
      title: 'Clear the quotation list?',
      message: 'All products will be removed from this local quotation list. Your cart is not affected.',
      confirmLabel: 'Clear list',
      danger: true
    });
    if (!confirmed) return;
    Store.clearQuoteList();
    renderAll();
    ui.toast('Quotation list cleared.', { type: 'info' });
  });

  // Update the review as contact details change.
  ['customerName', 'phone', 'email', 'projectType', 'neededBy'].forEach((id) => {
    const input = document.getElementById(id);
    if (input) input.addEventListener('input', renderReview);
  });
  $$('input[name="contactMethod"]', form).forEach((input) =>
    input.addEventListener('change', renderReview)
  );

  // Clear field errors when the customer edits the field.
  ['customerName', 'phone', 'email', 'projectDescription'].forEach((id) => {
    const input = document.getElementById(id);
    if (!input) return;
    input.addEventListener('input', () => {
      input.removeAttribute('aria-invalid');
      const host = form.querySelector(`[data-error-for="${id}"]`);
      if (host) host.textContent = '';
    });
  });
  $('#quoteConsent').addEventListener('change', () => {
    const host = form.querySelector('[data-error-for="consent"]');
    if (host) host.textContent = '';
  });

  // ---- Submit ----
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    clearErrors();
    const payload = payloadFromForm();

    if (!payload.items.length) {
      formError.hidden = false;
      formError.textContent = 'Add at least one product to the quotation list before saving.';
      $('#quoteEmpty').scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const errors = validate(payload);
    if (errors.length) {
      errors.forEach(([field, message], index) => setError(field, message, index === 0));
      formError.hidden = false;
      formError.textContent = 'Please check the highlighted fields and try again.';
      return;
    }

    const result = Store.addQuotation(payload);
    if (!result.ok) {
      if (result.field && result.field !== 'items') {
        setError(result.field, result.error);
      }
      formError.hidden = false;
      formError.textContent = result.error || 'The demonstration request could not be saved.';
      return;
    }

    ui.toast('Demonstration quotation saved in this browser.', { type: 'success' });
    showConfirmation(result.quotation);
  });

  // Optional deep link: quotation.html?product=<id>
  try {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('product');
    if (productId) {
      const product = Store.getProduct(productId);
      if (product && product.active) {
        Store.addToQuote(product.id, 1);
        ui.toast(`${product.name} added to the quotation list.`, { type: 'success' });
      }
      params.delete('product');
      const query = params.toString();
      window.history.replaceState(null, '', `quotation.html${query ? `?${query}` : ''}`);
    }
  } catch {
    /* ignore URL issues in restricted contexts */
  }

  renderAll();
})();
