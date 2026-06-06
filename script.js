import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { STRINGS } from './strings.js';

// Read endpoints from import.meta.env or fallback directly to user keys
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://dpieotagixxxxsdwwxud.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_hkLzRA2IBEpTKNNACgU9Zw_lx5i7MPp';

const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Truck Record Management Service
 * Establishes hot connections with Supabase database.
 * Auto-detects table schemas and falls back safely to LocalStorage if missing.
 */
class TruckRecordService {
  constructor() {
    this.STORAGE_RECORDS_KEY = 'trm_delivery_records';
    this.STORAGE_OPTIONS_KEY = 'trm_dropdown_options';
    this.mode = 'checking'; // 'supabase' | 'localStorage' | 'checking'

    // Local fallback lookup values
    this.defaultOptions = {
      truckNumbers: ['TRK-101', 'TRK-202', 'TRK-303', 'TRK-404', 'TRK-505'],
      owners: ['Apex Logistics', 'Horizon Transport', 'Swift Haulers', 'BlueSky Cargo', 'Standard Delivery'],
      warehouses: ['WH-Alpha', 'WH-Beta', 'WH-Gamma', 'WH-Delta']
    };

    // Local fallback sample delivery records
    this.defaultRecords = [
      { id: 1, date: '2026-01-20', truckNumber: 'TRK-101', owner: 'Apex Logistics', warehouseNumber: 'WH-Alpha' },
      { id: 2, date: '2026-02-05', truckNumber: 'TRK-202', owner: 'Horizon Transport', warehouseNumber: 'WH-Beta' },
      { id: 3, date: '2026-03-12', truckNumber: 'TRK-101', owner: 'Apex Logistics', warehouseNumber: 'WH-Gamma' },
      { id: 4, date: '2026-05-18', truckNumber: 'TRK-303', owner: 'Swift Haulers', warehouseNumber: 'WH-Alpha' },
      { id: 5, date: '2026-06-01', truckNumber: 'TRK-404', owner: 'BlueSky Cargo', warehouseNumber: 'WH-Delta' }
    ];

    this._initLocalStorage();
  }

  // Prep local backups
  _initLocalStorage() {
    if (!localStorage.getItem(this.STORAGE_OPTIONS_KEY)) {
      localStorage.setItem(this.STORAGE_OPTIONS_KEY, JSON.stringify(this.defaultOptions));
    }
    if (!localStorage.getItem(this.STORAGE_RECORDS_KEY)) {
      localStorage.setItem(this.STORAGE_RECORDS_KEY, JSON.stringify(this.defaultRecords));
    }
  }

  // Network pacing
  _delay(ms = 60) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Safe Test Handshake with Supabase.
   * Assures schema contains "truck_options" and "truck_records"
   */
  async initConnection() {
    try {
      // 1. Check options table schema in Supabase
      const { data: optData, error: optError } = await supabaseClient
        .from('truck_options')
        .select('*')
        .limit(1);

      if (optError) {
        if (optError.code === '42P01' || (optError.message && optError.message.includes('relation'))) {
          throw new Error('tables_missing');
        }
        throw optError;
      }

      // 2. Check records table schema in Supabase
      const { data: recData, error: recError } = await supabaseClient
        .from('truck_records')
        .select('*')
        .limit(1);

      if (recError) {
        if (recError.code === '42P01' || (recError.message && recError.message.includes('relation'))) {
          throw new Error('tables_missing');
        }
        throw recError;
      }

      // Tables verified!
      this.mode = 'supabase';
      this.updateStatusBadge('supabase');
      return true;
    } catch (err) {
      if (err.message === 'tables_missing') {
        console.warn('Connected to Supabase, but db migrations have not been installed yet.');
        this.mode = 'localStorage';
        this.updateStatusBadge('fallback_missing');
        toggleSupabaseBanner(true);
      } else {
        console.error('Failed connection to Supabase endpoint, fallback activated:', err);
        this.mode = 'localStorage';
        this.updateStatusBadge('fallback_offline');
      }
      return false;
    }
  }

  // Dynamically update upper status badge with modern styles
  updateStatusBadge(status) {
    const badge = document.getElementById('db-status-badge');
    const indicator = document.getElementById('db-status-indicator');
    const textEl = document.getElementById('db-status-text');
    const helpBtn = document.getElementById('supabase-setup-help-btn');

    if (!badge || !indicator || !textEl) return;

    if (status === 'supabase') {
      badge.className = 'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-950 text-emerald-300 border border-emerald-800';
      indicator.className = 'w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse';
      textEl.textContent = t('dbConnected');
      if (helpBtn) helpBtn.classList.add('hidden');
    } else if (status === 'fallback_missing') {
      badge.className = 'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-950 text-amber-300 border border-amber-800';
      indicator.className = 'w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse';
      textEl.textContent = t('dbFallbackLocal');
      if (helpBtn) helpBtn.classList.remove('hidden');
    } else {
      badge.className = 'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700/60';
      indicator.className = 'w-1.5 h-1.5 rounded-full bg-slate-500';
      textEl.textContent = t('dbFallbackOffline');
      if (helpBtn) helpBtn.classList.remove('hidden');
    }
  }

  /* --- RECORDS (CRUD operations) --- */

  // Retrieve all records
  async getRecords() {
    await this._delay();
    if (this.mode === 'supabase') {
      const { data, error } = await supabaseClient
        .from('truck_records')
        .select('*')
        .order('id', { ascending: true });

      if (error) {
        console.error('getRecords from Supabase error:', error);
        throw error;
      }

      // Convert snake_case db attributes to camelCase for script operations
      return data.map(record => ({
        id: record.id,
        date: record.date,
        truckNumber: record.truck_number,
        owner: record.owner,
        warehouseNumber: record.warehouse_number
      }));
    } else {
      const data = localStorage.getItem(this.STORAGE_RECORDS_KEY);
      return data ? JSON.parse(data) : [];
    }
  }

  // Add new record
  async createRecord(recordData) {
    await this._delay();
    if (this.mode === 'supabase') {
      const { data, error } = await supabaseClient
        .from('truck_records')
        .insert([{
          date: recordData.date,
          truck_number: recordData.truckNumber,
          owner: recordData.owner,
          warehouse_number: recordData.warehouseNumber
        }])
        .select()
        .single();

      if (error) {
        console.error('createRecord on Supabase failed:', error);
        throw error;
      }

      return {
        id: data.id,
        date: data.date,
        truckNumber: data.truck_number,
        owner: data.owner,
        warehouseNumber: data.warehouse_number
      };
    } else {
      const records = await this.getRecords();
      const nextId = records.length > 0 ? Math.max(...records.map(r => r.id)) + 1 : 1;
      
      const newRecord = {
        id: nextId,
        date: recordData.date,
        truckNumber: recordData.truckNumber,
        owner: recordData.owner,
        warehouseNumber: recordData.warehouseNumber
      };
      
      records.push(newRecord);
      localStorage.setItem(this.STORAGE_RECORDS_KEY, JSON.stringify(records));
      return newRecord;
    }
  }

  // Update existing record
  async updateRecord(id, recordData) {
    await this._delay();
    if (this.mode === 'supabase') {
      const { data, error } = await supabaseClient
        .from('truck_records')
        .update({
          date: recordData.date,
          truck_number: recordData.truckNumber,
          owner: recordData.owner,
          warehouse_number: recordData.warehouseNumber
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('updateRecord on Supabase failed:', error);
        throw error;
      }

      return {
        id: data.id,
        date: data.date,
        truckNumber: data.truck_number,
        owner: data.owner,
        warehouseNumber: data.warehouse_number
      };
    } else {
      const records = await this.getRecords();
      const index = records.findIndex(r => r.id === parseInt(id, 10));
      
      if (index === -1) {
        throw new Error(`Record with ID ${id} not found.`);
      }

      records[index] = {
        ...records[index],
        date: recordData.date,
        truckNumber: recordData.truckNumber,
        owner: recordData.owner,
        warehouseNumber: recordData.warehouseNumber
      };

      localStorage.setItem(this.STORAGE_RECORDS_KEY, JSON.stringify(records));
      return records[index];
    }
  }

  // Delete a record
  async deleteRecord(id) {
    await this._delay();
    if (this.mode === 'supabase') {
      const { error } = await supabaseClient
        .from('truck_records')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('deleteRecord on Supabase failed:', error);
        throw error;
      }
      return true;
    } else {
      const records = await this.getRecords();
      const filteredRecords = records.filter(r => r.id !== parseInt(id, 10));
      localStorage.setItem(this.STORAGE_RECORDS_KEY, JSON.stringify(filteredRecords));
      return true;
    }
  }

  /* --- DROP DOWN OPTIONS (Lookup management) --- */

  // Retrieve dropdown lookup lists
  async getDropdownOptions() {
    await this._delay();
    if (this.mode === 'supabase') {
      const { data, error } = await supabaseClient
        .from('truck_options')
        .select('*');

      if (error) {
        console.error('getDropdownOptions from Supabase failed:', error);
        throw error;
      }

      const options = {
        truckNumbers: [],
        owners: [],
        warehouses: []
      };

      data.forEach(item => {
        if (options[item.type]) {
          options[item.type].push(item.value);
        }
      });

      options.truckNumbers.sort((a, b) => a.localeCompare(b));
      options.owners.sort((a, b) => a.localeCompare(b));
      options.warehouses.sort((a, b) => a.localeCompare(b));

      return options;
    } else {
      const data = localStorage.getItem(this.STORAGE_OPTIONS_KEY);
      return data ? JSON.parse(data) : this.defaultOptions;
    }
  }

  // Add an option to a specific lookup category
  async addDropdownOption(type, value) {
    await this._delay();
    if (!value || value.trim() === '') return false;
    const trimmedVal = value.trim();

    if (this.mode === 'supabase') {
      // Direct Select Check to prevent constraint collisions
      const { data: hasDuplicate, error: checkError } = await supabaseClient
        .from('truck_options')
        .select('id')
        .eq('type', type)
        .eq('value', trimmedVal);

      if (checkError) throw checkError;

      if (hasDuplicate && hasDuplicate.length > 0) {
        return { success: false, msg: 'Option already exists' };
      }

      const { error } = await supabaseClient
        .from('truck_options')
        .insert([{ type, value: trimmedVal }]);

      if (error) {
        console.error('addDropdownOption on Supabase failed:', error);
        throw error;
      }

      const latestOptions = await this.getDropdownOptions();
      return { success: true, options: latestOptions[type] };
    } else {
      const options = await this.getDropdownOptions();
      if (!options[type]) {
        options[type] = [];
      }

      if (options[type].includes(trimmedVal)) {
        return { success: false, msg: 'Option already exists' };
      }

      options[type].push(trimmedVal);
      options[type].sort((a, b) => a.localeCompare(b));
      
      localStorage.setItem(this.STORAGE_OPTIONS_KEY, JSON.stringify(options));
      return { success: true, options: options[type] };
    }
  }

  // Remove an option from a specific lookup category
  async removeDropdownOption(type, value) {
    await this._delay();
    if (this.mode === 'supabase') {
      const { error } = await supabaseClient
        .from('truck_options')
        .delete()
        .eq('type', type)
        .eq('value', value);

      if (error) {
        console.error('removeDropdownOption from Supabase failed:', error);
        throw error;
      }
      return true;
    } else {
      const options = await this.getDropdownOptions();
      if (options[type]) {
        options[type] = options[type].filter(item => item !== value);
        localStorage.setItem(this.STORAGE_OPTIONS_KEY, JSON.stringify(options));
        return true;
      }
      return false;
    }
  }
}

// Instantiate database service
const db = new TruckRecordService();

// State containers
let allRecords = [];
let dropdownOptions = { truckNumbers: [], owners: [], warehouses: [] };
let editingRecordId = null;
let currentLang = 'en';

/**
 * Fetch localized text string helper
 */
function t(key, variables = {}, fallback = '') {
  let str = STRINGS[currentLang]?.[key];
  if (str === undefined) return fallback || key;
  if (variables) {
    Object.keys(variables).forEach(k => {
      str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), variables[k]);
    });
  }
  return str;
}

/**
 * Iterates through all nodes with data-i18n, data-i18n-placeholder, data-i18n-html
 * and translates their textual contents dynamically.
 */
function translatePage(lang = 'en') {
  currentLang = lang;
  const dictionary = STRINGS[lang] || STRINGS.en;
  if (!dictionary) return;

  // 1. Text elements translations
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (dictionary[key] !== undefined) {
      el.textContent = dictionary[key];
    }
  });

  // 2. HTML elements translations
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    const key = el.getAttribute('data-i18n-html');
    if (dictionary[key] !== undefined) {
      el.innerHTML = dictionary[key];
    }
  });

  // 3. Placeholders translations
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (dictionary[key] !== undefined) {
      el.placeholder = dictionary[key];
    }
  });

  // 4. Anchor title / helper label attributes
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.getAttribute('data-i18n-title');
    if (dictionary[key] !== undefined) {
      el.title = dictionary[key];
    }
  });
}

// Real-time filter tracking values
const filters = {
  no: '',
  startDate: '',
  endDate: '',
  truckNumber: '',
  owner: '',
  warehouseNumber: ''
};

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Parses YYYY-MM-DD back into elegant 'DD-MMM-YYYY' text strings
 */
function displayFriendlyDate(dateStr) {
  if (!dateStr) return 'N/A';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parts[0];
    const monthIdx = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    if (!isNaN(monthIdx) && monthIdx >= 0 && monthIdx < 12) {
      const paddedDay = day.toString().padStart(2, '0');
      const monthLabel = MONTH_NAMES[monthIdx];
      return `${paddedDay}-${monthLabel}-${year}`;
    }
  }
  return dateStr;
}

function parseDateForCompare(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

// UI element mappings
const DOM = {
  recordForm: document.getElementById('record-form'),
  formTitle: document.getElementById('form-title'),
  recordDate: document.getElementById('record-date'),
  truckSelect: document.getElementById('record-truck-select'),
  ownerSelect: document.getElementById('record-owner-select'),
  whSelect: document.getElementById('record-wh-select'),
  submitBtn: document.getElementById('submit-record-btn'),
  cancelEditBtn: document.getElementById('cancel-edit-btn'),

  // Filters inputs
  filterNoInput: document.getElementById('filter-no'),
  filterStartDateInput: document.getElementById('filter-start-date'),
  filterEndDateInput: document.getElementById('filter-end-date'),
  filterTruckSelect: document.getElementById('filter-truck'),
  filterOwnerSelect: document.getElementById('filter-owner'),
  filterWhSelect: document.getElementById('filter-wh'),
  clearFiltersBtn: document.getElementById('clear-filters-btn'),

  // Table structures
  tableBody: document.getElementById('table-records-body'),
  emptyState: document.getElementById('empty-state-row'),
  loadingIndicator: document.getElementById('table-loading-overlay'),

  // Lookup sub-forms inputs
  newTruckInput: document.getElementById('new-truck-input'),
  addTruckBtn: document.getElementById('add-truck-btn'),
  newOwnerInput: document.getElementById('new-owner-input'),
  addOwnerBtn: document.getElementById('add-owner-btn'),
  newWhInput: document.getElementById('new-wh-input'),
  addWhBtn: document.getElementById('add-wh-btn'),

  // Options badge outputs
  truckBadgesContainer: document.getElementById('truck-badges-list'),
  ownerBadgesContainer: document.getElementById('owner-badges-list'),
  whBadgesContainer: document.getElementById('wh-badges-list'),

  // Summary widgets
  statTotalRecords: document.getElementById('stat-total-records'),
  statFilteredRecords: document.getElementById('stat-filtered-records'),
  statUniqueTrucks: document.getElementById('stat-unique-trucks'),

  // Toast container
  toastContainer: document.getElementById('toast-container')
};

// Toggle banner visibility
function toggleSupabaseBanner(show) {
  const banner = document.getElementById('supabase-alert-banner');
  if (banner) {
    if (show) {
      banner.classList.remove('hidden');
      banner.classList.add('flex');
    } else {
      banner.classList.add('hidden');
      banner.classList.remove('flex');
    }
  }
}

// Feedback alerts
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = 'toast-notification flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border pointer-events-auto transition-all duration-300';

  if (type === 'success') {
    toast.classList.add('bg-emerald-50', 'text-emerald-800', 'border-emerald-200');
    toast.innerHTML = `
      <svg class="w-5 h-5 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path>
      </svg>
      <span class="text-xs font-semibold">${message}</span>
    `;
  } else if (type === 'error') {
    toast.classList.add('bg-rose-50', 'text-rose-800', 'border-rose-200');
    toast.innerHTML = `
      <svg class="w-5 h-5 text-rose-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path>
      </svg>
      <span class="text-xs font-semibold">${message}</span>
    `;
  } else {
    toast.classList.add('bg-indigo-50', 'text-indigo-800', 'border-indigo-200');
    toast.innerHTML = `
      <svg class="w-5 h-5 text-indigo-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>
      <span class="text-xs font-semibold">${message}</span>
    `;
  }

  DOM.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('hide');
    toast.addEventListener('animationend', () => {
      toast.remove();
    });
  }, 2600);
}

// Async Loading view overlays
function toggleLoading(show) {
  if (show) {
    DOM.loadingIndicator.classList.remove('opacity-0', 'pointer-events-none');
    DOM.loadingIndicator.classList.add('opacity-40');
  } else {
    DOM.loadingIndicator.classList.add('opacity-0', 'pointer-events-none');
    DOM.loadingIndicator.classList.remove('opacity-40');
  }
}

// Safe modal click alerts helper
function customConfirm(title, message) {
  const modal = document.getElementById('confirm-modal');
  const titleEl = document.getElementById('confirm-modal-title');
  const messageEl = document.getElementById('confirm-modal-message');
  const okBtn = document.getElementById('confirm-modal-ok');
  const cancelBtn = document.getElementById('confirm-modal-cancel');
  
  titleEl.textContent = title || t('confirmDefaultTitle');
  messageEl.textContent = message || t('confirmDefaultMsg');
  
  modal.classList.remove('hidden');
  
  return new Promise((resolve) => {
    const cleanup = (value) => {
      modal.classList.add('hidden');
      okBtn.removeEventListener('click', onOk);
      cancelBtn.removeEventListener('click', onCancel);
      resolve(value);
    };
    
    function onOk() { cleanup(true); }
    
    function onCancel() { cleanup(false); }
    
    okBtn.addEventListener('click', onOk);
    cancelBtn.addEventListener('click', onCancel);
  });
}

// Generate badges list and dropdown menu selects
function renderLookupOptions() {
  const selectedTruckFilter = DOM.filterTruckSelect ? DOM.filterTruckSelect.value : "";
  const selectedOwnerFilter = DOM.filterOwnerSelect ? DOM.filterOwnerSelect.value : "";
  const selectedWhFilter = DOM.filterWhSelect ? DOM.filterWhSelect.value : "";

  DOM.truckSelect.innerHTML = `<option value="" disabled selected data-i18n="placeholderSelectTruck">${t('placeholderSelectTruck')}</option>`;
  DOM.ownerSelect.innerHTML = `<option value="" disabled selected data-i18n="placeholderSelectOwner">${t('placeholderSelectOwner')}</option>`;
  DOM.whSelect.innerHTML = `<option value="" disabled selected data-i18n="placeholderSelectWarehouse">${t('placeholderSelectWarehouse')}</option>`;

  if (DOM.filterTruckSelect) DOM.filterTruckSelect.innerHTML = `<option value="" data-i18n="filterAllTrucks">${t('filterAllTrucks')}</option>`;
  if (DOM.filterOwnerSelect) DOM.filterOwnerSelect.innerHTML = `<option value="" data-i18n="filterAllOwners">${t('filterAllOwners')}</option>`;
  if (DOM.filterWhSelect) DOM.filterWhSelect.innerHTML = `<option value="" data-i18n="filterAllWarehouses">${t('filterAllWarehouses')}</option>`;

  DOM.truckBadgesContainer.innerHTML = '';
  DOM.ownerBadgesContainer.innerHTML = '';
  DOM.whBadgesContainer.innerHTML = '';

  dropdownOptions.truckNumbers.forEach(truck => {
    const opt = document.createElement('option');
    opt.value = truck;
    opt.textContent = truck;
    DOM.truckSelect.appendChild(opt);

    if (DOM.filterTruckSelect) {
      const filterOpt = document.createElement('option');
      filterOpt.value = truck;
      filterOpt.textContent = truck;
      DOM.filterTruckSelect.appendChild(filterOpt);
    }

    const badge = createOptionBadge('truckNumbers', truck);
    DOM.truckBadgesContainer.appendChild(badge);
  });

  dropdownOptions.owners.forEach(owner => {
    const opt = document.createElement('option');
    opt.value = owner;
    opt.textContent = owner;
    DOM.ownerSelect.appendChild(opt);

    if (DOM.filterOwnerSelect) {
      const filterOpt = document.createElement('option');
      filterOpt.value = owner;
      filterOpt.textContent = owner;
      DOM.filterOwnerSelect.appendChild(filterOpt);
    }

    const badge = createOptionBadge('owners', owner);
    DOM.ownerBadgesContainer.appendChild(badge);
  });

  dropdownOptions.warehouses.forEach(wh => {
    const opt = document.createElement('option');
    opt.value = wh;
    opt.textContent = wh;
    DOM.whSelect.appendChild(opt);

    if (DOM.filterWhSelect) {
      const filterOpt = document.createElement('option');
      filterOpt.value = wh;
      filterOpt.textContent = wh;
      DOM.filterWhSelect.appendChild(filterOpt);
    }

    const badge = createOptionBadge('warehouses', wh);
    DOM.whBadgesContainer.appendChild(badge);
  });

  // Restore filter values if they still exist
  if (DOM.filterTruckSelect) {
    DOM.filterTruckSelect.value = dropdownOptions.truckNumbers.includes(selectedTruckFilter) ? selectedTruckFilter : "";
  }
  if (DOM.filterOwnerSelect) {
    DOM.filterOwnerSelect.value = dropdownOptions.owners.includes(selectedOwnerFilter) ? selectedOwnerFilter : "";
  }
  if (DOM.filterWhSelect) {
    DOM.filterWhSelect.value = dropdownOptions.warehouses.includes(selectedWhFilter) ? selectedWhFilter : "";
  }
}

// Build delete badge controllers
function createOptionBadge(type, value) {
  const badge = document.createElement('span');
  badge.className = 'badge-option cursor-pointer';
  badge.title = t('deleteBadgeTooltip', {}, 'Click to delete this option');
  badge.innerHTML = `
    ${value}
    <svg class="w-3.5 h-3.5 hover:text-red-600 transition-colors pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path>
    </svg>
  `;
  badge.addEventListener('click', async () => {
    const confirmed = await customConfirm(
      t('confirmRemoveOptionTitle'),
      t('confirmRemoveOptionMsgFirst', { value })
    );
    if (confirmed) {
      toggleLoading(true);
      try {
        const deleted = await db.removeDropdownOption(type, value);
        if (deleted) {
          dropdownOptions[type] = dropdownOptions[type].filter(item => item !== value);
          renderLookupOptions();
          showToast(t('toastDeletedOption', { value }), 'info');
        }
      } catch (err) {
        showToast(t('toastErrorRemovingOption'), 'error');
      } finally {
        toggleLoading(false);
      }
    }
  });
  return badge;
}

// Update primary statistics markers in header
function updateStatistics(visibleRecords) {
  DOM.statTotalRecords.textContent = allRecords.length;
  DOM.statFilteredRecords.textContent = visibleRecords.length;
  
  const activeTruckNumbers = new Set(allRecords.map(r => r.truckNumber));
  DOM.statUniqueTrucks.textContent = activeTruckNumbers.size;
}

// Main Table Drawing Loops
function renderRecordsTable() {
  DOM.tableBody.innerHTML = '';
  let sequentialNo = 1;

  const filtered = allRecords.filter(record => {
    // 1. "No" Filter
    if (filters.no) {
      const matchNo = sequentialNo.toString();
      if (!matchNo.includes(filters.no)) {
        sequentialNo++;
        return false;
      }
    }

    // 2. Date limits
    const recordDateObj = parseDateForCompare(record.date);
    if (filters.startDate) {
      const startLimit = parseDateForCompare(filters.startDate);
      if (startLimit && (!recordDateObj || recordDateObj < startLimit)) {
        sequentialNo++;
        return false;
      }
    }
    if (filters.endDate) {
      const endLimit = parseDateForCompare(filters.endDate);
      if (endLimit && (!recordDateObj || recordDateObj > endLimit)) {
        sequentialNo++;
        return false;
      }
    }

    // 3. Truck Number
    if (filters.truckNumber) {
      const truckVal = (record.truckNumber || '').toLowerCase();
      if (!truckVal.includes(filters.truckNumber.toLowerCase())) {
        sequentialNo++;
        return false;
      }
    }

    // 4. Owner
    if (filters.owner) {
      const ownerVal = (record.owner || '').toLowerCase();
      if (!ownerVal.includes(filters.owner.toLowerCase())) {
        sequentialNo++;
        return false;
      }
    }

    // 5. Warehouse
    if (filters.warehouseNumber) {
      const whVal = (record.warehouseNumber || '').toLowerCase();
      if (!whVal.includes(filters.warehouseNumber.toLowerCase())) {
        sequentialNo++;
        return false;
      }
    }

    record.renderedNo = sequentialNo;
    sequentialNo++;
    return true;
  });

  if (filtered.length === 0) {
    DOM.emptyState.classList.remove('hidden');
    toggleLoading(false);
    updateStatistics([]);
    return;
  }

  DOM.emptyState.classList.add('hidden');

  filtered.forEach(record => {
    const tr = document.createElement('tr');
    tr.id = `row-${record.id}`;
    tr.className = 'border-b border-slate-100 hover:bg-slate-50/75 transition-colors';
    
    if (editingRecordId === record.id) {
      tr.classList.add('editing-row');
    }

    tr.innerHTML = `
      <td class="px-6 py-4.5 font-semibold text-slate-900 text-sm whitespace-nowrap text-center">${record.renderedNo}</td>
      <td class="px-6 py-4.5 text-slate-800 text-sm font-medium whitespace-nowrap">${displayFriendlyDate(record.date)}</td>
      <td class="px-6 py-4.5 text-slate-900 text-sm font-semibold whitespace-nowrap">
        <span class="inline-flex items-center px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs font-mono font-bold tracking-tight">
          ${record.truckNumber}
        </span>
      </td>
      <td class="px-6 py-4.5 text-slate-600 text-sm whitespace-nowrap">${record.owner}</td>
      <td class="px-6 py-4.5 text-slate-700 text-sm whitespace-nowrap">
        <span class="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200 text-xs font-mono font-medium">
          ${record.warehouseNumber}
        </span>
      </td>
      <td class="px-6 py-4.5 whitespace-nowrap text-right text-xs font-medium">
        <div class="inline-flex items-center gap-1.5">
          <button 
            type="button" 
            id="edit-record-btn-${record.id}"
            class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 border border-transparent hover:border-indigo-100 active:bg-indigo-100 transition-all cursor-pointer"
            title="Edit delivery"
          >
            <svg class="w-4 h-4 shrink-0 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
            </svg>
            ${t('operationsEdit')}
          </button>
          
          <button 
            type="button" 
            id="delete-record-btn-${record.id}"
            class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-rose-600 hover:text-rose-900 hover:bg-rose-50 border border-transparent hover:border-rose-100 active:bg-rose-100 transition-all cursor-pointer"
            title="Delete record"
          >
            <svg class="w-4 h-4 shrink-0 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
            ${t('operationsDelete')}
          </button>
        </div>
      </td>
    `;

    tr.querySelector(`#edit-record-btn-${record.id}`).addEventListener('click', () => initiateEditRecord(record));
    tr.querySelector(`#delete-record-btn-${record.id}`).addEventListener('click', () => triggerDeleteRecord(record));

    DOM.tableBody.appendChild(tr);
  });

  updateStatistics(filtered);
}

// Reset form elements
function resetUpperForm() {
  editingRecordId = null;
  DOM.recordForm.reset();
  
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  DOM.recordDate.value = `${yyyy}-${mm}-${dd}`;

  DOM.formTitle.textContent = t('formTitleAdd');
  DOM.submitBtn.innerHTML = `
    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"></path>
    </svg>
    <span id="submit-btn-text" data-i18n="btnAddRecord">${t('btnAddRecord')}</span>
  `;
  DOM.cancelEditBtn.classList.add('hidden');
  
  const editingRows = document.querySelectorAll('.editing-row');
  editingRows.forEach(row => row.classList.remove('editing-row'));
}

// Load a selected row details for updating
function initiateEditRecord(record) {
  editingRecordId = record.id;
  
  const editingRows = document.querySelectorAll('.editing-row');
  editingRows.forEach(row => row.classList.remove('editing-row'));
  
  const targetRow = document.getElementById(`row-${record.id}`);
  if (targetRow) targetRow.classList.add('editing-row');

  DOM.recordForm.scrollIntoView({ behavior: 'smooth', block: 'end' });

  DOM.recordDate.value = record.date;
  DOM.truckSelect.value = record.truckNumber;
  DOM.ownerSelect.value = record.owner;
  DOM.whSelect.value = record.warehouseNumber;

  DOM.formTitle.innerHTML = t('formTitleEditHtml', { no: record.renderedNo });
  DOM.submitBtn.innerHTML = `
    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path>
    </svg>
    <span id="submit-btn-text" data-i18n="btnSaveChanges">${t('btnSaveChanges')}</span>
  `;
  DOM.cancelEditBtn.classList.remove('hidden');

  showToast(t('toastRecordEditingState', { no: record.renderedNo }), 'info');
}

// Delete row handler
async function triggerDeleteRecord(record) {
  const confirmed = await customConfirm(
    t('confirmDeleteRecordTitle'),
    t('confirmDeleteRecordMsgFirst', { no: record.renderedNo, date: displayFriendlyDate(record.date) })
  );
  if (confirmed) {
    toggleLoading(true);
    try {
      const success = await db.deleteRecord(record.id);
      if (success) {
        showToast(t('toastRecordDeleteSuccess', { no: record.renderedNo }), 'info');
        if (editingRecordId === record.id) resetUpperForm();
        await reloadData();
      }
    } catch (err) {
      showToast(t('toastRecordDeleteError'), 'error');
    } finally {
      toggleLoading(false);
    }
  }
}

async function reloadData() {
  allRecords = await db.getRecords();
  renderRecordsTable();
}

function setupFiltersHandlers() {
  const triggerFilters = () => {
    filters.no = DOM.filterNoInput.value.trim();
    filters.startDate = DOM.filterStartDateInput.value;
    filters.endDate = DOM.filterEndDateInput.value;
    filters.truckNumber = DOM.filterTruckSelect ? DOM.filterTruckSelect.value : "";
    filters.owner = DOM.filterOwnerSelect ? DOM.filterOwnerSelect.value : "";
    filters.warehouseNumber = DOM.filterWhSelect ? DOM.filterWhSelect.value : "";
    
    renderRecordsTable();
  };

  DOM.filterNoInput.addEventListener('input', triggerFilters);
  DOM.filterStartDateInput.addEventListener('change', triggerFilters);
  DOM.filterEndDateInput.addEventListener('change', triggerFilters);
  if (DOM.filterTruckSelect) DOM.filterTruckSelect.addEventListener('change', triggerFilters);
  if (DOM.filterOwnerSelect) DOM.filterOwnerSelect.addEventListener('change', triggerFilters);
  if (DOM.filterWhSelect) DOM.filterWhSelect.addEventListener('change', triggerFilters);

  DOM.clearFiltersBtn.addEventListener('click', () => {
    DOM.filterNoInput.value = '';
    DOM.filterStartDateInput.value = '';
    DOM.filterEndDateInput.value = '';
    if (DOM.filterTruckSelect) DOM.filterTruckSelect.value = '';
    if (DOM.filterOwnerSelect) DOM.filterOwnerSelect.value = '';
    if (DOM.filterWhSelect) DOM.filterWhSelect.value = '';

    filters.no = '';
    filters.startDate = '';
    filters.endDate = '';
    filters.truckNumber = '';
    filters.owner = '';
    filters.warehouseNumber = '';

    renderRecordsTable();
    showToast(t('toastFiltersCleared'), 'info');
  });
}

// Modal Toggle utilities
function showSetupModal(show) {
  const modal = document.getElementById('supabase-setup-modal');
  if (modal) {
    if (show) {
      modal.classList.remove('hidden');
    } else {
      modal.classList.add('hidden');
    }
  }
}

// Global Controller Entry
document.addEventListener('DOMContentLoaded', async () => {
  toggleLoading(true);
  translatePage('en');
  try {
    // 1. Kick off connection handshake
    await db.initConnection();

    // 2. Load Lookups & Records
    dropdownOptions = await db.getDropdownOptions();
    allRecords = await db.getRecords();

    // 3. Mount lists to selectors
    renderLookupOptions();

    // 4. Default upper date state
    resetUpperForm();

    // 5. Draw table row templates
    renderRecordsTable();

    // 6. Bind column interactive filter handlers
    setupFiltersHandlers();

    // 7. Core records submission handler
    DOM.recordForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const recordData = {
        date: DOM.recordDate.value,
        truckNumber: DOM.truckSelect.value,
        owner: DOM.ownerSelect.value,
        warehouseNumber: DOM.whSelect.value
      };

      if (!recordData.date || !recordData.truckNumber || !recordData.owner || !recordData.warehouseNumber) {
        showToast(t('toastFillAllValues'), 'error');
        return;
      }

      toggleLoading(true);
      try {
        if (editingRecordId) {
          await db.updateRecord(editingRecordId, recordData);
          showToast(t('toastRecordUpdated'));
          resetUpperForm();
        } else {
          await db.createRecord(recordData);
          showToast(t('toastRecordCreated'));
          resetUpperForm();
        }
        await reloadData();
      } catch (err) {
        showToast(err.message || t('toastRecordSaveError'), 'error');
      } finally {
        toggleLoading(false);
      }
    });

    DOM.cancelEditBtn.addEventListener('click', () => {
      resetUpperForm();
      showToast(t('toastEditFieldCancelled'), 'info');
    });

    /* --- ADD DROPDOWN VALUE EVENT LISTENERS --- */

    DOM.addTruckBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      const val = DOM.newTruckInput.value.trim();
      if (!val) {
        showToast(t('toastInputValidTruck'), 'error');
        return;
      }
      toggleLoading(true);
      try {
        const res = await db.addDropdownOption('truckNumbers', val);
        if (res.success) {
          dropdownOptions.truckNumbers = res.options;
          renderLookupOptions();
          DOM.newTruckInput.value = '';
          showToast(t('toastTruckAdded', { value: val }));
        } else {
          showToast(res.msg || t('toastAddOptionError'), 'error');
        }
      } catch (err) {
        showToast(t('toastOperationFailed'), 'error');
      } finally {
        toggleLoading(false);
      }
    });

    DOM.addOwnerBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      const val = DOM.newOwnerInput.value.trim();
      if (!val) {
        showToast(t('toastInputOwnerName'), 'error');
        return;
      }
      toggleLoading(true);
      try {
        const res = await db.addDropdownOption('owners', val);
        if (res.success) {
          dropdownOptions.owners = res.options;
          renderLookupOptions();
          DOM.newOwnerInput.value = '';
          showToast(t('toastOwnerAdded', { value: val }));
        } else {
          showToast(res.msg || t('toastAddOptionError'), 'error');
        }
      } catch (err) {
        showToast(t('toastOperationFailed'), 'error');
      } finally {
        toggleLoading(false);
      }
    });

    DOM.addWhBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      const val = DOM.newWhInput.value.trim();
      if (!val) {
        showToast(t('toastInputWhID'), 'error');
        return;
      }
      toggleLoading(true);
      try {
        const res = await db.addDropdownOption('warehouses', val);
        if (res.success) {
          dropdownOptions.warehouses = res.options;
          renderLookupOptions();
          DOM.newWhInput.value = '';
          showToast(t('toastWhAdded', { value: val }));
        } else {
          showToast(res.msg || t('toastAddOptionError'), 'error');
        }
      } catch (err) {
        showToast(t('toastOperationFailed'), 'error');
      } finally {
        toggleLoading(false);
      }
    });

    /* --- SETUP MODAL & ALERT BANNER HANDLERS --- */

    const dismissBtn = document.getElementById('btn-dismiss-supabase');
    if (dismissBtn) {
      dismissBtn.addEventListener('click', () => {
        toggleSupabaseBanner(false);
        showToast(t('toastFallbackModeActive_dismissed', {}, 'Notice dismissed. Fallback Mode active.'), 'info');
      });
    }

    const showSqlBtn = document.getElementById('btn-show-sql-script');
    if (showSqlBtn) {
      showSqlBtn.addEventListener('click', () => {
        showSetupModal(true);
      });
    }

    const helpBtnTop = document.getElementById('supabase-setup-help-btn');
    if (helpBtnTop) {
      helpBtnTop.addEventListener('click', () => {
        showSetupModal(true);
      });
    }

    const closeModalBtn1 = document.getElementById('close-setup-modal-btn');
    if (closeModalBtn1) {
      closeModalBtn1.addEventListener('click', () => {
        showSetupModal(false);
      });
    }

    const closeModalBtn2 = document.getElementById('close-setup-modal-btn-footer');
    if (closeModalBtn2) {
      closeModalBtn2.addEventListener('click', () => {
        showSetupModal(false);
      });
    }

    // Easy Copy-to-Clipboard functionality
    const copySqlBtn = document.getElementById('btn-copy-setup-sql');
    if (copySqlBtn) {
      copySqlBtn.addEventListener('click', () => {
        const sqlCode = document.getElementById('sql-script-pre').textContent;
        navigator.clipboard.writeText(sqlCode)
          .then(() => {
            showToast(t('toastSqlCopied', {}, 'SQL schema copied to clipboard!'), 'success');
          })
          .catch(() => {
            showToast(t('toastCopyFailed', {}, 'Copy failed, please highlight manually.'), 'error');
          });
      });
    }

  } catch (error) {
    showToast(t('toastSchemaInitFailed'), 'error');
    console.error(error);
  } finally {
    toggleLoading(false);
  }
});
