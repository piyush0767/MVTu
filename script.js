// ========== GLOBAL VARIABLES ==========
let routeData = {};
const mccAdmins = [
  { username: "admin", password: "admin123" }
];

// ========== LOCAL STORAGE UTILITIES ==========
function loadRouteData() {
  const saved = localStorage.getItem("routeData");
  if (saved) {
    return JSON.parse(saved);
  }
  return {
    "1801": { password: "Milk1801", societies: ["Society 1", "Society 2", "Society 3"] },
    "1802": { password: "Milk1802", societies: ["Society A", "Society B", "Society C"] }
  };
}

function saveRouteData() {
  localStorage.setItem("routeData", JSON.stringify(routeData));
}

// ========== DRIVER LOGIN ==========
function driverLogin() {
  const route = document.getElementById("routeNumber").value.trim();
  const password = document.getElementById("password").value;
  const shift = document.getElementById("shiftSelector").value;

  if (!route || !password) {
    showToast("Please enter route number and password", true);
    return;
  }

  if (routeData[route] && routeData[route].password === password) {
    // Hide login sections
    document.getElementById("driverLoginSection").classList.add("hidden");
    document.getElementById("adminLoginSection").classList.add("hidden");

    // Show driver section
    document.querySelector(".driver-section").classList.remove("hidden");

    // Update display
    document.getElementById("driverRoute").textContent = `Route: ${route}`;
    document.getElementById("shiftDisplay").textContent = `Shift: ${shift}`;
    document.getElementById("loginTime").textContent = `Login Time: ${new Date().toLocaleTimeString()}`;

    // Load societies
    loadSocietiesForDriver(route, shift);

    showToast("Login successful!", false);
  } else {
    showToast("Invalid route or password", true);
  }
}

function loadSocietiesForDriver(route, shift) {
  const societyList = document.getElementById("societyList");
  const societies = routeData[route].societies;
  societyList.innerHTML = "";

  const date = new Date().toISOString().slice(0, 10);
  const statusKey = `status_${route}_${shift}_${date}`;
  const savedStatus = JSON.parse(localStorage.getItem(statusKey)) || {};

  societies.forEach((society, index) => {
    const div = document.createElement("div");
    div.innerHTML = `
      <b>${index + 1}. ${society}</b>
      <button onclick="markStatus('${route}','${shift}','${society}','arrival')">Arrival</button>
      <button onclick="markStatus('${route}','${shift}','${society}','departure')">Departure</button>
      <span id="status_${route}_${shift}_${society.replace(/\s+/g, '_')}"></span>
    `;
    societyList.appendChild(div);

    // Restore saved status
    const status = savedStatus[society] || {};
    const span = document.getElementById(`status_${route}_${shift}_${society.replace(/\s+/g, '_')}`);
    if (status.arrival) span.innerHTML += " 🟢 Arrived";
    if (status.departure) span.innerHTML += " 🔴 Departed";
  });
}

function markStatus(route, shift, society, type) {
  const date = new Date().toISOString().slice(0, 10);
  const time = new Date().toLocaleTimeString();
  const statusKey = `status_${route}_${shift}_${date}`;

  let savedStatus = JSON.parse(localStorage.getItem(statusKey)) || {};

  if (!savedStatus[society]) {
    savedStatus[society] = {};
  }

  savedStatus[society][type] = time;
  localStorage.setItem(statusKey, JSON.stringify(savedStatus));

  const span = document.getElementById(`status_${route}_${shift}_${society.replace(/\s+/g, '_')}`);
  span.innerHTML = "";

  if (savedStatus[society].arrival) {
    span.innerHTML += ` 🟢 Arrived at ${savedStatus[society].arrival}`;
  }
  if (savedStatus[society].departure) {
    span.innerHTML += ` 🔴 Departed at ${savedStatus[society].departure}`;
  }

  showToast(`${type} marked for ${society}`, false);
}

// ========== ADMIN LOGIN ==========
function adminLogin() {
  const username = document.getElementById("adminUsername").value;
  const password = document.getElementById("adminPassword").value;

  const match = mccAdmins.find(a => a.username === username && a.password === password);

  if (match) {
    document.getElementById("driverLoginSection").classList.add("hidden");
    document.getElementById("adminLoginSection").classList.add("hidden");
    document.querySelector(".admin-section").classList.remove("hidden");

    showAdminTab('routes');
    populateAllDropdowns();
    showToast("Admin login successful!", false);
  } else {
    showToast("Invalid admin credentials", true);
  }
}

// ========== ADMIN TAB MANAGEMENT ==========
function showAdminTab(tabName) {
  // Hide all tabs
  document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.classList.add('hidden');
  });

  // Show selected tab
  const selectedTab = document.getElementById('adminTab-' + tabName);
  if (selectedTab) {
    selectedTab.classList.remove('hidden');

    if (tabName === 'routes') {
      populateRouteSelector();
    }
  }
}

// ========== ROUTE MANAGEMENT ==========
function populateRouteSelector() {
  const selector = document.getElementById("routeSelector");
  selector.innerHTML = "<option value=''>Select Route</option>";

  Object.keys(routeData).forEach(route => {
    const option = document.createElement("option");
    option.value = route;
    option.textContent = route;
    selector.appendChild(option);
  });
}

function loadSocietiesForEdit() {
  const route = document.getElementById("routeSelector").value;
  const editor = document.getElementById("societyEditor");
  editor.innerHTML = "";

  if (!route || !routeData[route]) return;

  const societies = routeData[route].societies;

  const list = document.createElement("ul");
  societies.forEach((society, index) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <input type="text" value="${society}" data-index="${index}">
      <button onclick="deleteSociety(${index})">❌ Delete</button>
    `;
    list.appendChild(li);
  });

  editor.appendChild(list);

  const saveBtn = document.createElement("button");
  saveBtn.textContent = "💾 Save Changes";
  saveBtn.onclick = saveSocietyChanges;
  editor.appendChild(saveBtn);
}

function saveSocietyChanges() {
  const route = document.getElementById("routeSelector").value;
  const inputs = document.querySelectorAll("#societyEditor input");

  const newSocieties = [];
  inputs.forEach(input => {
    if (input.value.trim()) {
      newSocieties.push(input.value.trim());
    }
  });

  routeData[route].societies = newSocieties;
  saveRouteData();
  showToast("Societies updated successfully!", false);
}

function addSociety() {
  const newSoc = document.getElementById("newSocietyName").value.trim();
  const route = document.getElementById("routeSelector").value;

  if (!route) {
    showToast("Please select a route first", true);
    return;
  }

  if (newSoc) {
    routeData[route].societies.push(newSoc);
    saveRouteData();
    loadSocietiesForEdit();
    document.getElementById("newSocietyName").value = "";
    showToast("Society added successfully!", false);
  }
}

function deleteSociety(index) {
  const route = document.getElementById("routeSelector").value;
  routeData[route].societies.splice(index, 1);
  saveRouteData();
  loadSocietiesForEdit();
  showToast("Society deleted successfully!", false);
}

function addRoute() {
  const newRoute = document.getElementById("newRouteNumber").value.trim();

  if (!newRoute) {
    showToast("Please enter a route number", true);
    return;
  }

  if (!routeData[newRoute]) {
    routeData[newRoute] = {
      password: "Milk" + newRoute,
      societies: []
    };
    saveRouteData();
    populateRouteSelector();
    populateAllDropdowns();
    document.getElementById("newRouteNumber").value = "";
    showToast(`Route ${newRoute} added successfully!`, false);
  } else {
    showToast("Route already exists", true);
  }
}

function bulkAddRoute() {
  const routeNumber = document.getElementById("bulkRouteNumber").value.trim();
  const rawText = document.getElementById("bulkSocieties").value.trim();

  if (!routeNumber || !rawText) {
    showToast("Please enter both route number and societies", true);
    return;
  }

  let societies = rawText
    .split(/[\n,\t]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  if (societies.length === 0) {
    showToast("No valid societies provided", true);
    return;
  }

  routeData[routeNumber] = {
    password: `Milk${routeNumber}`,
    societies: societies
  };

  saveRouteData();
  populateRouteSelector();
  populateAllDropdowns();

  document.getElementById("bulkRouteNumber").value = "";
  document.getElementById("bulkSocieties").value = "";

  showToast(`Route ${routeNumber} added with ${societies.length} societies!`, false);
}

// ========== ADMIN FILTERS & LOGS ==========
function populateAllDropdowns() {
  populateFilterDropdowns();
  populateSummaryDropdowns();
}

function populateFilterDropdowns() {
  const routeFilter = document.getElementById("filterRoute");
  if (routeFilter) {
    routeFilter.innerHTML = '<option value="">All Routes</option>';
    Object.keys(routeData).forEach(route => {
      const option = document.createElement("option");
      option.value = route;
      option.textContent = route;
      routeFilter.appendChild(option);
    });
  }
}

function populateSummaryDropdowns() {
  const summaryFilter = document.getElementById("summaryRouteFilter");
  if (summaryFilter) {
    summaryFilter.innerHTML = '<option value="">Select Route</option>';
    Object.keys(routeData).forEach(route => {
      const option = document.createElement("option");
      option.value = route;
      option.textContent = route;
      summaryFilter.appendChild(option);
    });
  }
}

function applyAdminFilters() {
  const date = document.getElementById("filterDate").value;
  const route = document.getElementById("filterRoute").value;
  const shift = document.getElementById("filterShift").value;

  const tableDiv = document.getElementById("adminStatusTable");
  tableDiv.innerHTML = "";

  if (!date) {
    showToast("Please select a date first", true);
    return;
  }

  let html = `<table>
    <tr>
      <th>#</th>
      <th>Route</th>
      <th>Shift</th>
      <th>Society</th>
      <th>Arrival</th>
      <th>Departure</th>
    </tr>`;

  let count = 0;

  Object.keys(routeData).forEach(routeKey => {
    if (route && route !== routeKey) return;

    ["Morning", "Evening"].forEach(shiftType => {
      if (shift && shift !== shiftType) return;

      const statusKey = `status_${routeKey}_${shiftType}_${date}`;
      const statusObj = JSON.parse(localStorage.getItem(statusKey)) || {};

      Object.keys(statusObj).forEach(society => {
        const status = statusObj[society];
        if (status.arrival || status.departure) {
          count++;
          html += `
            <tr>
              <td>${count}</td>
              <td>${routeKey}</td>
              <td>${shiftType}</td>
              <td>${society}</td>
              <td>${status.arrival || "-"}</td>
              <td>${status.departure || "-"}</td>
            </tr>
          `;
        }
      });
    });
  });

  html += "</table>";

  if (count === 0) {
    tableDiv.innerHTML = "<p>⚠️ No records found for the selected filters.</p>";
  } else {
    tableDiv.innerHTML = html;
  }
}

// ========== SUMMARY FUNCTIONS ==========
function loadAdminSummary() {
  const date = document.getElementById("summaryDateFilter").value;
  const route = document.getElementById("summaryRouteFilter").value;
  const tbody = document.querySelector("#summaryTable tbody");

  tbody.innerHTML = "";

  if (!date || !route) {
    showToast("Please select both date and route", true);
    return;
  }

  ["Morning", "Evening"].forEach(shift => {
    const statusKey = `status_${route}_${shift}_${date}`;
    const statusObj = JSON.parse(localStorage.getItem(statusKey)) || {};

    Object.keys(statusObj).forEach(society => {
      const status = statusObj[society];
      const row = document.createElement("tr");

      let duration = "-";
      if (status.arrival && status.departure) {
        duration = calculateDuration(status.arrival, status.departure);
      }

      row.innerHTML = `
        <td>${society}</td>
        <td>${status.arrival || "-"}</td>
        <td>${status.departure || "-"}</td>
        <td>${duration}</td>
      `;
      tbody.appendChild(row);
    });
  });
}

function calculateDuration(start, end) {
  try {
    const startTime = new Date("1970-01-01T" + start);
    const endTime = new Date("1970-01-01T" + end);
    const diff = (endTime - startTime) / 60000; // minutes

    if (isNaN(diff) || diff < 0) return "-";

    const hours = Math.floor(diff / 60);
    const minutes = Math.floor(diff % 60);
    return `${hours}h ${minutes}m`;
  } catch (e) {
    return "-";
  }
}

function exportCSV() {
  const rows = [["Society", "Arrival Time", "Departure Time", "Duration"]];
  const tableRows = document.querySelectorAll("#summaryTable tbody tr");

  tableRows.forEach(tr => {
    const cells = tr.querySelectorAll("td");
    const row = Array.from(cells).map(td => td.textContent.trim());
    rows.push(row);
  });

  const csvContent = rows.map(row => row.join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "visit_summary.csv";
  a.click();

  showToast("CSV exported successfully!", false);
}

// ========== LANGUAGE TOGGLE ==========
function toggleLanguage() {
  const labelRoute = document.getElementById("labelRoute");

  if (labelRoute.textContent === "Route Number") {
    // Switch to Hindi
    labelRoute.textContent = "मार्ग संख्या";
    document.getElementById("labelPassword").textContent = "पासवर्ड";
    document.getElementById("shiftLabel").textContent = "पाली चुनें";
    document.getElementById("driverLoginButton").textContent = "लॉगिन";
    document.getElementById("adminLoginTitle").textContent = "प्रशासक लॉगिन";
    showToast("भाषा बदली गई", false);
  } else {
    // Switch to English
    labelRoute.textContent = "Route Number";
    document.getElementById("labelPassword").textContent = "Password";
    document.getElementById("shiftLabel").textContent = "Select Shift";
    document.getElementById("driverLoginButton").textContent = "Login";
    document.getElementById("adminLoginTitle").textContent = "Admin Login";
    showToast("Language changed", false);
  }
}

// ========== UTILITY FUNCTIONS ==========
function showToast(msg, isError = false) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.className = "toast show " + (isError ? "error" : "info");
  setTimeout(() => toast.classList.remove("show"), 3000);
}

function resetApp() {
  if (confirm("Are you sure you want to reset all data? This cannot be undone.")) {
    localStorage.clear();
    location.reload();
  }
}

// ========== INITIALIZATION ==========
window.onload = function() {
  routeData = loadRouteData();
  saveRouteData(); // Save default data if none exists

  // Hide sections initially
  document.querySelector(".driver-section").classList.add("hidden");
  document.querySelector(".admin-section").classList.add("hidden");

  console.log("✅ Milk Route Tracker initialized successfully");
};
