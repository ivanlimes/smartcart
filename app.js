const STORAGE_KEYS = {
  state: 'grocerlist-state-v3',
};

const FALLBACK_STORES = [
  { id: 'costco', name: 'Costco', taxRate: 0.0925, defaultBrand: 'Kirkland Signature' },
  { id: 'kroger', name: 'Kroger', taxRate: 0.0925, defaultBrand: 'Simple Truth / Kroger' },
  { id: 'walmart', name: 'Walmart', taxRate: 0.0925, defaultBrand: 'Great Value / Marketside' },
];

const FALLBACK_CATALOG = [
  { id: uid('cat'), storeId: 'costco', name: 'Pasture Eggs', code: '1068080', category: 'Dairy & Eggs', defaultPrice: 7.99, isFavorite: true, lastUpdated: new Date().toISOString() },
  { id: uid('cat'), storeId: 'costco', name: 'Organic Spinach', code: '96716', category: 'Produce', defaultPrice: 4.29, isFavorite: false, lastUpdated: new Date().toISOString() },
  { id: uid('cat'), storeId: 'costco', name: 'Avocados', code: '647465', category: 'Produce', defaultPrice: 4.69, isFavorite: false, lastUpdated: new Date().toISOString() },
  { id: uid('cat'), storeId: 'costco', name: 'KS 3 Berry Blend', code: '1010598', category: 'Frozen', defaultPrice: 12.69, isFavorite: true, lastUpdated: new Date().toISOString() },
  { id: uid('cat'), storeId: 'costco', name: 'Dave\'s 21 Whole Grain Bread', code: '512447', category: 'Bakery', defaultPrice: 8.69, isFavorite: false, lastUpdated: new Date().toISOString() },
  { id: uid('cat'), storeId: 'kroger', name: 'Bananas', code: '', category: 'Produce', defaultPrice: 2.19, isFavorite: false, lastUpdated: new Date().toISOString() },
  { id: uid('cat'), storeId: 'walmart', name: 'Whole Milk', code: '', category: 'Dairy & Eggs', defaultPrice: 3.98, isFavorite: false, lastUpdated: new Date().toISOString() },
];

const seedData = {
  stores: [...FALLBACK_STORES],
  catalogItems: normalizeSavedCatalogItems(FALLBACK_CATALOG),
};

const FALLBACK_STORE_CATALOG = [
  { storeId: 'kroger', name: 'Simple Truth Organic Bananas', brand: 'Simple Truth', code: 'KR-BAN-01', category: 'Produce', defaultPrice: 1.99, isFavorite: true },
  { storeId: 'kroger', name: 'Simple Truth Organic Baby Spinach', brand: 'Simple Truth', code: 'KR-SPN-01', category: 'Produce', defaultPrice: 3.49 },
  { storeId: 'kroger', name: 'Kroger Large Eggs', brand: 'Kroger', code: 'KR-EGG-24', category: 'Dairy & Eggs', defaultPrice: 5.99 },
  { storeId: 'kroger', name: 'Simple Truth Unsweet Almondmilk', brand: 'Simple Truth', code: 'KR-ALM-01', category: 'Dairy & Eggs', defaultPrice: 3.79 },
  { storeId: 'walmart', name: 'Great Value Bananas', brand: 'Great Value', code: 'WM-BAN-01', category: 'Produce', defaultPrice: 1.82, isFavorite: true },
  { storeId: 'walmart', name: 'Marketside Baby Spinach', brand: 'Marketside', code: 'WM-SPN-01', category: 'Produce', defaultPrice: 2.98 },
  { storeId: 'walmart', name: 'Great Value Cage Free Large Eggs', brand: 'Great Value', code: 'WM-EGG-18', category: 'Dairy & Eggs', defaultPrice: 4.84 },
  { storeId: 'walmart', name: 'Great Value Unsweetened Almondmilk', brand: 'Great Value', code: 'WM-ALM-01', category: 'Dairy & Eggs', defaultPrice: 2.88 }
];

const state = {
  stores: [],
  catalogItems: [],
  tripItems: [],
  importItems: [],
  settings: {
    defaultStore: 'costco',
    theme: 'system',
    taxRateOverride: null,
    budgetTarget: null,
  },
  savedTrips: [],
  ui: {
    activeView: 'list',
    currentStore: 'costco',
    selectedTripItemId: null,
    editorOpen: false,
    settingsOpen: false,
    showAllStoresCatalog: false,
  },
};

const els = {};
let lastFocusedBeforeDialog = null;

function uid(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
}

function safeJsonParse(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function saveState() {
  const payload = {
    catalogItems: state.catalogItems,
    tripItems: state.tripItems,
    importItems: state.importItems,
    savedTrips: state.savedTrips,
    settings: state.settings,
    currentStore: state.ui.currentStore,
    activeView: state.ui.activeView,
    showAllStoresCatalog: state.ui.showAllStoresCatalog,
  };
  localStorage.setItem(STORAGE_KEYS.state, JSON.stringify(payload));
}

function normalizeSavedCatalogItems(items = []) {
  return items.map((item) => ({
    id: item.id || uid('cat'),
    storeId: item.storeId || 'costco',
    name: item.name || 'Untitled item',
    brand: item.brand || item.sourceMeta?.brand || '',
    code: item.code || '',
    category: item.category || '',
    defaultPrice: Math.max(0, number(item.defaultPrice, 0)),
    isFavorite: Boolean(item.isFavorite),
    lastUpdated: item.lastUpdated || new Date().toISOString(),
    priceHistory: Array.isArray(item.priceHistory) ? item.priceHistory : [],
    sourceMeta: item.sourceMeta || null,
  }));
}

function loadSavedState() {
  const raw = localStorage.getItem(STORAGE_KEYS.state);
  if (!raw) return;
  const parsed = safeJsonParse(raw, null);
  if (!parsed || typeof parsed !== 'object') return;

  state.catalogItems = Array.isArray(parsed.catalogItems) ? normalizeSavedCatalogItems(parsed.catalogItems) : state.catalogItems;
  state.tripItems = Array.isArray(parsed.tripItems) ? parsed.tripItems : [];
  state.importItems = Array.isArray(parsed.importItems) ? parsed.importItems : [];
  state.savedTrips = Array.isArray(parsed.savedTrips) ? parsed.savedTrips : [];
  state.settings = {
    ...state.settings,
    ...(parsed.settings || {}),
  };
  state.ui.currentStore = parsed.currentStore || state.settings.defaultStore || state.ui.currentStore;
  state.ui.activeView = parsed.activeView || 'list';
  state.ui.showAllStoresCatalog = Boolean(parsed.showAllStoresCatalog);
}

function money(value) {
  const n = Number(value || 0);
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function slugify(value = '') {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function todayIso() {
  return new Date().toISOString();
}

function activeStoreBrand() {
  return getCurrentStore()?.defaultBrand || '';
}

function findCatalogMatchByStore({ name = '', code = '', storeId = state.ui.currentStore }) {
  const safeName = slugify(name);
  return state.catalogItems.find((item) => item.storeId === storeId && (
    (code && item.code && String(item.code) === String(code)) ||
    (safeName && slugify(item.name) === safeName)
  ));
}

function addPriceHistoryEntry(item, price, source = 'manual') {
  const cleanPrice = number(price, NaN);
  if (!Number.isFinite(cleanPrice) || cleanPrice < 0) return;
  if (!Array.isArray(item.priceHistory)) item.priceHistory = [];
  item.priceHistory.unshift({
    price: cleanPrice,
    date: todayIso(),
    source,
    storeId: item.storeId || state.ui.currentStore,
  });
  item.priceHistory = item.priceHistory.slice(0, 12);
}

function getPriceStats(item) {
  const history = Array.isArray(item?.priceHistory) ? item.priceHistory.filter((entry) => Number.isFinite(Number(entry.price))) : [];
  const prices = history.map((entry) => Number(entry.price));
  const latest = Number.isFinite(number(item?.defaultPrice, NaN)) ? number(item.defaultPrice, 0) : (prices[0] || 0);
  if (!prices.length) return { latest, previous: null, avg: latest, low: latest, high: latest, count: latest ? 1 : 0 };
  const sum = prices.reduce((acc, value) => acc + value, 0);
  return {
    latest,
    previous: prices[1] ?? null,
    avg: sum / prices.length,
    low: Math.min(...prices),
    high: Math.max(...prices),
    count: prices.length,
  };
}

function storeNameById(storeId) {
  return state.stores.find((store) => store.id === storeId)?.name || 'Store';
}


function getItemEmoji(item) {
  const name = String(item?.name || '').toLowerCase();
  const category = String(item?.category || '').toLowerCase();

  const checks = [
    [/banana/, '🍌'],
    [/(blueberr|blackberr|strawberr|berry)/, '🫐'],
    [/(apple)/, '🍎'],
    [/(grape)/, '🍇'],
    [/(mandarin|clementine|orange)/, '🍊'],
    [/(avocado)/, '🥑'],
    [/(spinach|arugula|romaine|lettuce|salad|greens?)/, '🥬'],
    [/(broccoli)/, '🥦'],
    [/(cucumber)/, '🥒'],
    [/(pepper)/, '🫑'],
    [/(tomato|marinara|ketchup|tomato sauce|tomato paste)/, '🍅'],
    [/(squash)/, '🥒'],
    [/(olive oil)/, '🫒'],
    [/(peanut butter)/, '🥜'],
    [/(rice|quinoa)/, '🍚'],
    [/(tortilla chips|chips)/, '🫓'],
    [/(bread|rolls?)/, '🍞'],
    [/(jam|jelly|preserve|spread)/, '🍓'],
    [/(egg)/, '🥚'],
    [/(yogurt|milk|mozzarella|cheese|cottage cheese)/, '🥛'],
    [/(oat beverage|almond beverage|almond milk|oat milk)/, '🥛'],
    [/(chicken|turkey)/, '🍗'],
    [/(salmon|cod|tuna|sardine|seafood|fish)/, '🐟'],
  ];

  for (const [pattern, emoji] of checks) {
    if (pattern.test(name)) return emoji;
  }

  if (category.includes('produce')) return '🥬';
  if (category.includes('dairy')) return '🥛';
  if (category.includes('egg')) return '🥚';
  if (category.includes('meat')) return '🍗';
  if (category.includes('fish') || category.includes('seafood')) return '🐟';
  if (category.includes('frozen')) return '🧊';
  if (category.includes('bread') || category.includes('bakery')) return '🍞';
  if (category.includes('canned')) return '🥫';
  if (category.includes('pantry')) return '🥫';
  return '🛒';
}

function formatItemLabel(item) {
  return `${getItemEmoji(item)} ${item?.name || 'Untitled item'}`;
}

function getCategoryEmoji(categoryName = '') {
  const category = String(categoryName || '').toLowerCase();
  if (!category || category === 'all categories') return '🧺';
  if (category.includes('produce') || category.includes('fruit') || category.includes('vegetable') || category.includes('greens') || category.includes('salad')) return '🥬';
  if (category.includes('dairy') || category.includes('yogurt') || category.includes('cheese') || category.includes('milk')) return '🥛';
  if (category.includes('egg')) return '🥚';
  if (category.includes('meat') || category.includes('chicken') || category.includes('turkey')) return '🍗';
  if (category.includes('fish') || category.includes('seafood') || category.includes('salmon') || category.includes('cod') || category.includes('tuna') || category.includes('sardine')) return '🐟';
  if (category.includes('frozen')) return '🧊';
  if (category.includes('bread') || category.includes('bakery')) return '🍞';
  if (category.includes('canned')) return '🥫';
  if (category.includes('pantry') || category.includes('condiment') || category.includes('spread') || category.includes('grain') || category.includes('rice') || category.includes('chips')) return '🥫';
  return '🛒';
}

function formatCategoryBadge(categoryName = '') {
  const label = categoryName || 'Uncategorized';
  return `<span class="badge badge--category" style="${categoryToneStyle(label)}"><span class="badge-emoji" aria-hidden="true">${getCategoryEmoji(label)}</span><span>${escapeHtml(label)}</span></span>`;
}

function getCurrentStore() {
  return state.stores.find((store) => store.id === state.ui.currentStore) || state.stores[0] || FALLBACK_STORES[0];
}

function categoryToneName(categoryName = '') {
  const category = String(categoryName || '').toLowerCase();
  if (!category || category === 'all categories') return 'default';
  if (category.includes('produce') || category.includes('fruit') || category.includes('vegetable') || category.includes('greens') || category.includes('salad')) return 'produce';
  if (category.includes('dairy') || category.includes('yogurt') || category.includes('cheese') || category.includes('milk') || category.includes('egg')) return 'dairy';
  if (category.includes('meat') || category.includes('chicken') || category.includes('turkey')) return 'meat';
  if (category.includes('fish') || category.includes('seafood') || category.includes('salmon') || category.includes('cod') || category.includes('tuna') || category.includes('sardine')) return 'seafood';
  if (category.includes('frozen')) return 'frozen';
  if (category.includes('bread') || category.includes('bakery')) return 'bakery';
  if (category.includes('canned')) return 'canned';
  if (category.includes('pantry') || category.includes('condiment') || category.includes('spread') || category.includes('grain') || category.includes('rice') || category.includes('chips')) return 'pantry';
  return 'default';
}

function categoryToneStyle(categoryName = '') {
  return `--category-color: var(--cat-${categoryToneName(categoryName)})`;
}

function getTaxRate() {
  const override = number(state.settings.taxRateOverride, NaN);
  if (Number.isFinite(override) && override >= 0) return override / 100;
  return number(getCurrentStore()?.taxRate, 0);
}

function calcTripSubtotal() {
  return state.tripItems.reduce((sum, item) => sum + calcItemSubtotal(item), 0);
}

function calcItemSubtotal(item) {
  return number(item.qty, 1) * number(item.price, 0);
}

function calcTax(subtotal) {
  return subtotal * getTaxRate();
}

function calcTotal(subtotal, tax) {
  return subtotal + tax;
}

function byStore(items) {
  if (state.ui.showAllStoresCatalog) return items;
  return items.filter((item) => !item.storeId || item.storeId === state.ui.currentStore);
}

function categoriesForCatalog() {
  const categories = [...new Set(state.catalogItems.map((item) => item.category).filter(Boolean))].sort();
  return ['All categories', ...categories];
}

function applyTheme() {
  const appRoot = document.getElementById('app');
  const htmlRoot = document.documentElement;
  const bodyRoot = document.body;
  const theme = state.settings.theme || 'system';
  const resolvedTheme = theme === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : theme;

  [appRoot, htmlRoot, bodyRoot].forEach((node) => {
    if (node) {
      node.setAttribute('data-theme', resolvedTheme);
    }
  });

  bodyRoot?.classList.toggle('theme-dark', resolvedTheme === 'dark');
  bodyRoot?.classList.toggle('theme-light', resolvedTheme === 'light');
}

function setActiveView(viewName) {
  state.ui.activeView = viewName;
  document.querySelectorAll('.view').forEach((view) => {
    view.classList.toggle('is-active', view.id === `${viewName}View`);
  });
  document.querySelectorAll('[data-view-target]').forEach((btn) => {
    const active = btn.dataset.viewTarget === viewName;
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-current', active ? 'page' : 'false');
  });
  saveState();
}

function renderStoreOptions() {
  els.storeSelect.innerHTML = state.stores.map((store) => `<option value="${store.id}">${store.name}</option>`).join('');
  els.settingsDefaultStore.innerHTML = state.stores.map((store) => `<option value="${store.id}">${store.name}</option>`).join('');
  els.storeSelect.value = state.ui.currentStore;
  els.settingsDefaultStore.value = state.settings.defaultStore;
}

function renderSummary() {
  const subtotal = calcTripSubtotal();
  const tax = calcTax(subtotal);
  const total = calcTotal(subtotal, tax);
  const target = number(state.settings.budgetTarget, NaN);
  const remaining = Number.isFinite(target) && target > 0 ? target - total : null;
  els.subtotalValue.textContent = money(subtotal);
  els.taxValue.textContent = money(tax);
  els.totalValue.textContent = money(total);
  els.stickyTotalValue.textContent = money(total);
  if (els.budgetStatus) {
    if (remaining === null) {
      els.budgetStatus.textContent = 'No trip budget set';
      els.budgetStatus.className = 'budget-pill';
    } else if (remaining >= 0) {
      els.budgetStatus.textContent = `${money(remaining)} under budget`;
      els.budgetStatus.className = 'budget-pill budget-pill--good';
    } else {
      els.budgetStatus.textContent = `${money(Math.abs(remaining))} over budget`;
      els.budgetStatus.className = 'budget-pill budget-pill--warn';
    }
  }
}

function renderTripView() {
  const hasItems = state.tripItems.length > 0;
  els.listEmptyState.hidden = hasItems;
  els.tripTableWrap.hidden = !hasItems;
  els.tripCardList.hidden = !hasItems;

  els.tripTableBody.innerHTML = state.tripItems.map((item) => {
    const selected = state.ui.selectedTripItemId === item.id ? 'is-selected' : '';
    return `
      <tr class="${selected}" data-trip-row="${item.id}">
        <td><button class="btn btn--ghost js-open-trip" data-item-id="${item.id}">${escapeHtml(formatItemLabel(item))}</button></td>
        <td>${escapeHtml(item.code || '—')}</td>
        <td>${formatCategoryBadge(item.category)}</td>
        <td>
          <div class="qty-stepper">
            <button class="step-btn" data-step-qty="-1" data-item-id="${item.id}" aria-label="Decrease quantity">−</button>
            <span>${number(item.qty, 1)}</span>
            <button class="step-btn" data-step-qty="1" data-item-id="${item.id}" aria-label="Increase quantity">+</button>
          </div>
        </td>
        <td><input class="input inline-input" type="number" step="0.01" min="0" value="${number(item.price, 0).toFixed(2)}" data-inline-price="${item.id}" aria-label="Edit price for ${escapeHtml(formatItemLabel(item))}"></td>
        <td>${money(calcItemSubtotal(item))}</td>
        <td>
          <button class="btn btn--secondary js-open-trip" data-item-id="${item.id}">Edit</button>
        </td>
      </tr>
    `;
  }).join('');

  els.tripCardList.innerHTML = state.tripItems.map((item) => `
    <article class="card-item">
      <div class="card-item__top">
        <div>
          <h3>${escapeHtml(formatItemLabel(item))}</h3>
          <div class="card-meta">
            ${formatCategoryBadge(item.category)}
            <span>${escapeHtml(item.code || 'No code')}</span>
          </div>
        </div>
        <strong>${money(calcItemSubtotal(item))}</strong>
      </div>
      <div class="card-item__bottom">
        <div>
          <div class="card-meta"><span>${escapeHtml(item.brand || activeStoreBrand() || '')}</span><span>Unit ${money(item.price)}</span></div>
          <div class="qty-stepper">
            <button class="step-btn" data-step-qty="-1" data-item-id="${item.id}" aria-label="Decrease quantity">−</button>
            <span>${number(item.qty, 1)}</span>
            <button class="step-btn" data-step-qty="1" data-item-id="${item.id}" aria-label="Increase quantity">+</button>
          </div>
        </div>
        <div class="stack-row">
          <button class="btn btn--secondary js-open-trip" data-item-id="${item.id}">Edit</button>
          <button class="btn btn--ghost" data-duplicate-trip="${item.id}">Duplicate</button>
        </div>
      </div>
    </article>
  `).join('');

  renderSummary();
}

function renderCatalogView() {
  const search = els.catalogSearch.value.trim().toLowerCase();
  const categoryFilter = els.catalogCategoryFilter.value;
  const categories = categoriesForCatalog();
  els.catalogCategoryFilter.innerHTML = categories.map((category) => `<option value="${category}">${category}</option>`).join('');
  if (categoryFilter) els.catalogCategoryFilter.value = categoryFilter;
  if (els.catalogStoreModeBtn) {
    els.catalogStoreModeBtn.textContent = state.ui.showAllStoresCatalog ? 'Showing all stores' : `Showing ${getCurrentStore().name} only`;
  }

  const visibleItems = byStore(state.catalogItems).filter((item) => {
    const haystack = `${item.name} ${item.brand || ''} ${item.code} ${item.category}`.toLowerCase();
    const matchesSearch = !search || haystack.includes(search);
    const matchesCategory = !els.catalogCategoryFilter.value || els.catalogCategoryFilter.value === 'All categories' || item.category === els.catalogCategoryFilter.value;
    return matchesSearch && matchesCategory;
  });

  const hasItems = visibleItems.length > 0;
  els.catalogEmptyState.hidden = hasItems;
  els.catalogCategoryChips.innerHTML = categories.map((category) => {
    const isActive = (els.catalogCategoryFilter.value || 'All categories') === category;
    return `<button class="filter-chip ${isActive ? 'is-active' : ''}" type="button" data-category-chip="${escapeHtmlAttr(category)}" aria-pressed="${isActive ? 'true' : 'false'}" style="${categoryToneStyle(category)}"><span aria-hidden="true">${getCategoryEmoji(category)}</span><span>${escapeHtml(category)}</span></button>`;
  }).join('');
  els.catalogTableBody.parentElement.parentElement.hidden = !hasItems;
  els.catalogCardList.hidden = !hasItems;

  els.catalogTableBody.innerHTML = visibleItems.map((item) => {
    const stats = getPriceStats(item);
    return `
    <tr>
      <td><span class="item-name"><span class="item-emoji" aria-hidden="true">${getItemEmoji(item)}</span><span><strong>${escapeHtml(item.name)}</strong><br><span class="muted-inline">${escapeHtml(item.brand || activeStoreBrand() || 'Store brand')}</span></span></span></td>
      <td>${escapeHtml(item.code || '—')}</td>
      <td>${formatCategoryBadge(item.category)}</td>
      <td><strong>${money(item.defaultPrice)}</strong><br><span class="muted-inline">Avg ${money(stats.avg)}</span></td>
      <td>${escapeHtml(storeNameById(item.storeId))}</td>
      <td>
        <div class="stack-row">
          <button class="btn btn--primary" data-add-catalog-to-trip="${item.id}">Add to list</button>
          <button class="btn btn--ghost" data-edit-catalog="${item.id}">Edit</button>
        </div>
      </td>
    </tr>`;
  }).join('');

  els.catalogCardList.innerHTML = visibleItems.map((item) => {
    const stats = getPriceStats(item);
    return `
    <article class="card-item">
      <div class="card-item__top">
        <div>
          <h3>${escapeHtml(formatItemLabel(item))}</h3>
          <div class="card-meta">
            ${formatCategoryBadge(item.category)}
            <span>${escapeHtml(item.code || 'No code')}</span>
            <span>${escapeHtml(item.brand || activeStoreBrand() || 'Store brand')}</span>
          </div>
        </div>
        <strong>${money(item.defaultPrice)}</strong>
      </div>
      <div class="card-item__bottom">
        <span class="badge">${escapeHtml(storeNameById(item.storeId))}</span>
        <span class="badge">Avg ${money(stats.avg)}</span>
        <div class="stack-row">
          <button class="btn btn--primary" data-add-catalog-to-trip="${item.id}">Add</button>
          <button class="btn btn--ghost" data-edit-catalog="${item.id}">Edit</button>
        </div>
      </div>
    </article>`;
  }).join('');
}

function renderImportView() {
  const hasItems = state.importItems.length > 0;
  els.importEmptyState.hidden = hasItems;
  els.importReviewWrap.hidden = !hasItems;
  els.importReviewList.innerHTML = state.importItems.map((item) => `
    <article class="review-row">
      <p class="help-text">Raw: ${escapeHtml(item.rawText)}</p>
      <div class="review-grid">
        <label class="field">
          <span>Name</span>
          <input class="input" type="text" value="${escapeHtmlAttr(item.correctedName || item.guessedName || '')}" data-import-field="name" data-import-id="${item.id}">
        </label>
        <label class="field">
          <span>Code</span>
          <input class="input" type="text" value="${escapeHtmlAttr(item.correctedCode || item.guessedCode || '')}" data-import-field="code" data-import-id="${item.id}">
        </label>
        <label class="field">
          <span>Price</span>
          <input class="input" type="number" step="0.01" min="0" value="${number(item.correctedPrice ?? item.guessedPrice, 0).toFixed(2)}" data-import-field="price" data-import-id="${item.id}">
        </label>
      </div>
      <div class="review-toggles">
        <label class="checkbox-row"><input type="checkbox" data-import-toggle="catalog" data-import-id="${item.id}" ${item.addToCatalog ? 'checked' : ''}> <span>Add to catalog</span></label>
        <label class="checkbox-row"><input type="checkbox" data-import-toggle="list" data-import-id="${item.id}" ${item.addToList ? 'checked' : ''}> <span>Add to current list</span></label>
      </div>
    </article>
  `).join('');
}

function renderSettings() {
  els.settingsDefaultStore.value = state.settings.defaultStore;
  els.settingsTheme.value = state.settings.theme;
  els.settingsTaxOverride.value = state.settings.taxRateOverride ?? '';
  if (els.settingsBudgetTarget) els.settingsBudgetTarget.value = state.settings.budgetTarget ?? '';
}

function renderSavedTrips() {
  if (!els.savedTripList) return;
  if (!state.savedTrips.length) {
    els.savedTripList.innerHTML = '<div class="saved-trip-empty">No saved future-trip lists yet.</div>';
    return;
  }
  els.savedTripList.innerHTML = state.savedTrips.map((trip) => `<article class="saved-trip-card"><div><strong>${escapeHtml(trip.name)}</strong><div class="muted-inline">${escapeHtml(storeNameById(trip.storeId))} • ${trip.items.length} items</div></div><div class="stack-row"><button class="btn btn--secondary btn--sm" data-load-trip-template="${trip.id}">Load</button><button class="btn btn--ghost btn--sm" data-delete-trip-template="${trip.id}">Delete</button></div></article>`).join('');
}

function renderAll() {
  renderStoreOptions();
  renderTripView();
  renderCatalogView();
  renderImportView();
  renderSettings();
  renderSavedTrips();
  applyTheme();
  setActiveView(state.ui.activeView);
}

function openOverlay() {
  els.overlay.hidden = false;
}

function closeOverlayIfClear() {
  if (!state.ui.editorOpen && !state.ui.settingsOpen) {
    els.overlay.hidden = true;
  }
}

function focusFirstIn(container) {
  const target = container.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  if (target) target.focus();
}

function openSettings() {
  lastFocusedBeforeDialog = document.activeElement;
  state.ui.settingsOpen = true;
  els.settingsModal.hidden = false;
  openOverlay();
  renderSettings();
  focusFirstIn(els.settingsModal);
}

function closeSettings() {
  state.ui.settingsOpen = false;
  els.settingsModal.hidden = true;
  closeOverlayIfClear();
  if (lastFocusedBeforeDialog) lastFocusedBeforeDialog.focus();
}

function openEditor(type, item = null) {
  state.ui.editorOpen = true;
  lastFocusedBeforeDialog = document.activeElement;
  els.editorPanel.classList.add('is-open');
  els.editorPanel.setAttribute('aria-hidden', 'false');
  openOverlay();

  els.editorEntityType.value = type;
  els.editorItemId.value = item?.id || '';
  const isTrip = type === 'trip';
  const isCatalog = type === 'catalog';

  els.editorModeLabel.textContent = item ? 'Edit item' : 'New item';
  els.editorTitle.textContent = isTrip ? 'Trip item' : 'Catalog item';
  els.editorQtyField.hidden = !isTrip;
  els.editorFavoriteField.hidden = !isCatalog;

  els.editorName.value = item?.name || '';
  els.editorCode.value = item?.code || '';
  els.editorCategory.value = item?.category || '';
  els.editorQty.value = item?.qty || 1;
  els.editorPrice.value = (isTrip ? item?.price : item?.defaultPrice) ?? 0;
  els.editorFavorite.checked = Boolean(item?.isFavorite);
  els.deleteEditorItemBtn.hidden = !item;

  focusFirstIn(els.editorPanel);
}

function closeEditor() {
  state.ui.editorOpen = false;
  els.editorPanel.classList.remove('is-open');
  els.editorPanel.setAttribute('aria-hidden', 'true');
  closeOverlayIfClear();
  if (lastFocusedBeforeDialog) lastFocusedBeforeDialog.focus();
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function escapeHtmlAttr(value) {
  return escapeHtml(value);
}

function createTripItem(data) {
  return {
    id: uid('trip'),
    catalogItemId: data.catalogItemId || null,
    name: data.name || 'Untitled item',
    brand: data.brand || activeStoreBrand() || '',
    code: data.code || '',
    category: data.category || '',
    qty: Math.max(1, number(data.qty, 1)),
    price: Math.max(0, number(data.price, 0)),
  };
}

function createCatalogItem(data) {
  const item = {
    id: uid('cat'),
    storeId: data.storeId || state.ui.currentStore,
    name: data.name || 'Untitled item',
    brand: data.brand || activeStoreBrand() || '',
    code: data.code || '',
    category: data.category || '',
    defaultPrice: Math.max(0, number(data.defaultPrice, 0)),
    isFavorite: Boolean(data.isFavorite),
    lastUpdated: todayIso(),
    priceHistory: Array.isArray(data.priceHistory) ? data.priceHistory : [],
    sourceMeta: data.sourceMeta || null,
  };
  addPriceHistoryEntry(item, item.defaultPrice, data.source || 'manual');
  return item;
}

function handleEditorSubmit(event) {
  event.preventDefault();
  const type = els.editorEntityType.value;
  const id = els.editorItemId.value;

  if (type === 'trip') {
    const payload = {
      name: els.editorName.value.trim(),
      code: els.editorCode.value.trim(),
      category: els.editorCategory.value.trim(),
      qty: number(els.editorQty.value, 1),
      price: number(els.editorPrice.value, 0),
      brand: activeStoreBrand(),
    };
    if (id) {
      const item = state.tripItems.find((entry) => entry.id === id);
      if (item) Object.assign(item, payload);
    } else {
      state.tripItems.unshift(createTripItem(payload));
    }
  }

  if (type === 'catalog') {
    const payload = {
      storeId: state.ui.currentStore,
      name: els.editorName.value.trim(),
      code: els.editorCode.value.trim(),
      category: els.editorCategory.value.trim(),
      defaultPrice: number(els.editorPrice.value, 0),
      brand: activeStoreBrand(),
      isFavorite: els.editorFavorite.checked,
    };
    if (id) {
      const item = state.catalogItems.find((entry) => entry.id === id);
      if (item) { Object.assign(item, payload, { lastUpdated: todayIso() }); addPriceHistoryEntry(item, payload.defaultPrice, 'manual-edit'); }
    } else {
      state.catalogItems.unshift(createCatalogItem(payload));
    }
  }

  saveState();
  renderAll();
  closeEditor();
  toast('Saved');
}

function deleteEditorItem() {
  const type = els.editorEntityType.value;
  const id = els.editorItemId.value;
  if (!id) return;
  if (type === 'trip') {
    state.tripItems = state.tripItems.filter((item) => item.id !== id);
    if (state.ui.selectedTripItemId === id) state.ui.selectedTripItemId = null;
  }
  if (type === 'catalog') {
    state.catalogItems = state.catalogItems.filter((item) => item.id !== id);
  }
  saveState();
  renderAll();
  closeEditor();
  toast('Deleted');
}

function addCatalogItemToTrip(catalogId) {
  const source = state.catalogItems.find((item) => item.id === catalogId);
  if (!source) return;
  const existingTripMatch = state.tripItems.find((entry) => (entry.catalogItemId && entry.catalogItemId === source.id) || (slugify(entry.name) === slugify(source.name) && (entry.code || '') === (source.code || '')));
  if (existingTripMatch) {
    existingTripMatch.qty = Math.max(1, number(existingTripMatch.qty, 1) + 1);
    saveState();
    renderTripView();
    toast(`Added one more ${source.name}`);
    return;
  }
  state.tripItems.unshift(createTripItem({
    catalogItemId: source.id,
    name: source.name,
    brand: source.brand || activeStoreBrand() || '',
    code: source.code,
    category: source.category,
    qty: 1,
    price: source.defaultPrice,
  }));
  saveState();
  renderAll();
  toast(`${getItemEmoji(source)} Added to list`);
}

function duplicateTripItem(itemId) {
  const source = state.tripItems.find((item) => item.id === itemId);
  if (!source) return;
  state.tripItems.unshift(createTripItem(source));
  saveState();
  renderAll();
  toast(`${getItemEmoji(source)} Duplicated`);
}

function saveSelectedTripItemToCatalog() {
  const selected = state.tripItems.find((item) => item.id === state.ui.selectedTripItemId) || state.tripItems[0];
  if (!selected) {
    toast('Select a trip item first');
    return;
  }
  const match = findCatalogMatchByStore({ name: selected.name, code: selected.code, storeId: state.ui.currentStore });
  if (match) {
    match.defaultPrice = selected.price;
    match.brand = selected.brand || match.brand;
    match.lastUpdated = todayIso();
    addPriceHistoryEntry(match, selected.price, 'trip-save');
    toast(`${getItemEmoji(selected)} Updated saved catalog item`);
  } else {
    state.catalogItems.unshift(createCatalogItem({
      storeId: state.ui.currentStore,
      name: selected.name,
      brand: selected.brand || activeStoreBrand(),
      code: selected.code,
      category: selected.category,
      defaultPrice: selected.price,
      isFavorite: false,
      source: 'trip-save',
    }));
    toast(`${getItemEmoji(selected)} Saved to catalog`);
  }
  saveState();
  renderAll();
}

function saveCurrentTripTemplate() {
  if (!state.tripItems.length) {
    toast('Current trip is empty');
    return;
  }
  const defaultName = `${getCurrentStore().name} trip ${new Date().toLocaleDateString()}`;
  const name = window.prompt('Name this saved list for future trips:', defaultName);
  if (!name || !name.trim()) return;
  state.savedTrips.unshift({
    id: uid('triptpl'),
    name: name.trim(),
    storeId: state.ui.currentStore,
    createdAt: todayIso(),
    items: state.tripItems.map((item) => ({ ...item })),
  });
  state.savedTrips = state.savedTrips.slice(0, 20);
  saveState();
  renderAll();
  toast('Saved list for future trips');
}

function loadTripTemplate(templateId) {
  const template = state.savedTrips.find((entry) => entry.id === templateId);
  if (!template) return;
  state.ui.currentStore = template.storeId || state.ui.currentStore;
  state.tripItems = template.items.map((item) => ({ ...item, id: uid('trip') }));
  state.ui.selectedTripItemId = null;
  saveState();
  renderAll();
  setActiveView('list');
  toast(`Loaded ${template.name}`);
}

function deleteTripTemplate(templateId) {
  state.savedTrips = state.savedTrips.filter((entry) => entry.id !== templateId);
  saveState();
  renderAll();
  toast('Saved list removed');
}

function parseReceiptText(text) {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const result = [];
  for (const line of lines) {
    const match = line.match(/^(\d{4,10})\s+(.+?)\s+(-?\d+\.\d{2})$/);
    if (!match) continue;
    const [, code, guessedName, guessedPrice] = match;
    if (Number(guessedPrice) < 0) continue;
    result.push({
      id: uid('imp'),
      rawText: line,
      guessedName: titleCase(guessedName),
      guessedCode: code,
      guessedPrice: Number(guessedPrice),
      correctedName: titleCase(guessedName),
      correctedCode: code,
      correctedPrice: Number(guessedPrice),
      addToCatalog: true,
      addToList: false,
    });
  }
  return result;
}

function titleCase(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function confirmImport() {
  const chosen = state.importItems.filter((item) => item.addToCatalog || item.addToList);
  if (!chosen.length) {
    toast('Nothing selected for import');
    return;
  }
  chosen.forEach((item) => {
    const payload = {
      name: item.correctedName || item.guessedName,
      code: item.correctedCode || item.guessedCode,
      category: 'Imported',
      brand: activeStoreBrand(),
      price: number(item.correctedPrice ?? item.guessedPrice, 0),
      defaultPrice: number(item.correctedPrice ?? item.guessedPrice, 0),
      storeId: state.ui.currentStore,
      source: 'receipt-import',
    };
    let catalogMatch = findCatalogMatchByStore(payload);
    if (item.addToCatalog) {
      if (catalogMatch) {
        catalogMatch.defaultPrice = payload.defaultPrice;
        catalogMatch.lastUpdated = todayIso();
        catalogMatch.brand = catalogMatch.brand || payload.brand;
        addPriceHistoryEntry(catalogMatch, payload.defaultPrice, 'receipt-import');
      } else {
        catalogMatch = createCatalogItem(payload);
        state.catalogItems.unshift(catalogMatch);
      }
    }
    if (item.addToList) {
      state.tripItems.unshift(createTripItem({ ...payload, catalogItemId: catalogMatch?.id || null }));
    }
  });
  state.importItems = [];
  els.receiptText.value = '';
  saveState();
  renderAll();
  setActiveView('catalog');
  toast('Import complete');
}

function exportCsv() {
  if (!state.tripItems.length) {
    toast('Trip list is empty');
    return;
  }
  const rows = [['Item', 'Code', 'Category', 'Qty', 'Price', 'Subtotal']];
  state.tripItems.forEach((item) => rows.push([
    item.name,
    item.code,
    item.category,
    item.qty,
    number(item.price, 0).toFixed(2),
    calcItemSubtotal(item).toFixed(2),
  ]));
  const csv = rows.map((row) => row.map(csvEscape).join(',')).join('\n');
  downloadFile(`grocery-list-${state.ui.currentStore}.csv`, csv, 'text/csv;charset=utf-8');
}

function csvEscape(value) {
  const str = String(value ?? '');
  return /[",\n]/.test(str) ? `"${str.replaceAll('"', '""')}"` : str;
}

function exportBackup() {
  const payload = {
    exportedAt: new Date().toISOString(),
    state: {
      catalogItems: state.catalogItems,
      tripItems: state.tripItems,
      importItems: state.importItems,
      savedTrips: state.savedTrips,
      settings: state.settings,
      currentStore: state.ui.currentStore,
      activeView: state.ui.activeView,
      showAllStoresCatalog: state.ui.showAllStoresCatalog,
    },
  };
  downloadFile('grocerlist-backup.json', JSON.stringify(payload, null, 2), 'application/json');
}

function importBackup(file) {
  const reader = new FileReader();
  reader.onload = () => {
    const parsed = safeJsonParse(reader.result, null);
    if (!parsed?.state) {
      toast('Backup file is invalid');
      return;
    }
    localStorage.setItem(STORAGE_KEYS.state, JSON.stringify(parsed.state));
    loadSavedState();
    renderAll();
    toast('Backup imported');
  };
  reader.readAsText(file);
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function clearAllData() {
  const confirmed = window.confirm('Clear all local app data from this browser?');
  if (!confirmed) return;
  localStorage.removeItem(STORAGE_KEYS.state);
  state.catalogItems = normalizeSavedCatalogItems(seedData.catalogItems);
  state.tripItems = [];
  state.importItems = [];
  state.savedTrips = [];
  state.settings = { defaultStore: 'costco', theme: 'system', taxRateOverride: null, budgetTarget: null };
  state.ui.currentStore = 'costco';
  state.ui.activeView = 'list';
  state.ui.showAllStoresCatalog = false;
  saveState();
  renderAll();
  closeSettings();
  toast('Local data cleared');
}

function buildPrintView() {
  const store = getCurrentStore();
  const subtotal = calcTripSubtotal();
  const tax = calcTax(subtotal);
  const total = calcTotal(subtotal, tax);
  const today = new Date();
  const dateText = today.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

  els.printMeta.textContent = `${store?.name || 'Store'} • ${dateText}`;

  if (!state.tripItems.length) {
    els.printChecklist.innerHTML = '<li><span class="print-check" aria-hidden="true"></span><div><div class="print-item-main">No items in current list</div><div class="print-item-meta">Add items before printing.</div></div><div class="print-item-price">$0.00</div></li>';
  } else {
    els.printChecklist.innerHTML = state.tripItems.map((item) => {
      const qty = Math.max(1, number(item.qty, 1));
      const price = Math.max(0, number(item.price, 0));
      const subtotalValue = qty * price;
      const details = [item.category || 'Uncategorized'];
      if (item.code) details.push(`Code ${item.code}`);
      details.push(`Qty ${qty}`);
      details.push(`${money(price)} each`);
      return `
        <li>
          <span class="print-check" aria-hidden="true"></span>
          <div>
            <div class="print-item-main">${escapeHtml(formatItemLabel(item))}</div>
            <div class="print-item-meta">${escapeHtml(details.join(' • '))}</div>
          </div>
          <div class="print-item-price">${money(subtotalValue)}</div>
        </li>
      `;
    }).join('');
  }

  els.printSubtotal.textContent = money(subtotal);
  els.printTax.textContent = money(tax);
  els.printTotal.textContent = money(total);
  els.printNote.textContent = 'Estimated prices only. Final in-store total may vary.';
}

function handlePrint() {
  buildPrintView();
  window.print();
}

function toast(message) {
  const node = document.createElement('div');
  node.className = 'toast';
  node.textContent = message;
  els.toastArea.appendChild(node);
  setTimeout(() => node.remove(), 2200);
}

async function loadJson(path, fallback) {
  try {
    const res = await fetch(path);
    if (!res.ok) throw new Error('Failed');
    return await res.json();
  } catch {
    return fallback;
  }
}

function inferStoreId(rawStoreId) {
  const value = String(rawStoreId || '').toLowerCase();
  if (value.includes('kroger')) return 'kroger';
  if (value.includes('walmart')) return 'walmart';
  return 'costco';
}

function pickLatestPrice(pricing) {
  const latestPrice = pricing?.latest?.price;
  if (Number.isFinite(Number(latestPrice))) return Number(latestPrice);
  const history = Array.isArray(pricing?.history) ? pricing.history : [];
  const found = history.find((entry) => Number.isFinite(Number(entry?.price)));
  return found ? Number(found.price) : 0;
}

function normalizeStarterCatalog(rawCatalog) {
  if (Array.isArray(rawCatalog)) {
    return normalizeSavedCatalogItems(rawCatalog);
  }

  if (rawCatalog && Array.isArray(rawCatalog.items)) {
    return rawCatalog.items.map((item) => ({
      id: item.id || uid('cat'),
      storeId: inferStoreId(item.storeId || item.storeKey || 'costco'),
      name: item.canonical_name || item.name || 'Untitled item',
      code: item.item_number || item.code || '',
      category: item.category || item.subcategory || '',
      defaultPrice: pickLatestPrice(item.pricing),
      brand: item.brand || '',
      isFavorite: Array.isArray(item.tags) ? item.tags.includes('staple') : false,
      lastUpdated: item?.pricing?.latest?.date_verified || item.lastUpdated || new Date().toISOString(),
      priceHistory: Array.isArray(item?.pricing?.history) ? item.pricing.history.filter((entry) => Number.isFinite(Number(entry?.price))).map((entry) => ({ price: Number(entry.price), date: entry.date_verified || todayIso(), source: entry.basis || 'seed', storeId: inferStoreId(item.storeId || item.storeKey || 'costco') })) : [],
      sourceMeta: {
        brand: item.brand || null,
        subcategory: item.subcategory || null,
        organic: item.organic ?? null,
        tags: Array.isArray(item.tags) ? item.tags : [],
        notes: item.notes || '',
      },
    }));
  }

  return normalizeSavedCatalogItems(FALLBACK_CATALOG);
}

function bindEvents() {
  document.addEventListener('click', (event) => {
    const viewBtn = event.target.closest('[data-view-target]');
    if (viewBtn) {
      setActiveView(viewBtn.dataset.viewTarget);
      return;
    }

    if (event.target.closest('#openSettingsBtn') || event.target.closest('#openSettingsBtnTop')) {
      openSettings();
      return;
    }

    if (event.target.closest('#catalogStoreModeBtn')) {
      state.ui.showAllStoresCatalog = !state.ui.showAllStoresCatalog;
      saveState();
      renderCatalogView();
      return;
    }

    if (event.target.closest('#saveTripTemplateBtn')) {
      saveCurrentTripTemplate();
      return;
    }

    if (event.target.closest('[data-load-trip-template]')) {
      loadTripTemplate(event.target.closest('[data-load-trip-template]').dataset.loadTripTemplate);
      return;
    }

    if (event.target.closest('[data-delete-trip-template]')) {
      deleteTripTemplate(event.target.closest('[data-delete-trip-template]').dataset.deleteTripTemplate);
      return;
    }

    if (event.target.closest('[data-open-editor="new-trip"]') || event.target.closest('#openAddItemBtn') || event.target.closest('#stickyAddItemBtn')) {
      openEditor('trip');
      return;
    }

    if (event.target.closest('[data-open-editor="new-catalog"]')) {
      openEditor('catalog');
      return;
    }

    const tripOpenBtn = event.target.closest('.js-open-trip');
    if (tripOpenBtn) {
      const item = state.tripItems.find((entry) => entry.id === tripOpenBtn.dataset.itemId);
      state.ui.selectedTripItemId = item?.id || null;
      openEditor('trip', item);
      renderTripView();
      return;
    }

    const editCatalogBtn = event.target.closest('[data-edit-catalog]');
    if (editCatalogBtn) {
      const item = state.catalogItems.find((entry) => entry.id === editCatalogBtn.dataset.editCatalog);
      openEditor('catalog', item);
      return;
    }

    const addCatalogBtn = event.target.closest('[data-add-catalog-to-trip]');
    if (addCatalogBtn) {
      addCatalogItemToTrip(addCatalogBtn.dataset.addCatalogToTrip);
      return;
    }

    const duplicateBtn = event.target.closest('[data-duplicate-trip]');
    if (duplicateBtn) {
      duplicateTripItem(duplicateBtn.dataset.duplicateTrip);
      return;
    }

    const categoryChip = event.target.closest('[data-category-chip]');
    if (categoryChip) {
      els.catalogCategoryFilter.value = categoryChip.dataset.categoryChip;
      renderCatalogView();
      return;
    }

    const stepBtn = event.target.closest('[data-step-qty]');
    if (stepBtn) {
      const item = state.tripItems.find((entry) => entry.id === stepBtn.dataset.itemId);
      if (!item) return;
      item.qty = Math.max(1, number(item.qty, 1) + number(stepBtn.dataset.stepQty, 0));
      saveState();
      renderTripView();
      return;
    }
  });

  document.addEventListener('input', (event) => {
    const inlinePrice = event.target.closest('[data-inline-price]');
    if (inlinePrice) {
      const item = state.tripItems.find((entry) => entry.id === inlinePrice.dataset.inlinePrice);
      if (!item) return;
      item.price = Math.max(0, number(inlinePrice.value, 0));
      saveState();
      renderTripView();
      return;
    }

    const importField = event.target.closest('[data-import-field]');
    if (importField) {
      const item = state.importItems.find((entry) => entry.id === importField.dataset.importId);
      if (!item) return;
      const map = { name: 'correctedName', code: 'correctedCode', price: 'correctedPrice' };
      item[map[importField.dataset.importField]] = importField.dataset.importField === 'price'
        ? number(importField.value, 0)
        : importField.value;
      saveState();
      return;
    }

    const importToggle = event.target.closest('[data-import-toggle]');
    if (importToggle) {
      const item = state.importItems.find((entry) => entry.id === importToggle.dataset.importId);
      if (!item) return;
      item[importToggle.dataset.importToggle === 'catalog' ? 'addToCatalog' : 'addToList'] = importToggle.checked;
      saveState();
      return;
    }
  });

  els.editorForm.addEventListener('submit', handleEditorSubmit);
  els.deleteEditorItemBtn.addEventListener('click', deleteEditorItem);
  els.closeEditorBtn.addEventListener('click', closeEditor);
  els.closeSettingsBtn.addEventListener('click', closeSettings);
  els.overlay.addEventListener('click', () => {
    closeEditor();
    closeSettings();
  });

  els.storeSelect.addEventListener('change', () => {
    state.ui.currentStore = els.storeSelect.value;
    saveState();
    renderAll();
  });

  els.catalogSearch.addEventListener('input', renderCatalogView);
  els.catalogCategoryFilter.addEventListener('change', renderCatalogView);

  els.parseReceiptBtn.addEventListener('click', () => {
    const text = els.receiptText.value.trim();
    if (!text) {
      toast('Paste receipt text first');
      return;
    }
    state.importItems = parseReceiptText(text);
    saveState();
    renderImportView();
    toast(state.importItems.length ? `Parsed ${state.importItems.length} items` : 'No receipt lines matched');
  });

  els.clearImportBtn.addEventListener('click', () => {
    state.importItems = [];
    els.receiptText.value = '';
    els.receiptImageInput.value = '';
    els.receiptImageNote.textContent = 'Image upload is saved only for this review step. Static GitHub Pages cannot do reliable OCR by magic. Paste text from your phone’s image copy feature for best results.';
    saveState();
    renderImportView();
  });

  els.receiptImageInput.addEventListener('change', () => {
    const file = els.receiptImageInput.files?.[0];
    els.receiptImageNote.textContent = file
      ? `Attached: ${file.name}. For this static MVP, use your phone or computer to copy text from the image, then paste it below for parsing.`
      : 'Image upload is saved only for this review step. Static GitHub Pages cannot do reliable OCR by magic. Paste text from your phone’s image copy feature for best results.';
  });

  els.confirmImportBtn.addEventListener('click', confirmImport);
  els.printBtn.addEventListener('click', handlePrint);
  els.exportListBtn.addEventListener('click', exportCsv);
  els.clearTripBtn.addEventListener('click', () => {
    if (!state.tripItems.length) return;
    if (!window.confirm('Clear the current grocery trip?')) return;
    state.tripItems = [];
    state.ui.selectedTripItemId = null;
    saveState();
    renderTripView();
  });
  els.saveSelectedTripToCatalogBtn.addEventListener('click', saveSelectedTripItemToCatalog);

  els.saveSettingsBtn.addEventListener('click', () => {
    state.settings.defaultStore = els.settingsDefaultStore.value;
    state.settings.theme = els.settingsTheme.value;
    state.settings.taxRateOverride = els.settingsTaxOverride.value === '' ? null : number(els.settingsTaxOverride.value, 0);
    state.settings.budgetTarget = els.settingsBudgetTarget && els.settingsBudgetTarget.value !== '' ? number(els.settingsBudgetTarget.value, 0) : null;
    if (!state.ui.currentStore) state.ui.currentStore = state.settings.defaultStore;
    saveState();
    renderAll();
    closeSettings();
    toast('Settings saved');
  });

  els.exportBackupBtn.addEventListener('click', exportBackup);
  els.importBackupInput.addEventListener('change', () => {
    const file = els.importBackupInput.files?.[0];
    if (file) importBackup(file);
    els.importBackupInput.value = '';
  });
  els.clearAllDataBtn.addEventListener('click', clearAllData);

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      if (state.ui.editorOpen) closeEditor();
      if (state.ui.settingsOpen) closeSettings();
    }
  });
}

function cacheElements() {
  Object.assign(els, {
    storeSelect: document.getElementById('storeSelect'),
    subtotalValue: document.getElementById('subtotalValue'),
    taxValue: document.getElementById('taxValue'),
    totalValue: document.getElementById('totalValue'),
    stickyTotalValue: document.getElementById('stickyTotalValue'),
    budgetStatus: document.getElementById('budgetStatus'),
    saveTripTemplateBtn: document.getElementById('saveTripTemplateBtn'),
    savedTripList: document.getElementById('savedTripList'),
    listEmptyState: document.getElementById('listEmptyState'),
    tripTableWrap: document.getElementById('tripTableWrap'),
    tripTableBody: document.getElementById('tripTableBody'),
    tripCardList: document.getElementById('tripCardList'),
    catalogSearch: document.getElementById('catalogSearch'),
    catalogStoreModeBtn: document.getElementById('catalogStoreModeBtn'),
    catalogCategoryFilter: document.getElementById('catalogCategoryFilter'),
    catalogCategoryChips: document.getElementById('catalogCategoryChips'),
    catalogEmptyState: document.getElementById('catalogEmptyState'),
    catalogTableBody: document.getElementById('catalogTableBody'),
    catalogCardList: document.getElementById('catalogCardList'),
    receiptImageInput: document.getElementById('receiptImageInput'),
    receiptImageNote: document.getElementById('receiptImageNote'),
    receiptText: document.getElementById('receiptText'),
    parseReceiptBtn: document.getElementById('parseReceiptBtn'),
    clearImportBtn: document.getElementById('clearImportBtn'),
    importEmptyState: document.getElementById('importEmptyState'),
    importReviewWrap: document.getElementById('importReviewWrap'),
    importReviewList: document.getElementById('importReviewList'),
    confirmImportBtn: document.getElementById('confirmImportBtn'),
    editorPanel: document.getElementById('editorPanel'),
    closeEditorBtn: document.getElementById('closeEditorBtn'),
    editorForm: document.getElementById('editorForm'),
    editorModeLabel: document.getElementById('editorModeLabel'),
    editorTitle: document.getElementById('editorTitle'),
    editorEntityType: document.getElementById('editorEntityType'),
    editorItemId: document.getElementById('editorItemId'),
    editorName: document.getElementById('editorName'),
    editorCode: document.getElementById('editorCode'),
    editorCategory: document.getElementById('editorCategory'),
    editorQtyField: document.getElementById('editorQtyField'),
    editorQty: document.getElementById('editorQty'),
    editorPrice: document.getElementById('editorPrice'),
    editorFavoriteField: document.getElementById('editorFavoriteField'),
    editorFavorite: document.getElementById('editorFavorite'),
    deleteEditorItemBtn: document.getElementById('deleteEditorItemBtn'),
    settingsModal: document.getElementById('settingsModal'),
    closeSettingsBtn: document.getElementById('closeSettingsBtn'),
    settingsDefaultStore: document.getElementById('settingsDefaultStore'),
    settingsTaxOverride: document.getElementById('settingsTaxOverride'),
    settingsTheme: document.getElementById('settingsTheme'),
    settingsBudgetTarget: document.getElementById('settingsBudgetTarget'),
    saveSettingsBtn: document.getElementById('saveSettingsBtn'),
    exportBackupBtn: document.getElementById('exportBackupBtn'),
    importBackupInput: document.getElementById('importBackupInput'),
    clearAllDataBtn: document.getElementById('clearAllDataBtn'),
    overlay: document.getElementById('overlay'),
    printBtn: document.getElementById('printBtn'),
    printMeta: document.getElementById('printMeta'),
    printChecklist: document.getElementById('printChecklist'),
    printSubtotal: document.getElementById('printSubtotal'),
    printTax: document.getElementById('printTax'),
    printTotal: document.getElementById('printTotal'),
    printNote: document.getElementById('printNote'),
    exportListBtn: document.getElementById('exportListBtn'),
    clearTripBtn: document.getElementById('clearTripBtn'),
    saveSelectedTripToCatalogBtn: document.getElementById('saveSelectedTripToCatalogBtn'),
    toastArea: document.getElementById('toastArea'),
  });
}

async function bootstrap() {
  cacheElements();
  const [stores, rawCatalog] = await Promise.all([
    loadJson('./data/stores.json', FALLBACK_STORES),
    loadJson('./data/starter-catalog.json', FALLBACK_CATALOG),
  ]);
  state.stores = Array.isArray(stores) ? stores : FALLBACK_STORES;
  state.catalogItems = normalizeStarterCatalog(rawCatalog);
  if (!state.catalogItems.length) state.catalogItems = normalizeSavedCatalogItems(FALLBACK_CATALOG);
  const extraSeedItems = normalizeSavedCatalogItems(FALLBACK_STORE_CATALOG);
  for (const seedItem of extraSeedItems) {
    if (!findCatalogMatchByStore({ name: seedItem.name, code: seedItem.code, storeId: seedItem.storeId })) state.catalogItems.push(seedItem);
  }
  seedData.stores = Array.isArray(state.stores) ? [...state.stores] : [...FALLBACK_STORES];
  seedData.catalogItems = normalizeSavedCatalogItems(state.catalogItems);
  loadSavedState();
  state.ui.currentStore = state.ui.currentStore || state.settings.defaultStore || state.stores[0]?.id || 'costco';
  bindEvents();
  renderAll();
}

bootstrap();
