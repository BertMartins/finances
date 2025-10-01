// =============================
// Modal System (replacement for alert/confirm)
// =============================
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-finance-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';
    
    toast.className = `${bgColor} text-white px-6 py-3 rounded-lg shadow-lg transform translate-x-full transition-transform duration-300`;
    toast.innerHTML = `
        <div class="flex items-center justify-between">
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-white hover:text-gray-200">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    container.appendChild(toast);
    setTimeout(() => toast.classList.remove('translate-x-full'), 100);
    setTimeout(() => toast.remove(), 4000);
}

function showConfirmDialog(message, onConfirm) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
        <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-sm w-full mx-4 transform scale-95 transition-transform duration-200">
            <div class="text-center">
                <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900 mb-4">
                    <i class="fas fa-exclamation-triangle text-red-600 dark:text-red-400"></i>
                </div>
                <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">Confirmar Ação</h3>
                <p class="text-gray-600 dark:text-gray-400 mb-6">${message}</p>
                <div class="flex justify-center space-x-3">
                    <button onclick="this.closest('.fixed').remove()" 
                            class="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                        Cancelar
                    </button>
                    <button onclick="this.closest('.fixed').remove(); (${onConfirm})()" 
                            class="px-4 py-2 bg-red-500 text-white hover:bg-red-600 rounded-lg transition-colors">
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('modal-container').appendChild(modal);
    setTimeout(() => modal.querySelector('div > div').classList.remove('scale-95'), 10);
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

function showPromptDialog(message, defaultValue = '', callbackName) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
        <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-sm w-full mx-4 transform scale-95 transition-transform duration-200">
            <div class="text-center">
                <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">${message}</h3>
                <input type="number" step="0.01" value="${defaultValue}" placeholder="0,00" 
                       class="w-full px-3 py-2 text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-finance-green-500 dark:bg-gray-700 dark:text-white mb-6">
                <div class="flex justify-center space-x-3">
                    <button onclick="this.closest('.fixed').remove()" 
                            class="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                        Cancelar
                    </button>
                    <button onclick="const val = this.closest('.fixed').querySelector('input').value; this.closest('.fixed').remove(); if(val) window[${JSON.stringify(callbackName)}](val);" 
                            class="px-4 py-2 bg-finance-green-500 text-white hover:bg-finance-green-600 rounded-lg transition-colors">
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('modal-container').appendChild(modal);
    const input = modal.querySelector('input');
    setTimeout(() => {
        modal.querySelector('div > div').classList.remove('scale-95');
        input.focus();
        input.select();
    }, 10);
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

// =============================
// Dark Mode
// =============================
if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.classList.add('dark');
}
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    document.documentElement.classList.toggle('dark', e.matches);
});

// =============================
// Data Storage
// =============================
let transactions = JSON.parse(localStorage.getItem('financeManager_transactions')) || [];
let nextId = parseInt(localStorage.getItem('financeManager_nextId')) || 1;
let settings = JSON.parse(localStorage.getItem('financeManager_settings')) || {
    userName: 'Usuário',
    monthlyGoal: 0
};

function saveData() {
    localStorage.setItem('financeManager_transactions', JSON.stringify(transactions));
    localStorage.setItem('financeManager_nextId', nextId.toString());
    localStorage.setItem('financeManager_settings', JSON.stringify(settings));
}

// =============================
// Category Configuration
// =============================
const categoryNames = {
    alimentacao: '🍽️ Alimentação',
    transporte: '🚗 Transporte',
    moradia: '🏠 Moradia',
    saude: '🏥 Saúde',
    educacao: '📚 Educação',
    lazer: '🎮 Lazer',
    compras: '🛍️ Compras',
    servicos: '🔧 Serviços',
    salario: '💼 Salário',
    freelance: '💻 Freelance',
    investimento: '📈 Investimento',
    bonus: '🎁 Bônus',
    vendas: '🛒 Vendas',
    outros: '📦 Outros'
};

// =============================
// Navigation
// =============================
let currentSortField = 'date';
let currentSortDirection = 'desc';

function showPage(pageId, event = null) {
    // Add fade out effect
    document.querySelectorAll('.page').forEach(p => {
        p.classList.add('hidden');
    });
    
    const targetPage = document.getElementById(pageId + '-page');
    targetPage.classList.remove('hidden');
    targetPage.classList.add('fade-in');

    const titles = {
        dashboard: 'Dashboard',
        'add-expense': 'Adicionar Despesa',
        'add-income': 'Adicionar Receita',
        expenses: 'Visualizar Transações',
        reports: 'Relatórios',
        settings: 'Configurações'
    };
    document.getElementById('page-title').textContent = titles[pageId] || '';

    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(i => {
        i.classList.remove('active', 'bg-finance-green-50', 'dark:bg-finance-green-900', 'text-finance-green-600', 'dark:text-finance-green-400');
    });
    
    if (event?.target) {
        const navItem = event.target.closest('.nav-item');
        if (navItem) {
            navItem.classList.add('active', 'bg-finance-green-50', 'dark:bg-finance-green-900', 'text-finance-green-600', 'dark:text-finance-green-400');
        }
    }

    // Close mobile sidebar
    document.getElementById('sidebar').classList.add('-translate-x-full');

    // Page-specific updates
    if (pageId === 'dashboard') updateDashboard();
    if (pageId === 'expenses') updateTransactionsList();
    if (pageId === 'reports') updateReports();
    if (pageId === 'settings') updateSettings();
}

// =============================
// Mobile Sidebar
// =============================
document.getElementById('mobile-menu-btn').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('-translate-x-full');
});

document.addEventListener('click', e => {
    const sidebar = document.getElementById('sidebar');
    const btn = document.getElementById('mobile-menu-btn');
    if (!sidebar.contains(e.target) && !btn.contains(e.target)) {
        sidebar.classList.add('-translate-x-full');
    }
});

// =============================
// Utility Functions
// =============================
function setDefaultDates() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('expense-date').value = today;
    document.getElementById('income-date').value = today;
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);
}

function getCurrentMonth() {
    return parseInt(document.getElementById('dashboard-month').value) || new Date().getMonth();
}

function getCurrentYear() {
    return parseInt(document.getElementById('dashboard-year').value) || new Date().getFullYear();
}

function getMonthTransactions() {
    const selectedMonth = getCurrentMonth();
    const selectedYear = getCurrentYear();
    
    return transactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });
}

// =============================
// Dashboard Functions
// =============================
function updateDashboard() {
    const selectedMonth = getCurrentMonth();
    const selectedYear = getCurrentYear();
    const monthTransactions = getMonthTransactions();

    console.log(`Atualizando dashboard para ${selectedMonth + 1}/${selectedYear} - ${monthTransactions.length} transações`);

    const summary = monthTransactions.reduce(
        (acc, t) => {
            acc[t.type] += t.amount;
            acc[t.type + 'Count']++;
            return acc;
        },
        { income: 0, expense: 0, incomeCount: 0, expenseCount: 0 }
    );

    const balance = summary.income - summary.expense;
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const dailyAverage = summary.expense / daysInMonth;

    // Update summary cards
    document.getElementById('monthly-income').textContent = formatCurrency(summary.income);
    document.getElementById('income-count').textContent = `${summary.incomeCount} transações`;
    
    document.getElementById('monthly-expenses').textContent = formatCurrency(summary.expense);
    document.getElementById('expense-count').textContent = `${summary.expenseCount} transações`;
    
    document.getElementById('monthly-balance').textContent = formatCurrency(balance);
    document.getElementById('total-balance').textContent = formatCurrency(balance);
    
    document.getElementById('daily-average').textContent = formatCurrency(dailyAverage);
    document.getElementById('daily-info').textContent = 'Gastos por dia';

    // Update balance percentage
    const balancePercentage = summary.income > 0 ? ((balance / summary.income) * 100).toFixed(1) : 100;
    document.getElementById('balance-percentage').textContent = `${balancePercentage}% das receitas`;

    // Update balance color
    const balanceEl = document.getElementById('monthly-balance');
    balanceEl.className = balance >= 0
        ? 'text-2xl font-bold text-finance-green-600'
        : 'text-2xl font-bold text-red-600';

    const totalBalanceEl = document.getElementById('total-balance');
    totalBalanceEl.className = balance >= 0
        ? 'font-medium'
        : 'font-medium text-red-600 dark:text-red-400';

    // Update current period indicator
    const periodText = new Date(selectedYear, selectedMonth).toLocaleDateString('pt-BR', { 
        month: 'long', 
        year: 'numeric' 
    });
    document.getElementById('current-period').textContent = periodText;

    // Update spending goal
    updateSpendingGoal(summary.expense);

    // Update charts
    updateExpensesChart(monthTransactions);
    updateMonthlyChart();
}

function updateSpendingGoal(currentExpenses) {
    const goal = settings.monthlyGoal || 0;
    if (goal === 0) {
        document.getElementById('spending-current').textContent = `R$ ${currentExpenses.toFixed(2)} gastos`;
        document.getElementById('spending-target').textContent = 'Meta: Não definida';
        document.getElementById('spending-progress').style.width = '0%';
        return;
    }

    const percentage = Math.min((currentExpenses / goal) * 100, 100);
    const progressColor = percentage > 90 ? 'bg-red-500' : percentage > 70 ? 'bg-yellow-500' : 'bg-finance-green-500';
    
    document.getElementById('spending-current').textContent = `${formatCurrency(currentExpenses)} gastos`;
    document.getElementById('spending-target').textContent = `Meta: ${formatCurrency(goal)}`;
    document.getElementById('spending-progress').style.width = `${percentage}%`;
    document.getElementById('spending-progress').className = `h-4 rounded-lg transition-all duration-500 ${progressColor}`;
}

// =============================
// Chart Functions
// =============================
function updateExpensesChart(monthTransactions) {
    const ctx = document.getElementById('expenses-chart').getContext('2d');
    if (window.expensesChart) window.expensesChart.destroy();

    const categoryTotals = {};
    monthTransactions.filter(t => t.type === 'expense').forEach(t => {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });

    const sortedCategories = Object.entries(categoryTotals)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 8); // Top 8 categories

    window.expensesChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: sortedCategories.map(([cat]) => categoryNames[cat] || cat),
            datasets: [{
                data: sortedCategories.map(([,amount]) => amount),
                backgroundColor: [
                    '#22c55e', '#ef4444', '#3b82f6', '#f59e0b', 
                    '#8b5cf6', '#ec4899', '#10b981', '#f97316'
                ],
                borderWidth: 2,
                borderColor: document.documentElement.classList.contains('dark') ? '#374151' : '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { 
                        color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#374151',
                        padding: 15,
                        usePointStyle: true
                    }
                }
            }
        }
    });
}

function updateMonthlyChart() {
    const ctx = document.getElementById('monthly-chart').getContext('2d');
    if (window.monthlyChart) window.monthlyChart.destroy();

    const months = [], incomeData = [], expenseData = [];
    for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const m = date.getMonth(), y = date.getFullYear();
        months.push(date.toLocaleDateString('pt-BR', { month: 'short' }));

        const monthTransactions = transactions.filter(t => {
            const d = new Date(t.date);
            return d.getMonth() === m && d.getFullYear() === y;
        });

        incomeData.push(monthTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0));
        expenseData.push(monthTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0));
    }

    const isDark = document.documentElement.classList.contains('dark');
    const textColor = isDark ? '#f3f4f6' : '#374151';
    const gridColor = isDark ? '#4b5563' : '#e5e7eb';

    window.monthlyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [
                { 
                    label: 'Receitas', 
                    data: incomeData, 
                    borderColor: '#22c55e', 
                    backgroundColor: 'rgba(34,197,94,0.1)', 
                    tension: 0.4,
                    fill: false,
                    pointBackgroundColor: '#22c55e',
                    pointBorderColor: '#fff',
                    pointHoverRadius: 6
                },
                { 
                    label: 'Despesas', 
                    data: expenseData, 
                    borderColor: '#ef4444', 
                    backgroundColor: 'rgba(239,68,68,0.1)', 
                    tension: 0.4,
                    fill: false,
                    pointBackgroundColor: '#ef4444',
                    pointBorderColor: '#fff',
                    pointHoverRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: { 
                legend: { 
                    labels: { 
                        color: textColor,
                        usePointStyle: true,
                        padding: 20
                    } 
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: textColor,
                        callback: v => formatCurrency(v)
                    },
                    grid: { color: gridColor }
                },
                x: {
                    ticks: { color: textColor },
                    grid: { color: gridColor }
                }
            }
        }
    });
}

// =============================
// Transaction Management
// =============================
function updateTransactionsList() {
    const tbody = document.getElementById('transactions-list');
    const categoryFilter = document.getElementById('filter-category').value;
    const typeFilter = document.getElementById('filter-type').value;
    const searchTerm = document.getElementById('search-transactions').value.toLowerCase();

    let filteredTransactions = transactions;
    
    if (categoryFilter) {
        filteredTransactions = filteredTransactions.filter(t => t.category === categoryFilter);
    }
    if (typeFilter) {
        filteredTransactions = filteredTransactions.filter(t => t.type === typeFilter);
    }
    if (searchTerm) {
        filteredTransactions = filteredTransactions.filter(t => 
            t.description.toLowerCase().includes(searchTerm) ||
            (categoryNames[t.category] || t.category).toLowerCase().includes(searchTerm)
        );
    }

    // Sort transactions
    filteredTransactions.sort((a, b) => {
        let aVal = a[currentSortField];
        let bVal = b[currentSortField];
        
        if (currentSortField === 'date') {
            aVal = new Date(aVal);
            bVal = new Date(bVal);
        } else if (currentSortField === 'category') {
            aVal = categoryNames[aVal] || aVal;
            bVal = categoryNames[bVal] || bVal;
        }
        
        if (aVal < bVal) return currentSortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return currentSortDirection === 'asc' ? 1 : -1;
        return 0;
    });

    tbody.innerHTML = '';
    const noTransactionsDiv = document.getElementById('no-transactions');
    
    if (filteredTransactions.length === 0) {
        noTransactionsDiv.classList.remove('hidden');
        return;
    } else {
        noTransactionsDiv.classList.add('hidden');
    }

    filteredTransactions.forEach((t, index) => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors';
        row.style.animationDelay = `${index * 50}ms`;
        row.classList.add('slide-up');
        
        row.innerHTML = `
            <td class="px-6 py-4 text-sm">${new Date(t.date).toLocaleDateString('pt-BR')}</td>
            <td class="px-6 py-4 text-sm font-medium">${t.description}</td>
            <td class="px-6 py-4 text-sm">${categoryNames[t.category] || t.category}</td>
            <td class="px-6 py-4 text-sm font-semibold ${t.type === 'income' ? 'text-finance-green-600 dark:text-finance-green-400' : 'text-red-600'}">
                ${t.type === 'income' ? '+' : '-'} ${formatCurrency(t.amount)}
            </td>
            <td class="px-6 py-4 text-sm">
                <div class="flex gap-2">
                    <button onclick="editTransaction(${t.id})" 
                            class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-600 p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
                            title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteTransaction(${t.id})" 
                            class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-600 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900 transition-colors"
                            title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function sortTransactions(field) {
    if (currentSortField === field) {
        currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        currentSortField = field;
        currentSortDirection = 'desc';
    }
    updateTransactionsList();
}

function deleteTransaction(id) {
    showConfirmDialog('Tem certeza que deseja excluir esta transação?', 
        `() => {
            transactions = transactions.filter(t => t.id !== ${id});
            saveData();
            updateTransactionsList();
            updateDashboard();
            showToast('Transação excluída com sucesso!');
        }`
    );
}

function editTransaction(id) {
    const t = transactions.find(x => x.id === id);
    if (!t) return;

    if (t.type === 'expense') {
        document.getElementById('expense-amount').value = t.amount;
        document.getElementById('expense-category').value = t.category;
        document.getElementById('expense-date').value = t.date;
        document.getElementById('expense-description').value = t.description;
        deleteTransaction(id);
        showPage('add-expense');
    } else {
        document.getElementById('income-amount').value = t.amount;
        document.getElementById('income-type').value = t.category;
        document.getElementById('income-date').value = t.date;
        document.getElementById('income-description').value = t.description;
        deleteTransaction(id);
        showPage('add-income');
    }
}

// =============================
// Form Handlers
// =============================
document.getElementById('expense-form').addEventListener('submit', e => {
    e.preventDefault();
    
    const amount = parseFloat(document.getElementById('expense-amount').value);
    if (amount <= 0) {
        showToast('Por favor, insira um valor válido', 'error');
        return;
    }

    const transaction = {
        id: nextId++,
        type: 'expense',
        amount: amount,
        category: document.getElementById('expense-category').value,
        date: document.getElementById('expense-date').value,
        description: document.getElementById('expense-description').value || 'Despesa'
    };

    transactions.push(transaction);
    saveData();
    e.target.reset();
    setDefaultDates();
    
    showToast('Despesa adicionada com sucesso!');
    showPage('dashboard');
});

document.getElementById('income-form').addEventListener('submit', e => {
    e.preventDefault();
    
    const amount = parseFloat(document.getElementById('income-amount').value);
    if (amount <= 0) {
        showToast('Por favor, insira um valor válido', 'error');
        return;
    }

    const transaction = {
        id: nextId++,
        type: 'income',
        amount: amount,
        category: document.getElementById('income-type').value,
        date: document.getElementById('income-date').value,
        description: document.getElementById('income-description').value || 'Receita'
    };

    transactions.push(transaction);
    saveData();
    e.target.reset();
    setDefaultDates();
    
    showToast('Receita adicionada com sucesso!');
    showPage('dashboard');
});

// =============================
// Reports Functions
// =============================
function updateReports() {
    const monthTransactions = getMonthTransactions();
    
    const summary = monthTransactions.reduce(
        (acc, t) => {
            acc[t.type] += t.amount;
            if (t.type === 'expense' && t.amount > acc.biggestExpense) {
                acc.biggestExpense = t.amount;
            }
            if (t.type === 'income' && t.amount > acc.biggestIncome) {
                acc.biggestIncome = t.amount;
            }
            return acc;
        },
        { income: 0, expense: 0, biggestExpense: 0, biggestIncome: 0 }
    );

    const balance = summary.income - summary.expense;

    document.getElementById('report-total-income').textContent = formatCurrency(summary.income);
    document.getElementById('report-total-expenses').textContent = formatCurrency(summary.expense);
    document.getElementById('report-balance').textContent = formatCurrency(balance);
    document.getElementById('report-biggest-expense').textContent = formatCurrency(summary.biggestExpense);
    document.getElementById('report-biggest-income').textContent = formatCurrency(summary.biggestIncome);

    // Update balance color
    const balanceEl = document.getElementById('report-balance');
    balanceEl.className = balance >= 0
        ? 'font-semibold text-finance-green-600'
        : 'font-semibold text-red-600';

    updateCategoryBreakdown(monthTransactions);
    updateYearlyChart();
}

function updateCategoryBreakdown(monthTransactions) {
    const categoryTotals = {};
    const totalExpenses = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((total, t) => {
            categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
            return total + t.amount;
        }, 0);

    const breakdown = document.getElementById('category-breakdown');
    breakdown.innerHTML = '';

    if (totalExpenses === 0) {
        breakdown.innerHTML = '<p class="text-gray-500 dark:text-gray-400 text-center">Nenhuma despesa no período</p>';
        return;
    }

    Object.entries(categoryTotals)
        .sort(([,a], [,b]) => b - a)
        .forEach(([category, amount]) => {
            const percentage = ((amount / totalExpenses) * 100).toFixed(1);
            const item = document.createElement('div');
            item.className = 'flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg';
            item.innerHTML = `
                <div class="flex items-center gap-3">
                    <span class="text-sm font-medium">${categoryNames[category] || category}</span>
                    <span class="text-xs text-gray-500 dark:text-gray-400">${percentage}%</span>
                </div>
                <span class="font-semibold text-red-600">${formatCurrency(amount)}</span>
            `;
            breakdown.appendChild(item);
        });
}

function updateYearlyChart() {
    const ctx = document.getElementById('yearly-chart').getContext('2d');
    if (window.yearlyChart) window.yearlyChart.destroy();

    const currentYear = getCurrentYear();
    const months = [];
    const incomeData = [];
    const expenseData = [];

    for (let m = 0; m < 12; m++) {
        const date = new Date(currentYear, m);
        months.push(date.toLocaleDateString('pt-BR', { month: 'short' }));

        const monthTransactions = transactions.filter(t => {
            const d = new Date(t.date);
            return d.getMonth() === m && d.getFullYear() === currentYear;
        });

        incomeData.push(monthTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0));
        expenseData.push(monthTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0));
    }

    const isDark = document.documentElement.classList.contains('dark');
    const textColor = isDark ? '#f3f4f6' : '#374151';
    const gridColor = isDark ? '#4b5563' : '#e5e7eb';

    window.yearlyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: months,
            datasets: [
                {
                    label: 'Receitas',
                    data: incomeData,
                    backgroundColor: 'rgba(34,197,94,0.7)',
                    borderColor: '#22c55e',
                    borderWidth: 1
                },
                {
                    label: 'Despesas',
                    data: expenseData,
                    backgroundColor: 'rgba(239,68,68,0.7)',
                    borderColor: '#ef4444',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: textColor }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: textColor,
                        callback: v => formatCurrency(v)
                    },
                    grid: { color: gridColor }
                },
                x: {
                    ticks: { color: textColor },
                    grid: { color: gridColor }
                }
            }
        }
    });
}

// =============================
// Settings Functions
// =============================
function updateSettings() {
    document.getElementById('user-name').value = settings.userName || 'Usuário';
    document.getElementById('monthly-goal').value = settings.monthlyGoal || '';
    
    updateStatistics();
}

function updateStatistics() {
    const totalTransactions = transactions.length;
    const expenses = transactions.filter(t => t.type === 'expense');
    const avgExpense = expenses.length > 0 ? expenses.reduce((s, t) => s + t.amount, 0) / expenses.length : 0;
    
    // Most used category
    const categoryCount = {};
    expenses.forEach(t => {
        categoryCount[t.category] = (categoryCount[t.category] || 0) + 1;
    });
    const mostCategory = Object.entries(categoryCount).length > 0 
        ? Object.entries(categoryCount).sort(([,a], [,b]) => b - a)[0][0] 
        : '-';
    
    // Active months
    const months = new Set();
    transactions.forEach(t => {
        const date = new Date(t.date);
        months.add(`${date.getFullYear()}-${date.getMonth()}`);
    });

    document.getElementById('stats-total-transactions').textContent = totalTransactions;
    document.getElementById('stats-avg-expense').textContent = formatCurrency(avgExpense);
    document.getElementById('stats-most-category').textContent = mostCategory !== '-' ? (categoryNames[mostCategory] || mostCategory) : '-';
    document.getElementById('stats-months-active').textContent = months.size;
}

function saveSettings() {
    settings.userName = document.getElementById('user-name').value || 'Usuário';
    settings.monthlyGoal = parseFloat(document.getElementById('monthly-goal').value) || 0;
    saveData();
    updateDashboard();
    showToast('Configurações salvas com sucesso!');
}

function exportAllData() {
    if (transactions.length === 0) {
        showToast('Nenhum dado para exportar', 'error');
        return;
    }

    const data = {
        transactions,
        settings,
        exportDate: new Date().toISOString(),
        version: '1.0'
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `finance_manager_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    showToast('Backup criado com sucesso!');
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            
            if (!data.transactions || !Array.isArray(data.transactions)) {
                showToast('Arquivo inválido', 'error');
                return;
            }

            showConfirmDialog('Isso substituirá todos os dados atuais. Continuar?',
                `() => {
                    transactions = data.transactions;
                    settings = data.settings || settings;
                    nextId = Math.max(...transactions.map(t => t.id)) + 1;
                    saveData();
                    updateDashboard();
                    updateTransactionsList();
                    updateSettings();
                    showToast('Dados importados com sucesso!');
                }`
            );
        } catch (error) {
            showToast('Erro ao ler o arquivo', 'error');
        }
    };
    reader.readAsText(file);
    
    // Reset file input
    event.target.value = '';
}

// =============================
// Help System
// =============================
function showHelpModal() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div class="p-6 border-b border-gray-200 dark:border-gray-700">
                <div class="flex justify-between items-center">
                    <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
                        <i class="fas fa-question-circle mr-2 text-blue-500"></i>
                        Central de Ajuda - FinanceManager
                    </h2>
                    <button onclick="this.closest('.fixed').remove()" 
                            class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            
            <div class="p-6 space-y-8">
                <!-- Visão Geral -->
                <section>
                    <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                        <i class="fas fa-info-circle mr-2 text-blue-500"></i>
                        Visão Geral
                    </h3>
                    <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                        <p class="text-gray-700 dark:text-gray-300">
                            O FinanceManager é uma ferramenta completa para controle financeiro pessoal. 
                            Gerencie receitas e despesas, visualize relatórios detalhados e defina metas de gastos.
                            Todos os dados são armazenados localmente no seu navegador.
                        </p>
                    </div>
                </section>

                <!-- Dashboard -->
                <section>
                    <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                        <i class="fas fa-chart-pie mr-2 text-green-500"></i>
                        Dashboard
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                            <h4 class="font-semibold text-green-800 dark:text-green-300 mb-2">📊 Cards de Resumo</h4>
                            <p class="text-sm text-gray-600 dark:text-gray-300">
                                • <strong>Receitas:</strong> Total de entradas no mês<br>
                                • <strong>Despesas:</strong> Total de gastos no mês<br>
                                • <strong>Saldo:</strong> Diferença entre receitas e despesas<br>
                                • <strong>Média Diária:</strong> Gasto médio por dia
                            </p>
                        </div>
                        <div class="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                            <h4 class="font-semibold text-green-800 dark:text-green-300 mb-2">🎯 Meta de Gastos</h4>
                            <p class="text-sm text-gray-600 dark:text-gray-300">
                                Clique em "Definir Meta" para estabelecer um limite mensal de gastos. 
                                A barra de progresso mostra o quanto você já gastou em relação à meta.
                            </p>
                        </div>
                        <div class="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                            <h4 class="font-semibold text-green-800 dark:text-green-300 mb-2">📈 Gráficos</h4>
                            <p class="text-sm text-gray-600 dark:text-gray-300">
                                • <strong>Pizza:</strong> Mostra gastos por categoria<br>
                                • <strong>Linha:</strong> Evolução mensal dos últimos 6 meses
                            </p>
                        </div>
                        <div class="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                            <h4 class="font-semibold text-green-800 dark:text-green-300 mb-2">📅 Seletor de Período</h4>
                            <p class="text-sm text-gray-600 dark:text-gray-300">
                                Use os seletores de mês/ano no cabeçalho para visualizar dados de períodos específicos.
                            </p>
                        </div>
                    </div>
                </section>

                <!-- Adicionar Transações -->
                <section>
                    <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                        <i class="fas fa-plus-circle mr-2 text-purple-500"></i>
                        Adicionar Transações
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                            <h4 class="font-semibold text-purple-800 dark:text-purple-300 mb-2">💸 Despesas</h4>
                            <p class="text-sm text-gray-600 dark:text-gray-300">
                                1. Informe o valor gasto<br>
                                2. Selecione a categoria (alimentação, transporte, etc.)<br>
                                3. Escolha a data do gasto<br>
                                4. Adicione uma descrição (opcional)<br>
                                5. Clique em "Adicionar Despesa"
                            </p>
                        </div>
                        <div class="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                            <h4 class="font-semibold text-purple-800 dark:text-purple-300 mb-2">💰 Receitas</h4>
                            <p class="text-sm text-gray-600 dark:text-gray-300">
                                1. Informe o valor recebido<br>
                                2. Selecione o tipo (salário, freelance, etc.)<br>
                                3. Escolha a data do recebimento<br>
                                4. Adicione uma descrição (opcional)<br>
                                5. Clique em "Adicionar Receita"
                            </p>
                        </div>
                    </div>
                </section>

                <!-- Ver Transações -->
                <section>
                    <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                        <i class="fas fa-list mr-2 text-orange-500"></i>
                        Visualizar Transações
                    </h3>
                    <div class="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <h4 class="font-semibold text-orange-800 dark:text-orange-300 mb-2">🔍 Filtros e Busca</h4>
                                <p class="text-sm text-gray-600 dark:text-gray-300">
                                    • <strong>Busca:</strong> Digite para buscar por descrição ou categoria<br>
                                    • <strong>Categoria:</strong> Filtre por categoria específica<br>
                                    • <strong>Tipo:</strong> Mostre apenas receitas ou despesas
                                </p>
                            </div>
                            <div>
                                <h4 class="font-semibold text-orange-800 dark:text-orange-300 mb-2">⚡ Ações</h4>
                                <p class="text-sm text-gray-600 dark:text-gray-300">
                                    • <strong>✏️ Editar:</strong> Modifica uma transação existente<br>
                                    • <strong>🗑️ Excluir:</strong> Remove permanentemente a transação<br>
                                    • <strong>Ordenação:</strong> Clique nos cabeçalhos para ordenar
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- Relatórios -->
                <section>
                    <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                        <i class="fas fa-chart-bar mr-2 text-red-500"></i>
                        Relatórios
                    </h3>
                    <div class="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <h4 class="font-semibold text-red-800 dark:text-red-300 mb-2">📋 Relatório Mensal</h4>
                                <p class="text-sm text-gray-600 dark:text-gray-300">
                                    Mostra um resumo completo do mês selecionado, incluindo totais, 
                                    maiores valores e análise por categoria.
                                </p>
                            </div>
                            <div>
                                <h4 class="font-semibold text-red-800 dark:text-red-300 mb-2">📊 Gráfico Anual</h4>
                                <p class="text-sm text-gray-600 dark:text-gray-300">
                                    Visualiza a evolução mensal de receitas e despesas durante todo o ano.
                                </p>
                            </div>
                        </div>
                        <div class="mt-4 p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <p class="text-sm text-blue-800 dark:text-blue-300">
                                <i class="fas fa-download mr-1"></i>
                                <strong>Exportação:</strong> Clique em "Exportar Relatório" para baixar um arquivo CSV 
                                com todas as transações do mês atual.
                            </p>
                        </div>
                    </div>
                </section>

                <!-- Configurações -->
                <section>
                    <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                        <i class="fas fa-cog mr-2 text-gray-500"></i>
                        Configurações
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                            <h4 class="font-semibold text-gray-800 dark:text-gray-300 mb-2">👤 Perfil</h4>
                            <p class="text-sm text-gray-600 dark:text-gray-300">
                                Configure seu nome e meta de gastos mensais. 
                                A meta aparecerá no dashboard como uma barra de progresso.
                            </p>
                        </div>
                        <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                            <h4 class="font-semibold text-gray-800 dark:text-gray-300 mb-2">📊 Estatísticas</h4>
                            <p class="text-sm text-gray-600 dark:text-gray-300">
                                Veja informações gerais como total de transações, 
                                gasto médio e categoria mais utilizada.
                            </p>
                        </div>
                        <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                            <h4 class="font-semibold text-gray-800 dark:text-gray-300 mb-2">💾 Backup</h4>
                            <p class="text-sm text-gray-600 dark:text-gray-300">
                                • <strong>Exportar:</strong> Baixa todos os dados em JSON<br>
                                • <strong>Importar:</strong> Restaura dados de um backup anterior
                            </p>
                        </div>
                        <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                            <h4 class="font-semibold text-gray-800 dark:text-gray-300 mb-2">🗑️ Limpeza</h4>
                            <p class="text-sm text-gray-600 dark:text-gray-300">
                                "Limpar Todos os Dados" remove permanentemente todas as transações. 
                                Use com cuidado!
                            </p>
                        </div>
                    </div>
                </section>

                <!-- Dicas -->
                <section>
                    <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                        <i class="fas fa-lightbulb mr-2 text-yellow-500"></i>
                        Dicas de Uso
                    </h3>
                    <div class="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                        <ul class="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                            <li><i class="fas fa-check text-green-500 mr-2"></i>Registre transações diariamente para manter controle preciso</li>
                            <li><i class="fas fa-check text-green-500 mr-2"></i>Use categorias consistentes para relatórios mais úteis</li>
                            <li><i class="fas fa-check text-green-500 mr-2"></i>Defina uma meta de gastos realista baseada em sua renda</li>
                            <li><i class="fas fa-check text-green-500 mr-2"></i>Faça backup regular dos seus dados</li>
                            <li><i class="fas fa-check text-green-500 mr-2"></i>Revise os relatórios mensalmente para identificar padrões</li>
                            <li><i class="fas fa-check text-green-500 mr-2"></i>Use descrições claras para facilitar futuras consultas</li>
                        </ul>
                    </div>
                </section>

                <!-- Atalhos -->
                <section>
                    <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                        <i class="fas fa-keyboard mr-2 text-indigo-500"></i>
                        Navegação Rápida
                    </h3>
                    <div class="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
                        <div class="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                            <div class="flex items-center">
                                <span class="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                <span class="text-gray-700 dark:text-gray-300">Dashboard: Visão geral</span>
                            </div>
                            <div class="flex items-center">
                                <span class="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                                <span class="text-gray-700 dark:text-gray-300">Despesa: Registrar gasto</span>
                            </div>
                            <div class="flex items-center">
                                <span class="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                                <span class="text-gray-700 dark:text-gray-300">Receita: Registrar entrada</span>
                            </div>
                            <div class="flex items-center">
                                <span class="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                                <span class="text-gray-700 dark:text-gray-300">Transações: Ver histórico</span>
                            </div>
                            <div class="flex items-center">
                                <span class="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                                <span class="text-gray-700 dark:text-gray-300">Relatórios: Análises</span>
                            </div>
                            <div class="flex items-center">
                                <span class="w-2 h-2 bg-gray-500 rounded-full mr-2"></span>
                                <span class="text-gray-700 dark:text-gray-300">Configurações: Ajustes</span>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    `;
    
    document.getElementById('modal-container').appendChild(modal);
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

function startTour() {
    const steps = [
        {
            element: '#dashboard-page .grid:first-child',
            title: '📊 Cards de Resumo',
            text: 'Estes cards mostram um resumo financeiro do mês selecionado. Você pode ver receitas, despesas, saldo e média diária de gastos.',
            position: 'bottom'
        },
        {
            element: '.bg-finance-green-100',
            title: '💰 Saldo Atual',
            text: 'Aqui no cabeçalho você sempre pode ver seu saldo atual. Verde indica saldo positivo, vermelho indica negativo.',
            position: 'bottom'
        },
        {
            element: '#dashboard-month',
            title: '📅 Seletor de Período',
            text: 'Use estes seletores para navegar entre diferentes meses e anos. Todos os dados do dashboard se atualizam automaticamente.',
            position: 'bottom'
        },
        {
            element: '#spending-goal-section',
            title: '🎯 Meta de Gastos',
            text: 'Defina uma meta mensal de gastos. A barra mostra seu progresso e muda de cor conforme você se aproxima do limite.',
            position: 'top'
        },
        {
            element: '.nav-item:nth-child(2)',
            title: '➕ Adicionar Despesa',
            text: 'Clique aqui para registrar um novo gasto. Informe valor, categoria, data e descrição.',
            position: 'right'
        },
        {
            element: '.nav-item:nth-child(3)',
            title: '💰 Adicionar Receita',
            text: 'Use esta opção para registrar entradas de dinheiro como salário, freelances ou vendas.',
            position: 'right'
        },
        {
            element: '.nav-item:nth-child(4)',
            title: '📋 Ver Transações',
            text: 'Aqui você pode visualizar, buscar, filtrar e editar todas suas transações.',
            position: 'right'
        },
        {
            element: '.nav-item:nth-child(5)',
            title: '📊 Relatórios',
            text: 'Acesse relatórios detalhados, gráficos anuais e exporte seus dados em CSV.',
            position: 'right'
        },
        {
            element: '#help-btn',
            title: '❓ Central de Ajuda',
            text: 'Este botão sempre estará disponível para ajudá-lo. Clique a qualquer momento para ver tutoriais e dicas!',
            position: 'left'
        }
    ];

    let currentStep = 0;
    let overlay;

    function showStep(stepIndex) {
        if (stepIndex >= steps.length) {
            endTour();
            return;
        }

        const step = steps[stepIndex];
        const element = document.querySelector(step.element);
        
        if (!element) {
            currentStep++;
            showStep(currentStep);
            return;
        }

        // Remove overlay anterior
        if (overlay) overlay.remove();

        // Criar overlay
        overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 bg-black bg-opacity-50 z-50';
        
        // Posição do elemento
        const rect = element.getBoundingClientRect();
        
        // Destacar elemento
        overlay.innerHTML = `
            <div class="absolute bg-white rounded-lg shadow-xl p-1" style="
                top: ${rect.top - 8}px; 
                left: ${rect.left - 8}px; 
                width: ${rect.width + 16}px; 
                height: ${rect.height + 16}px;
                z-index: 51;
            "></div>
            
            <div class="absolute bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-sm" style="
                ${step.position === 'bottom' ? `top: ${rect.bottom + 20}px;` : ''}
                ${step.position === 'top' ? `bottom: ${window.innerHeight - rect.top + 20}px;` : ''}
                ${step.position === 'right' ? `top: ${rect.top}px; left: ${rect.right + 20}px;` : ''}
                ${step.position === 'left' ? `top: ${rect.top}px; right: ${window.innerWidth - rect.left + 20}px;` : ''}
                ${step.position === 'bottom' || step.position === 'top' ? `left: ${Math.max(20, Math.min(rect.left, window.innerWidth - 400))}px;` : ''}
                z-index: 52;
            ">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">${step.title}</h3>
                <p class="text-gray-600 dark:text-gray-300 mb-4">${step.text}</p>
                <div class="flex justify-between">
                    <button onclick="endTour()" class="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                        Pular Tour
                    </button>
                    <div class="space-x-2">
                        ${stepIndex > 0 ? '<button onclick="previousStep()" class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600">Anterior</button>' : ''}
                        <button onclick="nextStep()" class="px-4 py-2 bg-finance-green-500 text-white rounded-lg hover:bg-finance-green-600">
                            ${stepIndex === steps.length - 1 ? 'Finalizar' : 'Próximo'}
                        </button>
                    </div>
                </div>
                <div class="mt-3 text-center text-sm text-gray-500 dark:text-gray-400">
                    ${stepIndex + 1} de ${steps.length}
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        
        // Scroll para o elemento se necessário
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    window.nextStep = () => {
        currentStep++;
        showStep(currentStep);
    };

    window.previousStep = () => {
        currentStep--;
        showStep(currentStep);
    };

    window.endTour = () => {
        if (overlay) overlay.remove();
        delete window.nextStep;
        delete window.previousStep;
        delete window.endTour;
        showToast('Tour concluído! Agora você está pronto para usar o FinanceManager.', 'success');
    };

    // Garantir que estamos no dashboard para o tour
    showPage('dashboard');
    setTimeout(() => showStep(0), 500);
}

// =============================
// Event Listeners
// =============================
document.getElementById('filter-category').addEventListener('change', updateTransactionsList);
document.getElementById('filter-type').addEventListener('change', updateTransactionsList);
document.getElementById('search-transactions').addEventListener('input', updateTransactionsList);
document.getElementById('dashboard-month').addEventListener('change', () => {
    updateDashboard();
    // Se estivermos na página de relatórios, atualizar também
    if (!document.getElementById('reports-page').classList.contains('hidden')) {
        updateReports();
    }
});
document.getElementById('dashboard-year').addEventListener('change', () => {
    updateDashboard();
    // Se estivermos na página de relatórios, atualizar também
    if (!document.getElementById('reports-page').classList.contains('hidden')) {
        updateReports();
    }
});
document.getElementById('help-btn').addEventListener('click', showHelpModal);

// =============================
// Initialization
// =============================
window.addEventListener('DOMContentLoaded', () => {
    setDefaultDates();
    
    // Set current month/year
    const now = new Date();
    document.getElementById('dashboard-month').value = now.getMonth();
    document.getElementById('dashboard-year').value = now.getFullYear();
    
    updateDashboard();
    updateTransactionsList();
    
    // Load initial nav state
    document.querySelector('.nav-item.active')?.classList.add('bg-finance-green-50', 'dark:bg-finance-green-900', 'text-finance-green-600', 'dark:text-finance-green-400');
});
