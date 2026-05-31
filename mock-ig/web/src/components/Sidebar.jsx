import React from "react";

// Sidebar de navegacao estilo Instagram web desktop. Itens decorativos
// (Pesquisa, Mensagens, etc.) ficam inertes; Feed e Reels trocam a view.
const ICONS = {
  home: "M2 12 12 3l10 9M5 10v10h5v-6h4v6h5V10",
  search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14ZM21 21l-4.3-4.3",
  explore: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm3.5 6.5-2 5-5 2 2-5 5-2Z",
  reels: "M3 3h18v18H3zM3 9h18M9 3 7 9m6-6-2 6m6-6-2 6M10 13l4 2.5L10 18z",
  msg: "M4 4h16v12H7l-3 3V4Z",
  heart: "M12 21s-7-4.5-9.5-9A5 5 0 0 1 12 6a5 5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9Z",
  create: "M4 12h16M12 4v16",
  profile: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21a8 8 0 0 1 16 0",
  more: "M4 7h16M4 12h16M4 17h16",
  lab: "M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3",
};

function Icon({ d, active }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none"
      stroke="currentColor" strokeWidth={active ? 2.4 : 1.7}
      strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

export default function Sidebar({ tab, onTab, reels, onFail, onReset }) {
  const Item = ({ icon, label, active, onClick, badge }) => (
    <button className={"nav-item" + (active ? " active" : "")} onClick={onClick}>
      <span className="nav-ico"><Icon d={ICONS[icon]} active={active} />{badge ? <i className="dot" /> : null}</span>
      <span className="nav-label">{label}</span>
    </button>
  );

  return (
    <aside className="ig-side">
      <div className="logo">smufdpj</div>
      <nav className="nav">
        <Item icon="home" label="Pagina inicial" active={tab === "feed"} onClick={() => onTab("feed")} />
        <Item icon="search" label="Pesquisa" />
        <Item icon="explore" label="Explorar" />
        <Item icon="reels" label="Reels" active={tab === "reels"} onClick={() => onTab("reels")} badge={reels > 0} />
        <Item icon="lab" label="Simulador" active={tab === "lab"} onClick={() => onTab("lab")} />
        <Item icon="msg" label="Mensagens" />
        <Item icon="heart" label="Notificacoes" />
        <Item icon="create" label="Criar" />
        <Item icon="profile" label="Perfil" />
      </nav>
      <div className="nav-foot">
        <Item icon="more" label="Simular erro" onClick={onFail} />
        <button className="nav-item ghost" onClick={onReset}>
          <span className="nav-ico"><Icon d="M4 4v6h6M20 20v-6h-6M20 9a8 8 0 0 0-15-1M4 15a8 8 0 0 0 15 1" /></span>
          <span className="nav-label">Limpar mock</span>
        </button>
      </div>
    </aside>
  );
}
