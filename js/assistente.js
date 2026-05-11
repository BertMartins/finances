// js/assistente.js

window.addEventListener("load", async () => {

    await verificarApiKey();
});

async function verificarApiKey() {

    const chave = obterApiKey();

    if (chave)
        return;

    const modal = `
        <div
            id="modalApiKey"
            class="fixed inset-0 bg-black/70 flex items-center justify-center z-50">

            <div class="bg-slate-900 border border-slate-700 rounded-3xl p-8 w-full max-w-xl">

                <h2 class="text-3xl font-black">
                    🔑 Configurar API Key
                </h2>

                <p class="text-slate-400 mt-3">
                    Informe sua chave da API da Poe.
                </p>

                <input
                    id="inputApiKey"
                    type="password"
                    placeholder="Cole sua API Key..."
                    class="input mt-6"
                />

                <button
                    onclick="salvarChaveApi()"
                    class="btn-primary w-full mt-5">

                    Salvar Chave

                </button>

            </div>

        </div>
    `;

    document.body.insertAdjacentHTML("beforeend", modal);
}

function salvarChaveApi() {

    const chave =
        document.getElementById("inputApiKey").value;

    if (!chave) {

        alert("Informe a chave.");

        return;
    }

    salvarApiKey(chave);

    document.getElementById("modalApiKey").remove();
}

async function enviarPergunta() {

    const input =
        document.getElementById("inputIA");

    const pergunta =
        input.value.trim();

    if (!pergunta)
        return;

    adicionarMensagem(pergunta, "usuario");

    input.value = "";

    const processou =
        processarCadastroContas(pergunta);

    if (processou) {
        return;
    }

    adicionarTyping();

    try {

        const resposta =
            await perguntarIA(pergunta);

        removerTyping();

        adicionarMensagem(resposta, "ia");
    }
    catch (erro) {

        removerTyping();

        adicionarMensagem(
            "Erro ao comunicar com a IA 😭",
            "ia"
        );

        console.error(erro);
    }
}

function processarCadastroContas(texto) {

    const textoLower =
        texto.toLowerCase();

    if (
        textoLower.includes("contas fixas família") ||
        textoLower.includes("contas familia")
    ) {

        cadastrarContasCompartilhadas(texto);

        return true;
    }

    if (
        textoLower.includes("contas fixas individual")
    ) {

        cadastrarContasIndividuais(texto);

        return true;
    }

    return false;
}

function cadastrarContasCompartilhadas(texto) {

    const linhas =
        texto.split("\n");

    const contas =
        obterContas();

    let adicionadas = 0;

    linhas.forEach(linha => {

        const match =
            linha.match(
                /(.+?)[:\-]?\s*R\$\s*(\d+[.,]?\d*)/i
            );

        if (!match)
            return;

        const nome =
            match[1]
            .replace(/#/g, "")
            .trim();

        const valor =
            Number(
                match[2]
                .replace(",", ".")
            );

        if (!nome || !valor)
            return;

        contas.push({
            id: gerarId(),
            nome,
            valor,
            tipo: "compartilhada",
            pessoaId: null
        });

        adicionadas++;
    });

    salvarContas(contas);

    adicionarMensagem(
        `
        ✅ ${adicionadas} contas compartilhadas cadastradas com sucesso.
        `,
        "ia"
    );

    if (typeof renderizarContas === "function") {
        renderizarContas();
    }

    if (typeof renderizarDashboard === "function") {
        renderizarDashboard();
    }
}

function cadastrarContasIndividuais(texto) {

    const linhas =
        texto.split("\n");

    const primeiraLinha =
        linhas[0];

    const nomePessoa =
        primeiraLinha
        .replace(/contas fixas individual/i, "")
        .trim();

    const pessoas =
        obterPessoas();

    const pessoa =
        pessoas.find(x =>
            x.nome.toLowerCase() ===
            nomePessoa.toLowerCase()
        );

    if (!pessoa) {

        adicionarMensagem(
            `
            Não encontrei a pessoa:
            <b>${nomePessoa}</b>
            `,
            "ia"
        );

        return;
    }

    const contas =
        obterContas();

    let adicionadas = 0;

    linhas.forEach(linha => {

        const match =
            linha.match(
                /(.+?)[:\-]?\s*R\$\s*(\d+[.,]?\d*)/i
            );

        if (!match)
            return;

        const nome =
            match[1]
            .replace(/#/g, "")
            .trim();

        const valor =
            Number(
                match[2]
                .replace(",", ".")
            );

        if (!nome || !valor)
            return;

        contas.push({
            id: gerarId(),
            nome,
            valor,
            tipo: "individual",
            pessoaId: pessoa.id
        });

        adicionadas++;
    });

    salvarContas(contas);

    adicionarMensagem(
        `
        ✅ ${adicionadas} contas individuais cadastradas
        para <b>${pessoa.nome}</b>.
        `,
        "ia"
    );

    if (typeof renderizarContas === "function") {
        renderizarContas();
    }

    if (typeof renderizarDashboard === "function") {
        renderizarDashboard();
    }
}

function perguntaRapida(texto) {

    document.getElementById("inputIA").value =
        texto;

    enviarPergunta();
}

function adicionarMensagem(texto, tipo) {

    const chat =
        document.getElementById("chatIA");

    const isIA = tipo === "ia";

    chat.innerHTML += `
        <div class="flex ${isIA ? "" : "justify-end"}">

            <div class="
                max-w-xl rounded-2xl p-4
                ${isIA
                    ? "bg-cyan-500 text-black"
                    : "bg-slate-800"}
            ">

                ${texto}

            </div>

        </div>
    `;

    chat.scrollTop = chat.scrollHeight;
}

function adicionarTyping() {

    const chat =
        document.getElementById("chatIA");

    chat.innerHTML += `
        <div
            id="typingIA"
            class="flex">

            <div class="bg-cyan-500 text-black rounded-2xl p-4">

                Pensando...

            </div>

        </div>
    `;

    chat.scrollTop = chat.scrollHeight;
}

function removerTyping() {

    const typing =
        document.getElementById("typingIA");

    if (typing)
        typing.remove();
}

async function perguntarIA(pergunta) {

    const chave = obterApiKey();

    const pessoas = obterPessoas();
    const contas = obterContas();

    const contexto = `
        Você é um assistente financeiro familiar.

        Dados atuais:

        Pessoas:
        ${JSON.stringify(pessoas)}

        Contas:
        ${JSON.stringify(contas)}

        Pergunta:
        ${pergunta}

        Responda de forma simples,
        amigável e objetiva.
    `;

    const response = await fetch(
        "https://api.poe.com/v1/responses",
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${chave}`
            },

            body: JSON.stringify({
                model: "gpt-5.3-codex",
                input: contexto
            })
        }
    );

    if (!response.ok) {

        throw new Error("Erro na API");
    }

    const data = await response.json();

    console.log(data);

    // AJUSTA ISSO DEPOIS
    // dependendo da resposta da API da Poe

    return (
        data.output?.[0]?.content?.[0]?.text
        || "Não consegui responder."
    );
}