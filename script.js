
// ========== CONSTANTS AND CONFIGURATION ==========
const CONFIG = {
  STORAGE_KEYS: {
    ROUTE_DATA: 'routeData',
    DRIVER_LOGS: 'driverLogs',
    CURRENT_ROUTE: 'currentRoute',
    CURRENT_SHIFT: 'currentShift',
    CURRENT_DATE: 'currentDate'
  },
  DEFAULT_ROUTES: {
    "1801": { password: "Milk1801", societies: ["Society 1", "Society 2", "Society 3"] },
    "1802": { password: "Milk1802", societies: ["Society A", "Society B", "Society C"] },
    "1803": { password: "Milk1803", societies: ["Society X", "Society Y", "Society Z"] }
  },
  ADMIN_CREDENTIALS: [
    { username: "admin", password: "admin123" },
    { username: "manager", password: "manager123" }
  ],
  SHIFTS: ["Morning", "Evening"]
};

// ========== UTILITY FUNCTIONS ==========
const Utils = {
  // Get current date in YYYY-MM-DD format
  getCurrentDate() {
    return new Date().toISOString().slice(0, 10);
  },

  // Get current time in HH:MM:SS format
  getCurrentTime() {
    return new Date().toLocaleTimeString('en-GB');
  },

  // Format duration from minutes to readable string
  formatDuration(minutes) {
    if (!minutes || minutes < 0) return '';
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  },

  // Calculate duration between two time strings
  calculateDuration(startTime, endTime) {
    if (!startTime || !endTime) return null;
    try {
      const start = new Date(`1970-01-01T${startTime}`);
      const end = new Date(`1970-01-01T${endTime}`);
      const diff = (end - start) / 60000; // Convert to minutes
      return diff >= 0 ? diff : null;
    } catch (error) {
      console.error('Error calculating duration:', error);
      return null;
    }
  },

  // Sanitize string for use as HTML ID
  sanitizeForId(str) {
    return str.replace(/[^a-zA-Z0-9]/g, '_');
  },

  // Debounce function for performance optimization
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
};

// ========== LOCAL STORAGE MANAGER ==========
const StorageManager = {
  // Load route data from localStorage or return defaults
  loadRouteData() {
    try {
      const saved = localStorage.getItem(CONFIG.STORAGE_KEYS.ROUTE_DATA);
      return saved ? JSON.parse(saved) : CONFIG.DEFAULT_ROUTES;
    } catch (error) {
      console.error('Error loading route data:', error);
      return CONFIG.DEFAULT_ROUTES;
    }
  },

  // Save route data to localStorage
  saveRouteData(data) {
    try {
      localStorage.setItem(CONFIG.STORAGE_KEYS.ROUTE_DATA, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Error saving route data:', error);
      UI.showToast('Error saving data', true);
      return false;
    }
  },

  // Load driver logs
  loadDriverLogs() {
    try {
      const saved = localStorage.getItem(CONFIG.STORAGE_KEYS.DRIVER_LOGS);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error loading driver logs:', error);
      return [];
    }
  },

  // Save driver logs
  saveDriverLogs(logs) {
    try {
      localStorage.setItem(CONFIG.STORAGE_KEYS.DRIVER_LOGS, JSON.stringify(logs));
      return true;
    } catch (error) {
      console.error('Error saving driver logs:', error);
      return false;
    }
  },

  // Get status for specific route, shift, and date
  getStatusKey(route, shift, date = null) {
    const statusDate = date || Utils.getCurrentDate();
    return `status_${route}_${shift}_${statusDate}`;
  },

  // Load status for specific route/shift/date
  loadStatus(route, shift, date = null) {
    try {
      const key = this.getStatusKey(route, shift, date);
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.error('Error loading status:', error);
      return {};
    }
  },

  // Save status for specific route/shift/date
  saveStatus(route, shift, societyStatus, date = null) {
    try {
      const key = this.getStatusKey(route, shift, date);
      localStorage.setItem(key, JSON.stringify(societyStatus));
      return true;
    } catch (error) {
      console.error('Error saving status:', error);
      return false;
    }
  }
};

// ========== UI MANAGER ==========
const UI = {
  // Show/hide elements
  show(selector) {
    const element = document.querySelector(selector);
    if (element) element.classList.remove('hidden');
  },

  hide(selector) {
    const element = document.querySelector(selector);
    if (element) element.classList.add('hidden');
  },

  // Clear element content
  clear(selector) {
    const element = document.querySelector(selector);
    if (element) element.innerHTML = '';
  },

  // Show toast notification
  showToast(message, isError = false) {
    const toast = document.getElementById('toast');
    if (!toast) return;

    toast.textContent = message;
    toast.className = `toast show ${isError ? 'error' : 'info'}`;
    
    // Auto-hide after 4 seconds
    setTimeout(() => {
      toast.classList.remove('show');
    }, 4000);
  },

  // Update tab button states
  updateTabButtons(activeTab) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    
    const activeBtn = document.querySelector(`[onclick*="'${activeTab}'"]`);
    if (activeBtn) activeBtn.classList.add('active');
  },

  // Populate dropdown with options
  populateDropdown(selector, options, defaultOption = '') {
    const dropdown = document.querySelector(selector);
    if (!dropdown) return;

    dropdown.innerHTML = defaultOption ? `<option value="">${defaultOption}</option>` : '';
    
    Object.entries(options).forEach(([value, text]) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = text;
      dropdown.appendChild(option);
    });
  }
};

// ========== APPLICATION STATE ==========
let routeData = StorageManager.loadRouteData();
let currentLanguage = 'en';

// ========== AUTHENTICATION ==========
const Auth = {
  // Driver login
  driverLogin() {
    const route = document.getElementById('routeNumber').value.trim();
    const password = document.getElementById('password').value;
    const shift = document.getElementById('shiftSelector').value;

    if (!route || !password) {
      UI.showToast('Please enter both route number and password', true);
      return;
    }

    if (!routeData[route]) {
      UI.showToast('Invalid route number', true);
      return;
    }

    if (routeData[route].password !== password) {
      UI.showToast('Invalid password', true);
      return;
    }

    // Store session data
    localStorage.setItem(CONFIG.STORAGE_KEYS.CURRENT_ROUTE, route);
    localStorage.setItem(CONFIG.STORAGE_KEYS.CURRENT_SHIFT, shift);
    localStorage.setItem(CONFIG.STORAGE_KEYS.CURRENT_DATE, Utils.getCurrentDate());

    // Show driver dashboard
    this.showDriverDashboard(route, shift);
    UI.showToast(`Welcome! Logged in to Route ${route}`, false);
  },

  // Admin login
  adminLogin() {
    const username = document.getElementById('adminUsername').value.trim();
    const password = document.getElementById('adminPassword').value;

    if (!username || !password) {
      UI.showToast('Please enter both username and password', true);
      return;
    }

    const isValid = CONFIG.ADMIN_CREDENTIALS.some(
      admin => admin.username === username && admin.password === password
    );

    if (!isValid) {
      UI.showToast('Invalid admin credentials', true);
      return;
    }

    this.showAdminDashboard();
    UI.showToast('Welcome, Admin!', false);
  },

  // Show driver dashboard
  showDriverDashboard(route, shift) {
    UI.hide('#driverLoginSection');
    UI.hide('#adminLoginSection');
    UI.show('.driver-section');

    // Update dashboard info
    document.getElementById('driverRoute').textContent = route;
    document.getElementById('shiftDisplay').textContent = shift;
    document.getElementById('loginTime').textContent = Utils.getCurrentTime();

    // Load societies for this route
    DriverDashboard.loadSocieties(route, shift);
  },

  // Show admin dashboard
  showAdminDashboard() {
    UI.hide('#driverLoginSection');
    UI.hide('#adminLoginSection');
    UI.show('.admin-section');

    // Initialize admin tabs
    AdminDashboard.showTab('routes');
    AdminDashboard.initializeDropdowns();
  },

  // Logout function
  logout() {
    // Clear session data
    localStorage.removeItem(CONFIG.STORAGE_KEYS.CURRENT_ROUTE);
    localStorage.removeItem(CONFIG.STORAGE_KEYS.CURRENT_SHIFT);
    localStorage.removeItem(CONFIG.STORAGE_KEYS.CURRENT_DATE);

    // Show login sections
    UI.show('#driverLoginSection');
    UI.show('#adminLoginSection');
    UI.hide('.driver-section');
    UI.hide('.admin-section');

    // Clear form fields
    document.getElementById('routeNumber').value = '';
    document.getElementById('password').value = '';
    document.getElementById('adminUsername').value = '';
    document.getElementById('adminPassword').value = '';

    UI.showToast('Logged out successfully', false);
  }
};

// ========== DRIVER DASHBOARD ==========
const DriverDashboard = {
  // Load societies for current route
  loadSocieties(route, shift) {
    const societyList = document.getElementById('societyList');
    if (!societyList) return;

    const societies = routeData[route]?.societies || [];
    const savedStatus = StorageManager.loadStatus(route, shift);

    societyList.innerHTML = '';

    societies.forEach((society, index) => {
      const societyDiv = document.createElement('div');
      societyDiv.className = 'society-item';
      
      const societyName = document.createElement('div');
      societyName.className = 'society-name';
      societyName.textContent = `${index + 1}. ${society}`;
      
      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'society-actions';
      
      const arrivalBtn = document.createElement('button');
      arrivalBtn.className = 'btn btn-primary btn-sm';
      arrivalBtn.textContent = '🟢 Arrival';
      arrivalBtn.onclick = () => this.markStatus(route, shift, society, 'arrival');
      
      const departureBtn = document.createElement('button');
      departureBtn.className = 'btn btn-secondary btn-sm';
      departureBtn.textContent = '🔴 Departure';
      departureBtn.onclick = () => this.markStatus(route, shift, society, 'departure');
      
      const statusDiv = document.createElement('div');
      statusDiv.className = 'society-status';
      statusDiv.id = `status_${Utils.sanitizeForId(route)}_${Utils.sanitizeForId(shift)}_${Utils.sanitizeForId(society)}`;
      
      actionsDiv.appendChild(arrivalBtn);
      actionsDiv.appendChild(departureBtn);
      
      societyDiv.appendChild(societyName);
      societyDiv.appendChild(actionsDiv);
      societyDiv.appendChild(statusDiv);
      
      societyList.appendChild(societyDiv);

      // Restore saved status
      this.updateStatusDisplay(route, shift, society, savedStatus[society] || {});
    });
  },

  // Mark arrival/departure status
  markStatus(route, shift, society, type) {
    const currentTime = Utils.getCurrentTime();
    const savedStatus = StorageManager.loadStatus(route, shift);

    if (!savedStatus[society]) {
      savedStatus[society] = {};
    }

    savedStatus[society][type] = currentTime;

    // Save to localStorage
    if (StorageManager.saveStatus(route, shift, savedStatus)) {
      this.updateStatusDisplay(route, shift, society, savedStatus[society]);
      this.logDriverActivity(route, shift, society, type, currentTime);
      UI.showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} marked for ${society}`, false);
    }
  },

  // Update status display for a society
  updateStatusDisplay(route, shift, society, status) {
    const statusDiv = document.getElementById(
      `status_${Utils.sanitizeForId(route)}_${Utils.sanitizeForId(shift)}_${Utils.sanitizeForId(society)}`
    );
    
    if (!statusDiv) return;

    let statusText = '';
    if (status.arrival) {
      statusText += `🟢 Arrived: ${status.arrival} `;
    }
    if (status.departure) {
      statusText += `🔴 Departed: ${status.departure}`;
    }

    statusDiv.textContent = statusText;
  },

  // Log driver activity
  logDriverActivity(route, shift, society, type, time) {
    const logs = StorageManager.loadDriverLogs();
    const date = Utils.getCurrentDate();

    // Find existing log entry for this society on this date/shift
    let existingLog = logs.find(
      log => log.date === date && 
             log.route === route && 
             log.shift === shift && 
             log.society === society
    );

    if (existingLog) {
      // Update existing log
      existingLog[`${type}Time`] = time;
    } else {
      // Create new log entry
      const newLog = {
        date,
        route,
        shift,
        society,
        arrivalTime: type === 'arrival' ? time : null,
        departureTime: type === 'departure' ? time : null
      };
      logs.push(newLog);
    }

    StorageManager.saveDriverLogs(logs);
  }
};

// ========== ADMIN DASHBOARD ==========
const AdminDashboard = {
  // Show specific admin tab
  showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.admin-tab').forEach(tab => {
      tab.classList.add('hidden');
    });

    // Show selected tab
    const selectedTab = document.getElementById(`adminTab-${tabName}`);
    if (selectedTab) {
      selectedTab.classList.remove('hidden');
      UI.updateTabButtons(tabName);

      // Load tab-specific content
      switch (tabName) {
        case 'routes':
          this.loadRouteManagement();
          break;
        case 'logs':
          this.loadDriverLogs();
          break;
        case 'summary':
          this.loadSummaryTab();
          break;
        case 'settings':
          this.loadSettingsTab();
          break;
      }
    }
  },

  // Initialize dropdown menus
  initializeDropdowns() {
    const routes = Object.keys(routeData);
    const routeOptions = {};
    routes.forEach(route => {
      routeOptions[route] = route;
    });

    // Populate various dropdowns
    UI.populateDropdown('#adminRouteFilter', routeOptions, 'All Routes');
    UI.populateDropdown('#summaryRouteFilter', routeOptions, 'Select Route');
  },

  // Load route management tab
  loadRouteManagement() {
    const container = document.getElementById('routeManagementArea');
    if (!container) return;

    container.innerHTML = `
      <div class="management-section">
        <h4>Add New Route</h4>
        <div class="form-group">
          <label for="newRouteNumber">Route Number:</label>
          <input type="text" id="newRouteNumber" placeholder="Enter route number">
        </div>
        <button class="btn btn-primary" onclick="RouteManager.addRoute()">Add Route</button>
      </div>

      <div class="management-section">
        <h4>Bulk Add Route & Societies</h4>
        <div class="form-group">
          <label for="bulkRouteNumber">Route Number:</label>
          <input type="text" id="bulkRouteNumber" placeholder="Enter route number">
        </div>
        <div class="form-group">
          <label for="bulkSocieties">Societies (comma or newline separated):</label>
          <textarea id="bulkSocieties" rows="4" placeholder="Society 1, Society 2..."></textarea>
        </div>
        <button class="btn btn-primary" onclick="RouteManager.bulkAddRoute()">Add Route with Societies</button>
      </div>

      <div class="management-section">
        <h4>Edit Existing Routes</h4>
        <div class="form-group">
          <label for="routeSelector">Select Route:</label>
          <select id="routeSelector" onchange="RouteManager.loadRouteForEdit()">
            <option value="">Select a route</option>
          </select>
        </div>
        <div id="routeEditor"></div>
      </div>
    `;

    RouteManager.populateRouteSelector();
  },

  // Load driver logs tab
  loadDriverLogs() {
    // Set default date to today
    const dateInput = document.getElementById('adminDate');
    if (dateInput && !dateInput.value) {
      dateInput.value = Utils.getCurrentDate();
    }
  },

  // Load summary tab
  loadSummaryTab() {
    // Set default date to today
    const dateInput = document.getElementById('summaryDateFilter');
    if (dateInput && !dateInput.value) {
      dateInput.value = Utils.getCurrentDate();
    }
  },

  // Load settings tab
  loadSettingsTab() {
    // Settings tab is mostly static, no dynamic loading needed
  }
};

// ========== ROUTE MANAGER ==========
const RouteManager = {
  // Add new route
  addRoute() {
    const routeNumber = document.getElementById('newRouteNumber').value.trim();
    
    if (!routeNumber) {
      UI.showToast('Please enter a route number', true);
      return;
    }

    if (routeData[routeNumber]) {
      UI.showToast('Route already exists', true);
      return;
    }

    routeData[routeNumber] = {
      password: `Milk${routeNumber}`,
      societies: []
    };

    if (StorageManager.saveRouteData(routeData)) {
      this.populateRouteSelector();
      AdminDashboard.initializeDropdowns();
      document.getElementById('newRouteNumber').value = '';
      UI.showToast(`Route ${routeNumber} added successfully`, false);
    }
  },

  // Bulk add route with societies
  bulkAddRoute() {
    const routeNumber = document.getElementById('bulkRouteNumber').value.trim();
    const rawText = document.getElementById('bulkSocieties').value.trim();

    if (!routeNumber || !rawText) {
      UI.showToast('Please enter both route number and societies', true);
      return;
    }

    // Parse societies from various delimiters
    const societies = rawText
      .split(/[\n,\t]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    if (societies.length === 0) {
      UI.showToast('No valid societies provided', true);
      return;
    }

    routeData[routeNumber] = {
      password: `Milk${routeNumber}`,
      societies: societies
    };

    if (StorageManager.saveRouteData(routeData)) {
      this.populateRouteSelector();
      AdminDashboard.initializeDropdowns();
      document.getElementById('bulkRouteNumber').value = '';
      document.getElementById('bulkSocieties').value = '';
      UI.showToast(`Route ${routeNumber} added with ${societies.length} societies`, false);
    }
  },

  // Populate route selector dropdown
  populateRouteSelector() {
    const selector = document.getElementById('routeSelector');
    if (!selector) return;

    selector.innerHTML = '<option value="">Select a route</option>';
    
    Object.keys(routeData).forEach(route => {
      const option = document.createElement('option');
      option.value = route;
      option.textContent = route;
      selector.appendChild(option);
    });
  },

  // Load route for editing
  loadRouteForEdit() {
    const routeNumber = document.getElementById('routeSelector').value;
    const editorDiv = document.getElementById('routeEditor');
    
    if (!routeNumber || !editorDiv) return;

    const route = routeData[routeNumber];
    if (!route) return;

    editorDiv.innerHTML = `
      <h5>Edit Route ${routeNumber}</h5>
      <div class="form-group">
        <label>Password: <strong>${route.password}</strong></label>
      </div>
      <div class="form-group">
        <label for="newSocietyName">Add Society:</label>
        <div style="display: flex; gap: 0.5rem;">
          <input type="text" id="newSocietyName" placeholder="Society name">
          <button class="btn btn-primary" onclick="RouteManager.addSociety('${routeNumber}')">Add</button>
        </div>
      </div>
      <div id="societiesList"></div>
      <button class="btn btn-danger" onclick="RouteManager.deleteRoute('${routeNumber}')" style="margin-top: 1rem;">
        Delete Route
      </button>
    `;

    this.loadSocietiesList(routeNumber);
  },

  // Load societies list for editing
  loadSocietiesList(routeNumber) {
    const listDiv = document.getElementById('societiesList');
    if (!listDiv) return;

    const societies = routeData[routeNumber]?.societies || [];
    
    listDiv.innerHTML = '<h6>Societies:</h6>';
    
    if (societies.length === 0) {
      listDiv.innerHTML += '<p>No societies added yet.</p>';
      return;
    }

    const list = document.createElement('ul');
    list.style.listStyle = 'none';
    list.style.padding = '0';

    societies.forEach((society, index) => {
      const li = document.createElement('li');
      li.style.display = 'flex';
      li.style.justifyContent = 'space-between';
      li.style.alignItems = 'center';
      li.style.padding = '0.5rem';
      li.style.margin = '0.25rem 0';
      li.style.background = 'var(--background-color)';
      li.style.borderRadius = '4px';

      li.innerHTML = `
        <span>${society}</span>
        <button class="btn btn-sm btn-danger" onclick="RouteManager.deleteSociety('${routeNumber}', ${index})">
          Delete
        </button>
      `;
      
      list.appendChild(li);
    });

    listDiv.appendChild(list);
  },

  // Add society to route
  addSociety(routeNumber) {
    const societyName = document.getElementById('newSocietyName').value.trim();
    
    if (!societyName) {
      UI.showToast('Please enter a society name', true);
      return;
    }

    if (!routeData[routeNumber].societies.includes(societyName)) {
      routeData[routeNumber].societies.push(societyName);
      
      if (StorageManager.saveRouteData(routeData)) {
        this.loadSocietiesList(routeNumber);
        document.getElementById('newSocietyName').value = '';
        UI.showToast(`Society "${societyName}" added`, false);
      }
    } else {
      UI.showToast('Society already exists', true);
    }
  },

  // Delete society from route
  deleteSociety(routeNumber, index) {
    if (confirm('Are you sure you want to delete this society?')) {
      const societyName = routeData[routeNumber].societies[index];
      routeData[routeNumber].societies.splice(index, 1);
      
      if (StorageManager.saveRouteData(routeData)) {
        this.loadSocietiesList(routeNumber);
        UI.showToast(`Society "${societyName}" deleted`, false);
      }
    }
  },

  // Delete entire route
  deleteRoute(routeNumber) {
    if (confirm(`Are you sure you want to delete Route ${routeNumber}? This action cannot be undone.`)) {
      delete routeData[routeNumber];
      
      if (StorageManager.saveRouteData(routeData)) {
        this.populateRouteSelector();
        AdminDashboard.initializeDropdowns();
        document.getElementById('routeEditor').innerHTML = '';
        UI.showToast(`Route ${routeNumber} deleted`, false);
      }
    }
  }
};

// ========== REPORTS MANAGER ==========
const ReportsManager = {
  // Filter and display driver logs
  filterDriverLogs() {
    const date = document.getElementById('adminDate').value;
    const route = document.getElementById('adminRouteFilter').value;
    const shift = document.getElementById('adminShiftFilter').value;

    const logs = StorageManager.loadDriverLogs();
    
    // Filter logs based on criteria
    const filteredLogs = logs.filter(log => {
      return (!date || log.date === date) &&
             (!route || log.route === route) &&
             (!shift || log.shift === shift);
    });

    this.displayLogsTable(filteredLogs);
  },

  // Display logs in table format
  displayLogsTable(logs) {
    const container = document.getElementById('adminStatusTable');
    if (!container) return;

    if (logs.length === 0) {
      container.innerHTML = '<p>No logs found for the selected criteria.</p>';
      return;
    }

    const table = document.createElement('table');
    table.className = 'data-table';
    
    table.innerHTML = `
      <thead>
        <tr>
          <th>Date</th>
          <th>Route</th>
          <th>Shift</th>
          <th>Society</th>
          <th>Arrival</th>
          <th>Departure</th>
          <th>Duration</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;

    const tbody = table.querySelector('tbody');
    
    logs.forEach(log => {
      const duration = Utils.calculateDuration(log.arrivalTime, log.departureTime);
      const row = document.createElement('tr');
      
      row.innerHTML = `
        <td>${log.date}</td>
        <td>${log.route}</td>
        <td>${log.shift}</td>
        <td>${log.society}</td>
        <td>${log.arrivalTime || '-'}</td>
        <td>${log.departureTime || '-'}</td>
        <td>${duration ? Utils.formatDuration(duration) : '-'}</td>
      `;
      
      tbody.appendChild(row);
    });

    container.innerHTML = '';
    container.appendChild(table);
  },

  // Load summary for specific date and route
  loadAdminSummary() {
    const date = document.getElementById('summaryDateFilter').value;
    const route = document.getElementById('summaryRouteFilter').value;

    if (!date || !route) {
      UI.showToast('Please select both date and route', true);
      return;
    }

    const logs = StorageManager.loadDriverLogs();
    const filteredLogs = logs.filter(log => 
      log.date === date && log.route === route
    );

    this.displaySummaryTable(filteredLogs);
  },

  // Display summary table
  displaySummaryTable(logs) {
    const tbody = document.querySelector('#summaryTable tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (logs.length === 0) {
      const row = document.createElement('tr');
      row.innerHTML = '<td colspan="4">No data found for the selected criteria.</td>';
      tbody.appendChild(row);
      return;
    }

    logs.forEach(log => {
      const duration = Utils.calculateDuration(log.arrivalTime, log.departureTime);
      const row = document.createElement('tr');
      
      row.innerHTML = `
        <td>${log.society}</td>
        <td>${log.arrivalTime || '-'}</td>
        <td>${log.departureTime || '-'}</td>
        <td>${duration ? Utils.formatDuration(duration) : '-'}</td>
      `;
      
      tbody.appendChild(row);
    });
  },

  // Export summary to CSV
  exportCSV() {
    const table = document.getElementById('summaryTable');
    if (!table) return;

    const rows = [];
    const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent);
    rows.push(headers);

    const dataRows = Array.from(table.querySelectorAll('tbody tr'));
    dataRows.forEach(row => {
      const cells = Array.from(row.querySelectorAll('td')).map(td => td.textContent);
      rows.push(cells);
    });

    const csvContent = rows.map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `milk_route_summary_${Utils.getCurrentDate()}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      UI.showToast('CSV exported successfully', false);
    }
  }
};

// ========== LANGUAGE MANAGER ==========
const LanguageManager = {
  // Toggle between English and Hindi
  toggleLanguage() {
    currentLanguage = currentLanguage === 'en' ? 'hi' : 'en';
    this.updateLanguage();
  },

  // Update UI language
  updateLanguage() {
    const translations = {
      en: {
        routeNumber: 'Route Number',
        password: 'Password',
        selectShift: 'Select Shift',
        login: 'Login',
        adminLogin: 'Admin Login'
      },
      hi: {
        routeNumber: 'मार्ग संख्या',
        password: 'पासवर्ड',
        selectShift: 'पाली चुनें',
        login: 'लॉगिन',
        adminLogin: 'प्रशासक लॉगिन'
      }
    };

    const t = translations[currentLanguage];
    
    // Update labels
    const labelRoute = document.getElementById('labelRoute');
    const labelPassword = document.getElementById('labelPassword');
    const shiftLabel = document.getElementById('shiftLabel');
    const driverLoginButton = document.getElementById('driverLoginButton');
    const adminLoginTitle = document.getElementById('adminLoginTitle');

    if (labelRoute) labelRoute.textContent = t.routeNumber;
    if (labelPassword) labelPassword.textContent = t.password;
    if (shiftLabel) shiftLabel.textContent = t.selectShift;
    if (driverLoginButton) driverLoginButton.textContent = t.login;
    if (adminLoginTitle) adminLoginTitle.textContent = t.adminLogin;
  }
};

// ========== GLOBAL FUNCTIONS (for onclick handlers) ==========
function driverLogin() {
  Auth.driverLogin();
}

function adminLogin() {
  Auth.adminLogin();
}

function logout() {
  Auth.logout();
}

function showAdminTab(tabName) {
  AdminDashboard.showTab(tabName);
}

function filterDriverLogs() {
  ReportsManager.filterDriverLogs();
}

function loadAdminSummary() {
  ReportsManager.loadAdminSummary();
}

function exportCSV() {
  ReportsManager.exportCSV();
}

function toggleLanguage() {
  LanguageManager.toggleLanguage();
}

function resetApp() {
  if (confirm('Are you sure you want to reset all application data? This action cannot be undone.')) {
    localStorage.clear();
    location.reload();
  }
}

// ========== APPLICATION INITIALIZATION ==========
const App = {
  // Initialize the application
  init() {
    try {
      // Load initial data
      routeData = StorageManager.loadRouteData();
      
      // Save default data if needed
      if (!localStorage.getItem(CONFIG.STORAGE_KEYS.ROUTE_DATA)) {
        StorageManager.saveRouteData(routeData);
      }

      // Set up event listeners
      this.setupEventListeners();

      // Initialize UI
      this.initializeUI();

      console.log('✅ Milk Route Tracker initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing app:', error);
      UI.showToast('Error initializing application', true);
    }
  },

  // Set up event listeners
  setupEventListeners() {
    // Enter key support for login forms
    document.getElementById('password')?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') driverLogin();
    });

    document.getElementById('adminPassword')?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') adminLogin();
    });

    // Auto-save functionality for forms
    const debouncedSave = Utils.debounce(() => {
      // Auto-save any unsaved changes
    }, 1000);

    // Add debounced save to input fields
    document.querySelectorAll('input, select, textarea').forEach(element => {
      element.addEventListener('input', debouncedSave);
    });
  },

  // Initialize UI state
  initializeUI() {
    // Hide all sections initially
    UI.hide('.driver-section');
    UI.hide('.admin-section');
    
    // Show login sections
    UI.show('#driverLoginSection');
    UI.show('#adminLoginSection');

    // Set default date inputs to today
    document.querySelectorAll('input[type="date"]').forEach(input => {
      if (!input.value) input.value = Utils.getCurrentDate();
    });
  }
};

// ========== APPLICATION STARTUP ==========
// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

// Fallback initialization for older browsers
window.addEventListener('load', () => {
  if (!window.appInitialized) {
    App.init();
    window.appInitialized = true;
  }
});
