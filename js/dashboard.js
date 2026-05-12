// js/dashboard.js

const MESES = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro"
];

function inicializarFiltroMes() {

    const select =
        document.getElementById("mesSelecionado");

    if (!select)
        return;

    select.innerHTML = "";

    const hoje = new Date();

    const anoAtual = hoje.getFullYear();

    for (let mes = 0; mes < 12; mes++) {

        const valor =
            `${anoAtual}-${mes}`;

        select.innerHTML += `
            <option value="${valor}">
                ${MESES[mes]} ${anoAtual}
            </option>
        `;
    }

    select.value =
        `${anoAtual}-${hoje.getMonth()}`;
}

function obterMesSelecionado() {

    const select =
        document.getElementById("mesSelecionado");

    if (!select) {

        const hoje = new Date();

        return {
            mes: hoje.getMonth(),
            ano: hoje.getFullYear()
        };
    }

    const [ano, mes] =
        select.value.split("-");

    return {
        mes: Number(mes),
        ano: Number(ano)
    };
}

function obterContasMesAtual() {

    const contas = obterContas();

    const periodo =
        obterMesSelecionado();

    return contas.filter(conta => {

        if (conta.recorrente) {

            if (!conta.data)
                return true;

            const dataInicio =
                new Date(conta.data);

            const dataComparacao =
                new Date(
                    periodo.ano,
                    periodo.mes,
                    1
                );

            return dataInicio <= dataComparacao;
        }

        if (!conta.data)
            return false;

        const dataConta =
            new Date(conta.data);

        return (
            dataConta.getMonth() === periodo.mes &&
            dataConta.getFullYear() === periodo.ano
        );
    });
}

function renderizarDashboard() {

    inicializarFiltroMes();

    const pessoas = obterPessoas();

    const contasMes =
        obterContasMesAtual();

    const totalSalarios =
        calcularTotalSalarios();

    const totalGastos =
        contasMes
            .filter(x => x.pago)
            .reduce((acc, conta) => {
                return acc + Number(conta.valor);
            }, 0);

    const totalCompartilhado =
        contasMes
            .filter(x =>
                x.tipo === "compartilhada" &&
                x.pago
            )
            .reduce((acc, conta) => {
                return acc + Number(conta.valor);
            }, 0);

    const sobra =
        totalSalarios - totalGastos;

    atualizarTexto(
        "totalSalarios",
        formatarMoeda(totalSalarios)
    );

    atualizarTexto(
        "totalCompartilhado",
        formatarMoeda(totalCompartilhado)
    );

    atualizarTexto(
        "totalGastos",
        formatarMoeda(totalGastos)
    );

    atualizarTexto(
        "sobraFamiliar",
        formatarMoeda(sobra)
    );

    renderizarDashboardPessoas();
    renderizarDashboardContas();
}

function renderizarDashboardPessoas() {

    const pessoas = obterPessoas();

    const contasMes =
        obterContasMesAtual();

    const container =
        document.getElementById("dashboardPessoas");

    if (!container)
        return;

    container.innerHTML = "";

    pessoas.forEach(pessoa => {

        const individual =
            contasMes
                .filter(x =>
                    x.tipo === "individual" &&
                    x.pessoaId === pessoa.id &&
                    x.pago
                )
                .reduce((acc, conta) => {
                    return acc + Number(conta.valor);
                }, 0);

        const compartilhado =
            contasMes
                .filter(x =>
                    x.tipo === "compartilhada" &&
                    x.pago
                )
                .reduce((acc, conta) => {
                    return acc + Number(conta.valor);
                }, 0);

        const dividido =
            pessoas.length > 0
                ? compartilhado / pessoas.length
                : 0;

        const total =
            individual + dividido;

        const sobra =
            pessoa.salario - total;

        const gastoDia =
            sobra > 0
                ? sobra / 30
                : 0;

        const percentual =
            pessoa.salario > 0
                ? ((total / pessoa.salario) * 100)
                : 0;

        container.innerHTML += `
            <div class="bg-slate-900 rounded-2xl p-5 border border-slate-800">

                <div class="flex justify-between items-start gap-4">

                    <div>

                        <h4 class="font-black text-xl">
                            ${pessoa.nome}
                        </h4>

                        <p class="text-slate-400 text-sm mt-1">
                            Salário:
                            ${formatarMoeda(pessoa.salario)}
                        </p>

                    </div>

                    <div class="text-right">

                        <p class="text-slate-400 text-sm">
                            Livre por dia
                        </p>

                        <h4 class="font-black text-cyan-400 text-lg">
                            ${formatarMoeda(gastoDia)}
                        </h4>

                    </div>

                </div>

                <div class="mt-5 space-y-2">

                    <div class="flex justify-between text-sm">

                        <span class="text-slate-400">
                            Gastos
                        </span>

                        <span>
                            ${formatarMoeda(total)}
                        </span>

                    </div>

                    <div class="flex justify-between text-sm">

                        <span class="text-slate-400">
                            Sobra
                        </span>

                        <span class="
                            ${sobra >= 0
                                ? "text-emerald-400"
                                : "text-red-400"}
                        ">
                            ${formatarMoeda(sobra)}
                        </span>

                    </div>

                    <div class="flex justify-between text-sm">

                        <span class="text-slate-400">
                            Comprometido
                        </span>

                        <span>
                            ${percentual.toFixed(0)}%
                        </span>

                    </div>

                    <div class="w-full bg-slate-800 rounded-full h-2 overflow-hidden">

                        <div
                            class="
                                h-full
                                ${percentual > 80
                                    ? "bg-red-500"
                                    : percentual > 60
                                        ? "bg-yellow-500"
                                        : "bg-cyan-500"}
                            "
                            style="width:${Math.min(percentual, 100)}%">
                        </div>

                    </div>

                </div>

            </div>
        `;
    });
}

function renderizarDashboardContas() {

    const contas =
        obterContasMesAtual()
            .sort((a, b) =>
                new Date(b.data) - new Date(a.data)
            )
            .slice(0, 8);

    const container =
        document.getElementById("dashboardContas");

    if (!container)
        return;

    container.innerHTML = "";

    if (contas.length === 0) {

        container.innerHTML = `
            <p class="text-slate-400">
                Nenhuma conta neste período.
            </p>
        `;

        return;
    }

    contas.forEach(conta => {

        container.innerHTML += `
            <div class="
                bg-slate-900 rounded-2xl p-4
                border border-slate-800
            ">

                <div class="flex justify-between items-start gap-4">

                    <div>

                        <div class="flex items-center gap-2 flex-wrap">

                            <h4 class="font-black">
                                ${conta.nome}
                            </h4>

                            <span class="
                                text-xs px-2 py-1 rounded-full
                                bg-slate-700
                            ">
                                ${conta.categoria || "Outros"}
                            </span>

                        </div>

                        <div class="mt-2 text-sm text-slate-400 space-y-1">

                            <p>
                                📅 ${formatarData(conta.data)}
                            </p>

                            <p>
                                ${conta.pago ? "✅ Pago" : "🕒 Pendente"}
                            </p>

                        </div>

                    </div>

                    <div class="text-right">

                        <h4 class="font-black">
                            ${formatarMoeda(conta.valor)}
                        </h4>

                    </div>

                </div>

            </div>
        `;
    });
}

function atualizarTexto(id, valor) {

    const elemento =
        document.getElementById(id);

    if (!elemento)
        return;

    elemento.innerText = valor;
}