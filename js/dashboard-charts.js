// js/dashboard-charts.js

function renderizarGraficosDashboard() {

    destruirGraficos();

    renderizarGraficoCategorias();

    renderizarGraficoResumo();
}

function destruirGraficos() {

    Object.values(
        appState.charts
    ).forEach(chart => {

        if (
            chart &&
            typeof chart.destroy
            === "function"
        ) {

            chart.destroy();
        }
    });

    appState.charts = {};
}

function renderizarGraficoCategorias() {

    const canvas =
        document.getElementById(
            "graficoCategorias"
        );

    if (!canvas)
        return;

    const categorias = {};

    obterContasFixasMes(
        appState.mesAtual
    ).forEach(conta => {

        categorias[
            conta.categoria
        ] =
            (
                categorias[
                    conta.categoria
                ] || 0
            ) + Number(
                conta.valor || 0
            );
    });

    obterContasVariaveisMes(
        appState.mesAtual
    ).forEach(conta => {

        categorias[
            conta.categoria
        ] =
            (
                categorias[
                    conta.categoria
                ] || 0
            ) + Number(
                conta.valorParcela || 0
            );
    });

    const labels =
        Object.keys(categorias);

    const valores =
        Object.values(categorias);

    if (labels.length === 0)
        return;

    appState.charts.categorias =
        new Chart(
            canvas,
            {
                type: "doughnut",

                data: {

                    labels,

                    datasets: [
                        {
                            data: valores,

                            backgroundColor: [
                                "#10b981",
                                "#6366f1",
                                "#f59e0b",
                                "#ef4444",
                                "#06b6d4",
                                "#ec4899",
                                "#8b5cf6"
                            ],

                            borderWidth: 0
                        }
                    ]
                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    plugins: {

                        legend: {

                            position: "bottom"
                        }
                    }
                }
            }
        );
}

function renderizarGraficoResumo() {

    const canvas =
        document.getElementById(
            "graficoResumo"
        );

    if (!canvas)
        return;

    const pessoas =
        obterPessoas();

    const totalSalarios =
        pessoas.reduce(
            (total, pessoa) =>
                total + Number(
                    pessoa.salario || 0
                ),
            0
        );

    const totalFixas =
        obterContasFixasMes(
            appState.mesAtual
        )
        .reduce(
            (total, conta) =>
                total + Number(
                    conta.valor || 0
                ),
            0
        );

    const totalVariaveis =
        obterContasVariaveisMes(
            appState.mesAtual
        )
        .reduce(
            (total, conta) =>
                total + Number(
                    conta.valorParcela || 0
                ),
            0
        );

    const sobra =
        totalSalarios -
        (
            totalFixas +
            totalVariaveis
        );

    appState.charts.resumo =
        new Chart(
            canvas,
            {
                type: "bar",

                data: {

                    labels: [
                        "Salários",
                        "Fixas",
                        "Variáveis",
                        "Sobra"
                    ],

                    datasets: [
                        {
                            data: [
                                totalSalarios,
                                totalFixas,
                                totalVariaveis,
                                sobra
                            ],

                            backgroundColor: [
                                "#10b981",
                                "#f59e0b",
                                "#6366f1",
                                "#06b6d4"
                            ],

                            borderRadius: 10
                        }
                    ]
                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    plugins: {

                        legend: {
                            display: false
                        }
                    }
                }
            }
        );
}

function obterContasFixasMes(
    mes
) {

    return obterContasFixas()
        .filter(conta => {

            if (
                !conta.dataInicio
            ) {
                return true;
            }

            return (
                conta.dataInicio
                    .slice(0, 7)
                <= mes
            );
        });
}

function obterContasVariaveisMes(
    mes
) {

    return obterContasVariaveis()
        .filter(conta => {

            if (
                conta.parcelado
            ) {

                const inicio =
                    conta.data
                        .slice(0, 7);

                const fim =
                    adicionarMeses(
                        inicio,
                        conta.parcelas - 1
                    );

                return (
                    mes >= inicio &&
                    mes <= fim
                );
            }

            return (
                conta.data
                    .slice(0, 7)
                === mes
            );
        });
}