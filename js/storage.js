// js/storage.js

const STORAGE_KEYS = {
    pessoas: "financas_pessoas",
    contas: "financas_contas",
    configuracoes: "financas_configuracoes",
    apiKey: "financas_poe_api_key"
};

function iniciarStorage() {

    if (!localStorage.getItem(STORAGE_KEYS.pessoas)) {

        localStorage.setItem(
            STORAGE_KEYS.pessoas,
            JSON.stringify([])
        );
    }

    if (!localStorage.getItem(STORAGE_KEYS.contas)) {

        localStorage.setItem(
            STORAGE_KEYS.contas,
            JSON.stringify([])
        );
    }

    if (!localStorage.getItem(STORAGE_KEYS.configuracoes)) {

        localStorage.setItem(
            STORAGE_KEYS.configuracoes,
            JSON.stringify({
                divisaoPorSalario: false
            })
        );
    }
}

function parseSeguro(valor, fallback) {

    try {

        return JSON.parse(valor) || fallback;
    }
    catch {

        return fallback;
    }
}

function obterPessoas() {

    return parseSeguro(
        localStorage.getItem(STORAGE_KEYS.pessoas),
        []
    );
}

function salvarPessoas(lista) {

    localStorage.setItem(
        STORAGE_KEYS.pessoas,
        JSON.stringify(lista)
    );
}

function obterContas() {

    return parseSeguro(
        localStorage.getItem(STORAGE_KEYS.contas),
        []
    );
}

function salvarContas(lista) {

    localStorage.setItem(
        STORAGE_KEYS.contas,
        JSON.stringify(lista)
    );
}

function obterConfiguracoes() {

    return parseSeguro(
        localStorage.getItem(STORAGE_KEYS.configuracoes),
        {}
    );
}

function salvarConfiguracoes(config) {

    localStorage.setItem(
        STORAGE_KEYS.configuracoes,
        JSON.stringify(config)
    );
}

function obterApiKey() {

    return localStorage.getItem(
        STORAGE_KEYS.apiKey
    );
}

function salvarApiKey(chave) {

    localStorage.setItem(
        STORAGE_KEYS.apiKey,
        chave
    );
}

function limparStorage() {

    Object.values(STORAGE_KEYS).forEach(chave => {
        localStorage.removeItem(chave);
    });

    iniciarStorage();
}

iniciarStorage();