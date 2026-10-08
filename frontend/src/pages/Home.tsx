import { MessagesSquare, UserRound } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { ProfileTab } from "../components/profile/ProfileTab";
import { RoomsTab } from "../components/rooms/RoomsTab";
import { Card, CenteredPage } from "../components/ui/Card";
import { Tab, Tabs } from "../components/ui/Tabs";
import { useAuth } from "../hooks/useAuth";
import type { IPublicUser } from "../model/userModel";
import { mockProfile, type Profile } from "../mocks/profile";

type HomeTab = "rooms" | "profile";

const HomeCard = styled(Card)`
  max-width: 480px;
  height: min(720px, calc(100dvh - 48px));
  gap: 20px;
`;

const toProfile = (user: IPublicUser | null): Profile =>
  user
    ? {
        ...mockProfile,
        name: user.name,
        username: user.user,
        email: user.email,
        bio: user.description,
        status: user.status,
        accentColor: user.profileBgColor,
        photoURL: user.userPhotoURL,
        memberSince: new Date(user.createdAt).toLocaleDateString("pt-BR", {
          month: "long",
          year: "numeric",
        }),
      }
    : mockProfile;

export default function Home() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<HomeTab>("rooms");
  const { user, logoutMutation, isLogoutPending } = useAuth();
  const profile = toProfile(user);

  function handleLogout() {
    logoutMutation(undefined, {
      onSuccess: () => navigate("/", { replace: true }),
    });
  }

  return (
    <CenteredPage>
      <HomeCard>
        <Tabs role="tablist">
          <Tab
            role="tab"
            aria-selected={activeTab === "rooms"}
            $active={activeTab === "rooms"}
            onClick={() => setActiveTab("rooms")}
          >
            <MessagesSquare size={16} />
            Salas
          </Tab>
          <Tab
            role="tab"
            aria-selected={activeTab === "profile"}
            $active={activeTab === "profile"}
            onClick={() => setActiveTab("profile")}
          >
            <UserRound size={16} />
            Perfil
          </Tab>
        </Tabs>

        {activeTab === "rooms" ? (
          <RoomsTab />
        ) : (
          <ProfileTab
            profile={profile}
            onLogout={handleLogout}
            isLoggingOut={isLogoutPending}
          />
        )}
      </HomeCard>
    </CenteredPage>
  );
}
