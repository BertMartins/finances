// --- DADOS & ESTADO ---
const DB_KEY = 'financeDB_v5_merged';
let DB = {
    incomes: [], rec_incomes: [],
    pix: [], rec_pix: [], pix_installments: [],
    savings: [], rec_savings: [],
    fixed: [], tracked: [], tracked_data: [], installments: [],
    planned: [], planned_inst: [], boxes: []
};

// Datas
const now = new Date();
let curYear = now.getFullYear();
let curMonth = now.getMonth() + 1; // 1-12

let pickerYear = curYear;
let pickerMonth = curMonth;

const months = ["JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO", "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO"];

// --- UTILITÁRIOS ---
const fmtMoney = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(isNaN(v) ? 0 : v);
const getMKey = (m, y) => `${String(m).padStart(2, '0')}-${y}`; // "01-2023"
const parseKey = (k) => { const s = k.split('-'); return { m: parseInt(s[0]), y: parseInt(s[1]) }; };
const getKeyVal = (k) => { const p = parseKey(k); return p.y * 12 + p.m; };
const addMonth = (k, n) => { const p = parseKey(k); const d = new Date(p.y, p.m - 1 + n, 1); return getMKey(d.getMonth() + 1, d.getFullYear()); };

// Chart global
let summaryChart = null;

// --- INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', () => {
    loadDB();
    renderApp();
});

function renderApp() {
    const currentMKey = getMKey(curMonth, curYear);
    document.getElementById('date-display').innerText = `${months[curMonth - 1]} ${curYear}`;

    // Popular selects de mês/ano
    const selOpts = [];
    for (let y = curYear - 2; y <= curYear + 5; y++) {
        for (let m = 1; m <= 12; m++) selOpts.push({ v: getMKey(m, y), t: `${months[m - 1]} ${y}` });
    }
    document.querySelectorAll('select').forEach(s => {
        if ((s.id.includes('month') || s.id.includes('start')) && !s.id.includes('edt')) {
            const oldVal = s.value;
            s.innerHTML = '';
            selOpts.forEach(o => s.add(new Option(o.t, o.v)));
            if (s.id.includes('month')) s.value = currentMKey;
            else s.value = oldVal || currentMKey;
        } else if (s.id.includes('edt')) {
            const oldVal = s.value;
            s.innerHTML = '';
            selOpts.forEach(o => s.add(new Option(o.t, o.v)));
            s.value = oldVal || currentMKey;
        }
    });

    const cmVal = curYear * 12 + curMonth;
    const isActive = (start, end) => {
        const s = getKeyVal(start);
        const e = end ? getKeyVal(end) : 999999;
        return cmVal >= s && cmVal <= e;
    };

    let totInc = 0, totExp = 0, totPix = 0;
    let cards = {};
    let totBox = 0; // saldo total da caixinha

    // 1. Renda
    const lIncRec = document.getElementById('list-inc-rec'); lIncRec.innerHTML = '';
    DB.rec_incomes.filter(i => isActive(i.start, i.end)).forEach(i => {
        totInc += i.val;
        lIncRec.innerHTML += row(i, 'rec_incomes', 'text-green', '+');
    });

    const lIncUniq = document.getElementById('list-inc-uniq'); lIncUniq.innerHTML = '';
    DB.incomes.filter(i => i.month === currentMKey).forEach(i => {
        totInc += i.val;
        lIncUniq.innerHTML += row(i, 'incomes', 'text-green', '+');
    });

    // 2. PIX
    const lPixRec = document.getElementById('list-pix-rec'); lPixRec.innerHTML = '';
    DB.rec_pix.filter(i => isActive(i.start, i.end)).forEach(i => {
        const isPaid = i.paid_months && i.paid_months.includes(currentMKey);
        if (!isPaid) { totExp += i.val; totPix += i.val; }
        lPixRec.innerHTML += rowRecPix(i, isPaid);
    });

    const lPixInst = document.getElementById('list-pix-inst'); lPixInst.innerHTML = '';
    DB.pix_installments.forEach(i => {
        const sVal = getKeyVal(i.start);
        const eVal = sVal + i.count - 1;
        if (cmVal >= sVal && cmVal <= eVal) {
            const val = i.total / i.count;
            const curNum = cmVal - sVal + 1;
            const isPaid = i.paid_months && i.paid_months.includes(currentMKey);
            if (!isPaid) { totExp += val; totPix += val; }
            lPixInst.innerHTML += rowPixInst(i, curNum, val, isPaid);
        }
    });

    const lPixUniq = document.getElementById('list-pix-uniq'); lPixUniq.innerHTML = '';
    DB.pix.filter(i => i.month === currentMKey).forEach(i => {
        if (!i.done) { totExp += i.val; totPix += i.val; }
        lPixUniq.innerHTML += rowPix(i);
    });

    // 3. Caixinha
    // Agora caixinha é só saldo acumulado em dash-box, não entra mais como gasto do mês.
    // Considera que val pode ser + (depósito) ou - (saque).
    DB.savings.forEach(i => {
        totBox += i.val;
    });

    // se ainda existir o card antigo, limpa as listas pra não mostrar nada
    const lSavRec = document.getElementById('list-sav-rec');
    const lSavUniq = document.getElementById('list-sav-uniq');
    if (lSavRec) lSavRec.innerHTML = '';
    if (lSavUniq) lSavUniq.innerHTML = '';

    // atualiza o card da caixinha
    const dashBoxEl = document.getElementById('dash-box');
    if (dashBoxEl) dashBoxEl.innerText = fmtMoney(totBox);

    // 4. Cartões
    const lFixed = document.getElementById('list-fixed'); lFixed.innerHTML = '';
    DB.fixed.filter(i => isActive(i.start, i.end)).forEach(i => {
        totExp += i.val;
        cards[i.card] = (cards[i.card] || 0) + i.val;
        lFixed.innerHTML += row(i, 'fixed', 'text-red', '-');
    });

    const lTracked = document.getElementById('list-tracked'); lTracked.innerHTML = '';
    DB.tracked.filter(i => isActive(i.start, i.end)).forEach(i => {
        const trackData = DB.tracked_data.find(d => d.id === i.id && d.m === currentMKey);
        const current = trackData ? trackData.val : 0;
        totExp += current;
        cards[i.card] = (cards[i.card] || 0) + current;
        lTracked.innerHTML += rowTracked(i, current);
    });

    const lInstNu = document.getElementById('list-inst-nubank'); lInstNu.innerHTML = '';
    const lInstMp = document.getElementById('list-inst-mp'); lInstMp.innerHTML = '';
    const lInstOt = document.getElementById('list-inst-other'); lInstOt.innerHTML = '';

    DB.installments.forEach(i => {
        const sVal = getKeyVal(i.start);
        const eVal = sVal + i.count - 1;
        if (cmVal >= sVal && cmVal <= eVal) {
            const val = i.total / i.count;
            totExp += val;
            cards[i.card] = (cards[i.card] || 0) + val;
            const curNum = cmVal - sVal + 1;
            const html = rowInst(i, curNum, val);
            if (i.card === 'Nubank') lInstNu.innerHTML += html;
            else if (i.card === 'Mercado Pago') lInstMp.innerHTML += html;
            else lInstOt.innerHTML += html;
        }
    });

    // 5. Planejado
    let totPlan = 0;
    const lPlan = document.getElementById('list-plan'); lPlan.innerHTML = '';
    DB.planned.filter(i => i.month === currentMKey).forEach(i => {
        totPlan += i.val;
        lPlan.innerHTML += row(i, 'planned', 'text-yellow', '-');
    });
    DB.planned_inst.forEach(i => {
        const sVal = getKeyVal(i.start);
        const eVal = sVal + i.count - 1;
        if (cmVal >= sVal && cmVal <= eVal) {
            const val = i.total / i.count;
            totPlan += val;
            const curNum = cmVal - sVal + 1;
            lPlan.innerHTML += rowInst(i, curNum, val, true);
        }
    });

    // Totais
    document.getElementById('dash-inc').innerText = fmtMoney(totInc);
    document.getElementById('dash-exp').innerText = fmtMoney(totExp);
    const bal = totInc - totExp;
    document.getElementById('dash-bal').innerText = fmtMoney(bal);
    document.getElementById('dash-bal').className = bal >= 0 ? 'text-blue' : 'text-red';

    const est = bal - totPlan;
    document.getElementById('dash-est').innerText = fmtMoney(est);
    document.getElementById('dash-est').className = est >= 0 ? 'text-yellow' : 'text-red';

    document.getElementById('total-pix').innerText = fmtMoney(totPix);

    const cDiv = document.getElementById('total-cards'); cDiv.innerHTML = '';
    if (Object.keys(cards).length === 0) cDiv.innerHTML = '<small class="text-slate-400">Sem gastos em cartões neste mês.</small>';
    for (let c in cards) {
        cDiv.innerHTML += `<div style="display:flex; justify-content:space-between;"><span>${c}:</span> <span class="text-red">${fmtMoney(cards[c])}</span></div>`;
    }

    // Atualiza gráfico resumo 
    updateSummaryChart(totInc, totExp, totPlan);
    buildYearChart();
}

// --- GRÁFICO RESUMO --- 
function updateSummaryChart(totInc, totExp, totPlan) {
    const ctx = document.getElementById('chart-summary');
    if (!ctx) return;

    const realBalance = totInc - totExp;
    const estBalance = realBalance - totPlan;

    const data = {
        labels: ['Renda', 'Gastos Reais', 'Saldo Real', 'Planejados (impacto)', 'Saldo Estimado'],
        datasets: [{
            label: 'R$',
            data: [
                totInc,
                totExp,
                realBalance,
                totPlan,
                estBalance
            ],
            borderWidth: 2,
            borderRadius: 6,
            backgroundColor: [
                'rgba(34,197,94,0.7)',
                'rgba(248,113,113,0.7)',
                'rgba(59,130,246,0.7)',
                'rgba(234,179,8,0.7)',
                'rgba(56,189,248,0.7)'
            ],
            borderColor: [
                '#22c55e',
                '#f97373',
                '#3b82f6',
                '#eab308',
                '#38bdf8'
            ]
        }]
    };

    if (summaryChart) summaryChart.destroy();

    summaryChart = new Chart(ctx, {
        type: 'bar',
        data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (context) => fmtMoney(context.parsed.y)
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#9ca3af',
                        callback: v => fmtMoney(v)
                    },
                    grid: { color: 'rgba(55,65,81,0.5)' }
                },
                x: {
                    ticks: { color: '#9ca3af' },
                    grid: { display: false }
                }
            }
        }
    });
}

// --- HTML GENERATORS ---
function row(i, type, color, sign) {
    return `<li class="list-item">
                        <div class="item-desc">
                            <span class="text-bold">${i.desc}</span>
                            <span class="item-sub">${i.date ? 'Dia ' + i.date : ''} ${i.to ? '→ ' + i.to : ''}</span>
                        </div>
                        <div class="item-val-group">
                            <span class="${color}">${sign} ${fmtMoney(i.val)}</span>
                            <div class="actions">
                                <button class="act-btn" onclick="edit('${type}','${i.id}')">✎</button>
                                <button class="act-btn" onclick="del('${type}','${i.id}')">✕</button>
                            </div>
                        </div>
                    </li>`;
}

function rowPix(i) {
    const checked = i.done ? 'checked' : '';
    const styleClass = i.done ? 'line-through' : '';
    return `<li class="list-item ${i.done ? 'pix-done' : ''}">
                        <div class="chk-wrapper">
                            <input type="checkbox" ${checked} onchange="togPix('${i.id}')">
                            <div class="item-desc">
                                <span class="text-bold ${styleClass}">${i.desc}</span>
                                <span class="item-sub">Dia ${i.date} ${i.to ? '→ ' + i.to : ''}</span>
                            </div>
                        </div>
                        <div class="item-val-group">
                            <span class="text-red">- ${fmtMoney(i.val)}</span>
                            <div class="actions">
                                <button class="act-btn" onclick="edit('pix','${i.id}')">✎</button>
                                <button class="act-btn" onclick="del('pix','${i.id}')">✕</button>
                            </div>
                        </div>
                    </li>`;
}

function rowRecPix(i, isPaid) {
    const checked = isPaid ? 'checked' : '';
    const styleClass = isPaid ? 'line-through' : '';
    return `<li class="list-item ${isPaid ? 'pix-done' : ''}">
                        <div class="chk-wrapper">
                            <input type="checkbox" ${checked} onchange="togRecPayment('rec_pix','${i.id}')">
                            <div class="item-desc">
                                <span class="text-bold ${styleClass}">${i.desc}</span>
                                <span class="item-sub">Dia ${i.date} ${i.to ? '→ ' + i.to : ''} (Recorrente)</span>
                            </div>
                        </div>
                        <div class="item-val-group">
                            <span class="text-red">- ${fmtMoney(i.val)}</span>
                            <div class="actions">
                                <button class="act-btn" onclick="edit('rec_pix','${i.id}')">✎</button>
                                <button class="act-btn" onclick="del('rec_pix','${i.id}')">✕</button>
                            </div>
                        </div>
                    </li>`;
}

function rowPixInst(i, num, val, isPaid) {
    const checked = isPaid ? 'checked' : '';
    const styleClass = isPaid ? 'line-through' : '';
    return `<li class="list-item ${isPaid ? 'pix-done' : ''}">
                        <div class="chk-wrapper">
                            <input type="checkbox" ${checked} onchange="togRecPayment('pix_installments','${i.id}')">
                            <div class="item-desc">
                                <span class="text-bold ${styleClass}">${i.desc}</span>
                                <span class="item-sub">${num}/${i.count} (Parcelado)</span>
                            </div>
                        </div>
                        <div class="item-val-group">
                            <span class="text-red">- ${fmtMoney(val)}</span>
                            <div class="actions">
                                <button class="act-btn" onclick="del('pix_installments','${i.id}')">✕</button>
                            </div>
                        </div>
                    </li>`;
}

function rowTracked(i, cur) {
    return `<div style="border:1px solid #111827; padding:8px; border-radius:10px; margin-bottom:5px; background:#020617;">
                        <div style="display:flex; justify-content:space-between;">
                            <span class="text-bold">${i.desc}</span>
                            <div class="actions">
                                <button class="act-btn" onclick="edit('tracked','${i.id}')">✎</button>
                                <button class="act-btn" onclick="del('tracked','${i.id}')">✕</button>
                            </div>
                        </div>
                        <div style="display:flex; justify-content:space-between; margin-top:5px; align-items:center;">
                            <span class="${cur > i.lim ? 'text-red' : ''}">
                                R$ <input class="edit-inline" type="number" value="${cur}" onchange="updTrack('${i.id}',this.value)"> / ${fmtMoney(i.lim)}
                            </span>
                        </div>
                    </div>`;
}

function rowInst(i, num, val, isPlan = false) {
    const type = isPlan ? 'planned_inst' : 'installments';
    const actions = `<div class="actions">
                                ${!isPlan ? `<button class="act-btn" title="Adiantar" onclick="prepay('${i.id}')">⏩</button>` : ''}
                                <button class="act-btn" onclick="edit('${type}','${i.id}')">✎</button>
                                <button class="act-btn" onclick="del('${type}','${i.id}')">✕</button>
                            </div>`;
    return `<div style="border:1px solid #111827; padding:8px; border-radius:10px; margin-bottom:5px; background:#020617;">
                        <div style="display:flex; justify-content:space-between;">
                            <span class="text-bold">${i.desc}</span>${actions}
                        </div>
                        <div style="display:flex; justify-content:space-between; margin-top:5px; font-size:0.85rem;">
                            <span class="text-slate-400">${num}/${i.count}</span>
                            <span class="${isPlan ? 'text-yellow' : 'text-red'}">${fmtMoney(val)}</span>
                        </div>
                    </div>`;
}

// --- CHECKBOX / TRACKING ---
function togPix(id) {
    const x = DB.pix.find(i => i.id === id);
    if (x) { x.done = !x.done; saveDB(); renderApp(); }
}

function togRecPayment(type, id) {
    const item = DB[type].find(i => i.id === id);
    if (!item) return;
    const curKey = getMKey(curMonth, curYear);
    if (!item.paid_months) item.paid_months = [];

    if (item.paid_months.includes(curKey)) {
        item.paid_months = item.paid_months.filter(k => k !== curKey);
    } else {
        item.paid_months.push(curKey);
    }
    saveDB(); renderApp();
}

function updTrack(id, v) {
    const val = parseFloat(v) || 0;
    const mKey = getMKey(curMonth, curYear);
    const ext = DB.tracked_data.find(d => d.id === id && d.m === mKey);
    if (ext) ext.val = val; else DB.tracked_data.push({ id: id, m: mKey, val: val });
    saveDB(); renderApp();
}

// DELETE
function del(type, id) {
    if (!confirm("Excluir item?")) return;
    const recs = ['rec_incomes', 'rec_pix', 'rec_savings', 'fixed', 'tracked'];
    if (recs.includes(type)) {
        const item = DB[type].find(i => i.id === id);
        const cmVal = curYear * 12 + curMonth;
        const sVal = getKeyVal(item.start);
        if (cmVal <= sVal) {
            DB[type] = DB[type].filter(i => i.id !== id);
            if (type === 'tracked') DB.tracked_data = DB.tracked_data.filter(d => d.id !== id);
        } else {
            item.end = addMonth(getMKey(curMonth, curYear), -1);
        }
    } else {
        DB[type] = DB[type].filter(i => i.id !== id);
    }
    saveDB(); renderApp();
}

// PREPAY
let prepayId = null;
function prepay(id) {
    prepayId = id;
    const i = DB.installments.find(x => x.id === id);
    document.getElementById('txt-pre-item').innerText = i.desc;
    const sVal = getKeyVal(i.start);
    const cmVal = curYear * 12 + curMonth;
    const curNum = cmVal - sVal + 1;
    document.getElementById('txt-pre-info').innerText = `Parcela ${curNum} de ${i.count}`;
    document.getElementById('modal-prepay').classList.add('open');
}
document.getElementById('inp-pre-count').addEventListener('input', function () {
    const n = parseInt(this.value) || 0;
    const i = DB.installments.find(x => x.id === prepayId);
    if (!i) { document.getElementById('txt-pre-total').innerText = fmtMoney(0); return; }
    const val = i.total / i.count;
    document.getElementById('txt-pre-total').innerText = fmtMoney(n * val);
});
document.getElementById('form-prepay').onsubmit = (e) => {
    e.preventDefault();
    const n = parseInt(document.getElementById('inp-pre-count').value);
    const i = DB.installments.find(x => x.id === prepayId);
    if (!i || !n || n < 1) { alert('Informe um número válido de parcelas.'); return; }
    const val = i.total / i.count;
    DB.pix.push({ id: 'pp_' + Date.now(), desc: `Adiant. ${i.desc}`, val: val * n, date: new Date().getDate(), month: getMKey(curMonth, curYear), done: true });
    i.count -= n;
    i.total -= (val * n);
    saveDB(); closeModal('modal-prepay'); renderApp();
};

// EDIT
function edit(type, id) {
    const item = DB[type].find(i => i.id === id);
    if (!item) return;
    document.getElementById('edt-id').value = id;
    document.getElementById('edt-type').value = type;
    document.getElementById('edt-desc').value = item.desc;

    ['month', 'start', 'amt', 'date', 'to', 'card', 'lim', 'inst'].forEach(k => {
        const el = document.getElementById('grp-edt-' + k);
        if (el) el.classList.add('hidden');
    });

    const isRec = ['rec_incomes', 'rec_pix', 'rec_savings', 'fixed', 'tracked'].includes(type);
    const currentMKey = getMKey(curMonth, curYear);

    if (isRec) {
        document.getElementById('grp-edt-start').classList.remove('hidden');
        document.getElementById('edt-start').value = item.start;
    } else {
        if (type !== 'installments' && type !== 'planned_inst') {
            document.getElementById('grp-edt-month').classList.remove('hidden');
            document.getElementById('edt-month').value = item.month || currentMKey;
        }
    }

    if (item.val !== undefined && type !== 'installments' && type !== 'planned_inst') {
        document.getElementById('grp-edt-amt').classList.remove('hidden');
        document.getElementById('edt-amt').value = item.val;
    }
    if (item.date !== undefined) {
        document.getElementById('grp-edt-date').classList.remove('hidden');
        document.getElementById('edt-date').value = item.date;
    }
    if (item.to !== undefined) {
        document.getElementById('grp-edt-to').classList.remove('hidden');
        document.getElementById('edt-to').value = item.to;
    }
    if (item.card !== undefined) {
        document.getElementById('grp-edt-card').classList.remove('hidden');
        document.getElementById('edt-card').value = item.card;
    }
    if (item.lim !== undefined) {
        document.getElementById('grp-edt-lim').classList.remove('hidden');
        document.getElementById('edt-lim').value = item.lim;
    }
    if (type === 'installments' || type === 'planned_inst') {
        document.getElementById('grp-edt-inst').classList.remove('hidden');
        document.getElementById('edt-inst-total').value = item.total;
        document.getElementById('edt-inst-count').value = item.count;
        document.getElementById('edt-inst-start').value = item.start;
    }

    document.getElementById('modal-edit').classList.add('open');
}

document.getElementById('form-edit').onsubmit = (e) => {
    e.preventDefault();
    const id = document.getElementById('edt-id').value;
    const type = document.getElementById('edt-type').value;
    const item = DB[type].find(i => i.id === id);
    if (!item) return;

    const newDesc = document.getElementById('edt-desc').value;
    const vAmt = parseFloat(document.getElementById('edt-amt').value);
    const vDate = parseInt(document.getElementById('edt-date').value);
    const vTo = document.getElementById('edt-to').value;
    const vCard = document.getElementById('edt-card').value;
    const vLim = parseFloat(document.getElementById('edt-lim').value);

    const isRec = ['rec_incomes', 'rec_pix', 'rec_savings', 'fixed', 'tracked'].includes(type);

    if (isRec) {
        const newStart = document.getElementById('edt-start').value;
        const cmVal = curYear * 12 + curMonth;
        const sVal = getKeyVal(item.start);

        if (cmVal > sVal && newStart === item.start) {
            item.end = addMonth(getMKey(curMonth, curYear), -1);
            const newItem = { ...item, id: type + Date.now(), start: getMKey(curMonth, curYear), end: null, desc: newDesc };
            if (newItem.paid_months) newItem.paid_months = [];
            if (type.includes('incomes') || type.includes('pix') || type.includes('savings') || type.includes('fixed')) newItem.val = vAmt;
            if (type.includes('incomes') || type.includes('pix')) newItem.date = vDate;
            if (type.includes('pix')) newItem.to = vTo;
            if (type.includes('fixed') || type.includes('tracked')) newItem.card = vCard;
            if (type.includes('tracked')) newItem.lim = vLim;
            DB[type].push(newItem);
        } else {
            item.desc = newDesc;
            item.start = newStart;
            if (type.includes('incomes') || type.includes('pix') || type.includes('savings') || type.includes('fixed')) item.val = vAmt;
            if (type.includes('incomes') || type.includes('pix')) item.date = vDate;
            if (type.includes('pix')) item.to = vTo;
            if (type.includes('fixed') || type.includes('tracked')) item.card = vCard;
            if (type.includes('tracked')) item.lim = vLim;
        }
    } else {
        item.desc = newDesc;
        if (item.month) item.month = document.getElementById('edt-month').value;
        if (item.val !== undefined) item.val = vAmt;
        if (item.date !== undefined) item.date = vDate;
        if (item.to !== undefined) item.to = vTo;
        if (item.card !== undefined) item.card = vCard;
        if (type === 'installments' || type === 'planned_inst') {
            item.total = parseFloat(document.getElementById('edt-inst-total').value);
            item.count = parseInt(document.getElementById('edt-inst-count').value);
            item.start = document.getElementById('edt-inst-start').value;
        }
    }
    saveDB(); closeModal('modal-edit'); renderApp();
};

// --- MODAIS / FORMS ---
function openModal(id) {
    const currentMKey = getMKey(curMonth, curYear);

    if (id === 'modal-pix') {
        document.getElementById('inp-pix-desc').value = '';
        document.getElementById('inp-pix-to').value = '';
        document.getElementById('inp-pix-amount').value = '';
        document.getElementById('inp-pix-date').value = '';
        document.getElementById('inp-pix-inst-total').value = '';
        document.getElementById('inp-pix-inst-count').value = '';

        document.getElementById('chk-pix-rec').checked = false;
        document.getElementById('chk-pix-inst').checked = false;

        document.getElementById('grp-pix-start').classList.add('hidden');
        document.getElementById('grp-pix-inst').classList.add('hidden');
        document.getElementById('grp-pix-month').classList.remove('hidden');
        document.getElementById('grp-pix-single-val').classList.remove('hidden');

        document.getElementById('inp-pix-month').value = currentMKey;
        document.getElementById('inp-pix-start').value = currentMKey;
        document.getElementById('inp-pix-inst-start').value = currentMKey;
    }

    if (id === 'modal-income') {
        document.getElementById('chk-inc-rec').checked = false;
        document.getElementById('grp-inc-start').classList.add('hidden');
        document.getElementById('grp-inc-month').classList.remove('hidden');
        document.getElementById('inp-inc-start').value = currentMKey;
        document.getElementById('inp-inc-month').value = currentMKey;
        document.getElementById('inp-inc-desc').value = '';
        document.getElementById('inp-inc-amount').value = '';
        document.getElementById('inp-inc-date').value = '';
    }
    if (id === 'modal-savings') {
        document.getElementById('grp-sav-start').classList.add('hidden');
        document.getElementById('inp-sav-start').value = currentMKey;
        document.getElementById('inp-sav-amount').value = '';
    }
    if (id === 'modal-recurring') {
        document.getElementById('inp-rec-start').value = currentMKey;
        document.getElementById('inp-rec-desc').value = '';
        document.getElementById('inp-rec-val').value = '';
        document.getElementById('inp-rec-lim').value = '';
    }
    if (id === 'modal-installment') {
        document.getElementById('inp-inst-start').value = currentMKey;
        document.getElementById('inp-inst-desc').value = '';
        document.getElementById('inp-inst-total').value = '';
        document.getElementById('inp-inst-count').value = '';
    }
    if (id === 'modal-planned') {
        document.getElementById('inp-plan-start').value = currentMKey;
        document.getElementById('inp-plan-month').value = currentMKey;
        document.getElementById('inp-plan-desc').value = '';
        document.getElementById('inp-plan-amount').value = '';
        document.getElementById('inp-plan-total').value = '';
        document.getElementById('inp-plan-count').value = '';
        document.getElementById('chk-plan-inst').checked = false;
        document.getElementById('grp-plan-inst').classList.add('hidden');
        document.getElementById('grp-plan-single').classList.remove('hidden');
    }

    document.getElementById(id).classList.add('open');
}
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

// Toggles
document.getElementById('chk-inc-rec').onchange = (e) => {
    document.getElementById('grp-inc-start').classList.toggle('hidden', !e.target.checked);
    document.getElementById('grp-inc-month').classList.toggle('hidden', e.target.checked);
};
document.getElementById('chk-plan-inst').onchange = (e) => {
    document.getElementById('grp-plan-inst').classList.toggle('hidden', !e.target.checked);
    document.getElementById('grp-plan-single').classList.toggle('hidden', e.target.checked);
};
document.getElementById('inp-rec-type').onchange = (e) => {
    document.getElementById('grp-rec-lim').classList.toggle('hidden', e.target.value !== 'tracked');
    document.getElementById('grp-rec-val').classList.toggle('hidden', e.target.value === 'tracked');
};

document.getElementById('chk-pix-rec').onchange = (e) => {
    const isRec = e.target.checked;
    document.getElementById('grp-pix-start').classList.toggle('hidden', !isRec);
    document.getElementById('grp-pix-month').classList.toggle('hidden', isRec);
    if (isRec) {
        document.getElementById('chk-pix-inst').checked = false;
        document.getElementById('chk-pix-inst').dispatchEvent(new Event('change'));
        document.getElementById('chk-pix-inst').parentElement.classList.add('hidden');
    } else {
        document.getElementById('chk-pix-inst').parentElement.classList.remove('hidden');
    }
};
document.getElementById('chk-pix-inst').onchange = (e) => {
    const isInst = e.target.checked;
    document.getElementById('grp-pix-inst').classList.toggle('hidden', !isInst);
    document.getElementById('grp-pix-single-val').classList.toggle('hidden', isInst);
    if (isInst) {
        document.getElementById('chk-pix-rec').checked = false;
        document.getElementById('chk-pix-rec').dispatchEvent(new Event('change'));
        document.getElementById('chk-pix-rec').parentElement.classList.add('hidden');
    } else {
        document.getElementById('chk-pix-rec').parentElement.classList.remove('hidden');
    }
};

// SUBMITS
document.getElementById('form-income').onsubmit = (e) => { e.preventDefault(); addItem('inc'); };
document.getElementById('form-pix').onsubmit = (e) => { e.preventDefault(); addItem('pix'); };
document.getElementById('form-inst').onsubmit = (e) => { e.preventDefault(); addItem('inst'); };
document.getElementById('form-rec').onsubmit = (e) => { e.preventDefault(); addItem('rec'); };
document.getElementById('form-sav').onsubmit = (e) => { e.preventDefault(); addItem('sav'); };
document.getElementById('form-plan').onsubmit = (e) => { e.preventDefault(); addItem('plan'); };

function addItem(code) {
    const id = Date.now();
    if (code === 'inc') {
        const isRec = document.getElementById('chk-inc-rec').checked;
        const desc = document.getElementById('inp-inc-desc').value;
        const val = parseFloat(document.getElementById('inp-inc-amount').value) || 0;
        const date = parseInt(document.getElementById('inp-inc-date').value) || 1;
        if (!desc || !val) { alert('Preencha descrição e valor.'); return; }
        if (isRec) DB.rec_incomes.push({ id: 'rinc' + id, desc, val, date, start: document.getElementById('inp-inc-start').value, end: null });
        else DB.incomes.push({ id: 'inc' + id, desc, val, date, month: document.getElementById('inp-inc-month').value });
        closeModal('modal-income');
    }
    if (code === 'pix') {
        const isRec = document.getElementById('chk-pix-rec').checked;
        const isInst = document.getElementById('chk-pix-inst').checked;
        const desc = document.getElementById('inp-pix-desc').value;
        if (!desc) { alert('Informe a descrição.'); return; }

        if (isRec) {
            const val = parseFloat(document.getElementById('inp-pix-amount').value) || 0;
            const date = parseInt(document.getElementById('inp-pix-date').value) || 1;
            const to = document.getElementById('inp-pix-to').value;
            DB.rec_pix.push({ id: 'rpix' + id, desc, val, date, to, start: document.getElementById('inp-pix-start').value, end: null, paid_months: [] });
        } else if (isInst) {
            DB.pix_installments.push({
                id: 'pinst' + id,
                desc: desc,
                total: parseFloat(document.getElementById('inp-pix-inst-total').value) || 0,
                count: parseInt(document.getElementById('inp-pix-inst-count').value) || 1,
                start: document.getElementById('inp-pix-inst-start').value,
                paid_months: []
            });
        } else {
            const val = parseFloat(document.getElementById('inp-pix-amount').value) || 0;
            const date = parseInt(document.getElementById('inp-pix-date').value) || 1;
            const to = document.getElementById('inp-pix-to').value;
            DB.pix.push({ id: 'pix' + id, desc, val, date, to, month: document.getElementById('inp-pix-month').value, done: false });
        }
        closeModal('modal-pix');
    }
    if (code === 'inst') {
        DB.installments.push({
            id: 'inst' + id,
            desc: document.getElementById('inp-inst-desc').value,
            card: document.getElementById('inp-inst-card').value,
            total: parseFloat(document.getElementById('inp-inst-total').value) || 0,
            count: parseInt(document.getElementById('inp-inst-count').value) || 1,
            start: document.getElementById('inp-inst-start').value
        });
        closeModal('modal-installment');
    }
    if (code === 'rec') {
        const type = document.getElementById('inp-rec-type').value;
        const base = {
            id: type + id,
            desc: document.getElementById('inp-rec-desc').value,
            card: document.getElementById('inp-rec-card').value,
            start: document.getElementById('inp-rec-start').value,
            end: null
        };
        if (type === 'fixed') {
            base.val = parseFloat(document.getElementById('inp-rec-val').value) || 0;
            DB.fixed.push(base);
        } else {
            base.lim = parseFloat(document.getElementById('inp-rec-lim').value) || 0;
            DB.tracked.push(base);
        }
        closeModal('modal-recurring');
    }
    if (code === 'sav') {
        const val = parseFloat(document.getElementById('inp-sav-amount').value) || 0;
        DB.savings.push({ val });
        closeModal('modal-savings');
    }

    if (code === 'plan') {
        const isInst = document.getElementById('chk-plan-inst').checked;
        const desc = document.getElementById('inp-plan-desc').value;
        if (!desc) { alert('Informe a descrição.'); return; }
        if (isInst) {
            DB.planned_inst.push({
                id: 'pi' + id,
                desc,
                total: parseFloat(document.getElementById('inp-plan-total').value) || 0,
                count: parseInt(document.getElementById('inp-plan-count').value) || 1,
                start: document.getElementById('inp-plan-start').value
            });
        } else {
            DB.planned.push({
                id: 'pl' + id,
                desc,
                val: parseFloat(document.getElementById('inp-plan-amount').value) || 0,
                month: document.getElementById('inp-plan-month').value
            });
        }
        closeModal('modal-planned');
    }
    saveDB(); renderApp();
}

// --- STORAGE ---
function saveDB() { localStorage.setItem(DB_KEY, JSON.stringify(DB)); }
function loadDB() {
    const d = localStorage.getItem(DB_KEY);
    if (d) {
        try {
            const parsed = JSON.parse(d);
            DB = { ...DB, ...parsed };
            if (!DB.pix_installments) DB.pix_installments = [];
        } catch (e) { console.log("Erro ao ler DB", e); }
    }
}

// --- CALENDÁRIO ---
function openCalendar() {
    pickerYear = curYear; pickerMonth = curMonth;
    renderCalendar(); document.getElementById('modal-calendar').classList.add('open');
}
function renderCalendar() {
    document.getElementById('cal-year-display').innerText = pickerYear;
    const grid = document.getElementById('cal-months-grid'); grid.innerHTML = '';
    months.forEach((m, idx) => {
        const btn = document.createElement('button');
        btn.innerText = m.substring(0, 3);
        btn.className = 'cal-month-btn';
        if (idx + 1 === pickerMonth) btn.classList.add('selected');
        btn.onclick = () => { pickerMonth = idx + 1; renderCalendar(); };
        grid.appendChild(btn);
    });
}
function changePickerYear(delta) { pickerYear += delta; renderCalendar(); }
function applyCalendar() {
    curYear = pickerYear; curMonth = pickerMonth;
    renderApp();
    closeModal('modal-calendar');
}

// --- RELATÓRIO ---
function openReport() {
    const currentMKey = getMKey(curMonth, curYear);
    document.getElementById('rep-date').innerText = `${months[curMonth - 1]}/${curYear}`;

    const cmVal = curYear * 12 + curMonth;
    const isActive = (start, end) => {
        const s = getKeyVal(start);
        const e = end ? getKeyVal(end) : 999999;
        return cmVal >= s && cmVal <= e;
    };

    let rInc = [], rFix = [], rVar = [];
    let sumInc = 0, sumFix = 0, sumVar = 0;

    DB.rec_incomes.filter(i => isActive(i.start, i.end)).forEach(i => rInc.push({ d: i.date, desc: i.desc, val: i.val }));
    DB.incomes.filter(i => i.month === currentMKey).forEach(i => rInc.push({ d: i.date, desc: i.desc, val: i.val }));

    DB.fixed.filter(i => isActive(i.start, i.end)).forEach(i => rFix.push({ d: '-', desc: i.desc, val: i.val }));
    DB.rec_pix.filter(i => isActive(i.start, i.end)).forEach(i => rFix.push({ d: i.date, desc: i.desc, val: i.val }));
    DB.pix_installments.forEach(i => {
        const sVal = getKeyVal(i.start);
        const eVal = sVal + i.count - 1;
        if (cmVal >= sVal && cmVal <= eVal) {
            rFix.push({ d: '-', desc: `${i.desc} (${cmVal - sVal + 1}/${i.count})`, val: i.total / i.count });
        }
    });

    DB.tracked.filter(i => isActive(i.start, i.end)).forEach(i => {
        const trackData = DB.tracked_data.find(d => d.id === i.id && d.m === currentMKey);
        const v = trackData ? trackData.val : 0;
        if (v > 0) rVar.push({ d: '-', desc: i.desc, val: v });
    });
    DB.pix.filter(i => i.month === currentMKey).forEach(i => rVar.push({ d: i.date, desc: i.desc, val: i.val }));
    DB.installments.forEach(i => {
        const sVal = getKeyVal(i.start);
        const eVal = sVal + i.count - 1;
        if (cmVal >= sVal && cmVal <= eVal) {
            rFix.push({ d: '-', desc: `${i.desc} (${cmVal - sVal + 1}/${i.count})`, val: i.total / i.count });
        }
    });

    rInc.sort((a, b) => (a.d || 0) - (b.d || 0));
    rFix.sort((a, b) => (a.d || 0) - (b.d || 0));
    rVar.sort((a, b) => (a.d || 0) - (b.d || 0));

    const tBodyInc = document.getElementById('rep-table-inc'); tBodyInc.innerHTML = '';
    rInc.forEach(i => { sumInc += i.val; tBodyInc.innerHTML += `<tr><td>${i.d || '-'}</td><td>${i.desc}</td><td>${fmtMoney(i.val)}</td></tr>`; });

    const tBodyFix = document.getElementById('rep-table-fix'); tBodyFix.innerHTML = '';
    rFix.forEach(i => { sumFix += i.val; tBodyFix.innerHTML += `<tr><td>${i.d || '-'}</td><td>${i.desc}</td><td>${fmtMoney(i.val)}</td></tr>`; });

    const tBodyVar = document.getElementById('rep-table-var'); tBodyVar.innerHTML = '';
    rVar.forEach(i => { sumVar += i.val; tBodyVar.innerHTML += `<tr><td>${i.d || '-'}</td><td>${i.desc}</td><td>${fmtMoney(i.val)}</td></tr>`; });

    document.getElementById('rep-inc').innerText = fmtMoney(sumInc);
    document.getElementById('rep-exp').innerText = fmtMoney(sumFix + sumVar);
    document.getElementById('rep-bal').innerText = fmtMoney(sumInc - (sumFix + sumVar));

    document.getElementById('modal-report').classList.add('open');
}

// --- IMPORT / EXPORT ---
function exportData() {
    if (!confirm("Exportar dados em JSON?")) return;
    const now = new Date();
    const fmt = n => n < 10 ? '0' + n : n;
    const name = `finance-manager-${fmt(now.getDate())}-${fmt(now.getMonth() + 1)}-${now.getFullYear()}-${fmt(now.getHours())}h${fmt(now.getMinutes())}.json`;
    const blob = new Blob([JSON.stringify(DB, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
}
function importData() { document.getElementById('import-input').click(); }
document.getElementById('import-input').onchange = function (e) {
    const file = e.target.files[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = function (ev) {
        if (confirm("Substituir TODOS os dados atuais pelo arquivo?")) {
            try {
                const json = JSON.parse(ev.target.result);
                DB = { ...DB, ...json };
                saveDB(); renderApp(); alert("Dados importados com sucesso!");
            } catch (err) { alert("Erro ao ler arquivo."); }
        }
    };
    r.readAsText(file);
    this.value = null;
};

// --- MODAL AJUDA  ---
function showHelpModal() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay open';
    overlay.innerHTML = `
                <div class="modal" style="max-width:700px;">
                    <h2 style="margin-bottom:10px;">Central de Ajuda</h2>
                    <p class="text-slate-300 mb-3">
                        Aqui você tem o melhor dos dois mundos:
                    </p>
                    <ul class="text-sm text-slate-300 space-y-2 mb-4">
                        <li>• <b>Dashboard</b> com resumo do mês e gráfico (renda, gastos, planejados).</li>
                        <li>• <b>Renda</b> recorrente e única, com dia de recebimento.</li>
                        <li>• <b>PIX / Débito</b> único, recorrente e parcelado (cartão de terceiros).</li>
                        <li>• <b>Cartões</b>: fixos, variáveis com limite por mês e compras parceladas.</li>
                        <li>• <b>Caixinhas</b> de poupança (depósitos únicos ou mensais).</li>
                        <li>• <b>Planejados</b> que só impactam o saldo estimado.</li>
                        <li>• <b>Relatório</b> mensal pronto pra imprimir.</li>
                        <li>• <b>Backup</b> via JSON (importar/exportar).</li>
                    </ul>
                    <p class="text-xs text-slate-400 mb-4">
                        Troque o mês lá em cima (📅) pra ver qualquer período, e vá cadastrando tudo aqui dentro.
                    </p>
                    <div class="modal-btns">
                        <button class="btn btn-gray" onclick="this.closest('.modal-overlay').remove()">Fechar</button>
                    </div>
                </div>
            `;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => {
        if (e.target === overlay) overlay.remove();
    });
}

function buildYearChart() {
    const year = curYear;

    const monthlyIncome = Array(12).fill(0);
    const monthlyExpense = Array(12).fill(0);

    // percorre todos os tipos de dados e soma por mês
    const addIncome = (mKey, val) => {
        const { m, y } = parseKey(mKey);
        if (y === year) monthlyIncome[m - 1] += val;
    };

    const addExpense = (mKey, val) => {
        const { m, y } = parseKey(mKey);
        if (y === year) monthlyExpense[m - 1] += val;
    };

    // Rendas únicas
    DB.incomes.forEach(i => addIncome(i.month, i.val));

    // Rendas recorrentes
    DB.rec_incomes.forEach(i => {
        let start = getKeyVal(i.start);
        let end = i.end ? getKeyVal(i.end) : getKeyVal(`12-${year + 1}`);
        for (let x = 1; x <= 12; x++) {
            const mk = getMKey(x, year);
            const mkVal = getKeyVal(mk);
            if (mkVal >= start && mkVal <= end) addIncome(mk, i.val);
        }
    });

    // PIX únicos
    DB.pix.forEach(i => addExpense(i.month, i.val));

    // PIX recorrentes
    DB.rec_pix.forEach(i => {
        let start = getKeyVal(i.start);
        let end = i.end ? getKeyVal(i.end) : getKeyVal(`12-${year + 1}`);
        for (let x = 1; x <= 12; x++) {
            const mk = getMKey(x, year);
            const mkVal = getKeyVal(mk);
            if (mkVal >= start && mkVal <= end) addExpense(mk, i.val);
        }
    });

    // Parcelado PIX
    DB.pix_installments.forEach(i => {
        const sVal = getKeyVal(i.start);
        for (let parc = 0; parc < i.count; parc++) {
            const mk = addMonth(i.start, parc);
            const { y } = parseKey(mk);
            if (y === year) addExpense(mk, i.total / i.count);
        }
    });

    // Caixinha NÃO entra mais no gráfico anual (é só transferência entre contas)
    // Se um dia quiser considerar só saques como gasto:
    // DB.savings.forEach(i => { if (i.val < 0) addExpense(i.month, Math.abs(i.val)); });

    // Fixos (cartões)
    DB.fixed.forEach(i => {
        let start = getKeyVal(i.start);
        let end = i.end ? getKeyVal(i.end) : getKeyVal(`12-${year + 1}`);
        for (let x = 1; x <= 12; x++) {
            const mk = getMKey(x, year);
            const mkVal = getKeyVal(mk);
            if (mkVal >= start && mkVal <= end) addExpense(mk, i.val);
        }
    });

    // Variáveis (tracked)
    DB.tracked.forEach(i => {
        for (let x = 1; x <= 12; x++) {
            const mk = getMKey(x, year);
            const data = DB.tracked_data.find(d => d.id === i.id && d.m === mk);
            if (data) addExpense(mk, data.val);
        }
    });

    // Parcelas cartão
    DB.installments.forEach(i => {
        const sVal = getKeyVal(i.start);
        for (let p = 0; p < i.count; p++) {
            const mk = addMonth(i.start, p);
            const { y } = parseKey(mk);
            if (y === year) addExpense(mk, i.total / i.count);
        }
    });

    // Planejados
    DB.planned.forEach(i => addExpense(i.month, i.val));

    DB.planned_inst.forEach(i => {
        for (let p = 0; p < i.count; p++) {
            const mk = addMonth(i.start, p);
            const { y } = parseKey(mk);
            if (y === year) addExpense(mk, i.total / i.count);
        }
    });

    // destrói gráfico antigo se existir
    if (window.yearChart) window.yearChart.destroy();

    const ctx = document.getElementById("chart-year");

    window.yearChart = new Chart(ctx, {
        type: "line",
        data: {
            labels: months,
            datasets: [
                {
                    label: "Renda Total",
                    data: monthlyIncome,
                    borderWidth: 3,
                    tension: 0.2
                },
                {
                    label: "Gastos Totais",
                    data: monthlyExpense,
                    borderWidth: 3,
                    tension: 0.2
                }
            ]
        }
    });
}
