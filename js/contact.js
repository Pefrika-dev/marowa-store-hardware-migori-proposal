/**
 * Contact page — the form is a local demonstration only. The real contact
 * links (phone, WhatsApp, email) are separate and clearly labelled.
 */
(function () {
  const Store = Marowa.Store;
  const ui = Marowa.ui;
  const $ = ui.$;
  const $$ = ui.$$;
  const form = $('#contactForm');
  const confirmation = $('#contactConfirmation');
  if (!form || !confirmation) return;

  const fieldIds = {
    customerName: 'inquiryName',
    phone: 'inquiryPhone',
    email: 'inquiryEmail',
    message: 'inquiryMessage'
  };

  function clearErrors() {
    $$('.field__error', form).forEach((el) => (el.textContent = ''));
    $$('[aria-invalid="true"]', form).forEach((el) => el.removeAttribute('aria-invalid'));
    const error = $('#inquiryFormError');
    error.hidden = true;
    error.textContent = '';
  }

  function setError(field, message, focus) {
    const host = form.querySelector(`[data-error-for="${field}"]`);
    if (host) host.textContent = message;
    const input = fieldIds[field] ? document.getElementById(fieldIds[field]) : null;
    if (input) {
      input.setAttribute('aria-invalid', 'true');
      if (focus) input.focus();
    }
  }

  ['inquiryName', 'inquiryPhone', 'inquiryEmail', 'inquiryMessage'].forEach((id) => {
    const input = document.getElementById(id);
    if (!input) return;
    input.addEventListener('input', () => {
      input.removeAttribute('aria-invalid');
      const field = Object.keys(fieldIds).find((key) => fieldIds[key] === id);
      const host = field ? form.querySelector(`[data-error-for="${field}"]`) : null;
      if (host) host.textContent = '';
    });
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    clearErrors();
    const payload = {
      customerName: $('#inquiryName').value,
      phone: $('#inquiryPhone').value,
      email: $('#inquiryEmail').value,
      topic: $('#inquiryTopic').value,
      message: $('#inquiryMessage').value
    };

    if (!payload.customerName.trim()) {
      setError('customerName', 'Enter your full name.', true);
      return;
    }
    if (!payload.phone.trim() && !payload.email.trim()) {
      setError('phone', 'Enter a phone number or an email address.', true);
      return;
    }

    const result = Store.addInquiry(payload);
    if (!result.ok) {
      if (result.field) setError(result.field, result.error, true);
      const error = $('#inquiryFormError');
      error.hidden = false;
      error.textContent = result.error || 'The demonstration inquiry could not be saved.';
      return;
    }

    showConfirmation(result.inquiry);
    ui.toast('Demonstration inquiry saved in this browser.', { type: 'success' });
  });

  function showConfirmation(inquiry) {
    form.hidden = true;
    confirmation.hidden = false;
    confirmation.innerHTML = `<div class="confirmation">
      <span class="confirmation__icon">${Marowa.icon('check-circle', 28)}</span>
      <span class="eyebrow">Saved locally · demonstration only</span>
      <h2>Your demonstration inquiry is saved.</h2>
      <p>
        This message has <strong>not</strong> been emailed, sent by WhatsApp or transmitted to
        Marowa Store. It exists only in this browser's local demonstration data.
      </p>
      <div class="reference-box">
        <div><span>Demo reference</span><strong>${ui.escapeHtml(inquiry.reference)}</strong></div>
        <span class="tag tag--demo">Demonstration record</span>
      </div>
      <div class="notice notice--warning">
        ${Marowa.icon('alert', 18)}
        <p><strong>For a real reply, contact the store directly.</strong> Use the phone, WhatsApp or email details on this page. Do not rely on this form to reach anyone.</p>
      </div>
      <div class="confirmation__actions">
        <a class="btn btn--dark" href="tel:+254716865976" data-tel>
          ${Marowa.icon('phone', 16)} Call the store
        </a>
        <a class="btn btn--outline" href="#" data-whatsapp data-whatsapp-message="Hello Marowa Store, I would like to make an enquiry.">
          ${Marowa.icon('whatsapp', 16)} WhatsApp
        </a>
        <a class="btn btn--outline" href="mailto:marowastores@gmail.com" data-biz-email>Email</a>
        <button class="btn btn--ghost" type="button" id="newInquiry" style="border-color:var(--line);color:var(--ink)">Send another demo inquiry</button>
      </div>
    </div>`;

    // Hydrate the newly rendered dynamic content.
    ui.hydrateIcons(confirmation);
    const settings = Store.getSettings();
    $$('[data-tel]', confirmation).forEach(
      (el) => (el.href = `tel:${String(settings.phone).replace(/\s/g, '')}`)
    );
    $$('[data-whatsapp]', confirmation).forEach((el) => {
      el.href = ui.whatsAppHref(el.getAttribute('data-whatsapp-message') || undefined);
      el.target = '_blank';
      el.rel = 'noopener noreferrer';
    });
    $$('[data-biz-email]', confirmation).forEach((el) => {
      el.href = `mailto:${settings.email}`;
      el.textContent = 'Email';
    });

    const again = $('#newInquiry');
    if (again) {
      again.addEventListener('click', () => {
        form.reset();
        $('#inquiryTopic').selectedIndex = 0;
        clearErrors();
        confirmation.hidden = true;
        form.hidden = false;
        const first = $('#inquiryName');
        if (first) first.focus();
      });
    }
    window.scrollTo({ top: Math.max(0, confirmation.offsetTop - 140), behavior: 'smooth' });
  }
})();
