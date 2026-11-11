import { useEffect, useRef, useState } from "react";
import styled from "styled-components";

type LiveWaveformProps = {
  stream: MediaStream;
  paused: boolean;
};

const SAMPLE_INTERVAL_MS = 90;
const BAR_WIDTH = 3;
const BAR_GAP = 2;
const MIN_BAR_HEIGHT = 3;
const MAX_BAR_HEIGHT = 24;

const Container = styled.div`
  flex: 1;
  min-width: 0;
  height: 28px;
  display: flex;
  align-items: center;
  overflow: hidden;
`;

const Bars = styled.div`
  display: flex;
  align-items: center;
  gap: ${BAR_GAP}px;
  flex-shrink: 0;
`;

const Bar = styled.span`
  width: ${BAR_WIDTH}px;
  flex-shrink: 0;
  border-radius: 2px;
  background: ${({ theme }) => theme.colors.textMuted};
`;

const Dots = styled.span`
  flex: 1;
  min-width: 0;
  height: 3px;
  margin-left: ${BAR_GAP}px;
  background-image: radial-gradient(
    circle,
    ${({ theme }) => theme.colors.textMuted} 1px,
    transparent 1.5px
  );
  background-size: ${BAR_WIDTH + BAR_GAP}px 3px;
  background-repeat: repeat-x;
  opacity: 0.6;
`;

const readLevel = (analyser: AnalyserNode, buffer: Uint8Array<ArrayBuffer>) => {
  analyser.getByteTimeDomainData(buffer);

  let sum = 0;

  for (const value of buffer) {
    const sample = (value - 128) / 128;
    sum += sample * sample;
  }

  return Math.min(1, Math.sqrt(sum / buffer.length) * 4);
};

export function LiveWaveform({ stream, paused }: LiveWaveformProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const [levels, setLevels] = useState<number[]>([]);
  const [maxBars, setMaxBars] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(([entry]) =>
      setMaxBars(
        Math.floor(entry.contentRect.width / (BAR_WIDTH + BAR_GAP)) - 2,
      ),
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const context = new AudioContext();
    const analyser = context.createAnalyser();

    analyser.fftSize = 1024;
    context.createMediaStreamSource(stream).connect(analyser);
    analyserRef.current = analyser;

    return () => {
      analyserRef.current = null;
      context.close();
    };
  }, [stream]);

  useEffect(() => {
    if (paused) return;

    const buffer = new Uint8Array(1024);
    const timer = window.setInterval(() => {
      const analyser = analyserRef.current;
      if (!analyser) return;

      const level = readLevel(analyser, buffer);
      setLevels((current) => [...current.slice(-500), level]);
    }, SAMPLE_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [paused]);

  const visible = maxBars > 0 ? levels.slice(-maxBars) : [];

  return (
    <Container ref={containerRef} aria-hidden="true">
      <Bars>
        {visible.map((level, index) => (
          <Bar
            key={levels.length - visible.length + index}
            style={{
              height: MIN_BAR_HEIGHT + level * (MAX_BAR_HEIGHT - MIN_BAR_HEIGHT),
            }}
          />
        ))}
      </Bars>
      <Dots />
    </Container>
  );
}
