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
import { Input, Label } from "../components/ui/Input";
import { PasswordInput } from "../components/ui/PasswordInput";

export default function Login() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    navigate("/home");
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
            Usuário
            <Input
              placeholder="Ex: Máquina A"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoFocus
            />
          </Label>
          <Label>
            Senha
            <PasswordInput
              placeholder="Sua senha"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </Label>
          <Button type="submit" $fullWidth disabled={!name.trim() || !password}>
            Entrar
          </Button>
        </Form>

        <FooterText>
          Ainda não tem perfil? <Link to="/register">Criar novo perfil</Link>
        </FooterText>
      </Card>
    </CenteredPage>
  );
}
