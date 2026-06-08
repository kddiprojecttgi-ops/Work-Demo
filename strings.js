/**
 * Multi-Language Translations Dictionary
 * Feel free to modify the values here or add a new language block (e.g. 'es', 'ja') to support dual-languages.
 */
export const STRINGS = {
  en: {
    // General Brand names & Metadata
    appTitle: "Truck Delivery Log",
    appSubtitle: "Fleet Warehouse Records & Logistics Administration",
    metadataDescription: "A robust and modern truck delivery records database system.",
    
    // DB Connection states
    dbChecking: "Checking Database...",
    dbConnected: "Supabase Connected",
    dbFallbackLocal: "Local Fallback (No Tables)",
    dbFallbackOffline: "Offline-Fallback Mode",
    dbSetupGuideBtn: "Setup Setup Guide →",
    
    // Header Stats panel
    statTotalLogs: "Total Logs",
    statFilteredItems: "Filtered Items",
    statActiveFleet: "Active Fleet",
    
    // Supabase alert banner (missing tables)
    alertBannerTitle: "Need Table Migrations Setup in Supabase",
    alertBannerDescHtml: 'We connected to your live Supabase project, but the required database tables <strong class="text-emerald-300 font-mono">truck_records</strong> or <strong class="text-emerald-300 font-mono">truck_options</strong> are not created yet. The application is running beautifully on <strong class="text-amber-400">LocalStorage fallback mode</strong> for now.',
    alertBannerBtnInstaller: "Show Supabase SQL Installer",
    alertBannerBtnDismiss: "Dismiss Notice",
    
    // Supabase setup guide modal
    modalInstructionsTitle: "Database Schema Installation Steps",
    modalInstructionsIntro: "Follow these simple steps to live-connect your database queries:",
    modalStep1Html: 'Log in to your Supabase project dashboard: <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" class="text-indigo-600 hover:underline font-bold inline-flex items-center">https://supabase.com/dashboard &nearr;</a>',
    modalStep2: "Select the project matching your provided link.",
    modalStep3: "Go to the SQL Editor tab on the left-side navigation rail.",
    modalStep4: "Click New Query.",
    modalStep5: "Copy the system SQL migration script below, paste it, and click Run (or press cmd+Enter).",
    modalStep6: "Refresh this application! Your data is fully linked up.",
    modalSqlBanner: "Setup SQL Query Script",
    modalCopyScriptBtn: "Copy Script",
    modalCloseBtn: "Close",
    
    // Add / Edit Form Panel
    formTitleAdd: "Add New Record",
    formTitleEditHtml: 'Edit Record <span class="text-indigo-600">No. {no}</span>',
    formRequiredHelp: "Fields are required",
    lblDeliveryDate: "Delivery Date",
    lblTruckNumber: "Truck Number",
    lblRegisteredOwner: "Registered Owner",
    lblWarehouseNumber: "Warehouse Number",
    placeholderSelectTruck: "-- Select Truck Number --",
    placeholderSelectOwner: "-- Select Owner Name --",
    placeholderSelectWarehouse: "-- Select Warehouse --",
    btnCancelEdit: "Cancel Edit",
    btnAddRecord: "Add Record",
    btnSaveChanges: "Save Changes",
    
    // Table listing
    tableSegmentBadge: "LOGS",
    tableMainTitle: "Delivery Record Listing",
    btnResetFilters: "Reset Table Filters",
    btnPrintPdf: "Print PDF Report",
    tableSyncing: "Syncing Database...",
    
    // Columns Headers
    colNo: "No",
    colDeliveryDate: "Delivery Date",
    colTruckNum: "Truck Num",
    colOwner: "Owner",
    colWarehouseNo: "Warehouse No",
    colOperations: "Operations",
    
    // Filters Row Placeholders & Indicators
    filterNoPlaceholder: "#",
    filterStartLabel: "Start",
    filterEndLabel: "End",
    filterTruckPlaceholder: "Search truck...",
    filterOwnerPlaceholder: "Search owner name...",
    filterWhPlaceholder: "Search WH ID...",
    filterAllTrucks: "-- All Trucks --",
    filterAllOwners: "-- All Owners --",
    filterAllWarehouses: "-- All Warehouses --",
    filterActiveIndicator: "Filters active",
    
    // Operations buttons
    operationsEdit: "Edit",
    operationsDelete: "Delete",
    
    // Empty state
    emptyTitle: "No Matching Records Found",
    emptyDesc: "Try adjusting your independent column filters above or register a new delivery item.",
    
    // Managed dropdown values lookups
    lookupsSegmentBadge: "LOOKUPS",
    lookupsMainTitle: "Manage Lookup Dropdown Values",
    lookupsSubtitle: "Extend values list options dynamically for the above drop-down select menus.",
    
    lookupTruckTitle: "Truck Numbers List",
    lookupTruckDesc: "Create or delete truck options",
    lookupTruckPlaceholder: "New Truck... (e.g. TRK-606)",
    lookupAddBtn: "Add",
    
    lookupOwnerTitle: "Registered Owners",
    lookupOwnerDesc: "Register shipping companies",
    lookupOwnerPlaceholder: "New Owner... (e.g. Apex Cargo)",
    
    lookupWhTitle: "Warehouse Numbers",
    lookupWhDesc: "Register logistical hubs",
    lookupWhPlaceholder: "New Hub... (e.g. WH-Epsilon)",
    
    // Custom confirm dialog details
    confirmDefaultTitle: "Confirm Action",
    confirmDefaultMsg: "Are you sure you want to proceed with this action?",
    confirmCancelLabel: "Cancel",
    confirmDeleteLabel: "Delete",
    
    confirmDeleteRecordTitle: "Delete Record Log",
    confirmDeleteRecordMsgFirst: "Are you sure you want to permanently delete delivery record No. {no} on {date}?",
    
    confirmRemoveOptionTitle: "Remove List Option",
    confirmRemoveOptionMsgFirst: "Are you sure you want to delete \"{value}\"? (This will not alter historical values in records, but matches will not be selectable for future entries)",
    
    // Toasts, Notifications, Dialog warnings
    toastDeletedOption: "Deleted option \"{value}\" successfully!",
    toastErrorRemovingOption: "Error removing option!",
    toastInputValidTruck: "Please input a valid Truck Number",
    toastInputOwnerName: "Please input an Owner name",
    toastInputWhID: "Please input a Warehouse ID option",
    toastOptionDuplicate: "Option already exists",
    toastTruckAdded: "Truck \"{value}\" added to inventory list",
    toastOwnerAdded: "Owner \"{value}\" registered successfully",
    toastWhAdded: "Warehouse \"{value}\" added to directory",
    toastOperationFailed: "Operation failed!",
    toastAddOptionError: "Error adding option",
    toastFiltersCleared: "Filters cleared",
    toastFillAllValues: "Please fill out all record values.",
    toastRecordCreated: "Delivery record created successfully!",
    toastRecordUpdated: "Delivery record updated successfully!",
    toastRecordSaveError: "Error saving delivery details!",
    toastRecordDeleteSuccess: "Record No. {no} deleted successfully",
    toastRecordDeleteError: "Error deleting record!",
    toastRecordEditingState: "Editing Delivery Record No. {no}...",
    toastEditFieldCancelled: "Edit cancelled",
    toastSchemaInitFailed: "Failed to initialize database schemas!"
  }
};
