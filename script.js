
/* =========================================
   MONEY EXCHANGE SYSTEM
   COMPLETE JAVASCRIPT - FIXED VERSION
========================================= */

/* 1. DEFAULT DATA */

const defaultRates = {
    USD: 1,
    AFN: 70,
    EUR: 0.92,
    PKR: 280,
    INR: 84
};

const defaultUsers = [
    {
        username: "admin",
        password: "12345",
        role: "admin"
    },
    {
        username: "staff",
        password: "12345",
        role: "staff"
    }
];

function getData(key, fallback) {
    try {
        const value = localStorage.getItem(key);
        return value !== null ? JSON.parse(value) : fallback;
    } catch {
        return fallback;
    }
}

function saveData(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

let rates = getData("rates", defaultRates);
let users = getData("users", defaultUsers);

let transactions = getData("transactions", []);
let remittances = getData("remittances", []);
let cashRecords = getData("cash", []);
let debts = getData("debts", []);
let receivables = getData("receivables", []);
let deposits = getData("deposits", []);
let advances = getData("advances", []);
let customers = getData("customers", []);

let currentUser = sessionStorage.getItem("currentUser");

/* 2. HELPER FUNCTIONS */

const $ = id => document.getElementById(id);

function today() {
    return new Date().toLocaleDateString();
}

function number(value) {
    return Number(value) || 0;
}

function formatMoney(value) {
    return number(value).toLocaleString(undefined, {
        maximumFractionDigits: 2
    });
}

function currencyOptions() {
    return Object.keys(rates)
        .map(currency => `<option value="${currency}">${currency}</option>`)
        .join("");
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[char]);
}

function createId(prefix) {
    return prefix + Date.now() + Math.floor(Math.random() * 1000);
}

function showMessage(message) {
    alert(message);
}

function persistAll() {
    saveData("rates", rates);
    saveData("users", users);
    saveData("transactions", transactions);
    saveData("remittances", remittances);
    saveData("cash", cashRecords);
    saveData("debts", debts);
    saveData("receivables", receivables);
    saveData("deposits", deposits);
    saveData("advances", advances);
    saveData("customers", customers);
}

/* 3. LOGIN SYSTEM */

function showApplication() {
    if ($("loginPage")) {
        $("loginPage").classList.add("hidden");
    }

    if ($("app")) {
        $("app").classList.remove("hidden");
    }

    if ($("currentUser")) {
        $("currentUser").textContent = currentUser || "Admin";
    }

    showPage("dashboard");
    refreshAll();
    loadCustomersFromApi();
}

/* FIXED LOGIN: IDs MATCH YOUR HTML */

if ($("loginForm")) {
    $("loginForm").addEventListener("submit", function (event) {
        event.preventDefault();

        const username = $("username")?.value.trim();
        const password = $("password")?.value;

        const loginError = $("loginError");

        const user = users.find(u =>
            u.username === username &&
            u.password === password
        );

        if (!user) {
            if (loginError) {
                loginError.textContent = "Invalid username or password.";
            }
            return;
        }

        currentUser = user.username;

        sessionStorage.setItem("currentUser", currentUser);
        sessionStorage.setItem("userRole", user.role);

        if (loginError) {
            loginError.textContent = "";
        }

        $("loginForm").reset();

        showApplication();
    });
}

/* LOGOUT */

if ($("logoutBtn")) {
    $("logoutBtn").addEventListener("click", function () {
        sessionStorage.removeItem("currentUser");
        sessionStorage.removeItem("userRole");

        currentUser = null;

        if ($("app")) {
            $("app").classList.add("hidden");
        }

        if ($("loginPage")) {
            $("loginPage").classList.remove("hidden");
        }

        if ($("loginForm")) {
            $("loginForm").reset();
        }

        if ($("loginError")) {
            $("loginError").textContent = "";
        }
    });
}

/* 4. PAGE NAVIGATION */

function showPage(pageName) {
    document.querySelectorAll(".page").forEach(page => {
        page.classList.remove("active");
    });

    const selectedPage = $(pageName);

    if (selectedPage) {
        selectedPage.classList.add("active");
    }

    document.querySelectorAll(".nav-link[data-page]").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.page === pageName
        );
    });

    if ($("pageTitle")) {
        const activeButton = document.querySelector(
            `.nav-link[data-page="${pageName}"]`
        );

        $("pageTitle").textContent = activeButton
            ? activeButton.textContent.trim()
            : pageName;
    }

    refreshAll();
}

document.addEventListener("click", function (event) {
    const button = event.target.closest("[data-page]");

    if (!button) return;

    event.preventDefault();
    showPage(button.dataset.page);
});

/* 5. AUTO LOGIN */

if (
    currentUser &&
    users.some(user => user.username === currentUser)
) {
    showApplication();
} else {
    currentUser = null;

    if ($("loginPage")) {
        $("loginPage").classList.remove("hidden");
    }

    if ($("app")) {
        $("app").classList.add("hidden");
    }
}

/* 6. CURRENCY EXCHANGE */

function calculateExchange() {
    const from = $("fromCurrency")?.value;
    const to = $("toCurrency")?.value;
    const amount = number($("exchangeAmount")?.value);

    if (!from || !to || !rates[from] || !rates[to]) return;

    const result = amount / rates[from] * rates[to];
    const rate = rates[to] / rates[from];

    if ($("resultAmount")) {
        $("resultAmount").textContent = formatMoney(result);
    }

    if ($("resultRate")) {
        $("resultRate").textContent =
            `Exchange Rate: 1 ${from} = ${formatMoney(rate)} ${to}`;
    }
}

["fromCurrency", "toCurrency", "exchangeAmount"].forEach(id => {
    $(id)?.addEventListener("input", calculateExchange);
    $(id)?.addEventListener("change", calculateExchange);
});

/* 7. EXCHANGE RATES */

if ($("rateForm")) {
    $("rateForm").addEventListener("submit", function (event) {
        event.preventDefault();

        const currency = $("rateCurrency").value;
        const value = number($("rateValue").value);

        if (value <= 0) {
            showMessage("Enter a valid exchange rate.");
            return;
        }

        rates[currency] = value;
        saveData("rates", rates);

        showMessage("Exchange rate updated successfully.");
        $("rateForm").reset();

        calculateExchange();
    });
}

/* 8. TRANSACTIONS */

if ($("transactionForm")) {
    $("transactionForm").addEventListener("submit", function (event) {
        event.preventDefault();

        const customer = $("customerName").value.trim();
        const amount = number($("transactionAmount").value);
        const currency = $("transactionCurrency").value;

        if (amount <= 0) {
            showMessage("Enter a valid amount.");
            return;
        }

        const transaction = {
            id: createId("TR"),
            customer: customer || "Walk-in Customer",
            amount,
            currency,
            fee: 0,
            total: amount,
            date: new Date().toISOString(),
            user: currentUser
        };

        transactions.unshift(transaction);

        saveData("transactions", transactions);

        $("transactionForm").reset();

        showMessage("Transaction saved successfully.");

        printTransactionReceipt(transaction);
        refreshAll();
    });
}

/* 9. TRANSACTION HISTORY */

function renderHistory() {
    const table = $("historyTable");
    if (!table) return;

    const search = ($("historySearch")?.value || "").toLowerCase();

    const filtered = transactions.filter(t =>
        String(t.id).toLowerCase().includes(search) ||
        String(t.customer).toLowerCase().includes(search)
    );

    table.innerHTML = filtered.map(t => `
        <tr>
            <td>${escapeHTML(t.id)}</td>
            <td>${escapeHTML(new Date(t.date).toLocaleString())}</td>
            <td>${escapeHTML(t.customer)}</td>
            <td>${escapeHTML(t.currency)}</td>
            <td>${formatMoney(t.amount)}</td>
            <td>${formatMoney(t.fee)}</td>
            <td>${formatMoney(t.total)}</td>
            <td>
                <button class="btn btn-primary"
                    onclick="printTransactionById('${escapeHTML(t.id)}')">
                    Receipt
                </button>
            </td>
        </tr>
    `).join("");
}

$("historySearch")?.addEventListener("input", renderHistory);

/* 10. TRANSACTION RECEIPT */

function printTransactionReceipt(transaction) {
    if (!transaction) return;

    const values = {
        receiptId: transaction.id,
        receiptDate: new Date(transaction.date).toLocaleString(),
        receiptCustomer: transaction.customer,
        receiptCurrency: transaction.currency,
        receiptAmount: formatMoney(transaction.amount),
        receiptFee: formatMoney(transaction.fee),
        receiptTotal: formatMoney(transaction.total)
    };

    Object.entries(values).forEach(([id, value]) => {
        if ($(id)) $(id).textContent = value;
    });

    if ($("receiptCompanyName")) {
        $("receiptCompanyName").textContent =
            getData("companyName", "Money Exchange");
    }

    showPage("receipt");
}

function printTransactionById(id) {
    const transaction = transactions.find(t => t.id === id);

    if (transaction) {
        printTransactionReceipt(transaction);
    }
}

/* 11. REMITTANCE */

if ($("remittanceForm")) {
    $("remittanceForm").addEventListener("submit", function (event) {
        event.preventDefault();

        const sender = $("senderName").value.trim();
        const receiver = $("receiverName").value.trim();
        const amount = number($("remittanceAmount").value);
        const currency = $("remittanceCurrency").value;
        const fee = number($("remittanceFee").value);

        if (!sender || !receiver || amount <= 0 || fee < 0 || fee > amount) {
            showMessage("Check sender, receiver, amount and commission.");
            return;
        }

        const remittance = {
            id: createId("RM"),
            sender,
            senderPhone: $("senderPhone").value,
            receiver,
            receiverPhone: $("receiverPhone").value,
            amount,
            fee,
            total: amount - fee,
            currency,
            reference: $("remittanceReference").value.trim() || createId("REF"),
            description: $("remittanceDescription").value,
            date: new Date().toISOString(),
            user: currentUser
        };

        remittances.unshift(remittance);

        saveData("remittances", remittances);

        $("remittanceForm").reset();

        showMessage("Remittance saved successfully.");

        printRemittanceReceipt(remittance);
        refreshAll();
    });
}

function renderRemittances() {
    const table = $("remittanceTable");
    if (!table) return;

    table.innerHTML = remittances.map(r => `
        <tr>
            <td>${escapeHTML(r.reference)}</td>
            <td>${escapeHTML(r.sender)}</td>
            <td>${escapeHTML(r.receiver)}</td>
            <td>${formatMoney(r.amount)} ${escapeHTML(r.currency)}</td>
            <td>${formatMoney(r.fee)}</td>
            <td>${escapeHTML(new Date(r.date).toLocaleDateString())}</td>
        </tr>
    `).join("");
}

function printRemittanceReceipt(r) {
    const values = {
        remittanceReceiptReference: r.reference,
        remittanceReceiptDate: new Date(r.date).toLocaleString(),
        remittanceReceiptSender: r.sender,
        remittanceReceiptReceiver: r.receiver,
        remittanceReceiptAmount: `${formatMoney(r.amount)} ${r.currency}`,
        remittanceReceiptFee: `${formatMoney(r.fee)} ${r.currency}`,
        remittanceReceiptTotal: `${formatMoney(r.total)} ${r.currency}`
    };

    Object.entries(values).forEach(([id, value]) => {
        if ($(id)) $(id).textContent = value;
    });

    showPage("remittanceReceipt");
}

/* 12. CASH MANAGEMENT */

if ($("cashForm")) {
    $("cashForm").addEventListener("submit", function (event) {
        event.preventDefault();

        const amount = number($("cashAmount").value);

        if (amount <= 0) {
            showMessage("Enter a valid amount.");
            return;
        }

        cashRecords.unshift({
            id: createId("CASH"),
            type: $("cashType").value,
            amount,
            currency: $("cashCurrency").value,
            description: $("cashDescription").value,
            date: new Date().toISOString()
        });

        saveData("cash", cashRecords);

        $("cashForm").reset();
        showMessage("Cash entry saved.");
        refreshAll();
    });
}

function renderCash() {
    const balances = {};

    Object.keys(rates).forEach(currency => {
        balances[currency] = 0;
    });

    let totalIn = 0;
    let totalOut = 0;

    cashRecords.forEach(record => {
        const currency = record.currency;

        if (!(currency in balances)) {
            balances[currency] = 0;
        }

        if (record.type === "in") {
            balances[currency] += number(record.amount);
            totalIn += number(record.amount);
        } else {
            balances[currency] -= number(record.amount);
            totalOut += number(record.amount);
        }
    });

    if ($("cashBalanceTable")) {
        $("cashBalanceTable").innerHTML = `
            <table>
                <thead>
                    <tr><th>Currency</th><th>Balance</th></tr>
                </thead>
                <tbody>
                    ${Object.entries(balances).map(([currency, balance]) => `
                        <tr>
                            <td>${escapeHTML(currency)}</td>
                            <td>${formatMoney(balance)}</td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        `;
    }

    if ($("totalCashBalance")) {
        $("totalCashBalance").textContent =
            formatMoney(totalIn - totalOut);
    }

    if ($("totalCashIn")) {
        $("totalCashIn").textContent = formatMoney(totalIn);
    }

    if ($("totalCashOut")) {
        $("totalCashOut").textContent = formatMoney(totalOut);
    }

    if ($("cashHistoryTable")) {
        $("cashHistoryTable").innerHTML = `
            <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Currency</th>
                <th>Description</th>
            </tr>
            ${cashRecords.map(r => `
                <tr>
                    <td>${escapeHTML(new Date(r.date).toLocaleString())}</td>
                    <td>${escapeHTML(r.type)}</td>
                    <td>${formatMoney(r.amount)}</td>
                    <td>${escapeHTML(r.currency)}</td>
                    <td>${escapeHTML(r.description)}</td>
                </tr>
            `).join("")}
        `;
    }
}

/* 13. DEBT MANAGEMENT */

if ($("debtForm")) {
    $("debtForm").addEventListener("submit", function (event) {
        event.preventDefault();

        const amount = number($("debtAmount").value);

        if (amount <= 0) {
            showMessage("Enter a valid debt amount.");
            return;
        }

        debts.unshift({
            id: createId("DEBT"),
            person: $("debtPerson").value.trim(),
            phone: $("debtPhone").value,
            type: $("debtType").value,
            amount,
            currency: $("debtCurrency").value,
            dueDate: $("debtDueDate").value,
            description: $("debtDescription").value,
            date: new Date().toISOString()
        });

        saveData("debts", debts);
        $("debtForm").reset();

        showMessage("Debt record saved.");
        refreshAll();
    });
}

function renderDebts() {
    let weOwe = 0;
    let theyOwe = 0;

    debts.forEach(debt => {
        if (debt.type === "weOwe") {
            weOwe += number(debt.amount);
        } else {
            theyOwe += number(debt.amount);
        }
    });

    if ($("weOweTotal")) {
        $("weOweTotal").textContent = formatMoney(weOwe);
    }

    if ($("theyOweTotal")) {
        $("theyOweTotal").textContent = formatMoney(theyOwe);
    }

    if ($("debtsTable")) {
        $("debtsTable").innerHTML = `
            <tr>
                <th>Person</th>
                <th>Phone</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Currency</th>
                <th>Due Date</th>
            </tr>
            ${debts.map(d => `
                <tr>
                    <td>${escapeHTML(d.person)}</td>
                    <td>${escapeHTML(d.phone)}</td>
                    <td>${escapeHTML(d.type)}</td>
                    <td>${formatMoney(d.amount)}</td>
                    <td>${escapeHTML(d.currency)}</td>
                    <td>${escapeHTML(d.dueDate)}</td>
                </tr>
            `).join("")}
        `;
    }
}

/* 14. RECEIVABLES */

if ($("receivableForm")) {
    $("receivableForm").addEventListener("submit", function (event) {
        event.preventDefault();

        const amount = number($("receivableAmount").value);

        if (amount <= 0) {
            showMessage("Enter a valid amount.");
            return;
        }

        receivables.unshift({
            id: createId("REC"),
            person: $("receivablePerson").value.trim(),
            phone: $("receivablePhone").value,
            amount,
            currency: $("receivableCurrency").value,
            description: $("receivableDescription").value,
            date: new Date().toISOString()
        });

        saveData("receivables", receivables);
        $("receivableForm").reset();

        showMessage("Receivable saved.");
        refreshAll();
    });
}

function renderReceivables() {
    if (!$("receivablesTable")) return;

    $("receivablesTable").innerHTML = `
        <tr>
            <th>Person</th>
            <th>Phone</th>
            <th>Amount</th>
            <th>Currency</th>
            <th>Description</th>
        </tr>
        ${receivables.map(r => `
            <tr>
                <td>${escapeHTML(r.person)}</td>
                <td>${escapeHTML(r.phone)}</td>
                <td>${formatMoney(r.amount)}</td>
                <td>${escapeHTML(r.currency)}</td>
                <td>${escapeHTML(r.description)}</td>
            </tr>
        `).join("")}
    `;
}

/* 15. DEPOSITS */

if ($("depositForm")) {
    $("depositForm").addEventListener("submit", function (event) {
        event.preventDefault();

        const amount = number($("depositAmount").value);

        if (amount <= 0) {
            showMessage("Enter a valid amount.");
            return;
        }

        deposits.unshift({
            id: createId("DEP"),
            person: $("depositPerson").value.trim(),
            phone: $("depositPhone").value,
            amount,
            currency: $("depositCurrency").value,
            description: $("depositDescription").value,
            date: new Date().toISOString()
        });

        saveData("deposits", deposits);
        $("depositForm").reset();

        showMessage("Deposit saved.");
        refreshAll();
    });
}

function renderDeposits() {
    if (!$("depositsTable")) return;

    $("depositsTable").innerHTML = `
        <tr>
            <th>Person</th>
            <th>Phone</th>
            <th>Amount</th>
            <th>Currency</th>
            <th>Description</th>
        </tr>
        ${deposits.map(d => `
            <tr>
                <td>${escapeHTML(d.person)}</td>
                <td>${escapeHTML(d.phone)}</td>
                <td>${formatMoney(d.amount)}</td>
                <td>${escapeHTML(d.currency)}</td>
                <td>${escapeHTML(d.description)}</td>
            </tr>
        `).join("")}
    `;
}

/* 16. ADVANCE PAYMENTS */

if ($("advanceForm")) {
    $("advanceForm").addEventListener("submit", function (event) {
        event.preventDefault();

        const amount = number($("advanceAmount").value);

        if (amount <= 0) {
            showMessage("Enter a valid amount.");
            return;
        }

        advances.unshift({
            id: createId("ADV"),
            person: $("advancePerson").value.trim(),
            phone: $("advancePhone").value,
            type: $("advanceType").value,
            amount,
            currency: $("advanceCurrency").value,
            description: $("advanceDescription").value,
            date: new Date().toISOString()
        });

        saveData("advances", advances);
        $("advanceForm").reset();

        showMessage("Advance payment saved.");
        refreshAll();
    });
}

function renderAdvances() {
    if (!$("advancesTable")) return;

    $("advancesTable").innerHTML = `
        <tr>
            <th>Person</th>
            <th>Phone</th>
            <th>Type</th>
            <th>Amount</th>
            <th>Currency</th>
        </tr>
        ${advances.map(a => `
            <tr>
                <td>${escapeHTML(a.person)}</td>
                <td>${escapeHTML(a.phone)}</td>
                <td>${escapeHTML(a.type)}</td>
                <td>${formatMoney(a.amount)}</td>
                <td>${escapeHTML(a.currency)}</td>
            </tr>
        `).join("")}
    `;
}

/* 17. CUSTOMER MANAGEMENT */

async function loadCustomersFromApi() {
    try {
        const response = await fetch("/api/customers");
        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(result.error || "Could not load customers.");
        }

        // Notes are currently a frontend-only field; preserve them locally by database ID.
        const savedNotes = new Map(
            customers.map(customer => [String(customer.id), customer.notes || ""])
        );
        customers = result
            .filter(row => String(row.status || "Active").toLowerCase() === "active")
            .map(row => ({
                id: String(row.customerid),
                name: row.name || "",
                phone: row.phone || "",
                address: row.address || "",
                notes: savedNotes.get(String(row.customerid)) || ""
            }));
        saveData("customers", customers);
        renderCustomers();
    } catch (error) {
        console.error("Customer API load failed:", error);
        showMessage("د پېرودونکو معلومات له ډیټابېس څخه نه شول لوستلای. ډاډ ترلاسه کړئ چې Flask سرور او Oracle فعال دي.\n\n" + error.message);
    }
}

if ($("customerForm")) {
    $("customerForm").addEventListener("submit", async function (event) {
        event.preventDefault();

        const name = $("newCustomerName").value.trim();
        if (!name) {
            showMessage("Enter customer name.");
            return;
        }

        const customerData = {
            name,
            phone: $("newCustomerPhone").value.trim(),
            address: $("newCustomerAddress").value.trim()
        };

        try {
            const response = await fetch("/api/customers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(customerData)
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(result.error || "Could not save customer.");
            }

            customers.unshift({
                id: String(result.customer_id),
                ...customerData,
                notes: $("newCustomerNotes").value.trim()
            });
            saveData("customers", customers);
            $("customerForm").reset();
            showMessage("Customer saved to the database successfully.");
            renderCustomers();
        } catch (error) {
            console.error("Customer API save failed:", error);
            showMessage("پېرودونکی ډیټابېس ته ثبت نه شو. د Flask سرور او Oracle اتصال وګورئ.\n\n" + error.message);
        }
    });
}

function renderCustomers() {
    if (!$("customersTable")) return;

    const search = ($("customerSearch")?.value || "").toLowerCase();
    const filtered = customers.filter(c =>
        String(c.name).toLowerCase().includes(search) ||
        String(c.phone).toLowerCase().includes(search)
    );

    $("customersTable").innerHTML = `
        <tr>
            <th>Name</th>
            <th>Phone</th>
            <th>Address</th>
            <th>Notes</th>
        </tr>
        ${filtered.map(c => `
            <tr>
                <td>${escapeHTML(c.name)}</td>
                <td>${escapeHTML(c.phone)}</td>
                <td>${escapeHTML(c.address)}</td>
                <td>${escapeHTML(c.notes)}</td>
            </tr>
        `).join("")}
    `;
}

$("customerSearch")?.addEventListener("input", renderCustomers);


/* 18. USER MANAGEMENT */

function renderUsers() {
    if (!$("usersTable")) return;

    $("usersTable").innerHTML = `
        <tr>
            <th>Username</th>
            <th>Role</th>
            <th>Action</th>
        </tr>
        ${users.map((u, index) => `
            <tr>
                <td>${escapeHTML(u.username)}</td>
                <td>${escapeHTML(u.role)}</td>
                <td>
                    ${u.username === "admin" ? "Protected" : `
                        <button class="btn btn-danger"
                            onclick="deleteUser(${index})">
                            Delete
                        </button>
                    `}
                </td>
            </tr>
        `).join("")}
    `;
}

function addUser(username, password, role) {
    if (!username || !password) {
        showMessage("Enter username and password.");
        return false;
    }

    if (users.some(u => u.username === username)) {
        showMessage("Username already exists.");
        return false;
    }

    users.push({ username, password, role });
    saveData("users", users);
    renderUsers();

    return true;
}

if ($("userForm")) {
    $("userForm").addEventListener("submit", function (event) {
        event.preventDefault();

        const success = addUser(
            $("newUsername").value.trim(),
            $("newPassword").value,
            $("newRole").value
        );

        if (success) {
            $("userForm").reset();
            showMessage("User created successfully.");
        }
    });
}

function deleteUser(index) {
    if (users[index]?.username === "admin") return;

    if (!confirm("Are you sure you want to delete this user?")) return;

    users.splice(index, 1);
    saveData("users", users);
    renderUsers();
}

/* 19. SETTINGS */

if ($("settingsForm")) {
    $("settingsForm").addEventListener("submit", function (event) {
        event.preventDefault();

        const username = $("settingsUsername").value.trim();
        const password = $("settingsPassword").value;

        const user = users.find(u => u.username === currentUser);

        if (!user) return;

        if (
            username &&
            username !== currentUser &&
            users.some(u => u.username === username)
        ) {
            showMessage("Username already exists.");
            return;
        }

        if (username) {
            user.username = username;
            currentUser = username;

            sessionStorage.setItem("currentUser", username);
        }

        if (password) {
            user.password = password;
        }

        saveData("users", users);

        if ($("currentUser")) {
            $("currentUser").textContent = currentUser;
        }

        $("settingsPassword").value = "";

        showMessage("Settings updated successfully.");
    });
}

if ($("settingsUserForm")) {
    $("settingsUserForm").addEventListener("submit", function (event) {
        event.preventDefault();

        const success = addUser(
            $("settingsNewUsername").value.trim(),
            $("settingsNewPassword").value,
            $("settingsNewRole").value
        );

        if (success) {
            $("settingsUserForm").reset();
            showMessage("User created successfully.");
        }
    });
}

/* 20. COMPANY SETTINGS */

if ($("companySettingsForm")) {
    $("companySettingsForm").addEventListener("submit", function (event) {
        event.preventDefault();

        saveData("companyName", $("companyName").value);
        saveData("companyPhone", $("companyPhone").value);
        saveData("companyAddress", $("companyAddress").value);

        showMessage("Company information saved.");
    });
}

$("companyLogo")?.addEventListener("change", function () {
    const file = this.files[0];

    if (!file) return;

    if (file.size > 1024 * 1024) {
        showMessage("Logo must be smaller than 1 MB.");
        this.value = "";
        return;
    }

    const reader = new FileReader();

    reader.onload = function (event) {
        if ($("companyLogoPreview")) {
            $("companyLogoPreview").src = event.target.result;
        }

        saveData("companyLogo", event.target.result);
    };

    reader.readAsDataURL(file);
});

function loadCompanySettings() {
    if ($("companyName")) {
        $("companyName").value = getData("companyName", "");
    }

    if ($("companyPhone")) {
        $("companyPhone").value = getData("companyPhone", "");
    }

    if ($("companyAddress")) {
        $("companyAddress").value = getData("companyAddress", "");
    }

    const logo = getData("companyLogo", "");

    if (logo && $("companyLogoPreview")) {
        $("companyLogoPreview").src = logo;
    }
}

/* 21. CALCULATOR */

let calculatorExpression = "";

document.querySelectorAll(".calculator-buttons button").forEach(button => {
    button.addEventListener("click", function () {
        const value = this.dataset.value;

        if (!value || !$("calculatorDisplay")) return;

        if (value === "C") {
            calculatorExpression = "";
        } else if (value === "DEL") {
            calculatorExpression = calculatorExpression.slice(0, -1);
        } else if (value === "=") {
            try {
                if (!/^[0-9+\-*/%.() ]+$/.test(calculatorExpression)) {
                    throw new Error("Invalid");
                }

                const result = Function(
                    `"use strict"; return (${calculatorExpression})`
                )();

                if (!Number.isFinite(result)) {
                    throw new Error("Invalid");
                }

                calculatorExpression = String(result);
            } catch {
                calculatorExpression = "";
                showMessage("Invalid calculation.");
            }
        } else {
            calculatorExpression += value;
        }

        $("calculatorDisplay").value = calculatorExpression;
    });
});

/* 22. REPORTS */

if ($("reportFilterForm")) {
    $("reportFilterForm").addEventListener("submit", function (event) {
        event.preventDefault();
        generateReports();
    });
}

function generateReports() {
    const start = $("reportStartDate")?.value;
    const end = $("reportEndDate")?.value;
    const currency = $("reportCurrency")?.value || "ALL";

    const filtered = transactions.filter(t => {
        const date = new Date(t.date);
        const day = date.toISOString().slice(0, 10);

        return (!start || day >= start) &&
            (!end || day <= end) &&
            (currency === "ALL" || t.currency === currency);
    });

    const income = filtered.reduce(
        (sum, t) => sum + number(t.amount), 0
    );

    const commission = filtered.reduce(
        (sum, t) => sum + number(t.fee), 0
    );

    if ($("reportIncome")) {
        $("reportIncome").textContent = formatMoney(income);
    }

    if ($("reportExpenses")) {
        $("reportExpenses").textContent = "0";
    }

    if ($("reportProfit")) {
        $("reportProfit").textContent = formatMoney(commission);
    }

    if ($("reportCommission")) {
        $("reportCommission").textContent = formatMoney(commission);
    }

    if ($("reportsTable")) {
        $("reportsTable").innerHTML = `
            <tr>
                <th>Date</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Commission</th>
            </tr>
            ${filtered.map(t => `
                <tr>
                    <td>${escapeHTML(new Date(t.date).toLocaleDateString())}</td>
                    <td>${escapeHTML(t.customer)}</td>
                    <td>${formatMoney(t.amount)} ${escapeHTML(t.currency)}</td>
                    <td>${formatMoney(t.fee)} ${escapeHTML(t.currency)}</td>
                </tr>
            `).join("")}
        `;
    }
}

/* 23. BACKUP */

$("backupBtn")?.addEventListener("click", function () {
    const backup = {
        rates,
        users,
        transactions,
        remittances,
        cashRecords,
        debts,
        receivables,
        deposits,
        advances,
        customers,
        companyName: getData("companyName", ""),
        companyPhone: getData("companyPhone", ""),
        companyAddress: getData("companyAddress", ""),
        companyLogo: getData("companyLogo", "")
    };

    const blob = new Blob(
        [JSON.stringify(backup, null, 2)],
        { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "money-exchange-backup.json";
    link.click();

    URL.revokeObjectURL(url);

    if ($("backupMessage")) {
        $("backupMessage").textContent =
            "Backup downloaded successfully.";
    }
});

/* 24. RESTORE */

$("restoreBtn")?.addEventListener("click", function () {
    const file = $("restoreFile")?.files[0];

    if (!file) {
        showMessage("Please select a backup file.");
        return;
    }

    const reader = new FileReader();

    reader.onload = function (event) {
        try {
            const backup = JSON.parse(event.target.result);

            const required = [
                "rates", "users", "transactions", "remittances",
                "cashRecords", "debts", "receivables",
                "deposits", "advances", "customers"
            ];

            if (!required.every(key =>
                Object.prototype.hasOwnProperty.call(backup, key)
            )) {
                throw new Error("Invalid backup");
            }

            if (!confirm("Restore backup? Current data will be replaced.")) {
                return;
            }

            rates = backup.rates;
            users = backup.users;
            transactions = backup.transactions;
            remittances = backup.remittances;
            cashRecords = backup.cashRecords;
            debts = backup.debts;
            receivables = backup.receivables;
            deposits = backup.deposits;
            advances = backup.advances;
            customers = backup.customers;

            saveData("rates", rates);
            saveData("users", users);
            saveData("transactions", transactions);
            saveData("remittances", remittances);
            saveData("cash", cashRecords);
            saveData("debts", debts);
            saveData("receivables", receivables);
            saveData("deposits", deposits);
            saveData("advances", advances);
            saveData("customers", customers);

            if (backup.companyName !== undefined) {
                saveData("companyName", backup.companyName);
            }

            if (backup.companyPhone !== undefined) {
                saveData("companyPhone", backup.companyPhone);
            }

            if (backup.companyAddress !== undefined) {
                saveData("companyAddress", backup.companyAddress);
            }

            if (backup.companyLogo !== undefined) {
                saveData("companyLogo", backup.companyLogo);
            }

            loadCompanySettings();
            refreshAll();

            if ($("restoreMessage")) {
                $("restoreMessage").textContent =
                    "Backup restored successfully.";
            }

            showMessage("Backup restored successfully.");

        } catch {
            showMessage("Invalid or damaged backup file.");
        }
    };

    reader.readAsText(file);
});

/* 25. DASHBOARD */

function updateDashboard() {
    const totalCash = cashRecords.reduce((sum, r) =>
        sum + (r.type === "in"
            ? number(r.amount)
            : -number(r.amount)), 0
    );

    const totalDebt = debts.reduce((sum, d) =>
        sum + number(d.amount), 0
    );

    const totalReceivables = receivables.reduce((sum, r) =>
        sum + number(r.amount), 0
    );

    const totalProfit = transactions.reduce((sum, t) =>
        sum + number(t.fee), 0
    );

    if ($("dashboardCash")) {
        $("dashboardCash").textContent = formatMoney(totalCash);
    }

    if ($("dashboardDebts")) {
        $("dashboardDebts").textContent = formatMoney(totalDebt);
    }

    if ($("dashboardReceivables")) {
        $("dashboardReceivables").textContent =
            formatMoney(totalReceivables);
    }

    if ($("dashboardProfit")) {
        $("dashboardProfit").textContent = formatMoney(totalProfit);
    }

    if ($("recentTransactions")) {
        $("recentTransactions").innerHTML =
            transactions.slice(0, 7).map(t => `
                <tr>
                    <td>${escapeHTML(new Date(t.date).toLocaleDateString())}</td>
                    <td>${escapeHTML(t.customer)}</td>
                    <td>${escapeHTML(t.currency)}</td>
                    <td>${formatMoney(t.amount)}</td>
                    <td>
                        <span style="color:#16A36A">Completed</span>
                    </td>
                </tr>
            `).join("");
    }
}

/* 26. REFRESH ALL */

function refreshAll() {
    renderHistory();
    renderRemittances();
    renderCash();
    renderDebts();
    renderReceivables();
    renderDeposits();
    renderAdvances();
    renderCustomers();
    renderUsers();
    updateDashboard();
    calculateExchange();
    loadCompanySettings();
}

/* 27. INITIALIZATION */

persistAll();
refreshAll();
