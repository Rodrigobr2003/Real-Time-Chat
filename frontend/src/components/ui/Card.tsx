import styled from "styled-components";

export const CenteredPage = styled.main`
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  background: radial-gradient(
    circle at top,
    rgba(108, 92, 231, 0.18),
    transparent 60%
  );
`;

export const Card = styled.section`
  width: 100%;
  max-width: 420px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 32px;
  border-radius: ${({ theme }) => theme.radius.lg};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  box-shadow: ${({ theme }) => theme.shadow};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 24px;
  }
`;

export const CardHeader = styled.header`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  text-align: center;

  h1 {
    font-size: 24px;
  }

  p {
    font-size: 14px;
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

export const Logo = styled.div`
  width: 56px;
  height: 56px;
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  margin-bottom: 8px;
`;

export const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

export const FooterText = styled.p`
  text-align: center;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textMuted};

  a {
    color: ${({ theme }) => theme.colors.primary};
    font-weight: 600;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
`;
