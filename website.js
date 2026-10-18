/* NEXEL Courier Co. - Application Logic & Firebase Cloud Sync */

import { initializeApp } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js";
import { getFirestore, collection, getDocs, setDoc, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBNVu3cb_eZzB9Jt8BXv3lXWtubPCayfBw",
    authDomain: "nexel-f9910.firebaseapp.com",
    projectId: "nexel-f9910",
    storageBucket: "nexel-f9910.firebasestorage.app",
    messagingSenderId: "1055930751401",
    appId: "1:1055930751401:web:4655988b3009576accccb8",
    measurementId: "G-595VGRL56B"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let activeEditingAWB = null;
let activeUpdatingAWB = null;

document.addEventListener('DOMContentLoaded', async () => {
    await initFirebaseStorage();
    setupAdminTabNavigation();
    setupCustomerNav();
    refreshAdminViews();
});

// Initialize & Sync with Firebase Firestore
async function initFirebaseStorage() {
    try {
        const accSnap = await getDocs(collection(db, "accounts"));
        if (accSnap.empty) {
            const defaultAccounts = [
                { fullName: "Customer Sample", email: "cust@gmail.com", mobile: "9876543210", username: "customer1", password: "123", address: "Mumbai, MH" }
            ];
            for (const acc of defaultAccounts) {
                await setDoc(doc(db, "accounts", acc.username), acc);
            }
        }

        const shipSnap = await getDocs(collection(db, "shipments"));
        if (shipSnap.empty) {
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
            for (const s of defaultShipments) {
                await setDoc(doc(db, "shipments", s.awb), s);
            }
        }

        const staffSnap = await getDocs(collection(db, "staff"));
        if (staffSnap.empty) {
            await setDoc(doc(db, "staff", "STF-101"), { id: "STF-101", name: "Ajay Kumar", mobile: "9000011111" });
        }

        const carrSnap = await getDocs(collection(db, "carriers"));
        if (carrSnap.empty) {
            await setDoc(doc(db, "carriers", "delhivery"), { name: "delhivery", cperson: "Bhavesh Shah", mobile: "7020392017", tele: "022-28001122", gstin: "27AAAAA0000A1Z5", email: "nexelcourier@gmail.com", web: "https://delhivery.com", trackLink: "https://delhivery.com/track", address: "Mumbai, Maharashtra" });
        }
    } catch (e) {
        console.error("Firebase Sync Error:", e);
    }
}

async function getFirestoreCollection(colName) {
    try {
        const querySnapshot = await getDocs(collection(db, colName));
        const list = [];
        querySnapshot.forEach((docSnap) => {
            list.push(docSnap.data());
        });
        return list;
    } catch (e) {
        console.error(`Error reading ${colName}:`, e);
        return [];
    }
}

// Unified Login Handling
async function handleUnifiedLogin(e) {
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

    const accounts = await getFirestoreCollection('accounts');
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

async function refreshAdminViews() {
    await renderAdminShipmentsTable();
    await updateDashboardStats();
    await populateCustomerDropdown();
    await renderStaffDropdown();
    await renderAdminStaffTable();
    await renderCustomerAccountsTable();
    await renderCarriersTable();
    await renderInvoiceListTable();
    await renderCarrierDropdownOptions();
}

// Fleet Carriers Management with Edit/Delete
async function openNewCarrierModal(editName = null) {
    const modalTitle = document.getElementById('carrier-modal-title');
    const form = document.getElementById('new-carrier-form');
    form.reset();

    if (editName) {
        const carriers = await getFirestoreCollection('carriers');
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

async function handleSaveNewCarrier(e) {
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

    const carrierData = { name, cperson, mobile, tele, gstin, email, web, trackLink, address };

    try {
        if (origName && origName !== name) {
            await deleteDoc(doc(db, "carriers", origName));
        }
        await setDoc(doc(db, "carriers", name), carrierData);
        await renderCarrierDropdownOptions();
        await renderCarriersTable();
        closeNewCarrierModal();
    } catch (err) {
        console.error("Error saving carrier:", err);
    }
}

async function renderCarriersTable() {
    const carriers = await getFirestoreCollection('carriers');
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

window.deleteCarrier = async function(name) {
    if (confirm(`Delete carrier ${name}?`)) {
        try {
            await deleteDoc(doc(db, "carriers", name));
            await renderCarrierDropdownOptions();
            await renderCarriersTable();
        } catch (err) {
            console.error("Error deleting carrier:", err);
        }
    }
};

async function renderCarrierDropdownOptions() {
    const select = document.getElementById('add-carrier');
    if (!select) return;
    const carriers = await getFirestoreCollection('carriers');
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
async function handleAdminCreateAccount(e) {
    e.preventDefault();
    const origUsername = document.getElementById('edit-account-username').value.trim();
    const fullName = document.getElementById('acc-cname').value.trim();
    const email = document.getElementById('acc-email').value.trim();
    const mobile = document.getElementById('acc-mob').value.trim();
    const username = document.getElementById('acc-username').value.trim();
    const password = document.getElementById('acc-pass').value.trim();
    const address = document.getElementById('acc-address').value.trim();
    const msg = document.getElementById('acc-create-msg');

    const accountData = { fullName, email, mobile, username, password, address };

    try {
        if (origUsername && origUsername !== username) {
            await deleteDoc(doc(db, "accounts", origUsername));
        }
        await setDoc(doc(db, "accounts", username), accountData);
        document.getElementById('edit-account-username').value = "";
        msg.className = "success-msg";
        msg.textContent = `Customer account saved successfully!`;
        document.getElementById('admin-create-account-form').reset();
        await populateCustomerDropdown();
        await renderCustomerAccountsTable();

        setTimeout(() => { msg.textContent = ""; }, 3000);
    } catch (err) {
        console.error("Error saving account:", err);
    }
}

window.editCustomerAccount = async function(username) {
    const accounts = await getFirestoreCollection('accounts');
    const a = accounts.find(item => item.username === username);
    if (!a) return;

    document.getElementById('edit-account-username').value = a.username;
    document.getElementById('acc-cname').value = a.fullName;
    document.getElementById('acc-email').value = a.email;
    document.getElementById('acc-mob').value = a.mobile;
    document.getElementById('acc-username').value = a.username;
    document.getElementById('acc-pass').value = a.password;
    document.getElementById('acc-address').value = a.address;
};

window.deleteCustomerAccount = async function(username) {
    if (confirm(`Delete customer account ${username}?`)) {
        try {
            await deleteDoc(doc(db, "accounts", username));
            await populateCustomerDropdown();
            await renderCustomerAccountsTable();
        } catch (err) {
            console.error("Error deleting account:", err);
        }
    }
};

async function renderCustomerAccountsTable() {
    const accounts = await getFirestoreCollection('accounts');
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

async function populateCustomerDropdown() {
    const select = document.getElementById('add-customer-user');
    if (!select) return;
    const accounts = await getFirestoreCollection('accounts');
    select.innerHTML = '<option value="">-- Select Customer Account --</option>';
