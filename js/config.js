/**
 * Global configuration for the Marowa Store digital commerce concept.
 *
 * IMPORTANT
 * This is an independent demonstration project. It is not commissioned,
 * approved or operated by Marowa Store. There is no production backend.
 * The demo access code below is intentionally public: it gates a demonstration
 * interface only and must never be treated as production security.
 */
window.Marowa = window.Marowa || {};

Marowa.config = {
  business: {
    name: 'Marowa Store',
    descriptor: 'Hardware, tools & building materials',
    phoneDisplay: '0716 865 976',
    phoneE164: '+254716865976',
    whatsappNumber: '254716865976',
    email: 'marowastores@gmail.com',
    location: 'Migori Town, next to Bansi Wholesale',
    town: 'Migori Town, Kenya',
    mapsUrl:
      'https://www.google.com/maps/search/?api=1&query=' +
      encodeURIComponent('Marowa Store, Migori Town, Kenya')
  },
  demo: {
    enabled: true,
    isConcept: true,
    accessCode: 'MAROWA-DEMO',
    storageKey: 'marowa.demo.state.v1',
    sessionKey: 'marowa.demo.session.v1',
    label: 'Independent concept · demonstration data'
  },
  api: {
    enabled: false,
    baseUrl: null,
    note: 'No API is connected. All writes are stored in this browser only.'
  },
  seo: {
    // Set this to the real absolute site URL after a production deployment,
    // for example "https://www.example.com". Leave blank for the local demo.
    siteUrl: 'https://marowa-store-migori-demo.netlify.app',
    defaultImage: 'assets/img/hero-grinder.jpg'
  },
  developer: {
    name: 'Thomas Hondo Chacha',
    role: 'Software Engineer',
    credit:
      'Digital Commerce Concept Designed & Developed by Thomas Hondo Chacha — Software Engineer.'
  },
  defaults: {
    currency: 'KES',
    lowStockThreshold: 5,
    pageSize: 9,
    quotationPrefix: 'MRW-Q',
    inquiryPrefix: 'MRW-I'
  }
};
