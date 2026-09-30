import { UserPlus } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import styled from "styled-components";
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
import { useUser } from "../hooks/useUser";
import { getApiErrors } from "../utils/apiErrors";
import {
  validateRegister,
  type RegisterErrors,
  type RegisterForm,
} from "../utils/userValidation";

// Agrupa o input e a mensagem de erro com 8px entre eles.
const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

// O 409 do backend só traz a mensagem; o campo é identificado pelo texto.
const getConflictErrors = (message: string): RegisterErrors => {
  const text = message.toLowerCase();
  const errors: RegisterErrors = {};

  if (text.includes("email")) errors.email = "Este e-mail já está cadastrado";
  if (text.includes("usuário"))
    errors.user = "Este nome de usuário já está em uso";

  return errors;
};

export default function Register() {
  const navigate = useNavigate();
  const { userDTO, applyDTOChanges, createUserMutation, isCreationPending } =
    useUser();
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [formError, setFormError] = useState("");

  function handleChange(field: keyof RegisterForm, value: string) {
    if (field === "confirmPassword") setConfirmPassword(value);
    else applyDTOChanges(field, value);

    // Limpa o erro do campo assim que o usuário volta a digitar.
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError("");

    const { data, errors } = validateRegister({ ...userDTO, confirmPassword });
    setErrors(errors);
    if (!data) return;

    createUserMutation(data, {
      onSuccess: () => {
        setConfirmPassword("");
        navigate("/", { replace: true });
      },
      onError: (error) => {
        const { message, fields } = getApiErrors(error);
        const fieldErrors =
          fields && Object.keys(fields).length > 0
            ? fields
            : getConflictErrors(message);

        if (Object.keys(fieldErrors).length > 0) setErrors(fieldErrors);
        else setFormError(message);
      },
    });
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

        <Form onSubmit={handleSubmit} noValidate>
          <Label>
            Usuário
            <FieldGroup>
              <Input
                placeholder="Insira seu nome de usuário"
                value={userDTO.user}
                onChange={(event) => handleChange("user", event.target.value)}
                aria-invalid={!!errors.user}
                autoFocus
              />
              {errors.user && <FieldError>{errors.user}</FieldError>}
            </FieldGroup>
          </Label>

          <Label>
            Nome Verdadeiro
            <FieldGroup>
              <Input
                placeholder="Insira seu nome verdadeiro"
                value={userDTO.name}
                onChange={(event) => handleChange("name", event.target.value)}
                aria-invalid={!!errors.name}
              />
              {errors.name && <FieldError>{errors.name}</FieldError>}
            </FieldGroup>
          </Label>

          <Label>
            E-mail
            <FieldGroup>
              <Input
                type="email"
                placeholder="Insira um e-mail"
                value={userDTO.email}
                onChange={(event) => handleChange("email", event.target.value)}
                aria-invalid={!!errors.email}
              />
              {errors.email && <FieldError>{errors.email}</FieldError>}
            </FieldGroup>
          </Label>

          <Label>
            Senha
            <FieldGroup>
              <PasswordInput
                placeholder="Crie uma senha"
                value={userDTO.password}
                onChange={(event) =>
                  handleChange("password", event.target.value)
                }
                aria-invalid={!!errors.password}
              />
              {errors.password && <FieldError>{errors.password}</FieldError>}
            </FieldGroup>
          </Label>

          <Label>
            Confirmar senha
            <FieldGroup>
              <PasswordInput
                placeholder="Repita a senha"
                value={confirmPassword}
                onChange={(event) =>
                  handleChange("confirmPassword", event.target.value)
                }
                aria-invalid={!!errors.confirmPassword}
              />
              {errors.confirmPassword && (
                <FieldError>{errors.confirmPassword}</FieldError>
              )}
            </FieldGroup>
          </Label>

          {formError && <FieldError role="alert">{formError}</FieldError>}

          <Button type="submit" $fullWidth disabled={isCreationPending}>
            {isCreationPending ? "Criando..." : "Criar perfil"}
          </Button>
        </Form>

        <FooterText>
          Já tem perfil? <Link to="/">Entrar</Link>
        </FooterText>
      </Card>
    </CenteredPage>
  );
}
