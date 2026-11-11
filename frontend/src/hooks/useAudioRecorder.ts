import { useCallback, useEffect, useRef, useState } from "react";

export type RecorderStatus = "idle" | "recording" | "paused";

const FORMATS = [
  { mimeType: "audio/webm;codecs=opus", extension: "weba" },
  { mimeType: "audio/webm", extension: "weba" },
  { mimeType: "audio/mp4", extension: "m4a" },
  { mimeType: "audio/ogg;codecs=opus", extension: "ogg" },
];

const AUDIO_BITS_PER_SECOND = 64_000;
export const RECORDING_MAX_SECONDS = 10 * 60;

const pickFormat = () =>
  FORMATS.find(({ mimeType }) => MediaRecorder.isTypeSupported(mimeType)) ??
  null;

const timestamp = () =>
  new Date().toISOString().slice(0, 19).replace(/[-:]/g, "").replace("T", "-");

export const useAudioRecorder = () => {
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [seconds, setSeconds] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const mimeTypeRef = useRef("");
  const stopResolverRef = useRef<((file: File | null) => void) | null>(null);

  const releaseStream = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setStream(null);
  };

  useEffect(() => {
    if (status !== "recording") return;

    const timer = window.setInterval(() => {
      setSeconds((current) => current + 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [status]);

  useEffect(
    () => () => {
      const recorder = recorderRef.current;

      if (recorder && recorder.state !== "inactive") {
        recorder.onstop = null;
        recorder.stop();
      }

      releaseStream();
    },
    [],
  );

  const start = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia || !("MediaRecorder" in window)) {
      throw new Error("Seu navegador não permite gravar áudio");
    }

    const format = pickFormat();

    if (!format) throw new Error("Seu navegador não permite gravar áudio");

    let stream: MediaStream;

    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      throw new Error("Permita o acesso ao microfone para gravar áudio");
    }

    const recorder = new MediaRecorder(stream, {
      mimeType: format.mimeType,
      audioBitsPerSecond: AUDIO_BITS_PER_SECOND,
    });

    chunksRef.current = [];
    mimeTypeRef.current = format.mimeType.split(";")[0];
    streamRef.current = stream;
    setStream(stream);
    recorderRef.current = recorder;

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };

    recorder.onstop = () => {
      releaseStream();
      recorderRef.current = null;
      setStatus("idle");

      const blob = new Blob(chunksRef.current, {
        type: format.mimeType.split(";")[0],
      });
      const file =
        blob.size > 0
          ? new File([blob], `audio-${timestamp()}.${format.extension}`, {
              type: blob.type,
            })
          : null;

      stopResolverRef.current?.(file);
      stopResolverRef.current = null;
    };

    recorder.start(250);
    setSeconds(0);
    setStatus("recording");
  }, []);

  const stop = useCallback(
    () =>
      new Promise<File | null>((resolve) => {
        const recorder = recorderRef.current;

        if (!recorder || recorder.state === "inactive") return resolve(null);

        stopResolverRef.current = resolve;
        recorder.stop();
      }),
    [],
  );

  const pause = useCallback(() => {
    if (recorderRef.current?.state !== "recording") return;

    recorderRef.current.requestData();
    recorderRef.current.pause();
    setStatus("paused");
  }, []);

  const resume = useCallback(() => {
    if (recorderRef.current?.state !== "paused") return;

    recorderRef.current.resume();
    setStatus("recording");
  }, []);

  const cancel = useCallback(() => {
    const recorder = recorderRef.current;

    if (recorder && recorder.state !== "inactive") {
      recorder.onstop = null;
      recorder.stop();
    }

    releaseStream();
    recorderRef.current = null;
    chunksRef.current = [];
    setStatus("idle");
    setSeconds(0);
  }, []);

  const snapshot = useCallback(
    () =>
      chunksRef.current.length
        ? new Blob(chunksRef.current, { type: mimeTypeRef.current })
        : null,
    [],
  );

  return {
    status,
    seconds,
    stream,
    start,
    stop,
    pause,
    resume,
    cancel,
    snapshot,
  };
};
