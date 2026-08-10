import { docsNavSections } from '../docs/pages';

const DOC_NAV_SECTIONS = docsNavSections();

type DocsSidebarProps = {
  activeHref: string;
};

export function DocsSidebar({ activeHref }: DocsSidebarProps) {
  return (
    <aside className="docs-sidebar">
      <h2 className="docs-sidebar-title">Documentation</h2>
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
