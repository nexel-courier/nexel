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
                awb: "NXL-1001",
                carrier: "nexel courier",
                serviceType: "Doc express",
                dateTime: "2026-10-17T10:30",
                customerUser: "customer1",
                amount: "250.00",
                actWeightVal: "0.5",
                actWeightUnit: "kg",
                volWeight: "0.20",
                senderName: "Bhavesh Shah",
                senderMobile: "7020392017",
                receiverName: "Amit Kumar",
                receiverMobile: "9988776655",
                destinationAddress: "Pune City",
                city: "Pune",
                pincode: "411001",
                state: "Maharashtra",
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
            { name: "nexel courier", cperson: "Bhavesh Shah", mobile: "7020392017", tele: "022-28001122", gstin: "27AAAAA0000A1Z5", email: "nexelcourier@gmail.com", web: "https://nexelcourier.com", trackLink: "https://nexelcourier.com/track", address: "Mumbai, Maharashtra" }
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
        renderCustomerShipmentsTable(cust.username);
        return;
    }

    err.textContent = "Invalid username or password.";
}

function logout() {
    localStorage.removeItem('nexel_logged_customer');
    showScreen('login-screen');
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
    updateReports();
}

// Fleet Carriers Management
function openNewCarrierModal() {
    document.getElementById('new-carrier-modal').classList.remove('hidden');
}

function closeNewCarrierModal() {
    document.getElementById('new-carrier-modal').classList.add('hidden');
    document.getElementById('new-carrier-form').reset();
}

function handleSaveNewCarrier(e) {
    e.preventDefault();
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
    carriers.push({ name, cperson, mobile, tele, gstin, email, web, trackLink, address });
    localStorage.setItem('nexel_carriers_v2', JSON.stringify(carriers));

    // Append to Carrier Select Dropdown
    const carrierSelect = document.getElementById('add-carrier');
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    carrierSelect.appendChild(opt);
    carrierSelect.value = name;

    renderCarriersTable();
    closeNewCarrierModal();
    alert(`Carrier '${name}' saved successfully!`);
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
            <td>${c.tele}</td>
            <td>${c.gstin}</td>
            <td>${c.email}</td>
            <td><a href="${c.web}" target="_blank">Website</a></td>
            <td><a href="${c.trackLink}" target="_blank">Track</a></td>
        `;
        tbody.appendChild(tr);
    });
}

// Customer Account Creation
function handleAdminCreateAccount(e) {
    e.preventDefault();
    const fullName = document.getElementById('acc-cname').value.trim();
    const email = document.getElementById('acc-email').value.trim();
    const mobile = document.getElementById('acc-mob').value.trim();
    const username = document.getElementById('acc-username').value.trim();
    const password = document.getElementById('acc-pass').value.trim();
    const address = document.getElementById('acc-address').value.trim();
    const msg = document.getElementById('acc-create-msg');

    let accounts = JSON.parse(localStorage.getItem('nexel_accounts_v2')) || [];
    if (accounts.some(a => a.username === username)) {
        msg.className = "error-msg";
        msg.textContent = "Username already exists.";
        return;
    }

    accounts.push({ fullName, email, mobile, username, password, address });
    localStorage.setItem('nexel_accounts_v2', JSON.stringify(accounts));

    msg.className = "success-msg";
    msg.textContent = `Customer account '${username}' created successfully!`;
    document.getElementById('admin-create-account-form').reset();
    populateCustomerDropdown();
    renderCustomerAccountsTable();

    setTimeout(() => { msg.textContent = ""; }, 3000);
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
            <td>${a.address}</td>
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
        staff: document.getElementById('add-staff').value,
        status: document.getElementById('add-status').value
    };

    let shipments = JSON.parse(localStorage.getItem('nexel_shipments_v2')) || [];

    const saveRecord = (photoBase64) => {
        if (photoBase64) shipmentData.photo = photoBase64;

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

// Render Admin Shipments Table
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
            <td>${s.senderName}</td>
            <td>${s.receiverName}</td>
            <td>${s.city || '-'} / ${s.state || '-'}</td>
            <td>${s.pincode || '-'}</td>
            <td>${s.actWeightVal} ${s.actWeightUnit}</td>
            <td>${s.volWeight} kg</td>
            <td>₹${s.amount}</td>
            <td><span class="status-badge ${getStatusBadgeClass(s.status)}">${s.status}</span></td>
            <td>
                <div class="table-actions-cell">
                    <button class="btn btn-secondary btn-sm" onclick="editShipment('${s.awb}')">Edit</button>
                    <button class="btn btn-accent btn-sm" onclick="openStatusUpdateModal('${s.awb}')">Update</button>
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

// Sequential Status Updates & DRS Photo Modal
function openStatusUpdateModal(awb) {
    const shipments = JSON.parse(localStorage.getItem('nexel_shipments_v2')) || [];
    const s = shipments.find(item => item.awb === awb);
    if (!s) return;

    activeUpdatingAWB = awb;
    const flow = ["Booked", "In Transit", "Out for Delivery", "Delivered"];
    const currIdx = flow.indexOf(s.status);

    if (currIdx >= flow.length - 1) {
        alert("This shipment is already Delivered.");
        return;
    }

    const nextStatus = flow[currIdx + 1];
    document.getElementById('modal-awb-text').textContent = awb;
    document.getElementById('modal-curr-status').textContent = s.status;
    document.getElementById('modal-next-status').textContent = nextStatus;

    const drsBox = document.getElementById('drs-upload-container');
    if (nextStatus === "Delivered") {
        drsBox.classList.remove('hidden');
    } else {
        drsBox.classList.add('hidden');
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

    const flow = ["Booked", "In Transit", "Out for Delivery", "Delivered"];
    const nextStatus = flow[flow.indexOf(s.status) + 1];

    if (nextStatus === "Delivered") {
        const drsInput = document.getElementById('drs-photo-input');
        if (!drsInput.files || !drsInput.files[0]) {
            alert("Compulsory: Please upload a DRS Photo to mark as Delivered.");
            return;
        }

        const reader = new FileReader();
        reader.onload = function (e) {
            s.drsPhoto = e.target.result;
            s.status = nextStatus;
            localStorage.setItem('nexel_shipments_v2', JSON.stringify(shipments));
            closeStatusModal();
            refreshAdminViews();
        };
        reader.readAsDataURL(drsInput.files[0]);
    } else {
        s.status = nextStatus;
        localStorage.setItem('nexel_shipments_v2', JSON.stringify(shipments));
        closeStatusModal();
        refreshAdminViews();
    }
}

// Stats & Staff Management
function updateDashboardStats() {
    const shipments = JSON.parse(localStorage.getItem('nexel_shipments_v2')) || [];
    document.getElementById('stat-total').textContent = shipments.length;
    document.getElementById('stat-pending').textContent = shipments.filter(s => s.status === 'Booked').length;
    document.getElementById('stat-transit').textContent = shipments.filter(s => s.status === 'In Transit' || s.status === 'Out for Delivery').length;
    document.getElementById('stat-delivered').textContent = shipments.filter(s => s.status === 'Delivered').length;
}

function handleAddStaff(e) {
    e.preventDefault();
    const name = document.getElementById('staff-name').value.trim();
    const mobile = document.getElementById('staff-mobile').value.trim();
    const id = document.getElementById('staff-id').value.trim();

    let staff = JSON.parse(localStorage.getItem('nexel_staff_v2')) || [];
    staff.push({ id, name, mobile });
    localStorage.setItem('nexel_staff_v2', JSON.stringify(staff));

    document.getElementById('add-staff-form').reset();
    renderStaffDropdown();
    renderAdminStaffTable();
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
            <td><button class="btn btn-primary btn-sm" onclick="deleteStaff('${st.id}')">Remove</button></td>
        `;
        tbody.appendChild(tr);
    });
}

function deleteStaff(id) {
    let staff = JSON.parse(localStorage.getItem('nexel_staff_v2')) || [];
    staff = staff.filter(s => s.id !== id);
    localStorage.setItem('nexel_staff_v2', JSON.stringify(staff));
    renderStaffDropdown();
    renderAdminStaffTable();
}

function updateReports() {
    const shipments = JSON.parse(localStorage.getItem('nexel_shipments_v2')) || [];
    if (document.getElementById('rep-total')) {
        document.getElementById('rep-total').textContent = shipments.length;
        document.getElementById('rep-delivered').textContent = shipments.filter(s => s.status === 'Delivered').length;
        document.getElementById('rep-transit').textContent = shipments.filter(s => s.status === 'In Transit' || s.status === 'Out for Delivery').length;
        document.getElementById('rep-pending').textContent = shipments.filter(s => s.status === 'Booked').length;
    }
}

// Customer Section Functions
function setupCustomerNav() {
    document.querySelectorAll('.cust-nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = link.getAttribute('data-target');
            navigateToCustomerSection(target);
            document.querySelectorAll('.cust-nav-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });
}

function navigateToCustomerSection(sectionId) {
    document.querySelectorAll('.cust-page-section').forEach(s => s.classList.remove('active-cust-section'));
    document.getElementById(sectionId).classList.add('active-cust-section');
}

function renderCustomerShipmentsTable(username) {
    const shipments = JSON.parse(localStorage.getItem('nexel_shipments_v2')) || [];
    const userShipments = shipments.filter(s => s.customerUser === username);
    const tbody = document.querySelector('#customer-shipments-table tbody');
    if (!tbody) return;
    tbody.innerHTML = "";

    userShipments.forEach(s => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${s.awb}</strong></td>
            <td>${s.carrier}</td>
            <td>${s.serviceType}</td>
            <td>${s.receiverName}</td>
            <td>${s.destinationAddress}</td>
            <td>${s.city || '-'} / ${s.state || '-'}</td>
            <td>${s.pincode || '-'}</td>
            <td>${s.dateTime.replace('T', ' ')}</td>
            <td><span class="status-badge ${getStatusBadgeClass(s.status)}">${s.status}</span></td>
            <td><button class="btn btn-secondary btn-sm" onclick="viewFullDetails('${s.awb}')">View</button></td>
        `;
        tbody.appendChild(tr);
    });
}

function custTrackSearch() {
    const query = document.getElementById('cust-tracking-input').value.trim();
    const box = document.getElementById('cust-tracking-result');
    const shipments = JSON.parse(localStorage.getItem('nexel_shipments_v2')) || [];
    const s = shipments.find(item => item.awb.toLowerCase() === query.toLowerCase());

    box.style.display = "block";
    if (s) {
        box.innerHTML = `
            <h4>AWB: ${s.awb}</h4>
            <p><strong>Carrier:</strong> ${s.carrier}</p>
            <p><strong>Status:</strong> <span class="status-badge ${getStatusBadgeClass(s.status)}">${s.status}</span></p>
            <p><strong>Destination:</strong> ${s.destinationAddress}, ${s.city || ''}, ${s.state || ''} - ${s.pincode || ''}</p>
            <p><strong>Receiver:</strong> ${s.receiverName}</p>
        `;
    } else {
        box.innerHTML = `<p style="color: var(--color-red);">AWB / Tracking ID not found.</p>`;
    }
}

function viewFullDetails(awb) {
    const shipments = JSON.parse(localStorage.getItem('nexel_shipments_v2')) || [];
    const s = shipments.find(item => item.awb === awb);
    if (!s) return;

    let bodyHTML = `
        <p><strong>AWB No.:</strong> ${s.awb}</p>
        <p><strong>Carrier:</strong> ${s.carrier}</p>
        <p><strong>Service Type:</strong> ${s.serviceType}</p>
        <p><strong>Status:</strong> ${s.status}</p>
        <p><strong>Sender:</strong> ${s.senderName} (${s.senderMobile})</p>
        <p><strong>Receiver:</strong> ${s.receiverName} (${s.receiverMobile})</p>
        <p><strong>Destination:</strong> ${s.destinationAddress}, ${s.city || ''}, ${s.state || ''} - ${s.pincode || ''}</p>
        <p><strong>Actual Weight:</strong> ${s.actWeightVal} ${s.actWeightUnit}</p>
        <p><strong>Volumetric Weight:</strong> ${s.volWeight} kg</p>
        <p><strong>Amount:</strong> ₹${s.amount}</p>
    `;

    if (s.photo) bodyHTML += `<div style="margin-top:10px;"><strong>Shipment Photo:</strong><br><img src="${s.photo}" style="max-width:100%; border-radius:6px; margin-top:5px;"></div>`;
    if (s.drsPhoto) bodyHTML += `<div style="margin-top:10px;"><strong>Delivery Receipt (DRS):</strong><br><img src="${s.drsPhoto}" style="max-width:100%; border-radius:6px; margin-top:5px;"></div>`;

    document.getElementById('details-modal-body').innerHTML = bodyHTML;
    document.getElementById('details-modal').classList.remove('hidden');
}

function closeDetailsModal() {
    document.getElementById('details-modal').classList.add('hidden');
}

function getStatusBadgeClass(status) {
    switch (status) {
        case 'Booked': return 'status-booked';
        case 'In Transit': return 'status-transit';
        case 'Out for Delivery': return 'status-out';
        case 'Delivered': return 'status-delivered';
        default: return 'status-booked';
    }
}