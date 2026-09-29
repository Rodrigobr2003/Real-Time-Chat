import { UserPlus } from "lucide-react";
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

export default function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    navigate("/");
  }

  return (
    <CenteredPage>
      <Card>
        <CardHeader>
          <Logo>
            <UserPlus size={28} />
          </Logo>
          <h1>Criar perfil</h1>
          <p>Escolha um nome e uma senha para esta máquina</p>
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
            E-mail
            <Input
              placeholder="Ex: Máquina A"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoFocus
            />
          </Label>

          <Label>
            Senha
            <PasswordInput
              placeholder="Crie uma senha"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </Label>
          <Label>
            Confirmar senha
            <PasswordInput
              placeholder="Repita a senha"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </Label>
          <Button
            type="submit"
            $fullWidth
            disabled={!name.trim() || !password || password !== confirmPassword}
          >
            Criar perfil
          </Button>
        </Form>

        <FooterText>
          Já tem perfil? <Link to="/">Entrar</Link>
        </FooterText>
      </Card>
    </CenteredPage>
  );
}
