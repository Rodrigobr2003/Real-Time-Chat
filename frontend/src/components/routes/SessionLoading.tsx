import { CenteredPage } from "../ui/Card";

export function SessionLoading() {
  return (
    <CenteredPage aria-busy="true">
      <p>Carregando...</p>
    </CenteredPage>
  );
}
