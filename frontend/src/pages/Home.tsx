import { MessagesSquare, UserRound } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { ProfileTab } from "../components/profile/ProfileTab";
import { RoomsTab } from "../components/rooms/RoomsTab";
import { Card, CenteredPage } from "../components/ui/Card";
import { Tab, Tabs } from "../components/ui/Tabs";
import { useUser } from "../hooks/useUser";
import { mockProfile } from "../mocks/profile";

type HomeTab = "rooms" | "profile";

const HomeCard = styled(Card)`
  max-width: 480px;
  height: min(720px, calc(100dvh - 48px));
  gap: 20px;
`;

export default function Home() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<HomeTab>("rooms");
  const [profile, setProfile] = useState(mockProfile);
  const { logoutMutation, isLogoutPending } = useUser();

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
            onSave={setProfile}
            onLogout={handleLogout}
            isLoggingOut={isLogoutPending}
          />
        )}
      </HomeCard>
    </CenteredPage>
  );
}
