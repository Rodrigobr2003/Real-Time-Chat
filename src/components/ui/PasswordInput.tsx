import { Eye, EyeOff } from "lucide-react";
import { useState, type ComponentProps } from "react";
import styled from "styled-components";
import { Input } from "./Input";

const Wrapper = styled.div`
  position: relative;

  ${Input} {
    padding-right: 44px;
  }
`;

const ToggleButton = styled.button`
  position: absolute;
  top: 50%;
  right: 8px;
  transform: translateY(-50%);
  display: flex;
  padding: 6px;
  color: ${({ theme }) => theme.colors.textMuted};

  &:hover {
    color: ${({ theme }) => theme.colors.text};
  }
`;

export function PasswordInput(props: Omit<ComponentProps<"input">, "type" | "ref">) {
  const [visible, setVisible] = useState(false);

  return (
    <Wrapper>
      <Input {...props} type={visible ? "text" : "password"} />
      <ToggleButton
        type="button"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
      >
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </ToggleButton>
    </Wrapper>
  );
}
