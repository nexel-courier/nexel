/* NEXEL Courier Co. - Application Logic */

let activeEditingAWB = null;
let activeUpdatingAWB = null;

document.addEventListener('DOMContentLoaded', () => {
    initDemoStorage();
    setupAdminTabNavigation();
    setupCustomerNav();
    populateCustomerDropdown();
    renderCustomerAccountsTable();
    renderCarriersTable();
    renderInvoiceListTable();
    renderCarrierDropdownOptions();
});

// Initialize Persistent Data
function initDemoStorage() {
    if (!localStorage.getItem('nexel_accounts_v2')) {
        const defaultAccounts = [
            { fullName: "Customer Sample", email: "cust@gmail.com", mobile: "9876543210", username: "customer1", password: "123", address: "Mumbai, MH" }
        ];
        localStorage.setItem('nexel_accounts_v2', JSON.stringify(defaultAccounts));
    }

    if (!localStorage.getItem('nexel_shipments_v2')) {
        const defaultShipments = [
            {
                awb: "13854914336625",
                carrier: "delhivery",
                serviceType: "Doc express",
                dateTime: "2026-09-11T16:03",
                customerUser: "customer1",
                amount: "1500.00",
                actWeightVal: "4.8",
                actWeightUnit: "kg",
                volWeight: "4.80",
                senderName: "SHREE OM GRAFIK",
                senderMobile: "9820248511",
                receiverName: "Sanjay Rai",
                receiverMobile: "9820248511",
                destinationAddress: "KHORA COLONY, GALLI NO. 3, PRATAP VIHAR, SECTOR 62A, GAUTAM BUDDH NAGAR",
                city: "Ghaziabad",
                pincode: "201020",
                state: "Uttar Pradesh",
                prodName: "DRY SNACKS",
                sku: "FOOD",
                tax: "18",
                qty: "1",
                paymentMode: "PREPAID",
                shipmentVal: "1500.00",
                staff: "Ajay Kumar (STF-101)",
                photo: null,
                status: "In Transit",
                drsPhoto: null
            }
        ];
        localStorage.setItem('nexel_shipments_v2', JSON.stringify(defaultShipments));
    }

    if (!localStorage.getItem('nexel_staff_v2')) {
        const defaultStaff = [
            { id: "STF-101", name: "Ajay Kumar", mobile: "9000011111" }
        ];
        localStorage.setItem('nexel_staff_v2', JSON.stringify(defaultStaff));
    }

    if (!localStorage.getItem('nexel_carriers_v2')) {
        const defaultCarriers = [
            { name: "delhivery", cperson: "Bhavesh Shah", mobile: "7020392017", tele: "022-28001122", gstin: "27AAAAA0000A1Z5", email: "nexelcourier@gmail.com", web: "https://delhivery.com", trackLink: "https://delhivery.com/track", address: "Mumbai, Maharashtra" }
        ];
        localStorage.setItem('nexel_carriers_v2', JSON.stringify(defaultCarriers));
    }
}

// Unified Login Handling
function handleUnifiedLogin(e) {
    e.preventDefault();
    const user = document.getElementById('login-username').value.trim();
    const pass = document.getElementById('login-password').value.trim();
    const err = document.getElementById('login-error');

    if (user === "Admin" && pass === "1234") {
        err.textContent = "";
        document.getElementById('unified-login-form').reset();
        showScreen('admin-screen');
        refreshAdminViews();
        return;
    }

    const accounts = JSON.parse(localStorage.getItem('nexel_accounts_v2')) || [];
    const cust = accounts.find(a => a.username === user && a.password === pass);

    if (cust) {
        err.textContent = "";
        document.getElementById('unified-login-form').reset();
        localStorage.setItem('nexel_logged_customer', JSON.stringify(cust));
        showScreen('customer-screen');
        navigateToCustomerSection('cust-dashboard-section');
        document.getElementById('logged-username-display').textContent = cust.fullName || cust.username;
        renderCustomerShipmentsTable(cust.username);
        return;
    }

    err.textContent = "Invalid username or password.";
}

function logoutCustomer() {
    localStorage.removeItem('nexel_logged_customer');
    showScreen('customer-screen');
    navigateToCustomerSection('cust-home-section');
}

function logoutAdmin() {
    showScreen('customer-screen');
    navigateToCustomerSection('cust-home-section');
}

function showScreen(screenId) {
    document.querySelectorAll('.app-screen').forEach(s => s.classList.remove('active-screen'));
    document.getElementById(screenId).classList.add('active-screen');
}

// Admin Navigation
function setupAdminTabNavigation() {
    const links = document.querySelectorAll('.admin-nav-link[data-admin-tab]');
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = link.getAttribute('data-admin-tab');
            document.querySelectorAll('.admin-tab-content').forEach(t => t.classList.remove('active-admin-tab'));
            document.querySelectorAll('.admin-nav-link').forEach(l => l.classList.remove('active'));

            document.getElementById(target).classList.add('active-admin-tab');
            link.classList.add('active');
        });
    });
}

function refreshAdminViews() {
    renderAdminShipmentsTable();
    updateDashboardStats();
    populateCustomerDropdown();
    renderStaffDropdown();
    renderAdminStaffTable();
    renderCustomerAccountsTable();
    renderCarriersTable();
    renderInvoiceListTable();
    renderCarrierDropdownOptions();
}

// Fleet Carriers Management with Edit/Delete
function openNewCarrierModal(editName = null) {
    const modalTitle = document.getElementById('carrier-modal-title');
    const form = document.getElementById('new-carrier-form');
    form.reset();

    if (editName) {
        const carriers = JSON.parse(localStorage.getItem('nexel_carriers_v2')) || [];
        const c = carriers.find(item => item.name === editName);
        if (c) {
            modalTitle.textContent = `Edit Carrier (${editName})`;
            document.getElementById('edit-carrier-orig-name').value = c.name;
            document.getElementById('carr-name').value = c.name;
            document.getElementById('carr-cperson').value = c.cperson;
            document.getElementById('carr-mobile').value = c.mobile;
            document.getElementById('carr-tele').value = c.tele;
            document.getElementById('carr-gstin').value = c.gstin;
            document.getElementById('carr-email').value = c.email;
            document.getElementById('carr-web').value = c.web;
            document.getElementById('carr-track-link').value = c.trackLink;
            document.getElementById('carr-address').value = c.address;
        }
    } else {
        modalTitle.textContent = "New Fleet Carrier";
        document.getElementById('edit-carrier-orig-name').value = "";
    }
    document.getElementById('new-carrier-modal').classList.remove('hidden');
}

function closeNewCarrierModal() {
    document.getElementById('new-carrier-modal').classList.add('hidden');
    document.getElementById('new-carrier-form').reset();
}

function handleSaveNewCarrier(e) {
    e.preventDefault();
    const origName = document.getElementById('edit-carrier-orig-name').value.trim();
    const name = document.getElementById('carr-name').value.trim();
    const cperson = document.getElementById('carr-cperson').value.trim();
    const mobile = document.getElementById('carr-mobile').value.trim();
    const tele = document.getElementById('carr-tele').value.trim();
    const gstin = document.getElementById('carr-gstin').value.trim();
    const email = document.getElementById('carr-email').value.trim();
    const web = document.getElementById('carr-web').value.trim();
    const trackLink = document.getElementById('carr-track-link').value.trim();
    const address = document.getElementById('carr-address').value.trim();

    let carriers = JSON.parse(localStorage.getItem('nexel_carriers_v2')) || [];

    if (origName) {
        carriers = carriers.map(c => c.name === origName ? { name, cperson, mobile, tele, gstin, email, web, trackLink, address } : c);
    } else {
        carriers.push({ name, cperson, mobile, tele, gstin, email, web, trackLink, address });
    }

    localStorage.setItem('nexel_carriers_v2', JSON.stringify(carriers));
    renderCarrierDropdownOptions();
    renderCarriersTable();
    closeNewCarrierModal();
}

function renderCarriersTable() {
    const carriers = JSON.parse(localStorage.getItem('nexel_carriers_v2')) || [];
    const tbody = document.querySelector('#carriers-directory-table tbody');
    if (!tbody) return;
    tbody.innerHTML = "";

    carriers.forEach(c => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${c.name}</strong></td>
            <td>${c.cperson}</td>
            <td>${c.mobile}</td>
            <td>${c.gstin}</td>
            <td>
                <div class="table-actions-cell">
                    <button class="btn btn-secondary btn-sm" onclick="openNewCarrierModal('${c.name}')">Edit</button>
                    <button class="btn btn-primary btn-sm" onclick="deleteCarrier('${c.name}')">Delete</button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function deleteCarrier(name) {
    if (confirm(`Delete carrier ${name}?`)) {
        let carriers = JSON.parse(localStorage.getItem('nexel_carriers_v2')) || [];
        carriers = carriers.filter(c => c.name !== name);
        localStorage.setItem('nexel_carriers_v2', JSON.stringify(carriers));
        renderCarrierDropdownOptions();
        renderCarriersTable();
    }
}

function renderCarrierDropdownOptions() {
    const select = document.getElementById('add-carrier');
    if (!select) return;
    const carriers = JSON.parse(localStorage.getItem('nexel_carriers_v2')) || [];
    const defaultList = ["Mark Express", "Anjani Courier", "Nandan Courier", "nexel courier", "delhivery", "trackon", "skysking", "fedex", "dhl", "ups", "atlantic", "professional", "dtdc"];
    
    let combined = [...defaultList];
    carriers.forEach(c => {
        if (!combined.includes(c.name)) combined.push(c.name);
    });

    select.innerHTML = '<option value="">-- Select Carrier --</option>';
    combined.forEach(name => {
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        select.appendChild(opt);
    });
}

// Customer Account Management with Edit/Delete
function handleAdminCreateAccount(e) {
    e.preventDefault();
    const origUsername = document.getElementById('edit-account-username').value.trim();
    const fullName = document.getElementById('acc-cname').value.trim();
    const email = document.getElementById('acc-email').value.trim();
    const mobile = document.getElementById('acc-mob').value.trim();
    const username = document.getElementById('acc-username').value.trim();
    const password = document.getElementById('acc-pass').value.trim();
    const address = document.getElementById('acc-address').value.trim();
    const msg = document.getElementById('acc-create-msg');

    let accounts = JSON.parse(localStorage.getItem('nexel_accounts_v2')) || [];

    if (origUsername) {
        accounts = accounts.map(a => a.username === origUsername ? { fullName, email, mobile, username, password, address } : a);
        document.getElementById('edit-account-username').value = "";
    } else {
        if (accounts.some(a => a.username === username)) {
            msg.className = "error-msg";
            msg.textContent = "Username already exists.";
            return;
        }
        accounts.push({ fullName, email, mobile, username, password, address });
    }

    localStorage.setItem('nexel_accounts_v2', JSON.stringify(accounts));
    msg.className = "success-msg";
    msg.textContent = `Customer account saved successfully!`;
    document.getElementById('admin-create-account-form').reset();
    populateCustomerDropdown();
    renderCustomerAccountsTable();

    setTimeout(() => { msg.textContent = ""; }, 3000);
}

function editCustomerAccount(username) {
    const accounts = JSON.parse(localStorage.getItem('nexel_accounts_v2')) || [];
    const a = accounts.find(item => item.username === username);
    if (!a) return;

    document.getElementById('edit-account-username').value = a.username;
    document.getElementById('acc-cname').value = a.fullName;
    document.getElementById('acc-email').value = a.email;
    document.getElementById('acc-mob').value = a.mobile;
    document.getElementById('acc-username').value = a.username;
    document.getElementById('acc-pass').value = a.password;
    document.getElementById('acc-address').value = a.address;
}

function deleteCustomerAccount(username) {
    if (confirm(`Delete customer account ${username}?`)) {
        let accounts = JSON.parse(localStorage.getItem('nexel_accounts_v2')) || [];
        accounts = accounts.filter(a => a.username !== username);
        localStorage.setItem('nexel_accounts_v2', JSON.stringify(accounts));
        populateCustomerDropdown();
        renderCustomerAccountsTable();
    }
}

function renderCustomerAccountsTable() {
    const accounts = JSON.parse(localStorage.getItem('nexel_accounts_v2')) || [];
    const tbody = document.querySelector('#customer-accounts-table tbody');
    if (!tbody) return;
    tbody.innerHTML = "";

    accounts.forEach(a => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${a.fullName}</td>
            <td><strong>${a.username}</strong></td>
            <td>${a.password}</td>
            <td>${a.mobile}</td>
            <td>${a.email}</td>
            <td>
                <div class="table-actions-cell">
                    <button class="btn btn-secondary btn-sm" onclick="editCustomerAccount('${a.username}')">Edit</button>
                    <button class="btn btn-primary btn-sm" onclick="deleteCustomerAccount('${a.username}')">Delete</button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function populateCustomerDropdown() {
    const select = document.getElementById('add-customer-user');
    if (!select) return;
    const accounts = JSON.parse(localStorage.getItem('nexel_accounts_v2')) || [];
    select.innerHTML = '<option value="">-- Select Customer Account --</option>';
    accounts.forEach(a => {
        const opt = document.createElement('option');
        opt.value = a.username;
        opt.textContent = `${a.fullName} (${a.username})`;
        select.appendChild(opt);
    });
}

// Volumetric Calculation
function calcVolumetricWeight() {
    const l = parseFloat(document.getElementById('vol-length').value) || 0;
    const w = parseFloat(document.getElementById('vol-width').value) || 0;
    const h = parseFloat(document.getElementById('vol-height').value) || 0;

    const vol = (l * w * h) / 5000;
    document.getElementById('add-vol-weight').value = vol > 0 ? vol.toFixed(2) : "";
}

// Add/Edit Shipment
function handleAddShipment(e) {
    e.preventDefault();
    const awb = document.getElementById('add-awb').value.trim();
    const photoInput = document.getElementById('add-photo');

    const shipmentData = {
        awb: awb,
        carrier: document.getElementById('add-carrier').value,
        serviceType: document.getElementById('add-service-type').value,
        dateTime: document.getElementById('add-datetime').value,
        customerUser: document.getElementById('add-customer-user').value,
        amount: document.getElementById('add-amount').value,
        actWeightVal: document.getElementById('add-act-weight-val').value,
        actWeightUnit: document.getElementById('add-act-weight-unit').value,
        volWeight: document.getElementById('add-vol-weight').value || "0.00",
        senderName: document.getElementById('add-sender-name').value.trim(),
        senderMobile: document.getElementById('add-sender-mobile').value.trim(),
        receiverName: document.getElementById('add-recv-name').value.trim(),
        receiverMobile: document.getElementById('add-recv-mobile').value.trim(),
        destinationAddress: document.getElementById('add-dest').value.trim(),
        city: document.getElementById('add-city').value.trim(),
        pincode: document.getElementById('add-pincode').value.trim(),
        state: document.getElementById('add-state').value.trim(),
        prodName: document.getElementById('add-prod-name').value.trim(),
        sku: document.getElementById('add-sku').value.trim(),
        tax: document.getElementById('add-tax').value,
        qty: document.getElementById('add-qty').value,
        paymentMode: document.getElementById('add-payment-mode').value,
        shipmentVal: document.getElementById('add-shipment-val').value,
        staff: document.getElementById('add-staff').value,
        status: document.getElementById('add-status').value
    };

    let shipments = JSON.parse(localStorage.getItem('nexel_shipments_v2')) || [];

    const saveRecord = (photoBase64) => {
        if (photoBase64) shipmentData.photo = photoBase64;
        else if (activeEditingAWB) {
            const existing = shipments.find(s => s.awb === activeEditingAWB);
            if (existing && existing.photo) shipmentData.photo = existing.photo;
        }

        if (activeEditingAWB) {
            shipments = shipments.map(s => s.awb === activeEditingAWB ? { ...s, ...shipmentData } : s);
            activeEditingAWB = null;
        } else {
            shipments.push(shipmentData);
        }

        localStorage.setItem('nexel_shipments_v2', JSON.stringify(shipments));
        document.getElementById('add-shipment-msg').textContent = "Shipment saved successfully!";
        resetShipmentForm();
        refreshAdminViews();
        setTimeout(() => { document.getElementById('add-shipment-msg').textContent = ""; }, 3000);
    };

    if (photoInput.files && photoInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function (evt) { saveRecord(evt.target.result); };
        reader.readAsDataURL(photoInput.files[0]);
    } else {
        saveRecord(null);
    }
}

function editShipment(awb) {
    const shipments = JSON.parse(localStorage.getItem('nexel_shipments_v2')) || [];
    const s = shipments.find(item => item.awb === awb);
    if (!s) return;

    activeEditingAWB = awb;
    document.getElementById('shipment-form-title').textContent = `Edit Shipment (${awb})`;
    document.getElementById('add-awb').value = s.awb;
    document.getElementById('add-carrier').value = s.carrier;
    document.getElementById('add-service-type').value = s.serviceType;
    document.getElementById('add-datetime').value = s.dateTime;
    document.getElementById('add-customer-user').value = s.customerUser;
    document.getElementById('add-amount').value = s.amount;
    document.getElementById('add-act-weight-val').value = s.actWeightVal;
    document.getElementById('add-act-weight-unit').value = s.actWeightUnit;
    document.getElementById('add-vol-weight').value = s.volWeight;
    document.getElementById('add-sender-name').value = s.senderName;
    document.getElementById('add-sender-mobile').value = s.senderMobile;
    document.getElementById('add-recv-name').value = s.receiverName;
    document.getElementById('add-recv-mobile').value = s.receiverMobile;
    document.getElementById('add-dest').value = s.destinationAddress;
    document.getElementById('add-city').value = s.city || "";
    document.getElementById('add-pincode').value = s.pincode || "";
    document.getElementById('add-state').value = s.state || "";
    document.getElementById('add-prod-name').value = s.prodName || "";
    document.getElementById('add-sku').value = s.sku || "";
    document.getElementById('add-tax').value = s.tax || "";
    document.getElementById('add-qty').value = s.qty || "1";
    document.getElementById('add-payment-mode').value = s.paymentMode || "PREPAID";
    document.getElementById('add-shipment-val').value = s.shipmentVal || "";
    document.getElementById('add-staff').value = s.staff;
    document.getElementById('add-status').value = s.status;

    document.querySelectorAll('.admin-tab-content').forEach(t => t.classList.remove('active-admin-tab'));
    document.getElementById('admin-tab-add').classList.add('active-admin-tab');
}

function resetShipmentForm() {
    activeEditingAWB = null;
    document.getElementById('shipment-form-title').textContent = "Add New Shipment";
    document.getElementById('add-shipment-form').reset();
}

function renderAdminShipmentsTable() {
    const shipments = JSON.parse(localStorage.getItem('nexel_shipments_v2')) || [];
    const tbody = document.querySelector('#admin-shipments-table tbody');
    if (!tbody) return;
    tbody.innerHTML = "";

    shipments.forEach(s => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${s.awb}</strong></td>
            <td>${s.carrier}</td>
            <td>${s.serviceType}</td>
            <td>${s.receiverName}</td>
            <td>${s.city \vert{}\vert{} '-'} /${s.state || '-'}</td>
            <td>${s.prodName \vert{}\vert{} '-'} (${s.sku || '-'})</td>
            <td>₹${s.amount}</td>
            <td><span class="status-badge ${getStatusBadgeClass(s.status)}">${s.status}</span></td>
            <td>
                <div class="table-actions-cell">
                    <button class="btn btn-secondary btn-sm" onclick="editShipment('${s.awb}')">Edit</button>
                    <button class="btn btn-accent btn-sm" onclick="openStatusUpdateModal('${s.awb}')">Change Status</button>
                    <button class="btn btn-primary btn-sm" onclick="deleteShipment('${s.awb}')">Delete</button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function deleteShipment(awb) {
    if (confirm(`Delete shipment ${awb}?`)) {
        let shipments = JSON.parse(localStorage.getItem('nexel_shipments_v2')) || [];
        shipments = shipments.filter(s => s.awb !== awb);
        localStorage.setItem('nexel_shipments_v2', JSON.stringify(shipments));
        refreshAdminViews();
    }
}

// Status Change & DRS Photo Modal
function openStatusUpdateModal(awb) {
    const shipments = JSON.parse(localStorage.getItem('nexel_shipments_v2')) || [];
    const s = shipments.find(item => item.awb === awb);
    if (!s) return;

    activeUpdatingAWB = awb;
    document.getElementById('modal-awb-text').textContent = awb;
    document.getElementById('modal-curr-status').textContent = s.status;
    document.getElementById('modal-new-status').value = s.status;
    document.getElementById('drs-upload-container').classList.add('hidden');

    document.getElementById('modal-new-status').onchange = function() {
        if (this.value === "Delivered") {
            document.getElementById('drs-upload-container').classList.remove('hidden');
        } else {
            document.getElementById('drs-upload-container').classList.add('hidden');
        }
    };

    if (s.status === "Delivered") {
        document.getElementById('drs-upload-container').classList.remove('hidden');
    }

    document.getElementById('status-modal').classList.remove('hidden');
}

function closeStatusModal() {
    document.getElementById('status-modal').classList.add('hidden');
    activeUpdatingAWB = null;
}

function confirmStatusUpdate() {
    const shipments = JSON.parse(localStorage.getItem('nexel_shipments_v2')) || [];
    const s = shipments.find(item => item.awb === activeUpdatingAWB);
    if (!s) return;

    const newStatus = document.getElementById('modal-new-status').value;

    if (newStatus === "Delivered") {
        const drsInput = document.getElementById('drs-photo-input');
        if (!drsInput.files || !drsInput.files[0]) {
            if (!s.drsPhoto) {
                alert("Compulsory: Please upload a DRS Photo to mark as Delivered.");
                return;
            }
        }
    }

    const finalize = (drsBase64) => {
        if (drsBase64) s.drsPhoto = drsBase64;
        s.status = newStatus;
        localStorage.setItem('nexel_shipments_v2', JSON.stringify(shipments));
        closeStatusModal();
        refreshAdminViews();
    };

    const drsInput = document.getElementById('drs-photo-input');
    if (drsInput.files && drsInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) { finalize(e.target.result); };
        reader.readAsDataURL(drsInput.files[0]);
    } else {
        finalize(null);
    }
}

// Admin Track Shipment View
function adminTrackSearch() {
    const query = document.getElementById('admin-tracking-input').value.trim();
    const box = document.getElementById('admin-tracking-result');
    const shipments = JSON.parse(localStorage.getItem('nexel_shipments_v2')) || [];
    const s = shipments.find(item => item.awb.toLowerCase() === query.toLowerCase());

    box.style.display = "block";
    if (s) {
        let photoHtml = s.photo ? `<div style="margin-top:12px;"><strong>Shipment Photo:</strong><br><img src="${s.photo}" style="max-width:220px; border-radius:6px; margin-top:5px; border:1px solid #ccc;"></div>` : `<p><em>No shipment photo uploaded.</em></p>`;
        let drsHtml = s.drsPhoto ? `<div style="margin-top:12px;"><strong>Delivery Receipt (DRS) Photo:</strong><br><img src="${s.drsPhoto}" style="max-width:220px; border-radius:6px; margin-top:5px; border:1px solid #ccc;"></div>` : `<p style="margin-top:10px;"><em>No DRS photo uploaded yet.</em></p>`;

        box.innerHTML = `
            <h4>AWB / Tracking ID: ${s.awb}</h4>
            <p><strong>Carrier:</strong> ${s.carrier}</p>
            <p><strong>Status:</strong> <span class="status-badge ${getStatusBadgeClass(s.status)}">${s.status}</span></p>
            <p><strong>Receiver:</strong> ${s.receiverName} (${s.receiverMobile})</p>
            <p><strong>Destination:</strong> ${s.destinationAddress},${s.city}, ${s.state} -${s.pincode}</p>
            <p><strong>Product & SKU:</strong> ${s.prodName} (SKU:${s.sku})</p>
            <p><strong>Payment Mode:</strong> ${s.paymentMode} \vert{} <strong>Amount:</strong> ₹${s.amount}</p>
            <div style="display: flex; gap: 20px; flex-wrap: wrap;">
                <div>${photoHtml}</div>
                <div>${drsHtml}</div>
            </div>
        `;
    } else {
        box.innerHTML = `<p style="color: var(--color-red);">Consignment AWB not found in records.</p>`;
    }
}

// Thermal Shipping Label Generator (Exact 1-Page Layout)
function renderInvoiceListTable() {
    const shipments = JSON.parse(localStorage.getItem('nexel_shipments_v2')) || [];
    const tbody = document.querySelector('#admin-invoice-list-table tbody');
    if (!tbody) return;
    tbody.innerHTML = "";

    shipments.forEach(s => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${s.awb}</strong></td>
            <td>${s.receiverName}</td>
            <td>${s.city || '-'}</td>
            <td>${s.prodName \vert{}\vert{} '-'} (${s.sku || '-'})</td>
            <td><strong style="color:var(--color-green);">${s.paymentMode || 'PREPAID'}</strong></td>
            <td>
                <button class="btn btn-accent btn-sm" onclick="generateAndOpenInvoice('${s.awb}')">View / Print Label</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function generateAndOpenInvoice(awb) {
    const shipments = JSON.parse(localStorage.getItem('nexel_shipments_v2')) || [];
    const s = shipments.find(item => item.awb === awb);
    if (!s) return;

    const formattedDate = s.dateTime ? s.dateTime.replace('T', ', ') : "Sep 11, 2026, 16:03";
    const carrierName = s.carrier ? s.carrier.toUpperCase() : "DELHIVERY";
    const returnAddress = "NEXEL COURIER CO., Shop No.50, Agarwal Nagri, Nr. Bassein Catholic Bank, Opp. Veena Saraswati, Nalasopara Vasai Link Road, Vasai East, Vasai, MH, 401208";
    const orderIdStr = `${s.senderName.toUpperCase()}${s.senderMobile}`;

    const htmlContent = `
        <div style="font-family: Arial, sans-serif; color: black; font-size: 13px; line-height: 1.3; border: 2px solid black; padding: 12px; background: white; width: 100%; max-width: 580px; margin: 0 auto;">
            <!-- Top Box: Ship to -->
            <div style="border-bottom: 2px solid black; padding-bottom: 8px; margin-bottom: 8px;">
                <div style="font-size: 14px; font-weight: bold; margin-bottom: 3px;">Ship to: ${s.receiverName}</div>
                <div style="font-size: 12px; text-transform: uppercase;">${s.destinationAddress},${s.city}, ${s.state} -${s.pincode}</div>
                <div style="font-size: 12px; margin-top: 3px;">${s.receiverMobile}</div>
            </div>

            <!-- Carrier & Barcode 1 -->
            <div style="border-bottom: 2px solid black; padding-bottom: 8px; margin-bottom: 8px; text-align: center;">
                <div style="font-size: 13px; font-weight: bold; text-align: left; margin-bottom: 4px;">${carrierName}_Surface:${s.awb}</div>
                <svg id="barcode-elem-1" style="width: 100%; height: 55px;"></svg>
            </div>

            <!-- Middle Split Box: Payment Mode & Order Details -->
            <div style="display: grid; grid-template-columns: 1fr 1.3fr; border-bottom: 2px solid black; margin-bottom: 8px;">
                <div style="display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: bold; border-right: 2px solid black; padding: 10px; background: #fff;">
                    ${s.paymentMode || 'PREPAID'}
                </div>
                <div style="padding: 6px 10px; font-size: 11.5px;">
                    <div><strong>Order Date:</strong> ${formattedDate}</div>
                    <div><strong>Invoice No:</strong> ${orderIdStr}</div>
                    <div><strong>Invoice Date:</strong> ${formattedDate.split(',')[0]}</div>
                    <div><strong>Pieces:</strong> ${s.qty || 1}</div>
                    <div><strong>Dim | Wt:</strong> ${s.volWeight || '4.8'} Kg</div>
                </div>
            </div>

            <!-- Order Id & Barcode 2 -->
            <div style="border-bottom: 2px solid black; padding-bottom: 8px; margin-bottom: 8px; text-align: center;">
                <div style="font-size: 13px; font-weight: bold; text-align: left; margin-bottom: 4px;">Order Id: ${orderIdStr}</div>
                <svg id="barcode-elem-2" style="width: 100%; height: 55px;"></svg>
            </div>

            <!-- Items Table -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 12px; border: 1px solid black;">
                <thead>
                    <tr style="border-bottom: 1px solid black; background: #f2f2f2;">
                        <th style="border: 1px solid black; text-align: left; padding: 4px; width: 10%;">#</th>
                        <th style="border: 1px solid black; text-align: left; padding: 4px; width: 65%;">Product Name & SKU</th>
                        <th style="border: 1px solid black; text-align: center; padding: 4px; width: 10%;">Qty</th>
                        <th style="border: 1px solid black; text-align: center; padding: 4px; width: 15%;">IGST</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="border: 1px solid black; padding: 4px; text-align: center;">1</td>
                        <td style="border: 1px solid black; padding: 4px;">${s.prodName} (SKU:${s.sku})</td>
                        <td style="border: 1px solid black; padding: 4px; text-align: center;">${s.qty || 1}</td>
                        <td style="border: 1px solid black; padding: 4px; text-align: center;">-</td>
                    </tr>
                </tbody>
            </table>

            <!-- Bottom Return Address -->
            <div style="border-top: 2px solid black; padding-top: 6px; font-size: 11px;">
                <strong>Return Address:</strong> ${returnAddress}
            </div>
        </div>
    `;

    document.getElementById('invoice-printable-area').innerHTML = htmlContent;
    document.getElementById('invoice-modal').classList.remove('hidden');

    // Generate real scannable barcodes using JsBarcode
    setTimeout(() => {
        try {
            JsBarcode("#barcode-elem-1", s.awb, {
                format: "CODE128",
                displayValue: false,
                height: 50,
                margin: 2
            });
            JsBarcode("#barcode-elem-2", s.awb, {
                format: "CODE128",
                displayValue: false,
                height: 50,
                margin: 2
            });
        } catch (err) {
            console.error("Barcode generation error:", err);
        }
    }, 100);
}

function triggerPrint() {
    window.print();
}

function closeInvoiceModal() {
    document.getElementById('invoice-modal').classList.add('hidden');
}

// Delivery Staff Management with Edit/Delete
function handleAddStaff(e) {
    e.preventDefault();
    const origId = document.getElementById('edit-staff-id-val').value.trim();
    const name = document.getElementById('staff-name').value.trim();
    const mobile = document.getElementById('staff-mobile').value.trim();
    const id = document.getElementById('staff-id').value.trim();

    let staff = JSON.parse(localStorage.getItem('nexel_staff_v2')) || [];

    if (origId) {
        staff = staff.map(st => st.id === origId ? { id, name, mobile } : st);
        document.getElementById('edit-staff-id-val').value = "";
        document.getElementById('staff-form-title').textContent = "Add Staff";
    } else {
        staff.push({ id, name, mobile });
    }

    localStorage.setItem('nexel_staff_v2', JSON.stringify(staff));
    document.getElementById('add-staff-form').reset();
    renderStaffDropdown();
    renderAdminStaffTable();
}

function editStaff(id) {
    const staff = JSON.parse(localStorage.getItem('nexel_staff_v2')) || [];
    const st = staff.find(item => item.id === id);
    if (!st) return;

    document.getElementById('edit-staff-id-val').value = st.id;
    document.getElementById('staff-form-title').textContent = `Edit Staff (${st.id})`;
    document.getElementById('staff-name').value = st.name;
    document.getElementById('staff-mobile').value = st.mobile;
    document.getElementById('staff-id').value = st.id;
}

function deleteStaff(id) {
    if (confirm(`Remove staff ${id}?`)) {
        let staff = JSON.parse(localStorage.getItem('nexel_staff_v2')) || [];
        staff = staff.filter(s => s.id !== id);
        localStorage.setItem('nexel_staff_v2', JSON.stringify(staff));
        renderStaffDropdown();
        renderAdminStaffTable();
    }
}

function renderStaffDropdown() {
    const select = document.getElementById('add-staff');
    if (!select) return;
    const staff = JSON.parse(localStorage.getItem('nexel_staff_v2')) || [];
    select.innerHTML = '<option value="">-- Select Delivery Staff --</option>';
    staff.forEach(st => {
        const opt = document.createElement('option');
        opt.value = `${st.name} (${st.id})`;
        opt.textContent = `${st.name} (${st.id})`;
        select.appendChild(opt);
    });
}

function renderAdminStaffTable() {
    const staff = JSON.parse(localStorage.getItem('nexel_staff_v2')) || [];
    const tbody = document.querySelector('#admin-staff-table tbody');
    if (!tbody) return;
    tbody.innerHTML = "";
    staff.forEach(st => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${st.id}</td>
            <td>${st.name}</td>
            <td>${st.mobile}</td>
            <td>
                <div class="table-actions-cell">
                    <button class="btn btn-secondary btn-sm" onclick="editStaff('${st
