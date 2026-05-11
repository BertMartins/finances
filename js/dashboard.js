// js/dashboard.js

function renderizarDashboard() {

    const pessoas = obterPessoas();
    const contas = obterContas();

    const totalSalarios =
        calcularTotalSalarios();

    const totalGastos =
        contas.reduce((acc, conta) => {
            return acc + Number(conta.valor);
        }, 0);

    const totalCompartilhado =
        calcularContasCompartilhadas();

    const sobra =
        totalSalarios - totalGastos;

    document.getElementById("totalSalarios").innerText =
        formatarMoeda(totalSalarios);

    document.getElementById("totalCompartilhado").innerText =
        formatarMoeda(totalCompartilhado);

    document.getElementById("totalGastos").innerText =
        formatarMoeda(totalGastos);

    document.getElementById("sobraFamiliar").innerText =
        formatarMoeda(sobra);

    renderizarDashboardPessoas();
    renderizarDashboardContas();
}

function renderizarDashboardPessoas() {

    const pessoas = obterPessoas();

    const container =
        document.getElementById("dashboardPessoas");

    container.innerHTML = "";

    pessoas.forEach(pessoa => {

        const individual =
            calcularContasIndividuaisPessoa(pessoa.id);

        const compartilhado =
            calcularContasCompartilhadas() / pessoas.length;

        const total =
            individual + compartilhado;

        const sobra =
            pessoa.salario - total;

        const gastoDia =
            sobra > 0
                ? sobra / 30
                : 0;

        container.innerHTML += `
            <div class="bg-slate-900 rounded-2xl p-4">

                <div class="flex justify-between">

                    <div>

                        <h4 class="font-black text-xl">
                            ${pessoa.nome}
                        </h4>

                        <p class="text-slate-400 text-sm mt-1">
                            Sobra:
                            ${formatarMoeda(sobra)}
                        </p>

                    </div>

                    <div class="text-right">

                        <p class="text-slate-400 text-sm">
                            Pode gastar/dia
                        </p>

                        <h4 class="font-black text-cyan-400">
                            ${formatarMoeda(gastoDia)}
                        </h4>

                    </div>

                </div>

            </div>
        `;
    });
}

function renderizarDashboardContas() {

    const contas =
        obterContas().slice(-5).reverse();

    const container =
        document.getElementById("dashboardContas");

    container.innerHTML = "";

    contas.forEach(conta => {

        container.innerHTML += `
            <div class="bg-slate-900 rounded-2xl p-4">

                <div class="flex justify-between">

                    <div>

                        <h4 class="font-black">
                            ${conta.nome}
                        </h4>

                        <p class="text-slate-400 text-sm">
                            ${conta.tipo}
                        </p>

                    </div>

                    <h4 class="font-black">

                        ${formatarMoeda(conta.valor)}

                    </h4>

                </div>

            </div>
        `;
    });
}

renderizarDashboard();