export default function Doc({ title, updated, children }) {
  return (
    <div className="wrap doc">
      <div className="eyebrow">Lapstack</div>
      <h1>{title}</h1>
      {updated ? <p className="upd">Last updated {updated}</p> : null}
      {children}
    </div>
  );
}
