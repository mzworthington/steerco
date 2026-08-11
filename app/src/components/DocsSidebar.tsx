import { docsNavSections } from '../docs/pages';
import { NavDrawerClose } from './NavDrawerChrome';

const DOC_NAV_SECTIONS = docsNavSections();

type DocsSidebarProps = {
  activeHref: string;
  open: boolean;
  onNavigate: () => void;
  id: string;
  showClose: boolean;
  isInert?: boolean;
};

export function DocsSidebar({
  activeHref,
  open,
  onNavigate,
  id,
  showClose,
  isInert = false,
}: DocsSidebarProps) {
  return (
    <aside
      id={id}
      className={open ? 'docs-sidebar is-open' : 'docs-sidebar'}
      aria-label="Documentation"
      data-testid="docs-nav-drawer"
      inert={isInert || undefined}
    >
      <div className="docs-sidebar-top">
        <h2 className="docs-sidebar-title">Documentation</h2>
        {showClose ? <NavDrawerClose onClose={onNavigate} /> : null}
      </div>
      <div className="docs-nav-sections">
        {DOC_NAV_SECTIONS.map((section) => (
          <nav key={section.id} className="docs-nav-section" aria-label={section.title}>
            <h3 className="docs-nav-section-title">{section.title}</h3>
            <ul className="docs-nav">
              {section.entries.map((entry) => (
                <li key={entry.href}>
                  <a
                    href={entry.href}
                    aria-current={entry.href === activeHref ? 'page' : undefined}
                    onClick={onNavigate}
                  >
                    {entry.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
    </aside>
  );
}
