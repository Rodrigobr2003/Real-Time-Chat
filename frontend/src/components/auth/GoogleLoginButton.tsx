import { GoogleLogin } from "@react-oauth/google";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { useAuth } from "../../hooks/useAuth";
import { getApiErrors } from "../../utils/apiErrors";
import { GOOGLE_CLIENT_ID } from "../../utils/googleAuth";

type GoogleLoginButtonProps = {
  text?: "signin_with" | "signup_with" | "continue_with";
  onError: (message: string) => void;
};

const MAX_BUTTON_WIDTH = 400;

const Divider = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: ${({ theme }) => theme.colors.textMuted};

  &::before,
  &::after {
    content: "";
    flex: 1;
    height: 1px;
    background: ${({ theme }) => theme.colors.border};
  }
`;

const LABELS = {
  signin_with: "Entrar com o Google",
  signup_with: "Cadastrar com o Google",
  continue_with: "Continuar com o Google",
};

const ButtonArea = styled.div<{ $pending: boolean }>`
  position: relative;
  height: 44px;
  opacity: ${({ $pending }) => ($pending ? 0.5 : 1)};
  pointer-events: ${({ $pending }) => ($pending ? "none" : "auto")};
  transition: opacity 0.2s;

  &:hover > span {
    background: ${({ theme }) => theme.colors.surfaceAlt};
    border-color: ${({ theme }) => theme.colors.textMuted};
  }

  &:active > span {
    transform: scale(0.99);
  }
`;

const Face = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  height: 100%;
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.text};
  font-size: 14px;
  font-weight: 600;
  transition:
    background 0.2s,
    border-color 0.2s,
    transform 0.1s;
`;

const HiddenGoogle = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  opacity: 0.0001;
`;

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

export function GoogleLoginButton({
  text = "continue_with",
  onError,
}: GoogleLoginButtonProps) {
  const navigate = useNavigate();
  const { googleLoginMutation, isGoogleLoginPending } = useAuth();
  const areaRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number>();

  useEffect(() => {
    const area = areaRef.current;
    if (!area) return;

    const observer = new ResizeObserver(([entry]) =>
      setWidth(
        Math.min(Math.floor(entry.contentRect.width), MAX_BUTTON_WIDTH),
      ),
    );

    observer.observe(area);
    return () => observer.disconnect();
  }, []);

  if (!GOOGLE_CLIENT_ID) return null;

  function handleCredential(credential: string | undefined) {
    if (!credential) return onError("Não foi possível entrar com o Google");

    googleLoginMutation(credential, {
      onSuccess: () => navigate("/home", { replace: true }),
      onError: (err) => onError(getApiErrors(err).message),
    });
  }

  return (
    <>
      <Divider>ou</Divider>
      <ButtonArea
        ref={areaRef}
        $pending={isGoogleLoginPending}
        aria-busy={isGoogleLoginPending}
      >
        <Face aria-hidden="true">
          <GoogleIcon />
          {isGoogleLoginPending ? "Entrando..." : LABELS[text]}
        </Face>
        <HiddenGoogle>
          {width && (
            <GoogleLogin
              onSuccess={({ credential }) => handleCredential(credential)}
              onError={() => onError("Não foi possível entrar com o Google")}
              size="large"
              text={text}
              width={width}
            />
          )}
        </HiddenGoogle>
      </ButtonArea>
    </>
  );
}
