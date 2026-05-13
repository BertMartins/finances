// js/app.js

const appState = {

    paginaAtual:
        "dashboard",

    mesAtual:
        obterMesAtual()
};

window.addEventListener(
    "DOMContentLoaded",
    async () => {

        configurarTema();

        configurarSidebarMobile();

        atualizarTextoMes();

        await navegarPara(
            "dashboard"
        );
    }
);

function configurarTema() {

    const darkMode =
        window.matchMedia(
            "(prefers-color-scheme: dark)"
        ).matches;

    if (darkMode) {

        document.documentElement
            .classList.add(
                "dark"
            );
    }

    window.matchMedia(
        "(prefers-color-scheme: dark)"
    ).addEventListener(
        "change",
        (event) => {

            if (event.matches) {

                document.documentElement
                    .classList.add(
                        "dark"
                    );

                return;
            }

            document.documentElement
                .classList.remove(
                    "dark"
                );
        }
    );
}

function configurarSidebarMobile() {

    const toggle =
        document.getElementById(
            "menuToggle"
        );

    const sidebar =
        document.getElementById(
            "sidebar"
        );

    const overlay =
        document.getElementById(
            "sidebarOverlay"
        );

    if (
        !toggle ||
        !sidebar ||
        !overlay
    ) {
        return;
    }

    toggle.addEventListener(
        "click",
        () => {

            sidebar.classList.toggle(
                "open"
            );

            overlay.classList.toggle(
                "active"
            );
        }
    );

    overlay.addEventListener(
        "click",
        fecharSidebarMobile
    );
}

function fecharSidebarMobile() {

    const sidebar =
        document.getElementById(
            "sidebar"
        );

    const overlay =
        document.getElementById(
            "sidebarOverlay"
        );

    sidebar?.classList.remove(
        "open"
    );

    overlay?.classList.remove(
        "active"
    );
}

function atualizarTextoMes() {

    const elemento =
        document.getElementById(
            "textoMesAtual"
        );

    if (!elemento)
        return;

    const [
        ano,
        mes
    ] = appState.mesAtual
        .split("-");

    const meses = [

        "Janeiro",
        "Fevereiro",
        "Março",
        "Abril",
        "Maio",
        "Junho",
        "Julho",
        "Agosto",
        "Setembro",
        "Outubro",
        "Novembro",
        "Dezembro"
    ];

    elemento.innerText =
        `${meses[
            Number(mes) - 1
        ]} ${ano}`;
}

function alterarMes(
    direcao
) {

    const [
        anoAtual,
        mesAtual
    ] = appState.mesAtual
        .split("-")
        .map(Number);

    const data = new Date(
        anoAtual,
        mesAtual - 1
    );

    data.setMonth(
        data.getMonth() + direcao
    );

    const novoAno =
        data.getFullYear();

    const novoMes =
        String(
            data.getMonth() + 1
        ).padStart(2, "0");

    appState.mesAtual =
        `${novoAno}-${novoMes}`;

    atualizarTextoMes();

    inicializarPagina(
        appState.paginaAtual
    );
}