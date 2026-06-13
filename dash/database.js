// Base de dados padrão para inicializar o sistema
const dadosIniciais = [
    { id: "1001", transportadora: "Alfa Transportes", regiao: "Sudeste", status: "No Prazo" },
    { id: "1002", transportadora: "Alfa Transportes", regiao: "Sul", status: "Atraso Crítico" },
    { id: "1003", transportadora: "Beta Logística", regiao: "Nordeste", status: "Atraso Médio" },
    { id: "1004", transportadora: "Alfa Transportes", regiao: "Sudeste", status: "No Prazo" },
    { id: "1005", transportadora: "Gama Fretes", regiao: "Norte", status: "Atraso Crítico" },
    { id: "1006", transportadora: "Beta Logística", regiao: "Centro-Oeste", status: "No Prazo" },
    { id: "1007", transportadora: "Gama Fretes", regiao: "Sul", status: "Atraso Médio" }
];

// Função para buscar dados do LocalStorage ou criar os iniciais
function obterBancoDeDados() {
    const bd = localStorage.getItem("logiflow_bd");
    if (!bd) {
        localStorage.setItem("logiflow_bd", JSON.stringify(dadosIniciais));
        return dadosIniciais;
    }
    return JSON.parse(bd);
}

// Salva o estado atual das entregas no banco
function salvarBancoDeDados(novosDados) {
    localStorage.setItem("logiflow_bd", JSON.stringify(novosDados));
}
