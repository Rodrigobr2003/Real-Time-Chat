import { Mic, Pause, Play, Square, Trash2 } from "lucide-react";
import styled, { css, keyframes } from "styled-components";
import { useAudioPlayback } from "../../hooks/useAudioPlayback";
import type { RecorderStatus } from "../../hooks/useAudioRecorder";
import {
  formatDuration,
  formatFileSize,
  getAttachmentSection,
} from "../../utils/attachments";
import { LiveWaveform } from "./LiveWaveform";

type VoiceRecorderBarProps = {
  status: RecorderStatus;
  seconds: number;
  stream: MediaStream | null;
  audio: File | null;
  getPreview: () => Blob | null;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onDiscard: () => void;
};

const pulse = keyframes`
  50% {
    opacity: 0.3;
  }
`;

const Bar = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  height: 44px;
  padding: 0 6px;
  border-radius: ${({ theme }) => theme.radius.full};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surfaceAlt};
`;

const Dot = styled.span<{ $active: boolean }>`
  flex-shrink: 0;
  width: 10px;
  height: 10px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ $active, theme }) =>
    $active ? theme.colors.danger : theme.colors.textMuted};

  ${({ $active }) =>
    $active &&
    css`
      animation: ${pulse} 1.2s ease-in-out infinite;
    `}
`;

const AudioIcon = styled.span<{ $color: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 30px;
  height: 30px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ $color }) => $color};
  color: #fff;
`;

const Label = styled.span`
  flex: 1;
  min-width: 0;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  small {
    margin-left: 6px;
    font-size: 12px;
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

const Timer = styled.span`
  flex-shrink: 0;
  min-width: 34px;
  font-size: 15px;
  font-variant-numeric: tabular-nums;
  color: ${({ theme }) => theme.colors.text};
`;

const Action = styled.button<{ $danger?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: ${({ theme }) => theme.radius.full};
  color: ${({ $danger, theme }) =>
    $danger ? theme.colors.danger : theme.colors.textMuted};
  transition:
    color 0.2s,
    background 0.2s;

  &:hover {
    color: ${({ $danger, theme }) =>
      $danger ? theme.colors.danger : theme.colors.text};
    background: ${({ theme }) => theme.colors.surface};
  }
`;

export function VoiceRecorderBar({
  status,
  seconds,
  stream,
  audio,
  getPreview,
  onPause,
  onResume,
  onStop,
  onDiscard,
}: VoiceRecorderBarProps) {
  const playback = useAudioPlayback();

  const playButton = (source: () => Blob | null) => (
    <Action
      type="button"
      onClick={() => (playback.isPlaying ? playback.stop() : playback.play(source()))}
      aria-label={playback.isPlaying ? "Parar reprodução" : "Ouvir áudio"}
      title={playback.isPlaying ? "Parar" : "Ouvir"}
    >
      {playback.isPlaying ? <Pause size={16} /> : <Play size={16} />}
    </Action>
  );

  function discard() {
    playback.stop();
    onDiscard();
  }

  if (audio) {
    const section = getAttachmentSection(audio.name);

    return (
      <Bar>
        <AudioIcon $color={section.color} title={section.label}>
          <section.icon size={16} />
        </AudioIcon>
        <Label>
          Áudio gravado
          <small>
            {formatDuration(seconds)} · {formatFileSize(audio.size)}
          </small>
        </Label>
        {playButton(() => audio)}
        <Action
          type="button"
          $danger
          onClick={discard}
          aria-label="Descartar áudio"
          title="Descartar"
        >
          <Trash2 size={16} />
        </Action>
      </Bar>
    );
  }

  const isRecording = status === "recording";

  return (
    <Bar role="status" aria-live="polite">
      <Action
        type="button"
        onClick={discard}
        aria-label="Descartar gravação"
        title="Descartar"
      >
        <Trash2 size={18} />
      </Action>
      <Dot $active={isRecording} />
      <Timer>{formatDuration(seconds)}</Timer>
      {stream ? (
        <LiveWaveform key={stream.id} stream={stream} paused={!isRecording} />
      ) : (
        <Label>{isRecording ? "Gravando" : "Pausado"}</Label>
      )}
      {!isRecording && playButton(getPreview)}
      <Action
        type="button"
        $danger
        onClick={() => {
          if (isRecording) return onPause();
          playback.stop();
          onResume();
        }}
        aria-label={isRecording ? "Pausar gravação" : "Continuar gravação"}
        title={isRecording ? "Pausar" : "Continuar"}
      >
        {isRecording ? <Pause size={16} /> : <Mic size={16} />}
      </Action>
      <Action
        type="button"
        onClick={() => {
          playback.stop();
          onStop();
        }}
        aria-label="Encerrar gravação"
        title="Encerrar"
      >
        <Square size={14} fill="currentColor" />
      </Action>
    </Bar>
  );
}
