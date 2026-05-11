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
        document.getElementById("nomeConta").value;

    const valor = Number(
        document.getElementById("valorConta").value
    );

    const tipo =
        document.getElementById("tipoConta").value;

    const pessoaId =
        document.getElementById("pessoaConta").value;

    if (!nome || valor <= 0) {

        alert("Preencha os campos.");

        return;
    }

    const contas = obterContas();

    contas.push({
        id: gerarId(),
        nome,
        valor,
        tipo,
        pessoaId: tipo === "individual"
            ? pessoaId
            : null
    });

    salvarContas(contas);

    document.getElementById("nomeConta").value = "";
    document.getElementById("valorConta").value = "";

    renderizarContas();
}

function removerConta(id) {

    let contas = obterContas();

    contas = contas.filter(x => x.id !== id);

    salvarContas(contas);

    renderizarContas();
}

function obterNomePessoa(id) {

    const pessoas = obterPessoas();

    const pessoa =
        pessoas.find(x => x.id === id);

    return pessoa?.nome || "-";
}

function renderizarContas() {

    const container =
        document.getElementById("listaContas");

    if (!container)
        return;

    const contas = obterContas();

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

                <div class="flex justify-between items-start">

                    <div>

                        <div class="flex items-center gap-3">

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

                        </div>

                        <p class="text-slate-400 mt-2">
                            Valor:
                            ${formatarMoeda(conta.valor)}
                        </p>

                        ${
                            conta.tipo === "individual"
                            ? `
                                <p class="text-slate-400">
                                    Pessoa:
                                    ${obterNomePessoa(conta.pessoaId)}
                                </p>
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
}

renderizarContas();

carregarPessoasSelect();