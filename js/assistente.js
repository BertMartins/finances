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
            class="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">

            <div class="bg-slate-900 border border-slate-700 rounded-3xl p-8 w-full max-w-xl shadow-2xl">

                <h2 class="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
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
    const chave = document.getElementById("inputApiKey").value;

    if (!chave) {
        alert("Informe a chave.");
        return;
    }

    salvarApiKey(chave);
    document.getElementById("modalApiKey").remove();
}

async function enviarPergunta() {
    const input = document.getElementById("inputIA");
    const pergunta = input.value.trim();

    if (!pergunta)
        return;

    adicionarMensagem(pergunta, "usuario");
    input.value = "";

    const processou = processarCadastroContas(pergunta);

    if (processou) {
        return;
    }

    adicionarTyping();

    try {
        const resposta = await perguntarIA(pergunta);
        removerTyping();
        adicionarMensagem(resposta, "ia");
    }
    catch (erro) {
        removerTyping();
        adicionarMensagem("Erro ao comunicar com a IA 😭", "ia");
        console.error(erro);
    }
}

function processarCadastroContas(texto) {
    const textoLower = texto.toLowerCase();

    if (
        textoLower.includes("contas fixas família") ||
        textoLower.includes("contas familia")
    ) {
        cadastrarContasCompartilhadas(texto);
        return true;
    }

    if (textoLower.includes("contas fixas individual")) {
        cadastrarContasIndividuais(texto);
        return true;
    }

    return false;
}

function cadastrarContasCompartilhadas(texto) {
    const linhas = texto.split("\n");
    const contas = obterContas();
    let adicionadas = 0;

    linhas.forEach(linha => {
        const match = linha.match(/(.+?)[:\-]?\s*R\$\s*(\d+[.,]?\d*)/i);

        if (!match)
            return;

        const nome = match[1].replace(/#/g, "").trim();
        const valor = Number(match[2].replace(",", "."));

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

    adicionarMensagem(`✅ **${adicionadas} contas compartilhadas** cadastradas com sucesso.`, "ia");

    if (typeof renderizarContas === "function") {
        renderizarContas();
    }

    if (typeof renderizarDashboard === "function") {
        renderizarDashboard();
    }
}

function cadastrarContasIndividuais(texto) {
    const linhas = texto.split("\n");
    const primeiraLinha = linhas[0];
    const nomePessoa = primeiraLinha.replace(/contas fixas individual/i, "").trim();
    const pessoas = obterPessoas();

    const pessoa = pessoas.find(x => x.nome.toLowerCase() === nomePessoa.toLowerCase());

    if (!pessoa) {
        adicionarMensagem(`Não encontrei a pessoa: **${nomePessoa}**`, "ia");
        return;
    }

    const contas = obterContas();
    let adicionadas = 0;

    linhas.forEach(linha => {
        const match = linha.match(/(.+?)[:\-]?\s*R\$\s*(\d+[.,]?\d*)/i);

        if (!match)
            return;

        const nome = match[1].replace(/#/g, "").trim();
        const valor = Number(match[2].replace(",", "."));

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

    adicionarMensagem(`✅ **${adicionadas} contas individuais** cadastradas para **${pessoa.nome}**.`, "ia");

    if (typeof renderizarContas === "function") {
        renderizarContas();
    }

    if (typeof renderizarDashboard === "function") {
        renderizarDashboard();
    }
}

function perguntaRapida(texto) {
    document.getElementById("inputIA").value = texto;
    enviarPergunta();
}

// NOVA FUNÇÃO: Converte o Markdown da IA para HTML
function formatarMarkdown(texto) {
    if (!texto) return "";
    
    let formatado = texto
        .replace(/### (.*?)(?:\n|$)/g, '<h3>$1</h3>') // Transforma ### em H3
        .replace(/## (.*?)(?:\n|$)/g, '<h2>$1</h2>')  // Transforma ## em H2
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>') // Transforma **negrito**
        .replace(/---/g, '<hr>'); // Transforma linhas divisórias

    // Transforma itens de lista (- item)
    formatado = formatado.replace(/- (.*?)(?:\n|$)/g, '<ul><li>$1</li></ul>');
    
    // Junta listas adjacentes para o HTML ficar mais limpo
    formatado = formatado.replace(/<\/ul>\n?<ul>/g, '');

    // Converte quebras de linha restantes em <br>
    formatado = formatado.replace(/\n/g, '<br>');

    return formatado;
}

function adicionarMensagem(texto, tipo) {
    const chat = document.getElementById("chatIA");
    const isIA = tipo === "ia";

    // Se for IA, formata o texto com a nova função. Se for usuário, mantém normal.
    let conteudoFinal = isIA ? formatarMarkdown(texto) : texto;

    // Classes atualizadas para combinar com o novo design
    const classesIA = "bg-slate-800 border border-slate-700 text-slate-200 rounded-2xl rounded-tl-sm p-5 max-w-3xl shadow-md ai-content";
    const classesUsuario = "bg-cyan-600 text-white rounded-2xl rounded-tr-sm p-4 max-w-xl shadow-md";

    chat.innerHTML += `
        <div class="flex ${isIA ? "" : "justify-end"}">
            <div class="${isIA ? classesIA : classesUsuario}">
                ${conteudoFinal}
            </div>
        </div>
    `;

    chat.scrollTop = chat.scrollHeight;
}

function adicionarTyping() {
    const chat = document.getElementById("chatIA");

    chat.innerHTML += `
        <div id="typingIA" class="flex">
            <div class="bg-slate-800 border border-slate-700 text-slate-400 rounded-2xl rounded-tl-sm p-5 shadow-md flex items-center gap-2">
                <span class="animate-pulse">Pensando...</span>
            </div>
        </div>
    `;

    chat.scrollTop = chat.scrollHeight;
}

function removerTyping() {
    const typing = document.getElementById("typingIA");
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
        amigável e objetiva. Use formatação Markdown (## para títulos, ** para negrito, - para listas).
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

    // AJUSTA ISSO DEPOIS dependendo da resposta da API da Poe
    return (
        data.output?.[0]?.content?.[0]?.text
        || "Não consegui responder."
    );
}