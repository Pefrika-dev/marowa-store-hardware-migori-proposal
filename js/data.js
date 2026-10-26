/**
 * DEMONSTRATION CATALOGUE DATA
 * -----------------------------
 * Every product, price, stock status and specification in this file is sample
 * data created for an independent design concept. It does not represent the
 * real catalogue, prices, stock or availability of Marowa Store.
 *
 * Do not present these entries as verified business information.
 */
(function () {
  const categories = [
    {
      id: 'power-tools',
      name: 'Power Tools',
      eyebrow: 'Corded & cordless',
      description:
        'Drills, grinders and cutting tools for assembly, fabrication and site work.',
      image: 'assets/img/categories/power-tools.jpg',
      imageAlt: 'Cordless drills arranged on a workshop bench',
      demo: true
    },
    {
      id: 'hand-tools',
      name: 'Hand Tools',
      eyebrow: 'Measure, strike, turn',
      description:
        'Measuring, striking, driving and turning tools for everyday trade work.',
      image: 'assets/img/categories/hand-tools.jpg',
      imageAlt: 'A flat-lay of hand tools including hammers, spanners and pliers',
      demo: true
    },
    {
      id: 'hardware',
      name: 'Hardware',
      eyebrow: 'General fitting',
      description:
        'Practical hardware for repairs, fitting, workshop use and general site work.',
      image: 'assets/img/categories/hardware.jpg',
      imageAlt: 'Open-ended spanners arranged on a dark workshop surface',
      demo: true
    },
    {
      id: 'electrical-supplies',
      name: 'Electrical Supplies',
      eyebrow: 'Cable & accessories',
      description:
        'Cabling, switches and installation accessories for domestic and light commercial work.',
      image: 'assets/img/categories/electrical-supplies.jpg',
      imageAlt: 'Coils of electrical cable in red and green',
      demo: true
    },
    {
      id: 'plumbing',
      name: 'Plumbing',
      eyebrow: 'Pipes & fittings',
      description:
        'PVC pipes, elbows and fittings for water and waste-system installations.',
      image: 'assets/img/categories/plumbing.jpg',
      imageAlt: 'Stacks of grey PVC pipes at a construction site',
      demo: true
    },
    {
      id: 'building-materials',
      name: 'Building Materials',
      eyebrow: 'Core site inputs',
      description:
        'Cement, masonry and core construction inputs for projects of different sizes.',
      image: 'assets/img/categories/building-materials.jpg',
      imageAlt: 'Cement bags stacked in a storage area',
      demo: true
    },
    {
      id: 'paint-finishing',
      name: 'Paint & Finishing',
      eyebrow: 'Prep & finish',
      description:
        'Rollers, trays and finishing supplies for interior and exterior work.',
      image: 'assets/img/categories/paint-finishing.jpg',
      imageAlt: 'Paint rollers, brushes and paint cans on a protective sheet',
      demo: true
    },
    {
      id: 'safety-equipment',
      name: 'Safety Equipment',
      eyebrow: 'Site protection',
      description:
        'Head, hand and basic site protection for workshop and construction tasks.',
      image: 'assets/img/categories/safety-equipment.jpg',
      imageAlt: 'A red construction safety helmet',
      demo: true
    },
    {
      id: 'fasteners-fittings',
      name: 'Fasteners & Fittings',
      eyebrow: 'Fix & secure',
      description:
        'Screws, bolts and fixing components for timber, masonry and general assembly.',
      image: 'assets/img/categories/fasteners-fittings.jpg',
      imageAlt: 'A close-up of threaded bolts arranged in a row',
      demo: true
    }
  ];

  const brands = [
    { id: 'metabo', name: 'Metabo', note: 'Power tools' },
    { id: 'dewalt', name: 'DeWalt', note: 'Power tools' },
    { id: 'milwaukee', name: 'Milwaukee', note: 'Power tools' },
    { id: 'stanley', name: 'Stanley', note: 'Hand tools' },
    { id: 'irwin', name: 'Irwin', note: 'Hand tools' },
    { id: 'husky', name: 'Husky', note: 'Tool storage & kits' },
    { id: 'haco', name: 'Haco', note: 'Plumbing' },
    { id: 'bua', name: 'Bua Cement', note: 'Building materials' },
    { id: 'unbranded', name: 'Unbranded / Trade', note: 'General supplies' }
  ];

  const products = [
    {
      id: 'cordless-drill-driver',
      sku: 'MRW-PT-1001',
      name: 'Cordless Drill Driver',
      brand: 'Metabo',
      category: 'power-tools',
      description:
        'A compact cordless drill driver for assembly, fixing and light drilling tasks. Supplied as a demonstration listing; confirm the exact model, battery configuration and current price with the store.',
      unit: 'Each',
      price: 6850,
      currency: 'KES',
      stockQty: 12,
      lowStockThreshold: 5,
      branchId: 'migori-main',
      image: 'assets/img/products/cordless-drill.jpg',
      imageAlt: 'Three cordless drill drivers lined up on a workshop bench',
      specifications: [
        { label: 'Tool type', value: 'Cordless drill driver' },
        { label: 'Chuck', value: 'Keyless chuck (demonstration specification)' },
        { label: 'Typical use', value: 'Drilling and screwdriving' },
        { label: 'Battery & charger', value: 'Confirm configuration with the store' }
      ],
      featured: true,
      active: true,
      demoData: true
    },
    {
      id: 'angle-grinder',
      sku: 'MRW-PT-1002',
      name: 'Angle Grinder 850W',
      brand: 'DeWalt',
      category: 'power-tools',
      description:
        'A corded angle grinder for cutting and light grinding work. Discs and guards must be matched to the task. Demonstration specification only.',
      unit: 'Each',
      price: 4950,
      currency: 'KES',
      stockQty: 4,
      lowStockThreshold: 5,
      branchId: 'migori-main',
      image: 'assets/img/products/angle-grinder.jpg',
      imageAlt: 'A worker using an angle grinder with sparks visible',
      specifications: [
        { label: 'Tool type', value: 'Corded angle grinder' },
        { label: 'Input power', value: '850W (demonstration specification)' },
        { label: 'Disc size', value: 'Confirm current stock specification' },
        { label: 'Accessories', value: 'Discs supplied separately unless stated' }
      ],
      featured: true,
      active: true,
      demoData: true
    },
    {
      id: 'impact-drill',
      sku: 'MRW-PT-1003',
      name: 'Corded Impact Drill',
      brand: 'Milwaukee',
      category: 'power-tools',
      description:
        'A corded impact drill for repetitive drilling tasks in masonry, timber and metal. Demonstration listing; accessories and exact specification to be confirmed.',
      unit: 'Each',
      price: 12750,
      currency: 'KES',
      stockQty: 7,
      lowStockThreshold: 4,
      branchId: 'migori-main',
      image: 'assets/img/products/impact-drill.jpg',
      imageAlt: 'Close-up of a red corded drill with a drill bit fitted',
      specifications: [
        { label: 'Tool type', value: 'Corded impact drill' },
        { label: 'Power source', value: 'Mains power' },
        { label: 'Chuck', value: 'Keyed chuck (demonstration specification)' },
        { label: 'Case', value: 'Confirm inclusion with the store' }
      ],
      featured: false,
      active: true,
      demoData: true
    },
    {
      id: 'tape-measure-8m',
      sku: 'MRW-HT-1001',
      name: 'Tape Measure 8m',
      brand: 'Stanley',
      category: 'hand-tools',
      description:
        'An 8-metre retractable tape measure with a locking blade for general construction and finishing measurements. Demonstration listing.',
      unit: 'Each',
      price: 450,
      currency: 'KES',
      stockQty: 30,
      lowStockThreshold: 10,
      branchId: 'migori-main',
      image: 'assets/img/products/tape-measure.jpg',
      imageAlt: 'A yellow Stanley tape measure with its blade extended',
      specifications: [
        { label: 'Length', value: '8m / 26ft (demonstration specification)' },
        { label: 'Blade', value: 'Retractable steel blade with lock' },
        { label: 'Scale', value: 'Metric and imperial markings' },
        { label: 'Belt clip', value: 'Confirm with current stock' }
      ],
      featured: true,
      active: true,
      demoData: true
    },
    {
      id: 'claw-hammer-16oz',
      sku: 'MRW-HT-1002',
      name: 'Claw Hammer 16oz',
      brand: 'Stanley',
      category: 'hand-tools',
      description:
        'A general-purpose claw hammer for driving and removing nails in timber and light construction work. Demonstration listing.',
      unit: 'Each',
      price: 780,
      currency: 'KES',
      stockQty: 18,
      lowStockThreshold: 6,
      branchId: 'migori-main',
      image: 'assets/img/products/claw-hammer.jpg',
      imageAlt: 'A claw hammer with a dark handle on a white surface',
      specifications: [
        { label: 'Head weight', value: '16oz (demonstration specification)' },
        { label: 'Handle', value: 'Composite grip handle' },
        { label: 'Use', value: 'Nailing and nail removal' },
        { label: 'Finish', value: 'Confirm with current stock' }
      ],
      featured: false,
      active: true,
      demoData: true
    },
    {
      id: 'precision-screwdriver-set',
      sku: 'MRW-HT-1003',
      name: 'Precision Screwdriver Set',
      brand: 'Unbranded / Trade',
      category: 'hand-tools',
      description:
        'A compact precision screwdriver set for small fixings, electronics and light assembly work. Demonstration listing; bit count to be confirmed.',
      unit: 'Set',
      price: 1250,
      currency: 'KES',
      stockQty: 9,
      lowStockThreshold: 4,
      branchId: 'migori-main',
      image: 'assets/img/products/screwdriver-set.jpg',
      imageAlt: 'A precision screwdriver set with interchangeable bits in a case',
      specifications: [
        { label: 'Set type', value: 'Interchangeable precision bits' },
        { label: 'Case', value: 'Storage case shown' },
        { label: 'Use', value: 'Small fixings and light assembly' },
        { label: 'Bit count', value: 'Confirm with the store' }
      ],
      featured: false,
      active: true,
      demoData: true
    },
    {
      id: 'adjustable-spanner-250mm',
      sku: 'MRW-HW-1001',
      name: 'Adjustable Spanner 250mm',
      brand: 'Irwin',
      category: 'hardware',
      description:
        'A 250mm adjustable spanner for nuts and fittings across general repair and plumbing work. Demonstration listing; current price and availability on request.',
      unit: 'Each',
      price: null,
      currency: 'KES',
      stockQty: null,
      lowStockThreshold: 4,
      branchId: 'migori-main',
      image: 'assets/img/products/adjustable-spanner.jpg',
      imageAlt: 'A 250mm adjustable spanner on a plain background',
      specifications: [
        { label: 'Length', value: '250mm (demonstration specification)' },
        { label: 'Jaw', value: 'Adjustable jaw with measurement scale' },
        { label: 'Handle', value: 'Metal handle' },
        { label: 'Price', value: 'Contact the store to confirm' }
      ],
      featured: false,
      active: true,
      demoData: true
    },
    {
      id: 'combination-spanner-set',
      sku: 'MRW-HT-1004',
      name: 'Combination Spanner Set',
      brand: 'Unbranded / Trade',
      category: 'hand-tools',
      description:
        'A set of combination spanners for general mechanical and site assembly. Demonstration listing; sizes and current price must be confirmed.',
      unit: 'Set',
      price: null,
      currency: 'KES',
      stockQty: 6,
      lowStockThreshold: 3,
      branchId: 'migori-main',
      image: 'assets/img/products/spanner-set.jpg',
      imageAlt: 'Open-ended spanners arranged around the edge of a dark surface',
      specifications: [
        { label: 'Set type', value: 'Combination spanners' },
        { label: 'Sizes', value: 'Confirm set contents with the store' },
        { label: 'Finish', value: 'Chrome vanadium steel (demo)' },
        { label: 'Storage', value: 'Confirm inclusion' }
      ],
      featured: false,
      active: true,
      demoData: true
    },
    {
      id: 'mechanics-tool-kit',
      sku: 'MRW-HW-1002',
      name: "Mechanic's Tool Kit",
      brand: 'Husky',
      category: 'hardware',
      description:
        'A comprehensive mechanic-style tool kit in a moulded case for workshop and maintenance use. Demonstration listing; exact contents to be confirmed.',
      unit: 'Set',
      price: 18950,
      currency: 'KES',
      stockQty: 2,
      lowStockThreshold: 3,
      branchId: 'migori-main',
      image: 'assets/img/products/tool-kit.jpg',
      imageAlt: 'A large mechanic tool kit in a black moulded case',
      specifications: [
        { label: 'Kit type', value: 'Mechanic tool set in case' },
        { label: 'Contents', value: 'Demonstration image; confirm exact set' },
        { label: 'Case', value: 'Moulded carry case' },
        { label: 'Use', value: 'Workshop and maintenance' }
      ],
      featured: false,
      active: true,
      demoData: true
    },
    {
      id: 'extension-lead-4way',
      sku: 'MRW-EL-1001',
      name: '4-Way Extension Lead',
      brand: 'Unbranded / Trade',
      category: 'electrical-supplies',
      description:
        'A four-way extension lead for temporary power distribution in workshops and light site use. Demonstration listing; cable length and plug type to be confirmed.',
      unit: 'Each',
      price: 1350,
      currency: 'KES',
      stockQty: 15,
      lowStockThreshold: 5,
      branchId: 'migori-main',
      image: 'assets/img/products/extension-lead.jpg',
      imageAlt: 'A white four-way extension lead with coiled cable',
      specifications: [
        { label: 'Outlets', value: '4-way (demonstration specification)' },
        { label: 'Cable', value: 'Confirm length and rating' },
        { label: 'Switch', value: 'Individual or master switch — confirm' },
        { label: 'Use', value: 'Temporary power distribution' }
      ],
      featured: true,
      active: true,
      demoData: true
    },
    {
      id: 'wall-light-switch',
      sku: 'MRW-EL-1002',
      name: 'Wall Light Switch',
      brand: 'Unbranded / Trade',
      category: 'electrical-supplies',
      description:
        'A single rocker wall switch for domestic lighting circuits. Installation should be carried out by a competent electrician. Demonstration listing.',
      unit: 'Each',
      price: 420,
      currency: 'KES',
      stockQty: 0,
      lowStockThreshold: 10,
      branchId: 'migori-main',
      image: 'assets/img/products/light-switch.jpg',
      imageAlt: 'A single wall-mounted rocker light switch',
      specifications: [
        { label: 'Type', value: 'Single rocker switch' },
        { label: 'Mounting', value: 'Wall plate included (demo)' },
        { label: 'Rating', value: 'Confirm with the store' },
        { label: 'Installation', value: 'Competent electrician required' }
      ],
      featured: false,
      active: true,
      demoData: true
    },
    {
      id: 'electrical-cable-25mm',
      sku: 'MRW-EL-1003',
      name: 'Electrical Cable 2.5mm',
      brand: 'Unbranded / Trade',
      category: 'electrical-supplies',
      description:
        'Single-core electrical cable sold by the metre for installation work. Confirm conductor type, rating and current price before purchasing.',
      unit: 'Metre',
      price: 140,
      currency: 'KES',
      stockQty: 120,
      lowStockThreshold: 30,
      branchId: 'migori-main',
      image: 'assets/img/products/electrical-cable.jpg',
      imageAlt: 'A large coil of red electrical cable',
      specifications: [
        { label: 'Conductor size', value: '2.5mm (demonstration specification)' },
        { label: 'Sold by', value: 'Metre' },
        { label: 'Colour', value: 'Confirm available colours' },
        { label: 'Application', value: 'Installation work — confirm rating' }
      ],
      featured: false,
      active: true,
      demoData: true
    },
    {
      id: 'pvc-waste-pipe-50mm',
      sku: 'MRW-PL-1001',
      name: 'PVC Waste Pipe 50mm',
      brand: 'Haco',
      category: 'plumbing',
      description:
        'A 50mm PVC waste pipe for soil and waste installations. Sold as a length; confirm the exact length and pressure class with the store.',
      unit: 'Length',
      price: 980,
      currency: 'KES',
      stockQty: 22,
      lowStockThreshold: 8,
      branchId: 'migori-main',
      image: 'assets/img/products/pvc-pipe.jpg',
      imageAlt: 'Grey PVC pipes stacked at a construction site',
      specifications: [
        { label: 'Diameter', value: '50mm (demonstration specification)' },
        { label: 'Material', value: 'PVC' },
        { label: 'Sold as', value: 'Length' },
        { label: 'Class', value: 'Confirm with the store' }
      ],
      featured: true,
      active: true,
      demoData: true
    },
    {
      id: 'pvc-elbow-50mm',
      sku: 'MRW-PL-1002',
      name: 'PVC Elbow 50mm',
      brand: 'Haco',
      category: 'plumbing',
      description:
        'A 50mm PVC elbow for changing direction in waste pipe runs. Sold as a pack; confirm the pack quantity and fitting type.',
      unit: 'Pack',
      price: 260,
      currency: 'KES',
      stockQty: 40,
      lowStockThreshold: 10,
      branchId: 'migori-main',
      image: 'assets/img/products/pvc-elbow.jpg',
      imageAlt: 'A collection of black PVC pipe elbows and fittings',
      specifications: [
        { label: 'Diameter', value: '50mm (demonstration specification)' },
        { label: 'Type', value: 'Elbow fitting' },
        { label: 'Sold as', value: 'Pack — confirm pack quantity' },
        { label: 'Material', value: 'PVC' }
      ],
      featured: false,
      active: true,
      demoData: true
    },
    {
      id: 'pvc-fittings-pack',
      sku: 'MRW-PL-1003',
      name: 'PVC Fittings Pack',
      brand: 'Haco',
      category: 'plumbing',
      description:
        'An assortment of PVC fittings for small repairs and installation work. Contents are illustrative; confirm the exact pack before ordering.',
      unit: 'Pack',
      price: 300,
      currency: 'KES',
      stockQty: 3,
      lowStockThreshold: 6,
      branchId: 'migori-main',
      image: 'assets/img/products/pvc-fittings.jpg',
      imageAlt: 'An assortment of PVC pipe fittings, tape and connectors',
      specifications: [
        { label: 'Contents', value: 'Assorted PVC fittings (demo)' },
        { label: 'Sold as', value: 'Pack' },
        { label: 'Sizes', value: 'Confirm with the store' },
        { label: 'Use', value: 'Repairs and small installations' }
      ],
      featured: false,
      active: true,
      demoData: true
    },
    {
      id: 'cement-50kg',
      sku: 'MRW-BM-1001',
      name: 'Cement 50kg',
      brand: 'Bua Cement',
      category: 'building-materials',
      description:
        'A 50kg bag of general-purpose cement for construction work. Brand, grade and current price must be confirmed with the store before purchase.',
      unit: 'Bag',
      price: 760,
      currency: 'KES',
      stockQty: 60,
      lowStockThreshold: 20,
      branchId: 'migori-main',
      image: 'assets/img/products/cement.jpg',
      imageAlt: 'A stack of cement bags in a store room',
      specifications: [
        { label: 'Pack size', value: '50kg (demonstration specification)' },
        { label: 'Type', value: 'General-purpose cement' },
        { label: 'Storage', value: 'Keep dry and off the ground' },
        { label: 'Price', value: 'Indicative demonstration price only' }
      ],
      featured: true,
      active: true,
      demoData: true
    },
    {
      id: 'clay-bricks',
      sku: 'MRW-BM-1002',
      name: 'Clay Bricks',
      brand: 'Unbranded / Trade',
      category: 'building-materials',
      description:
        'Hollow clay bricks for wall construction. Pricing and minimum order quantities vary; confirm current availability with the store.',
      unit: 'Per 100',
      price: null,
      currency: 'KES',
      stockQty: 8,
      lowStockThreshold: 5,
      branchId: 'migori-main',
      image: 'assets/img/products/bricks.jpg',
      imageAlt: 'A single hollow clay brick on a work surface',
      specifications: [
        { label: 'Type', value: 'Hollow clay brick (demo)' },
        { label: 'Sold as', value: 'Per 100 pieces' },
        { label: 'Use', value: 'Wall construction' },
        { label: 'Price', value: 'Contact the store to confirm' }
      ],
      featured: false,
      active: true,
      demoData: true
    },
    {
      id: 'masonry-blocks',
      sku: 'MRW-BM-1003',
      name: 'Masonry Blocks',
      brand: 'Unbranded / Trade',
      category: 'building-materials',
      description:
        'Draft demonstration listing for masonry blocks. This product is not published to the storefront until the specification and pricing are confirmed.',
      unit: 'Each',
      price: null,
      currency: 'KES',
      stockQty: null,
      lowStockThreshold: 10,
      branchId: 'migori-main',
      image: 'assets/img/products/masonry-blocks.jpg',
      imageAlt: 'A weathered brick wall with green foliage',
      specifications: [
        { label: 'Type', value: 'Masonry block — draft listing' },
        { label: 'Status', value: 'Not published' },
        { label: 'Price', value: 'Not configured' },
        { label: 'Specification', value: 'To be verified' }
      ],
      featured: false,
      active: false,
      demoData: true
    },
    {
      id: 'paint-roller-9in',
      sku: 'MRW-PF-1001',
      name: 'Paint Roller 9"',
      brand: 'Unbranded / Trade',
      category: 'paint-finishing',
      description:
        'A 9-inch paint roller for general wall and ceiling finishing. Demonstration listing; nap and handle specification to be confirmed.',
      unit: 'Each',
      price: 480,
      currency: 'KES',
      stockQty: 14,
      lowStockThreshold: 6,
      branchId: 'migori-main',
      image: 'assets/img/products/paint-roller.jpg',
      imageAlt: 'Two paint rollers with blue handles on a wooden surface',
      specifications: [
        { label: 'Width', value: '9 inch (demonstration specification)' },
        { label: 'Nap', value: 'Confirm with the store' },
        { label: 'Handle', value: 'Plastic handle' },
        { label: 'Use', value: 'General wall finishing' }
      ],
      featured: true,
      active: true,
      demoData: true
    },
    {
      id: 'roller-tray-kit',
      sku: 'MRW-PF-1002',
      name: 'Roller & Tray Kit',
      brand: 'Unbranded / Trade',
      category: 'paint-finishing',
      description:
        'A painting kit with rollers and a tray for small to medium finishing jobs. Contents are illustrative; confirm the exact kit with the store.',
      unit: 'Set',
      price: 1250,
      currency: 'KES',
      stockQty: 8,
      lowStockThreshold: 4,
      branchId: 'migori-main',
      image: 'assets/img/products/roller-kit.jpg',
      imageAlt: 'Paint rollers and a paint tray on a wooden floor',
      specifications: [
        { label: 'Kit contents', value: 'Rollers and tray (demo)' },
        { label: 'Roller widths', value: 'Confirm with the store' },
        { label: 'Use', value: 'Interior finishing' },
        { label: 'Packaging', value: 'Confirm inclusion' }
      ],
      featured: false,
      active: true,
      demoData: true
    },
    {
      id: 'emulsion-paint-4l',
      sku: 'MRW-PF-1003',
      name: 'Emulsion Paint 4L',
      brand: 'Unbranded / Trade',
      category: 'paint-finishing',
      description:
        'Draft demonstration listing for 4-litre emulsion paint. Colour range, finish and pricing have not been configured and the listing is not published.',
      unit: 'Each',
      price: null,
      currency: 'KES',
      stockQty: null,
      lowStockThreshold: 4,
      branchId: 'migori-main',
      image: 'assets/img/products/emulsion-paint.jpg',
      imageAlt: 'Paint cans, brushes and a roller on a protective sheet',
      specifications: [
        { label: 'Volume', value: '4L — draft demonstration listing' },
        { label: 'Finish', value: 'To be confirmed' },
        { label: 'Colour', value: 'To be confirmed' },
        { label: 'Status', value: 'Not published' }
      ],
      featured: false,
      active: false,
      demoData: true
    },
    {
      id: 'safety-helmet',
      sku: 'MRW-SE-1001',
      name: 'Safety Helmet',
      brand: 'Unbranded / Trade',
      category: 'safety-equipment',
      description:
        'A basic hard hat for head protection on site. Confirm the standard, size adjustment and current certification with the store before use.',
      unit: 'Each',
      price: 720,
      currency: 'KES',
      stockQty: 10,
      lowStockThreshold: 5,
      branchId: 'migori-main',
      image: 'assets/img/products/safety-helmet.jpg',
      imageAlt: 'A red construction hard hat',
      specifications: [
        { label: 'Type', value: 'Hard hat (demonstration specification)' },
        { label: 'Adjustment', value: 'Confirm with the store' },
        { label: 'Standard', value: 'Verify certification before use' },
        { label: 'Colour', value: 'Confirm available colours' }
      ],
      featured: true,
      active: true,
      demoData: true
    },
    {
      id: 'work-gloves',
      sku: 'MRW-SE-1002',
      name: 'Work Gloves',
      brand: 'Unbranded / Trade',
      category: 'safety-equipment',
      description:
        'General-purpose work gloves for handling and light site tasks. Confirm size, material and suitability for the specific task.',
      unit: 'Pair',
      price: 350,
      currency: 'KES',
      stockQty: 25,
      lowStockThreshold: 10,
      branchId: 'migori-main',
      image: 'assets/img/products/work-gloves.jpg',
      imageAlt: 'A pair of red and grey work gloves',
      specifications: [
        { label: 'Type', value: 'General-purpose work gloves' },
        { label: 'Sold as', value: 'Pair' },
        { label: 'Sizes', value: 'Confirm with the store' },
        { label: 'Use', value: 'Handling and light site tasks' }
      ],
      featured: false,
      active: true,
      demoData: true
    },
    {
      id: 'wood-screws-box',
      sku: 'MRW-FF-1001',
      name: 'Wood Screws 4 x 40mm',
      brand: 'Unbranded / Trade',
      category: 'fasteners-fittings',
      description:
        'A box of general-purpose wood screws for timber assembly and fixing. Confirm the pack quantity and coating before ordering.',
      unit: 'Box',
      price: 620,
      currency: 'KES',
      stockQty: 7,
      lowStockThreshold: 10,
      branchId: 'migori-main',
      image: 'assets/img/products/wood-screws.jpg',
      imageAlt: 'A close-up pile of zinc-plated wood screws',
      specifications: [
        { label: 'Size', value: '4 x 40mm (demonstration specification)' },
        { label: 'Head', value: 'Countersunk head' },
        { label: 'Sold as', value: 'Box — confirm quantity' },
        { label: 'Use', value: 'Timber assembly' }
      ],
      featured: false,
      active: true,
      demoData: true
    },
    {
      id: 'hex-bolts-pack',
      sku: 'MRW-FF-1002',
      name: 'Hex Bolts & Nuts',
      brand: 'Unbranded / Trade',
      category: 'fasteners-fittings',
      description:
        'A pack of hex bolts and matching nuts for general assembly and structural fixing. Confirm size, grade and pack quantity with the store.',
      unit: 'Pack',
      price: 840,
      currency: 'KES',
      stockQty: 35,
      lowStockThreshold: 10,
      branchId: 'migori-main',
      image: 'assets/img/products/hex-bolts.jpg',
      imageAlt: 'A row of zinc-plated hex bolts standing upright',
      specifications: [
        { label: 'Type', value: 'Hex bolts with nuts' },
        { label: 'Size', value: 'Confirm with the store' },
        { label: 'Grade', value: 'Confirm with the store' },
        { label: 'Sold as', value: 'Pack' }
      ],
      featured: false,
      active: true,
      demoData: true
    }
  ];

  Marowa.data = {
    categories,
    brands,
    products,
    demoNotice:
      'Demonstration catalogue: product entries, prices, photographs and stock are sample data. They do not represent verified Marowa Store stock or current pricing.'
  };
})();
