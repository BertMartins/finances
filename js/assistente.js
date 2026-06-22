// js/assistente.js

let contasDetectadasIA = [];

function inicializarAssistente() {

    verificarApiKey();
}

function verificarApiKey() {

    const chave =
        obterApiKey();

    if (chave)
        return;

    abrirModal({

        titulo:
            "Configurar API Key",

        conteudo: `
            <div class="space-y-4">

                <p class="text-muted">

                    Informe sua chave da API da Poe.

                </p>

                <input
                    id="inputApiKey"
                    type="password"
                    class="input"
                    placeholder="Cole sua API Key"
                />

            </div>
        `,

        footer: `
            <button
                class="btn btn-primary"
                onclick="salvarChaveIA()">

                Salvar

            </button>
        `
    });
}

function salvarChaveIA() {

    const chave =
        document.getElementById(
            "inputApiKey"
        ).value.trim();

    if (!chave) {

        mostrarToast(
            "Informe a chave.",
            "error"
        );

        return;
    }

    salvarApiKey(
        chave
    );

    fecharModal();

    mostrarToast(
        "API configurada.",
        "success"
    );
}

function preencherPerguntaIA(pergunta) {

    const input =
        document.getElementById(
            "inputIA"
        );

    if (!input)
        return;

    input.value = pergunta;

    enviarPerguntaIA();
}

async function enviarPerguntaIA() {

    const input =
        document.getElementById(
            "inputIA"
        );

    const pergunta =
        input.value.trim();

    if (!pergunta)
        return;

    adicionarMensagemIA(
        pergunta,
        "usuario"
    );

    input.value = "";

    const contas =
        detectarContasTexto(
            pergunta
        );

    if (contas.length > 0) {

        contasDetectadasIA =
            contas;

        adicionarMensagemIA(
            gerarHtmlContasDetectadas(
                contas
            ),
            "ia"
        );

        return;
    }

    adicionarTypingIA();

    try {

        const resposta =
            await perguntarIA(
                pergunta
            );

        removerTypingIA();

        adicionarMensagemIA(
            resposta,
            "ia"
        );
    }
    catch {

        removerTypingIA();

        adicionarMensagemIA(
            "Erro ao comunicar com a IA.",
            "ia"
        );
    }
}

function adicionarMensagemIA(
    mensagem,
    tipo
) {

    const chat =
        document.getElementById(
            "chatIA"
        );

    if (!chat)
        return;

    const isIA =
        tipo === "ia";

    chat.innerHTML += `
        <div class="
            ai-msg
            ${isIA ? "bot" : "user"}
        ">

            <div class="ai-msg-avatar">

                ${
                    isIA
                        ? "🤖"
                        : "👤"
                }

            </div>

            <div class="ai-msg-bubble">

                ${mensagem}

            </div>

        </div>
    `;

    chat.scrollTop =
        chat.scrollHeight;
}

function adicionarTypingIA() {

    const chat =
        document.getElementById(
            "chatIA"
        );

    if (!chat)
        return;

    chat.innerHTML += `
        <div
            id="typingIA"
            class="ai-msg bot">

            <div class="ai-msg-avatar">
                🤖
            </div>

            <div class="ai-msg-bubble">

                <div class="ai-typing">

                    <span></span>
                    <span></span>
                    <span></span>

                </div>

            </div>

        </div>
    `;

    chat.scrollTop =
        chat.scrollHeight;
}

function removerTypingIA() {

    document.getElementById(
        "typingIA"
    )?.remove();
}

function detectarContasTexto(
    texto
) {

    const linhas =
        texto.split("\n");

    const contas = [];

    const regex =
        /^(.+?)\s*[:\-]\s*R?\$?\s*([\d.,]+)/i;

    linhas.forEach(linha => {

        const match =
            linha
                .trim()
                .match(regex);

        if (!match)
            return;

        contas.push({

            nome:
                match[1].trim(),

            valor:
                Number(
                    match[2]
                        .replace(".", "")
                        .replace(",", ".")
                )
        });
    });

    return contas;
}

function gerarHtmlContasDetectadas(
    contas
) {

    return `
        <div class="ai-parsed-bills">

            <h4>
                📋 Contas Detectadas
            </h4>

            ${
                contas.map(conta => `
                    <div class="ai-parsed-item">

                        <span>

                            ${conta.nome}

                        </span>

                        <span>

                            ${formatarMoeda(
                                conta.valor
                            )}

                        </span>

                    </div>
                `).join("")
            }

            <button
                class="
                    btn btn-primary
                    mt-16
                "
                onclick="
                    adicionarContasDetectadas()
                ">

                Adicionar Contas

            </button>

        </div>
    `;
}

function adicionarContasDetectadas() {

    const contas =
        obterContasFixas();

    contasDetectadasIA
        .forEach(conta => {

            contas.push({

                id: gerarId(),

                nome:
                    conta.nome,

                valor:
                    conta.valor,

                categoria:
                    "Outros",

                dataInicio:
                    appState.mesAtual,

                tipo:
                    "compartilhada",

                pessoaId:
                    null,

                observacao:
                    "Adicionado via IA"
            });
        });

    salvarContasFixas(
        contas
    );

    mostrarToast(
        "Contas adicionadas.",
        "success"
    );

    contasDetectadasIA = [];
}

async function perguntarIA(
    pergunta
) {

    const chave =
        obterApiKey();

    const contexto =
        "Você é um assistente financeiro familiar.\n\n" +
        "Pessoas: " +
        JSON.stringify(obterPessoas()) + "\n\n" +
        "Contas Fixas: " +
        JSON.stringify(obterContasFixas()) + "\n\n" +
        "Contas Variáveis: " +
        JSON.stringify(obterContasVariaveis()) + "\n\n" +
        "Pergunta: " + pergunta + "\n\n" +
        "Responda em português de forma clara e objetiva.";

    const response =
        await fetch(
            "https://api.poe.com/bot/GPT-3.5-Turbo",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json",

                    "Authorization":
                        `Bearer ${chave}`
                },

                body: JSON.stringify({

                    version: "1.0",

                    type: "query",

                    query: [
                        {
                            role: "user",

                            content: contexto,

                            content_type:
                                "text/markdown",

                            timestamp: 0,

                            message_id: "",

                            feedback: [],

                            attachments: []
                        }
                    ],

                    user_id: "",

                    conversation_id: "",

                    message_id: ""
                })
            }
        );

    if (!response.ok)
        throw new Error(
            `Erro ${response.status}`
        );

    const reader =
        response.body.getReader();

    const decoder =
        new TextDecoder();

    let fullText = "";
    let buffer = "";

    while (true) {

        const { done, value } =
            await reader.read();

        if (done)
            break;

        buffer +=
            decoder.decode(
                value,
                { stream: true }
            );

        const parts =
            buffer.split("\n\n");

        buffer =
            parts.pop();

        for (const part of parts) {

            const lines =
                part.split("\n");

            let eventType = "";
            let eventData = "";

            for (const line of lines) {

                if (line.startsWith(
                    "event: "
                )) {
                    eventType =
                        line
                            .slice(7)
                            .trim();
                }
                else if (line.startsWith(
                    "data: "
                )) {
                    eventData =
                        line
                            .slice(6)
                            .trim();
                }
            }

            if (!eventData)
                continue;

            try {

                const parsed =
                    JSON.parse(
                        eventData
                    );

                if (
                    eventType === "text"
                ) {
                    fullText +=
                        parsed.text || "";
                }
                else if (
                    eventType ===
                    "replace_response"
                ) {
                    fullText =
                        parsed.text ||
                        fullText;
                }
            }
            catch {}
        }
    }

    return fullText || "Sem resposta.";
}