// js/tabs.js

async function abrirPagina(pagina) {

    const response =
        await fetch(`pages/${pagina}.html`);

    const html =
        await response.text();

    document.getElementById("app").innerHTML =
        html;

    atualizarTitulo(pagina);

    inicializarPagina(pagina);
}

function atualizarTitulo(pagina) {

    const titulos = {
        dashboard: "Dashboard",
        pessoas: "Pessoas",
        contas: "Contas",
        relatorios: "Relatórios",
        assistente: "Assistente IA"
    };

    document.getElementById("tituloPagina").innerText =
        titulos[pagina];
}

function inicializarPagina(pagina) {

    switch (pagina) {

        case "dashboard":
            renderizarDashboard();
            break;

        case "pessoas":
            renderizarPessoas();
            break;

        case "contas":
            renderizarContas();
            carregarPessoasSelect();
            break;
    }
}