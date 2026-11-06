import { Redirect, Route, Switch, useParams } from 'wouter';
import { lvtPath } from '../application/lvtRoutes';
import { NotFoundPage } from '../pages/NotFoundPage';
import { DecisionNotesPage } from '../pages/DecisionNotesPage';
import { EvidencePage } from '../pages/EvidencePage';
import { ExportBoardPackPage } from '../pages/ExportBoardPackPage';
import { GoalsPage } from '../pages/GoalsPage';
import { OrganisationPage } from '../pages/OrganisationPage';
import { ProductsPage } from '../pages/ProductsPage';
import { SteeringOverviewPage } from '../pages/SteeringOverviewPage';
import { TechnicalFitnessPage } from '../pages/TechnicalFitnessPage';
import { TechnicalHubPage } from '../pages/TechnicalHubPage';
import { TechnicalImportPage } from '../pages/TechnicalImportPage';
import { TechnicalTreePage } from '../pages/TechnicalTreePage';
import { TechnicalVocabularyPage } from '../pages/TechnicalVocabularyPage';
import { WorkspaceDiffPage } from '../pages/WorkspaceDiffPage';
import { WorkspaceHomePage } from '../pages/WorkspaceHomePage';
import { WorkspaceSessionProvider } from './WorkspaceSession';
import { WorkspaceShell } from './WorkspaceShell';

function BetToLvtRedirect() {
  const params = useParams<{ betId: string }>();
  return <Redirect to={lvtPath('bet', params.betId || 'vision')} />;
}

function WorkspaceRoutes() {
  return (
    <Switch>
      <Route path="/workspace" component={WorkspaceHomePage} />
      <Route path="/workspace/steering" component={SteeringOverviewPage} />
      <Route path="/workspace/lvt/:hierarchyType/:slug" component={GoalsPage} />
      <Route path="/workspace/lvt" component={GoalsPage} />
      <Route path="/workspace/goals">
        <Redirect to="/workspace/lvt" />
      </Route>
      <Route path="/workspace/products" component={ProductsPage} />
      <Route path="/workspace/outcomes">
        <Redirect to="/workspace/lvt" />
      </Route>
      <Route path="/workspace/evidence" component={EvidencePage} />
      <Route path="/workspace/organisation" component={OrganisationPage} />
      <Route path="/workspace/decisions" component={DecisionNotesPage} />
      <Route path="/workspace/diff" component={WorkspaceDiffPage} />
      <Route path="/workspace/export" component={ExportBoardPackPage} />
      <Route path="/workspace/technical/tree" component={TechnicalTreePage} />
      <Route path="/workspace/technical/fitness" component={TechnicalFitnessPage} />
      <Route path="/workspace/technical/vocabulary" component={TechnicalVocabularyPage} />
      <Route path="/workspace/technical/import" component={TechnicalImportPage} />
      <Route path="/workspace/technical" component={TechnicalHubPage} />
      <Route path="/workspace/bets/:betId" component={BetToLvtRedirect} />
      <Route>
        <NotFoundPage />
      </Route>
    </Switch>
  );
}

export function WorkspaceApp() {
  return (
    <WorkspaceSessionProvider>
      <WorkspaceShell>
        <WorkspaceRoutes />
      </WorkspaceShell>
    </WorkspaceSessionProvider>
  );
}
