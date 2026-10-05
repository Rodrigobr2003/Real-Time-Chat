import { MessageCircle } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import {
  Card,
  CardHeader,
  CenteredPage,
  FooterText,
  Form,
  Logo,
} from "../components/ui/Card";
import { FieldError, Input, Label } from "../components/ui/Input";
import { PasswordInput } from "../components/ui/PasswordInput";
import { useAuth } from "../hooks/useAuth";
import { getApiErrors } from "../utils/apiErrors";

export default function Login() {
  const navigate = useNavigate();
  const [userOrEmail, setUserOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const { loginMutation, isLoginPending: isPending } = useAuth();

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    loginMutation(
      { userOrEmail: userOrEmail.trim(), password },
      {
        onSuccess: () => navigate("/home", { replace: true }),
        onError: (err) => setError(getApiErrors(err).message),
      },
    );
  }

  return (
    <CenteredPage>
      <Card>
        <CardHeader>
          <Logo>
            <MessageCircle size={28} />
          </Logo>
          <h1>Real Time Chat</h1>
          <p>Converse em tempo real entre duas máquinas</p>
        </CardHeader>

        <Form onSubmit={handleSubmit}>
          <Label>
            Usuário ou e-mail
            <Input
              placeholder="Seu usuário ou e-mail"
              value={userOrEmail}
              onChange={(event) => {
                setUserOrEmail(event.target.value);
                setError("");
              }}
              autoFocus
            />
          </Label>
          <Label>
            Senha
            <PasswordInput
              placeholder="Sua senha"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setError("");
              }}
            />
          </Label>

          {error && <FieldError role="alert">{error}</FieldError>}

          <Button
            type="submit"
            $fullWidth
            disabled={!userOrEmail.trim() || !password || isPending}
          >
            {isPending ? "Entrando..." : "Entrar"}
          </Button>
        </Form>

        <FooterText>
          Ainda não tem perfil? <Link to="/register">Criar novo perfil</Link>
        </FooterText>
      </Card>
    </CenteredPage>
  );
}
