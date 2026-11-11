import { LoaderCircle, Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import styled, { keyframes, useTheme } from "styled-components";
import WaveSurfer from "wavesurfer.js";
import { downloadAttachment } from "../../api/messageHelpers";
import type { IMessageAttachment } from "../../model/messageModel";
import { formatDuration } from "../../utils/attachments";

type VoiceMessageProps = {
  attachment: IMessageAttachment;
  mine: boolean;
};

const WAVE_HEIGHT = 32;
const PROGRESS_DOT_COLOR = "#53bdeb";

let activePlayer: WaveSurfer | null = null;

const spin = keyframes`
  to {
    transform: rotate(360deg);
  }
`;

const Player = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  column-gap: 10px;
  align-items: center;
  width: min(280px, 62vw);
  padding: 4px 2px 0;
  white-space: normal;
`;

const PlayButton = styled.button`
  grid-row: span 2;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  color: inherit;
  border-radius: ${({ theme }) => theme.radius.full};
  transition: background 0.2s;

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.1);
  }

  &:disabled {
    opacity: 0.6;
    cursor: default;
  }

  .spin {
    animation: ${spin} 0.8s linear infinite;
  }
`;

const Track = styled.div`
  position: relative;
  height: ${WAVE_HEIGHT}px;
  min-width: 0;
`;

const Wave = styled.div<{ $hidden: boolean }>`
  position: relative;
  z-index: 0;
  height: 100%;
  opacity: ${({ $hidden }) => ($hidden ? 0 : 1)};
  transition: opacity 0.2s;
  cursor: pointer;
`;

const Placeholder = styled.div<{ $mine: boolean }>`
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image: linear-gradient(
    to right,
    ${({ $mine }) =>
        $mine ? "rgba(255, 255, 255, 0.35)" : "rgba(139, 145, 160, 0.45)"}
      3px,
    transparent 3px
  );
  background-size: 5px 6px;
  background-repeat: repeat-x;
  background-position: left center;
`;

const ProgressDot = styled.span`
  position: absolute;
  top: 50%;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${PROGRESS_DOT_COLOR};
  z-index: 1;
  transform: translate(-50%, -50%);
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.15);
  pointer-events: none;
`;

const Time = styled.span`
  font-size: 11px;
  opacity: 0.75;
  font-variant-numeric: tabular-nums;
`;

export function VoiceMessage({ attachment, mine }: VoiceMessageProps) {
  const theme = useTheme();
  const rootRef = useRef<HTMLDivElement>(null);
  const waveRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<WaveSurfer | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);

  const waveColor = mine ? "rgba(255, 255, 255, 0.45)" : theme.colors.textMuted;
  const progressColor = mine ? "#ffffff" : theme.colors.primary;

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;

      setIsVisible(true);
      observer.disconnect();
    });

    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const container = waveRef.current;
    if (!isVisible || !attachment.url || !container) return;

    let cancelled = false;
    const player = WaveSurfer.create({
      container,
      height: WAVE_HEIGHT,
      waveColor,
      progressColor,
      cursorWidth: 0,
      barWidth: 3,
      barGap: 2,
      barRadius: 3,
      barMinHeight: 3,
      normalize: true,
      dragToSeek: true,
    });

    playerRef.current = player;

    player.on("ready", (total) => {
      setDuration(total);
      setIsReady(true);
    });
    player.on("timeupdate", setCurrent);
    player.on("play", () => {
      if (activePlayer && activePlayer !== player) activePlayer.pause();
      activePlayer = player;
      setIsPlaying(true);
    });
    player.on("pause", () => setIsPlaying(false));
    player.on("finish", () => {
      setIsPlaying(false);
      player.seekTo(0);
    });
    player.on("error", () => setHasFailed(true));

    downloadAttachment(attachment.url)
      .then((blob) => {
        if (!cancelled) return player.loadBlob(blob);
      })
      .catch(() => {
        if (!cancelled) setHasFailed(true);
      });

    return () => {
      cancelled = true;
      if (activePlayer === player) activePlayer = null;
      playerRef.current = null;
      player.destroy();
    };
  }, [isVisible, attachment.url, waveColor, progressColor]);

  const isLoading = !!attachment.url && !isReady && !hasFailed;
  const progress = duration > 0 ? Math.min(1, current / duration) : 0;
  const shownTime = Math.floor(isPlaying || current > 0 ? current : duration);

  return (
    <Player ref={rootRef}>
      <PlayButton
        type="button"
        onClick={() => playerRef.current?.playPause()}
        disabled={!isReady}
        aria-label={isPlaying ? "Pausar áudio" : "Reproduzir áudio"}
        title={hasFailed ? "Não foi possível carregar o áudio" : undefined}
      >
        {isLoading ? (
          <LoaderCircle size={22} className="spin" />
        ) : isPlaying ? (
          <Pause size={24} fill="currentColor" />
        ) : (
          <Play size={24} fill="currentColor" />
        )}
      </PlayButton>
      <Track>
        <Wave ref={waveRef} $hidden={!isReady} />
        {!isReady && <Placeholder $mine={mine} />}
        <ProgressDot style={{ left: `${progress * 100}%` }} />
      </Track>
      <Time>{isReady ? formatDuration(shownTime) : "0:00"}</Time>
    </Player>
  );
}
