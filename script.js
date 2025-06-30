// Dark mode detection
if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.classList.add('dark');
}
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
    if (event.matches) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
});

// Load transactions and nextId from localStorage or initialize
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let nextId = parseInt(localStorage.getItem('nextId')) || 1;

// Save transactions and nextId to localStorage
function saveData() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
    localStorage.setItem('nextId', nextId.toString());
}

// Page navigation
function showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.add('hidden');
    });

    // Show selected page
    document.getElementById(pageId + '-page').classList.remove('hidden');

    // Update page title
    const titles = {
        'dashboard': 'Dashboard',
        'add-expense': 'Adicionar Despesa',
        'add-income': 'Adicionar Receita',
        'expenses': 'Visualizar Transações',
        'reports': 'Relatórios',
        'settings': 'Configurações'
    };
    document.getElementById('page-title').textContent = titles[pageId];

    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active', 'bg-finance-green-50', 'dark:bg-finance-green-900', 'text-finance-green-600', 'dark:text-finance-green-400');
    });
    if (event && event.target) {
        event.target.classList.add('active', 'bg-finance-green-50', 'dark:bg-finance-green-900', 'text-finance-green-600', 'dark:text-finance-green-400');
    }

    // Refresh data if needed
    if (pageId === 'dashboard') {
        updateDashboard();
    } else if (pageId === 'expenses') {
        updateTransactionsList();
    } else if (pageId === 'reports') {
        updateReports();
    }
}

// Mobile menu toggle
document.getElementById('mobile-menu-btn').addEventListener('click', function () {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('-translate-x-full');
});

// Close sidebar when clicking outside on mobile
document.addEventListener('click', function (event) {
    const sidebar = document.getElementById('sidebar');
    const menuBtn = document.getElementById('mobile-menu-btn');

    if (!sidebar.contains(event.target) && !menuBtn.contains(event.target)) {
        sidebar.classList.add('-translate-x-full');
    }
});

// Form submissions
document.getElementById('expense-form').addEventListener('submit', function (e) {
    e.preventDefault();

    const expense = {
        id: nextId++,
        type: 'expense',
        amount: parseFloat(document.getElementById('expense-amount').value),
        category: document.getElementById('expense-category').value,
        date: document.getElementById('expense-date').value,
        description: document.getElementById('expense-description').value || 'Despesa'
    };

    transactions.push(expense);
    saveData();

    this.reset();

    // Show success message
    alert('Despesa adicionada com sucesso!');

    // Go to dashboard
    showPage('dashboard');
});

document.getElementById('income-form').addEventListener('submit', function (e) {
    e.preventDefault();

    const income = {
        id: nextId++,
        type: 'income',
        amount: parseFloat(document.getElementById('income-amount').value),
        category: document.getElementById('income-type').value,
        date: document.getElementById('income-date').value,
        description: document.getElementById('income-description').value || 'Receita'
    };

    transactions.push(income);
    saveData();

    this.reset();

    // Show success message
    alert('Receita adicionada com sucesso!');

    // Go to dashboard
    showPage('dashboard');
});

// Set default dates to today
function setDefaultDates() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('expense-date').value = today;
    document.getElementById('income-date').value = today;
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(amount);
}

// Update dashboard
function updateDashboard() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Update current month display
    document.getElementById('current-month').textContent =
        now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

    // Filter transactions for current month
    const monthlyTransactions = transactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
    });

    const monthlyIncome = monthlyTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const monthlyExpenses = monthlyTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    const monthlyBalance = monthlyIncome - monthlyExpenses;

    // Update cards
    document.getElementById('monthly-income').textContent = formatCurrency(monthlyIncome);
    document.getElementById('monthly-expenses').textContent = formatCurrency(monthlyExpenses);
    document.getElementById('monthly-balance').textContent = formatCurrency(monthlyBalance);
    document.getElementById('total-balance').textContent = formatCurrency(monthlyBalance);
    document.getElementById('total-transactions').textContent = monthlyTransactions.length;

    // Update balance color
    const balanceElement = document.getElementById('monthly-balance');
    if (monthlyBalance >= 0) {
        balanceElement.className = 'text-2xl font-bold text-finance-green-600';
    } else {
        balanceElement.className = 'text-2xl font-bold text-red-600';
    }

    // Update charts
    updateExpensesChart(monthlyTransactions);
    updateMonthlyChart();
}

// Update expenses chart
function updateExpensesChart(monthlyTransactions) {
    const ctx = document.getElementById('expenses-chart').getContext('2d');

    // Destroy existing chart if it exists
    if (window.expensesChart) {
        window.expensesChart.destroy();
    }

    const expenses = monthlyTransactions.filter(t => t.type === 'expense');
    const categoryTotals = {};

    expenses.forEach(expense => {
        categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
    });

    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);
    const colors = [
        '#22c55e', '#ef4444', '#3b82f6', '#f59e0b',
        '#8b5cf6', '#ec4899', '#10b981', '#f97316'
    ];

    window.expensesChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels.map(label => {
                const categoryNames = {
                    'alimentacao': 'Alimentação',
                    'transporte': 'Transporte',
                    'moradia': 'Moradia',
                    'saude': 'Saúde',
                    'educacao': 'Educação',
                    'lazer': 'Lazer',
                    'outros': 'Outros'
                };
                return categoryNames[label] || label;
            }),
            datasets: [{
                data: data,
                backgroundColor: colors.slice(0, labels.length),
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#374151'
                    }
                }
            }
        }
    });
}

// Update monthly chart
function updateMonthlyChart() {
    const ctx = document.getElementById('monthly-chart').getContext('2d');

    // Destroy existing chart if it exists
    if (window.monthlyChart) {
        window.monthlyChart.destroy();
    }

    // Get last 6 months of data
    const months = [];
    const incomeData = [];
    const expenseData = [];

    for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);

        const month = date.getMonth();
        const year = date.getFullYear();

        months.push(date.toLocaleDateString('pt-BR', { month: 'short' }));

        const monthTransactions = transactions.filter(t => {
            const tDate = new Date(t.date);
            return tDate.getMonth() === month && tDate.getFullYear() === year;
        });

        const income = monthTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const expenses = monthTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        incomeData.push(income);
        expenseData.push(expenses);
    }

    window.monthlyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [
                {
                    label: 'Receitas',
                    data: incomeData,
                    borderColor: '#22c55e',
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    tension: 0.4
                },
                {
                    label: 'Despesas',
                    data: expenseData,
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#374151'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#374151',
                        callback: function (value) {
                            return formatCurrency(value);
                        }
                    },
                    grid: {
                        color: document.documentElement.classList.contains('dark') ? '#374151' : '#e5e7eb'
                    }
                },
                x: {
                    ticks: {
                        color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#374151'
                    },
                    grid: {
                        color: document.documentElement.classList.contains('dark') ? '#374151' : '#e5e7eb'
                    }
                }
            }
        }
    });
}

// Update transactions list
function updateTransactionsList() {
    const tbody = document.getElementById('transactions-list');
    const categoryFilter = document.getElementById('filter-category').value;
    const typeFilter = document.getElementById('filter-type').value;

    let filteredTransactions = transactions;

    if (categoryFilter) {
        filteredTransactions = filteredTransactions.filter(t => t.category === categoryFilter);
    }

    if (typeFilter) {
        filteredTransactions = filteredTransactions.filter(t => t.type === typeFilter);
    }

    // Sort by date (newest first)
    filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    tbody.innerHTML = '';

    filteredTransactions.forEach(transaction => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50 dark:hover:bg-gray-700';

        const categoryNames = {
            'alimentacao': 'Alimentação',
            'transporte': 'Transporte',
            'moradia': 'Moradia',
            'saude': 'Saúde',
            'educacao': 'Educação',
            'lazer': 'Lazer',
            'salario': 'Salário',
            'freelance': 'Freelance',
            'investimento': 'Investimento',
            'bonus': 'Bônus',
            'outros': 'Outros'
        };

        row.innerHTML = `
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        ${new Date(transaction.date).toLocaleDateString('pt-BR')}
                    </td>
                    <td class="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        ${transaction.description}
                    </td>
                    <td class="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        ${categoryNames[transaction.category] || transaction.category}
                    </td>
                    <td class="px-6 py-4 text-sm font-semibold ${transaction.type === 'income' ? 'text-finance-green-600 dark:text-finance-green-400' : 'text-red-600'}">
                        ${transaction.type === 'income' ? '+' : '-'} ${formatCurrency(transaction.amount)}
                    </td>
                    <td class="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        <button onclick="deleteTransaction(${transaction.id})" title="Excluir" class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-600 focus:outline-none">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </td>
                `;

        tbody.appendChild(row);
    });
}

// Delete transaction
function deleteTransaction(id) {
    if (confirm('Tem certeza que deseja excluir esta transação?')) {
        transactions = transactions.filter(t => t.id !== id);
        saveData();
        updateTransactionsList();
        updateDashboard();
    }
}

// Clear all data
function clearAllData() {
    if (confirm('Tem certeza que deseja limpar todos os dados? Esta ação não pode ser desfeita.')) {
        transactions = [];
        nextId = 1;
        saveData();
        updateDashboard();
        updateTransactionsList();
        updateReports();
        alert('Todos os dados foram removidos com sucesso!');
    }
}

// Reports update (implement if you have report functionality)
function updateReports() {
    // Placeholder for updating reports page
}

// Filter inputs event listeners
document.getElementById('filter-category').addEventListener('change', updateTransactionsList);
document.getElementById('filter-type').addEventListener('change', updateTransactionsList);

// Initialize default dates and dashboard on load
window.addEventListener('DOMContentLoaded', () => {
    setDefaultDates();
    updateDashboard();
    updateTransactionsList();
});
