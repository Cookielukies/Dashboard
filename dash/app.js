// Estado global da ordenação (true = crescente, false = decrescente)
let ordenacaoCrescente = true;

// Inicialização segura do sistema assim que o DOM estiver pronto
document.addEventListener("DOMContentLoaded", () => {
    // Garante que o banco de dados existe antes de renderizar
    obterBancoDeDados();
    
    // Renderiza a tela inicial (Dashboard)
    renderizarTudo();
    
    // Configura o ouvinte do formulário do simulador (Requisito 4)
    const formSimulador = document.getElementById("form-simulador");
    if (formSimulador) {
        formSimulador.addEventListener("submit", (e) => {
            e.preventDefault();
            adicionarEntrega();
        });
    }
});

// Alternância de Telas Corrigida (Requisito 8)
function mudarTela(tela) {
    const d = document.getElementById("tela-dashboard");
    const t = document.getElementById("tela-tabela");
    const bDash = document.getElementById("btn-dash");
    const bTab = document.getElementById("btn-tabela");

    if (!d || !t || !bDash || !bTab) return; // Evita erros caso os IDs não existam

    if (tela === 'dashboard') {
        d.className = "tela-active";
        t.className = "tela-hidden";
        bDash.classList.add("active");
        bTab.classList.remove("active");
        renderizarTudo(); // Atualiza gráficos com os dados atuais do banco
    } else {
        d.className = "tela-hidden";
        t.className = "tela-active";
        bDash.classList.remove("active");
        bTab.classList.add("active");
        renderizarTabela(obterBancoDeDados()); // Renderiza a tabela limpa
    }
}

// Centralizador de renderizações da dashboard
function renderizarTudo() {
    const dados = obterBancoDeDados();
    renderizarMetricas(dados);
    renderizarGraficoTransportadoras(dados);
    atualizarMapaGeografico(dados);
}

// 1. GERAR BLOCOS DE MÉTRICAS COM % (Requisito 2 - STEF)
function renderizarMetricas(dados) {
    const container = document.getElementById("kpis-container");
    if (!container) return;

    const total = dados.length;
    const critico = dados.filter(d => d.status === "Atraso Crítico").length;
    const medio = dados.filter(d => d.status === "Atraso Médio").length;
    const prazo = dados.filter(d => d.status === "No Prazo").length;
    const totalAtrasadas = critico + medio;

    const calcPct = (valor) => total > 0 ? ((valor / total) * 100).toFixed(1) : "0.0";

    container.innerHTML = `
        <div class="kpi-card" style="border-left-color: var(--primary)">
            <h4>Total de Entregas</h4>
            <div class="kpi-value">${total}</div>
            <div class="kpi-pct">100% Volumetria</div>
        </div>
        <div class="kpi-card" style="border-left-color: var(--status-critico)">
            <h4>Atraso Crítico</h4>
            <div class="kpi-value">${critico}</div>
            <div class="kpi-pct">${calcPct(critico)}% do total</div>
        </div>
        <div class="kpi-card" style="border-left-color: var(--status-medio)">
            <h4>Atraso Médio</h4>
            <div class="kpi-value">${medio}</div>
            <div class="kpi-pct">${calcPct(medio)}% do total</div>
        </div>
        <div class="kpi-card" style="border-left-color: #475569">
            <h4>Total Atrasadas</h4>
            <div class="kpi-value">${totalAtrasadas}</div>
            <div class="kpi-pct">${calcPct(totalAtrasadas)}% do total</div>
        </div>
        <div class="kpi-card" style="border-left-color: var(--status-prazo)">
            <h4>No Prazo</h4>
            <div class="kpi-value">${prazo}</div>
            <div class="kpi-pct">${calcPct(prazo)}% de eficiência</div>
        </div>
    `;
}

// 2. RENDERIZAR TABELA (Requisito 1 - JP)
function renderizarTabela(dados) {
    const tbody = document.getElementById("table-body");
    if (!tbody) return;
    
    tbody.innerHTML = "";

    if (dados.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-muted);">Nenhuma entrega encontrada.</td></tr>`;
        return;
    }

    dados.forEach(item => {
        let classBadge = item.status === "No Prazo" ? "prazo" : (item.status === "Atraso Médio" ? "medio" : "critico");
        
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>#${item.id}</strong></td>
            <td>${item.transportadora}</td>
            <td>${item.regiao}</td>
            <td><span class="badge ${classBadge}">${item.status}</span></td>
            <td>
                <button class="btn btn-warning" onclick="dispararAlerta('${item.id}')" title="Alerta Crítico" style="padding: 6px 10px;"><i class="fa-solid fa-triangle-exclamation"></i></button>
                <button class="btn btn-danger" onclick="removerEntrega('${item.id}')" title="Remover" style="padding: 6px 10px;"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// 3. ORDENAÇÃO POR ID / GRAVIDADE DO ATRASO (Requisito 1 - JP)
function ordenarPorId() {
    let dados = obterBancoDeDados();
    const icon = document.getElementById("sort-icon");
    if (!icon) return;

    // Lógica de peso para ordenar por nível de atraso conforme solicitado
    const pesos = { "Atraso Crítico": 3, "Atraso Médio": 2, "No Prazo": 1 };

    dados.sort((a, b) => {
        return ordenacaoCrescente ? pesos[b.status] - pesos[a.status] : pesos[a.status] - pesos[b.status];
    });

    // Inverte o estado para o próximo clique
    ordenacaoCrescente = !ordenacaoCrescente;
    
    // Atualiza o ícone visual
    icon.className = ordenacaoCrescente ? "fa-solid fa-sort-up" : "fa-solid fa-sort-down";
    
    // Renderiza a tabela com a nova ordenação aplicada
    renderizarTabela(dados);
}

// 4. BARRA DE PESQUISA POR ID OU TRANSPORTADORA (Requisito 6 - JP)
function filtrarTabela() {
    const input = document.getElementById("search-input");
    if (!input) return;
    
    const termo = input.value.toLowerCase().trim();
    const dados = obterBancoDeDados();
    
    const filtrados = dados.filter(item => 
        item.id.toLowerCase().includes(termo) || 
        item.transportadora.toLowerCase().includes(termo)
    );
    
    renderizarTabela(filtrados);
}

// 5. REMOVER ENTREGA (Requisito 5 - JP)
function removerEntrega(id) {
    if (!confirm(`Tem certeza que deseja remover a entrega #${id}?`)) return;
    
    let dados = obterBancoDeDados();
    dados = dados.filter(item => item.id !== id);
    salvarBancoDeDados(dados);
    
    // Atualiza a tabela respeitando o filtro digitado
    filtrarTabela(); 
}

// 6. ALERTA DE ENTREGA CRÍTICA (Requisito 5 - JP)
function dispararAlerta(id) {
    let dados = obterBancoDeDados();
    dados = dados.map(item => {
        if (item.id === id) item.status = "Atraso Crítico";
        return item;
    });
    salvarBancoDeDados(dados);
    alert(`Alerta crítico disparado para a entrega #${id}!`);
    filtrarTabela();
}

// 7. ADICIONAR ITEM DO SIMULADOR AO BANCO (Requisito 4 - JP)
function adicionarEntrega() {
    const idEl = document.getElementById("sim-id");
    const transEl = document.getElementById("sim-transportadora");
    const regEl = document.getElementById("sim-regiao");
    const statEl = document.getElementById("sim-status");

    if (!idEl || !transEl || !regEl || !statEl) return;

    const id = idEl.value.trim();
    const transportadora = transEl.value.trim();
    const regiao = regEl.value;
    const status = statEl.value;

    let dados = obterBancoDeDados();
    
    // Evita IDs duplicados na base
    if (dados.some(item => item.id === id)) {
        alert("Erro: Este ID de entrega já está registado no banco de dados!");
        return;
    }

    dados.push({ id, transportadora, regiao, status });
    salvarBancoDeDados(dados);
    
    alert(`Entrega #${id} guardada com sucesso no banco de dados.`);
    document.getElementById("form-simulador").reset();
    
    // Atualiza o Dashboard caso o utilizador volte para lá
    renderizarTudo();
}

// 8. GRÁFICO DE PERFORMANCE DAS TRANSPORTADORAS (Requisito 7 - JP)
function renderizarGraficoTransportadoras(dados) {
    const container = document.getElementById("transportadoras-chart");
    if (!container) return;
    
    container.innerHTML = "";

    // Agrupamento dos dados
    const performance = {};
    dados.forEach(item => {
        if (!performance[item.transportadora]) {
            performance[item.transportadora] = { totais: 0, atrasos: 0 };
        }
        performance[item.transportadora].totais++;
        if (item.status !== "No Prazo") {
            performance[item.transportadora].atrasos++;
        }
    });

    // Construção visual das barras percentuais
    Object.keys(performance).forEach(carrier => {
        const info = performance[carrier];
        const pctAtraso = info.totais > 0 ? ((info.atrasos / info.totais) * 100).toFixed(0) : 0;
        
        const barGroup = document.createElement("div");
        barGroup.className = "chart-bar-group";
        barGroup.innerHTML = `
            <div class="chart-labels">
                <strong>${carrier}</strong>
                <span>${info.atrasos} atrasos / ${info.totais} totais (${pctAtraso}%)</span>
            </div>
            <div class="bar-track">
                <div class="bar-total" style="width: 100%;"></div>
                <div class="bar-atraso" style="width: ${pctAtraso}%;"></div>
            </div>
        `;
        container.appendChild(barGroup);
    });
}

// 9. MAPA INTERATIVO REFINADO (Requisito 3 - FERAX)
function atualizarMapaGeografico(dados) {
    const regioes = ["Norte", "Nordeste", "Centro-Oeste", "Sudeste", "Sul"];
    
    regioes.forEach(regiao => {
        const entregasRegiao = dados.filter(d => d.regiao === regiao);
        const criticas = entregasRegiao.filter(d => d.status === "Atraso Crítico").length;
        const medias = entregasRegiao.filter(d => d.status === "Atraso Médio").length;
        
        const classeRegiao = regiao.toLowerCase().replace("centro-oeste", "centro-oeste");
        const elementoEl = document.querySelector(`.map-region.${classeRegiao}`);
        
        if (elementoEl) {
            // Se não houver entregas, volta ao estado cinzento neutro
            if (entregasRegiao.length === 0) {
                elementoEl.style.backgroundColor = "#e2e8f0";
                elementoEl.style.border = "1px solid var(--border-color)";
                return;
            }

            // Lógica de coloração conforme a severidade regional
            if (criticas > 0) {
                elementoEl.style.backgroundColor = "rgba(239, 68, 68, 0.4)"; 
                elementoEl.style.border = "2px solid var(--status-critico)";
            } else if (medias > 0) {
                elementoEl.style.backgroundColor = "rgba(245, 158, 11, 0.4)"; 
                elementoEl.style.border = "2px solid var(--status-medio)";
            } else {
                elementoEl.style.backgroundColor = "rgba(16, 185, 129, 0.4)"; 
                elementoEl.style.border = "2px solid var(--status-prazo)";
            }
            
            elementoEl.setAttribute("title", `${regiao}: ${entregasRegiao.length} entrega(s) ativa(s).`);
        }
    });
}
