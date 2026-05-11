function formatarMoeda(valor) {

    return Number(valor).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function gerarId() {
    return crypto.randomUUID();
}

function calcularTotalSalarios() {

    const pessoas = obterPessoas();

    return pessoas.reduce((acc, pessoa) => {
        return acc + Number(pessoa.salario);
    }, 0);
}

function calcularContasCompartilhadas() {

    const contas = obterContas();

    return contas
        .filter(x => x.tipo === "compartilhada")
        .reduce((acc, conta) => {
            return acc + Number(conta.valor);
        }, 0);
}

function calcularContasIndividuaisPessoa(pessoaId) {

    const contas = obterContas();

    return contas
        .filter(x =>
            x.tipo === "individual" &&
            x.pessoaId === pessoaId
        )
        .reduce((acc, conta) => {
            return acc + Number(conta.valor);
        }, 0);
}