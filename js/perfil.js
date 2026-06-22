// js/perfil.js

function renderizarPerfil() {

    atualizarStatusToken();
    preencherTokenSalvo();
}

function atualizarStatusToken() {

    const chave = obterApiKey();
    const el = document.getElementById("tokenStatus");

    if (!el) return;

    if (chave) {

        el.innerHTML = `
            <span class="perfil-status ok">
                ✅ Token configurado
            </span>
        `;

        const btnLimpar =
            document.getElementById("btnLimparToken");

        if (btnLimpar)
            btnLimpar.style.display = "";

    } else {

        el.innerHTML = `
            <span class="perfil-status warn">
                ⚠️ Token não configurado
            </span>
        `;

        const btnLimpar =
            document.getElementById("btnLimparToken");

        if (btnLimpar)
            btnLimpar.style.display = "none";
    }
}

function preencherTokenSalvo() {

    const chave = obterApiKey();
    const input = document.getElementById("inputTokenPoe");

    if (!input) return;

    if (chave)
        input.placeholder = "Token já configurado — cole um novo para substituir";
}

function salvarTokenPoe() {

    const input =
        document.getElementById("inputTokenPoe");

    const chave = input.value.trim();

    if (!chave) {

        mostrarToast(
            "Informe o token da Poe.",
            "error"
        );

        return;
    }

    salvarApiKey(chave);

    input.value = "";

    mostrarToast(
        "Token salvo com sucesso!",
        "success"
    );

    atualizarStatusToken();
    preencherTokenSalvo();
}

function limparTokenPoe() {

    abrirModal({

        titulo: "Limpar Token",

        conteudo: `
            <p class="text-muted">
                Tem certeza que deseja remover o token da Poe? O Assistente IA não funcionará sem ele.
            </p>
        `,

        footer: `
            <button
                class="btn btn-secondary"
                onclick="fecharModal()">
                Cancelar
            </button>

            <button
                class="btn btn-primary"
                style="background:var(--danger);border-color:var(--danger);"
                onclick="confirmarLimparToken()">
                Remover
            </button>
        `
    });
}

function confirmarLimparToken() {

    localStorage.removeItem(
        STORAGE_KEYS.apiKey
    );

    fecharModal();

    mostrarToast(
        "Token removido.",
        "success"
    );

    atualizarStatusToken();
    preencherTokenSalvo();
}

function alternarVisibilidadeToken() {

    const input =
        document.getElementById("inputTokenPoe");

    if (!input) return;

    input.type =
        input.type === "password"
            ? "text"
            : "password";
}

function zerarTodosDados() {

    abrirModal({

        titulo: "⚠️ Zerar Todos os Dados",

        conteudo: `
            <div class="space-y-4">

                <p class="text-muted">
                    Você está prestes a apagar <strong style="color:var(--danger)">todos os dados</strong> do aplicativo:
                </p>

                <div class="perfil-import-resumo">
                    <span>👥 Todas as pessoas</span>
                    <span>🏠 Todas as contas fixas</span>
                    <span>💳 Todas as contas variáveis</span>
                    <span>⚙️ Todas as configurações</span>
                    <span>🤖 Token da Poe</span>
                </div>

                <p class="text-muted" style="font-size:13px;">
                    Esta ação é <strong>irreversível</strong>. O app voltará ao estado inicial.
                </p>

            </div>
        `,

        footer: `
            <button
                class="btn btn-secondary"
                onclick="fecharModal()">
                Cancelar
            </button>

            <button
                class="btn btn-primary"
                style="background:var(--danger);border-color:var(--danger);"
                onclick="confirmarZerarTudo()">
                🗑️ Zerar Tudo
            </button>
        `
    });
}

function confirmarZerarTudo() {

    Object.values(STORAGE_KEYS).forEach(chave => {
        localStorage.removeItem(chave);
    });

    iniciarStorage();

    fecharModal();

    mostrarToast(
        "Todos os dados foram apagados.",
        "success"
    );

    navegarPara("dashboard");
}

function exportarDadosPerfil() {

    exportarDados();

    mostrarToast(
        "Backup exportado com sucesso!",
        "success"
    );
}

function onSelecionarArquivo(event) {

    const arquivo = event.target.files[0];

    if (!arquivo) return;

    lerArquivoJSON(arquivo);

    event.target.value = "";
}

function onDropArquivo(event) {

    event.preventDefault();

    const dropZone =
        document.getElementById("dropZone");

    if (dropZone)
        dropZone.classList.remove("drag-over");

    const arquivo =
        event.dataTransfer.files[0];

    if (!arquivo) return;

    if (!arquivo.name.endsWith(".json")) {

        mostrarToast(
            "Selecione um arquivo .json válido.",
            "error"
        );

        return;
    }

    lerArquivoJSON(arquivo);
}

function lerArquivoJSON(arquivo) {

    const reader = new FileReader();

    reader.onload = function (e) {

        try {

            const dados =
                JSON.parse(e.target.result);

            confirmarImportacao(dados);

        } catch {

            mostrarToast(
                "Arquivo inválido ou corrompido.",
                "error"
            );
        }
    };

    reader.readAsText(arquivo);
}

function confirmarImportacao(dados) {

    const resumo = [
        dados.pessoas?.length
            ? `👥 ${dados.pessoas.length} pessoa(s)`
            : null,

        dados.contasFixas?.length
            ? `🏠 ${dados.contasFixas.length} conta(s) fixa(s)`
            : null,

        dados.contasVariaveis?.length
            ? `💳 ${dados.contasVariaveis.length} conta(s) variável(is)`
            : null,
    ]
    .filter(Boolean)
    .join(", ");

    const exportadoEm = dados.exportadoEm
        ? `<p class="text-muted" style="margin-top:8px;font-size:13px;">
               Exportado em: ${new Date(dados.exportadoEm).toLocaleString("pt-BR")}
           </p>`
        : "";

    abrirModal({

        titulo: "Confirmar Importação",

        conteudo: `
            <div class="space-y-4">

                <p class="text-muted">
                    Os dados atuais serão <strong style="color:var(--danger)">substituídos</strong>.
                    Deseja continuar?
                </p>

                <div class="perfil-import-resumo">
                    <span class="perfil-import-label">Será importado:</span>
                    <span>${resumo || "Sem dados detectados"}</span>
                </div>

                ${exportadoEm}

            </div>
        `,

        footer: `
            <button
                class="btn btn-secondary"
                onclick="fecharModal()">
                Cancelar
            </button>

            <button
                class="btn btn-primary"
                onclick="executarImportacao()">
                ✅ Importar
            </button>
        `
    });

    window._dadosImportacao = dados;
}

function executarImportacao() {

    const dados = window._dadosImportacao;

    if (!dados) {

        mostrarToast(
            "Nenhum dado para importar.",
            "error"
        );

        return;
    }

    const sucesso = importarDados(dados);

    fecharModal();

    delete window._dadosImportacao;

    if (sucesso) {

        mostrarToast(
            "Dados importados com sucesso!",
            "success"
        );

    } else {

        mostrarToast(
            "Erro ao importar os dados.",
            "error"
        );
    }
}
