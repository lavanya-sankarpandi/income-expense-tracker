// Local Storage Manager
const Storage = {
    get: (key) => JSON.parse(localStorage.getItem(key)) || [],
    set: (key, value) => localStorage.setItem(key, JSON.stringify(value)),
    clear: () => localStorage.clear()
};

// Password Generator
document.getElementById('generatePassBtn')?.addEventListener('click', function() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const passField = document.getElementById('generatedPassword');
    passField.textContent = password;
    passField.style.animation = 'highlight 1s';
    setTimeout(() => passField.style.animation = '', 1000);
});

// Login System
document.getElementById('loginForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    localStorage.setItem('loggedIn', 'true');
    window.location.href = 'dashboard.html';
});

// Transaction Manager
class TransactionManager {
    static addTransaction(type, amount, category, date) {
        const transactions = Storage.get('transactions');
        transactions.push({
            id: Date.now(),
            type,
            amount: parseFloat(amount),
            category,
            date,
            createdAt: new Date().toISOString()
        });
        Storage.set('transactions', transactions);
        this.updateMetrics();
    }

    static deleteTransaction(id) {
        let transactions = Storage.get('transactions');
        transactions = transactions.filter(t => t.id !== id);
        Storage.set('transactions', transactions);
        this.updateMetrics();
    }

    static updateMetrics() {
        const transactions = Storage.get('transactions');
        const income = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const expenses = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        const balance = income - expenses;

        // Update Dashboard Metrics
        if (document.getElementById('totalIncome')) {
            document.getElementById('totalIncome').textContent = `$${income.toFixed(2)}`;
            document.getElementById('totalExpense').textContent = `$${expenses.toFixed(2)}`;
            document.getElementById('currentBalance').textContent = `$${balance.toFixed(2)}`;
        }

        // Update Budget Summary
        if (document.getElementById('summaryIncome')) {
            document.getElementById('summaryIncome').textContent = `$${income.toFixed(2)}`;
            document.getElementById('summaryExpense').textContent = `$${expenses.toFixed(2)}`;
            document.getElementById('summaryBalance').textContent = `$${balance.toFixed(2)}`;
            
            // Budget Progress (example: expenses vs income)
            const progressPercentage = income > 0 ? (expenses / income) * 100 : 0;
            document.getElementById('budgetProgress').style.width = `${Math.min(progressPercentage, 100)}%`;
            document.getElementById('budgetPercentage').textContent = `${progressPercentage.toFixed(1)}%`;
        }
    }
}

// Form Handlers
function setupFormHandler(formId, transactionType) {
    const form = document.getElementById(formId);
    if (!form) return;

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const amount = form.querySelector('input[type="number"]').value;
        const category = form.querySelector('select').value;
        const date = form.querySelector('input[type="date"]').value;

        if (!amount || !category || !date) {
            alert('Please fill all fields');
            return;
        }

        TransactionManager.addTransaction(transactionType, amount, category, date);
        form.reset();
        renderTransactions();
    });
}

// Transaction Renderer
function renderTransactions() {
    const tables = [
        { type: 'expense', element: 'expenseTableBody' },
        { type: 'income', element: 'incomeTableBody' },
        { type: 'all', element: 'historyTableBody' }
    ];

    tables.forEach(table => {
        const element = document.getElementById(table.element);
        if (!element) return;

        let transactions = Storage.get('transactions');
        
        if (table.type !== 'all') {
            transactions = transactions.filter(t => t.type === table.type);
        }

        element.innerHTML = transactions.map(transaction => `
            <tr>
                ${table.type === 'all' ? `<td class="transaction-type ${transaction.type}">${transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}</td>` : ''}
                <td>$${transaction.amount.toFixed(2)}</td>
                <td>${transaction.category}</td>
                <td>${new Date(transaction.date).toLocaleDateString()}</td>
                <td>
                    <button onclick="TransactionManager.deleteTransaction(${transaction.id})" 
                            class="btn-delete">
                        Delete
                    </button>
                </td>
            </tr>
        `).join('');
    });
}

// History Filter
document.getElementById('applyFilter')?.addEventListener('click', function() {
    const filterType = document.getElementById('filterType').value;
    const filterDate = document.getElementById('filterDate').value;
    let transactions = Storage.get('transactions');

    if (filterType !== 'all') {
        transactions = transactions.filter(t => t.type === filterType);
    }

    if (filterDate) {
        transactions = transactions.filter(t => t.date === filterDate);
    }

    const tableBody = document.getElementById('historyTableBody');
    tableBody.innerHTML = transactions.map(transaction => `
        <tr>
            <td class="transaction-type ${transaction.type}">
                ${transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
            </td>
            <td>$${transaction.amount.toFixed(2)}</td>
            <td>${transaction.category}</td>
            <td>${new Date(transaction.date).toLocaleDateString()}</td>
            <td>
                <button onclick="TransactionManager.deleteTransaction(${transaction.id})" 
                        class="btn-delete">
                    Delete
                </button>
            </td>
        </tr>
    `).join('');
});

// Initialize App
function initApp() {
    // Setup forms
    setupFormHandler('expenseForm', 'expense');
    setupFormHandler('incomeForm', 'income');

    // Render initial data
    renderTransactions();
    TransactionManager.updateMetrics();

    // Check authentication
    if (!localStorage.getItem('loggedIn') && !window.location.pathname.includes('index.html')) {
        window.location.href = 'index.html';
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', initApp);

// Animation for CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes highlight {
        0% { background-color: #00BCD4; }
        100% { background-color: #f0f0f0; }
    }
    .transaction-type.income { color: #2ecc71; }
    .transaction-type.expense { color: #e74c3c; }
`;
document.head.appendChild(style);
