// ===== Dados iniciais =====
const TITULOS_BASE = [
  { id: 1, titulo: "Interestelar", tipo: "Filme", genero: "Ficção", ano: 2014 },
  { id: 2, titulo: "Cidade de Deus", tipo: "Filme", genero: "Drama", ano: 2002 },
  { id: 3, titulo: "Parasita", tipo: "Filme", genero: "Suspense", ano: 2019 },
  { id: 4, titulo: "O Auto da Compadecida", tipo: "Filme", genero: "Comédia", ano: 2000 },
  { id: 5, titulo: "A Origem", tipo: "Filme", genero: "Ficção", ano: 2010 },
  { id: 6, titulo: "Breaking Bad", tipo: "Série", genero: "Drama", ano: 2008 },
  { id: 7, titulo: "Stranger Things", tipo: "Série", genero: "Ficção", ano: 2016 },
  { id: 8, titulo: "Dark", tipo: "Série", genero: "Ficção", ano: 2017 },
  { id: 9, titulo: "La Casa de Papel", tipo: "Série", genero: "Ação", ano: 2017 },
  { id: 10, titulo: "The Office", tipo: "Série", genero: "Comédia", ano: 2005 },
];

// ===== Estado (salvo no navegador com localStorage) =====
// extras: títulos adicionados pelo usuário | dados: { [id]: { nota, assistido } }
let estado = carregar();
let abaAtual = "catalogo";

function carregar() {
  try {
    return JSON.parse(localStorage.getItem("cineteca")) || { extras: [], dados: {} };
  } catch {
    return { extras: [], dados: {} };
  }
}
function salvar() {
  try { localStorage.setItem("cineteca", JSON.stringify(estado)); } catch {}
}

const todos = () => [...TITULOS_BASE, ...estado.extras];
const dadosDe = (id) => estado.dados[id] || { nota: 0, assistido: false };

// Gera uma cor estável a partir do título (cada pôster tem sua cor)
function corDoTitulo(texto) {
  let h = 0;
  for (const c of texto) h = (h * 31 + c.charCodeAt(0)) % 360;
  return `linear-gradient(160deg, hsl(${h} 60% 42%), hsl(${(h + 50) % 360} 55% 22%))`;
}
// Evita que texto digitado vire HTML
function esc(txt) {
  const d = document.createElement("div");
  d.textContent = txt;
  return d.innerHTML;
}

// ===== Elementos =====
const lista = document.getElementById("lista");
const vazio = document.getElementById("vazio");
const busca = document.getElementById("busca");
const tipo = document.getElementById("tipo");
const detalhe = document.getElementById("detalhe");
const novo = document.getElementById("novo");

// ===== Renderização =====
function render() {
  const termo = busca.value.trim().toLowerCase();
  let itens = todos().filter((t) =>
    (!tipo.value || t.tipo === tipo.value) &&
    (t.titulo + " " + t.genero).toLowerCase().includes(termo)
  );

  if (abaAtual === "ranking") {
    itens = itens.filter((t) => dadosDe(t.id).nota > 0)
                 .sort((a, b) => dadosDe(b.id).nota - dadosDe(a.id).nota);
  } else if (abaAtual === "assistidos") {
    itens = itens.filter((t) => dadosDe(t.id).assistido);
  }

  lista.innerHTML = itens.map((t, i) => {
    const d = dadosDe(t.id);
    const posicao = abaAtual === "ranking" ? `${i + 1}º · ` : "";
    return `
      <button class="card" data-id="${t.id}">
        <div class="poster" style="background:${corDoTitulo(t.titulo)}">
          ${esc(t.titulo)}<small>${esc(t.genero)}</small>
        </div>
        <div class="info"><span>${posicao}${t.tipo} · ${t.ano}</span>
          <span class="estrela">${d.nota ? "★ " + d.nota : ""}</span></div>
      </button>`;
  }).join("");

  const mensagens = {
    catalogo: "Nenhum título encontrado. Tente outra busca.",
    ranking: "Ainda não há títulos avaliados. Abra um título e dê uma nota.",
    assistidos: "Você ainda não marcou nenhum título como assistido.",
  };
  vazio.hidden = itens.length > 0;
  vazio.textContent = mensagens[abaAtual];
}

function abrirDetalhe(id) {
  const t = todos().find((x) => x.id === id);
  const d = dadosDe(id);
  const ehExtra = estado.extras.some((x) => x.id === id);
  detalhe.innerHTML = `
    <h2>${esc(t.titulo)}</h2>
    <p class="meta">${t.tipo} · ${esc(t.genero)} · ${t.ano}</p>
    <div>Sua nota</div>
    <div class="estrelas">
      ${[1, 2, 3, 4, 5].map((n) =>
        `<button data-nota="${n}" class="${n <= d.nota ? "on" : ""}" aria-label="${n} estrelas">★</button>`).join("")}
    </div>
    <div class="acoes">
      ${ehExtra ? `<button data-acao="remover">Remover</button>` : ""}
      <button data-acao="assistido" class="${d.assistido ? "marcado" : ""}">
        ${d.assistido ? "Assistido" : "Marcar como assistido"}</button>
      <button data-acao="fechar" class="primario">Fechar</button>
    </div>`;
  detalhe.dataset.id = id;
  if (!detalhe.open) detalhe.showModal();
}

// ===== Eventos =====
lista.addEventListener("click", (e) => {
  const card = e.target.closest(".card");
  if (card) abrirDetalhe(Number(card.dataset.id));
});

detalhe.addEventListener("click", (e) => {
  const id = Number(detalhe.dataset.id);
  const dados = { ...dadosDe(id) };
  const nota = e.target.dataset.nota;
  const acao = e.target.dataset.acao;

  if (nota) {
    // Clicar na mesma nota de novo remove a avaliação
    dados.nota = dados.nota === Number(nota) ? 0 : Number(nota);
  } else if (acao === "assistido") {
    dados.assistido = !dados.assistido;
  } else if (acao === "remover") {
    estado.extras = estado.extras.filter((x) => x.id !== id);
    delete estado.dados[id];
    salvar(); detalhe.close(); render();
    return;
  } else if (acao === "fechar") {
    detalhe.close();
    return;
  } else {
    return;
  }
  estado.dados[id] = dados;
  salvar(); abrirDetalhe(id); render();
});

document.getElementById("abas").addEventListener("click", (e) => {
  if (!e.target.dataset.aba) return;
  abaAtual = e.target.dataset.aba;
  document.querySelectorAll(".aba").forEach((b) => b.classList.toggle("ativa", b === e.target));
  render();
});

busca.addEventListener("input", render);
tipo.addEventListener("change", render);
document.getElementById("btnNovo").addEventListener("click", () => novo.showModal());

document.getElementById("formNovo").addEventListener("submit", (e) => {
  if (e.submitter.value !== "ok") return;
  const f = new FormData(e.target);
  estado.extras.push({
    id: Date.now(),
    titulo: f.get("titulo").trim(),
    tipo: f.get("tipo"),
    genero: f.get("genero").trim(),
    ano: Number(f.get("ano")),
  });
  salvar(); e.target.reset(); render();
});

render();
