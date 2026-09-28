import type { DefaultTheme } from "styled-components";
import type { UserStatus } from "../mocks/profile";

export function getStatusColor(theme: DefaultTheme, status: UserStatus) {
  switch (status) {
    case "online":
      return theme.colors.success;
    case "away":
      return theme.colors.warning;
    case "busy":
      return theme.colors.danger;
    default:
      return theme.colors.textMuted;
  }
}
