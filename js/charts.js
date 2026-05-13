// js/charts.js

let charts = {};

function destruirCharts() {

    Object.keys(charts)
        .forEach(key => {

            if (charts[key]) {

                charts[key].destroy();
            }
        });

    charts = {};
}

function renderizarGraficoCategorias() {

    const canvas =
        document.getElementById(
            "graficoCategorias"
        );

    if (
        !canvas ||
        typeof Chart === "undefined"
    ) {
        return;
    }

    destruirCharts();

    const categorias = {};

    const contasFixas =
        obterContasFixasMes(
            appState.mesAtual
        );

    const contasVariaveis =
        obterContasVariaveisMes(
            appState.mesAtual
        );

    contasFixas.forEach(conta => {

        const categoria =
            conta.categoria ||
            "Outros";

        categorias[categoria] = (

            categorias[categoria] || 0

        ) + Number(
            conta.valor || 0
        );
    });

    contasVariaveis.forEach(conta => {

        const categoria =
            conta.categoria ||
            "Outros";

        categorias[categoria] = (

            categorias[categoria] || 0

        ) + Number(
            conta.valorParcela || 0
        );
    });

    const labels =
        Object.keys(categorias);

    const valores =
        Object.values(categorias);

    charts.categorias =
        new Chart(canvas, {

            type: "doughnut",

            data: {

                labels,

                datasets: [{

                    data: valores,

                    borderWidth: 0,

                    hoverOffset: 8
                }]
            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                plugins: {

                    legend: {

                        position: "bottom",

                        labels: {

                            color:
                                "#94a3b8"
                        }
                    }
                }
            }
        });
}

function renderizarGraficoResumo() {

    const canvas =
        document.getElementById(
            "graficoResumo"
        );

    if (
        !canvas ||
        typeof Chart === "undefined"
    ) {
        return;
    }

    const pessoas =
        obterPessoas();

    const contasFixas =
        obterContasFixasMes(
            appState.mesAtual
        );

    const contasVariaveis =
        obterContasVariaveisMes(
            appState.mesAtual
        );

    const totalSalarios =
        pessoas.reduce(
            (total, pessoa) => {

                return (
                    total +
                    Number(
                        pessoa.salario || 0
                    )
                );
            },
            0
        );

    const totalFixas =
        contasFixas.reduce(
            (total, conta) => {

                return (
                    total +
                    Number(
                        conta.valor || 0
                    )
                );
            },
            0
        );

    const totalVariaveis =
        contasVariaveis.reduce(
            (total, conta) => {

                return (
                    total +
                    Number(
                        conta.valorParcela || 0
                    )
                );
            },
            0
        );

    const sobra =
        totalSalarios -
        (
            totalFixas +
            totalVariaveis
        );

    charts.resumo =
        new Chart(canvas, {

            type: "bar",

            data: {

                labels: [

                    "Salários",
                    "Fixas",
                    "Variáveis",
                    "Sobra"
                ],

                datasets: [{

                    data: [

                        totalSalarios,

                        totalFixas,

                        totalVariaveis,

                        sobra > 0
                            ? sobra
                            : 0
                    ],

                    borderRadius: 12
                }]
            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                plugins: {

                    legend: {

                        display: false
                    }
                },

                scales: {

                    y: {

                        ticks: {

                            color:
                                "#94a3b8"
                        },

                        grid: {

                            color:
                                "rgba(255,255,255,.05)"
                        }
                    },

                    x: {

                        ticks: {

                            color:
                                "#94a3b8"
                        },

                        grid: {

                            display: false
                        }
                    }
                }
            }
        });
}