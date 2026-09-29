import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "styled-components";
import Chat from "./pages/Chat";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { GlobalStyle } from "./styles/GlobalStyle";
import { theme } from "./styles/theme";

function App() {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/home" element={<Home />} />
          <Route path="/chat/:roomId" element={<Chat />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
