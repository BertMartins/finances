// js/contas.js

function alterarTipoConta() {

    const tipo =
        document.getElementById("tipoConta").value;

    const container =
        document.getElementById("containerPessoa");

    if (tipo === "individual") {
        container.classList.remove("hidden");
    }
    else {
        container.classList.add("hidden");
    }
}

function carregarPessoasSelect() {

    const select =
        document.getElementById("pessoaConta");

    if (!select)
        return;

    const pessoas = obterPessoas();

    select.innerHTML = "";

    pessoas.forEach(pessoa => {

        select.innerHTML += `
            <option value="${pessoa.id}">
                ${pessoa.nome}
            </option>
        `;
    });
}

function adicionarConta() {

    const nome =
        document.getElementById("nomeConta")
        .value
        .trim();

    const valor = Number(
        document.getElementById("valorConta").value
    );

    const categoria =
        document.getElementById("categoriaConta").value;

    const data =
        document.getElementById("dataConta").value;

    const tipo =
        document.getElementById("tipoConta").value;

    const pessoaId =
        document.getElementById("pessoaConta").value;

    const recorrente =
        document.getElementById("recorrenteConta").checked;

    const pago =
        document.getElementById("pagoConta").checked;

    const observacao =
        document.getElementById("observacaoConta")
        .value
        .trim();

    if (!nome || valor <= 0) {

        alert("Preencha os campos.");

        return;
    }

    const contas = obterContas();

    contas.push({
        id: gerarId(),

        nome,
        valor,

        categoria,
        data,

        tipo,

        recorrente,
        pago,

        observacao,

        pessoaId:
            tipo === "individual"
                ? pessoaId
                : null
    });

    salvarContas(contas);

    limparFormularioConta();

    renderizarContas();

    if (typeof renderizarDashboard === "function") {
        renderizarDashboard();
    }
}

function limparFormularioConta() {

    document.getElementById("nomeConta").value = "";

    document.getElementById("valorConta").value = "";

    document.getElementById("observacaoConta").value = "";

    document.getElementById("recorrenteConta").checked = false;

    document.getElementById("pagoConta").checked = true;

    document.getElementById("dataConta").value =
        new Date().toISOString().split("T")[0];
}

function removerConta(id) {

    let contas = obterContas();

    contas = contas.filter(x => x.id !== id);

    salvarContas(contas);

    renderizarContas();

    if (typeof renderizarDashboard === "function") {
        renderizarDashboard();
    }
}

function obterNomePessoa(id) {

    const pessoas = obterPessoas();

    const pessoa =
        pessoas.find(x => x.id === id);

    return pessoa?.nome || "-";
}

function formatarData(data) {

    if (!data)
        return "-";

    return new Date(data).toLocaleDateString("pt-BR");
}

function renderizarContas() {

    const container =
        document.getElementById("listaContas");

    if (!container)
        return;

    const contas = obterContas()
        .sort((a, b) =>
            new Date(b.data) - new Date(a.data)
        );

    container.innerHTML = "";

    if (contas.length === 0) {

        container.innerHTML = `
            <div class="card">

                <p class="text-slate-400">
                    Nenhuma conta cadastrada.
                </p>

            </div>
        `;

        return;
    }

    contas.forEach(conta => {

        container.innerHTML += `
            <div class="card">

                <div class="flex justify-between items-start gap-4">

                    <div class="flex-1">

                        <div class="flex flex-wrap items-center gap-3">

                            <h3 class="text-2xl font-black">
                                ${conta.nome}
                            </h3>

                            <span class="
                                px-3 py-1 rounded-full text-xs font-bold
                                ${conta.tipo === "compartilhada"
                                    ? "bg-cyan-500 text-black"
                                    : "bg-emerald-500 text-black"}
                            ">

                                ${conta.tipo}

                            </span>

                            <span class="
                                px-3 py-1 rounded-full text-xs font-bold
                                bg-slate-700
                            ">
                                ${conta.categoria || "Outros"}
                            </span>

                        </div>

                        <div class="mt-4 grid md:grid-cols-2 gap-2 text-sm">

                            <p class="text-slate-400">
                                💰 ${formatarMoeda(conta.valor)}
                            </p>

                            <p class="text-slate-400">
                                📅 ${formatarData(conta.data)}
                            </p>

                            <p class="text-slate-400">
                                ✅ ${conta.pago ? "Pago" : "Pendente"}
                            </p>

                            <p class="text-slate-400">
                                🔁 ${conta.recorrente ? "Recorrente" : "Única"}
                            </p>

                            ${
                                conta.tipo === "individual"
                                ? `
                                    <p class="text-slate-400">
                                        👤 ${obterNomePessoa(conta.pessoaId)}
                                    </p>
                                `
                                : ""
                            }

                        </div>

                        ${
                            conta.observacao
                            ? `
                                <div class="mt-4 p-3 bg-slate-900 rounded-xl text-sm text-slate-300">
                                    ${conta.observacao}
                                </div>
                            `
                            : ""
                        }

                    </div>

                    <button
                        onclick="removerConta('${conta.id}')"
                        class="bg-red-500 hover:bg-red-400 px-3 py-2 rounded-xl">

                        ✕

                    </button>

                </div>

            </div>
        `;
    });

    carregarPessoasSelect();

    document.getElementById("dataConta").value =
        new Date().toISOString().split("T")[0];
}