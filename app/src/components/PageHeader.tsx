import type { ReactNode } from 'react';

type Props = {
  eyebrow: string;
  title: string;
  framing?: ReactNode;
  action?: ReactNode;
};

export function PageHeader({ eyebrow, title, framing, action }: Props) {
  return (
    <header className="page-header">
      <div className="page-header-copy">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="page-header-title">{title}</h1>
        {framing ? <div className="page-header-framing">{framing}</div> : null}
      </div>
      {action ? <div className="page-header-action">{action}</div> : null}
    </header>
  );
}
