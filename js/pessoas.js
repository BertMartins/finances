// js/pessoas.js

function adicionarPessoa() {

    const nome =
        document.getElementById("nomePessoa")
        .value
        .trim();

    const salario = Number(
        document.getElementById("salarioPessoa").value
    );

    if (!nome || salario <= 0) {

        alert("Preencha os campos corretamente.");

        return;
    }

    const pessoas = obterPessoas();

    pessoas.push({
        id: gerarId(),
        nome,
        salario
    });

    salvarPessoas(pessoas);

    document.getElementById("nomePessoa").value = "";
    document.getElementById("salarioPessoa").value = "";

    renderizarPessoas();

    if (typeof renderizarDashboard === "function") {
        renderizarDashboard();
    }
}

function removerPessoa(id) {

    let pessoas = obterPessoas();

    pessoas = pessoas.filter(x => x.id !== id);

    salvarPessoas(pessoas);

    // REMOVE CONTAS DA PESSOA

    let contas = obterContas();

    contas = contas.filter(
        x => x.pessoaId !== id
    );

    salvarContas(contas);

    renderizarPessoas();

    if (typeof renderizarDashboard === "function") {
        renderizarDashboard();
    }
}

function renderizarPessoas() {

    const container =
        document.getElementById("listaPessoas");

    if (!container)
        return;

    const pessoas = obterPessoas();

    container.innerHTML = "";

    if (pessoas.length === 0) {

        container.innerHTML = `
            <div class="card col-span-full">

                <p class="text-slate-400">
                    Nenhuma pessoa cadastrada.
                </p>

            </div>
        `;

        return;
    }

    pessoas.forEach(pessoa => {

        container.innerHTML += `
            <div class="card">

                <div class="flex justify-between items-start">

                    <div>

                        <h3 class="text-2xl font-black">
                            ${pessoa.nome}
                        </h3>

                        <p class="text-slate-400 mt-2">
                            Salário:
                            ${formatarMoeda(pessoa.salario)}
                        </p>

                    </div>

                    <button
                        onclick="removerPessoa('${pessoa.id}')"
                        class="bg-red-500 hover:bg-red-400 px-3 py-2 rounded-xl">
                        ✕
                    </button>

                </div>

            </div>
        `;
    });
}