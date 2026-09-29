import { createGlobalStyle } from "styled-components";

export const GlobalStyle = createGlobalStyle`
  *,
  *::before,
  *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html,
  body,
  #root {
    height: 100%;
  }

  body {
    font-family: "Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    background: ${({ theme }) => theme.colors.background};
    color: ${({ theme }) => theme.colors.text};
    -webkit-font-smoothing: antialiased;
  }

  button,
  input,
  textarea {
    font: inherit;
    color: inherit;
  }

  button {
    cursor: pointer;
    border: none;
    background: none;
  }

  ::-webkit-scrollbar {
    width: 8px;
  }

  ::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.border};
    border-radius: 999px;
  }
`;
