import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "styled-components";
import Chat from "./pages/Chat";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { GlobalStyle } from "./styles/GlobalStyle";
import { theme } from "./styles/theme";
import { GlobalContexts } from "./context/globalContexts";
import { PrivateRoute } from "./components/routes/PrivateRoute";
import { PublicOnlyRoute } from "./components/routes/PublicOnlyRoute";

function App() {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <GlobalContexts>
        <BrowserRouter>
          <Routes>
            <Route element={<PublicOnlyRoute />}>
              <Route path="/" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Route>

            <Route element={<PrivateRoute />}>
              <Route path="/home" element={<Home />} />
              <Route path="/chat/:roomId" element={<Chat />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </GlobalContexts>
    </ThemeProvider>
  );
}

export default App;
