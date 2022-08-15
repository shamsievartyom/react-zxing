import {
  BrowserMultiFormatReader,
  DecodeContinuouslyCallback,
  DecodeHintType,
  Result,
} from "@zxing/library";
import { useCallback, useEffect, useMemo, useRef } from "react";

const DEFAULT_CONSTRAINTS: MediaStreamConstraints = {
  audio: false,
  video: { facingMode: "environment" },
};

const DEFAULT_TIME_BETWEEN_SCANS_MS = 300;

export interface UseZxingOptions {
  hints?: Map<DecodeHintType, any>;
  timeBetweenDecodingAttempts?: number;
  onResult?: (result: Result) => void;
  onError?: (error: Error) => void;
}

export interface UseZxingOptionsWithConstraints extends UseZxingOptions {
  constraints?: MediaStreamConstraints;
}

export interface UseZxingOptionsWithDeviceId extends UseZxingOptions {
  deviceId: string;
}

function isUseZxingOptionsWithDeviceId(
  options: UseZxingOptions
): options is UseZxingOptionsWithDeviceId {
  return (options as UseZxingOptionsWithDeviceId).deviceId !== undefined;
}

export const useZxing = (
  options: UseZxingOptionsWithConstraints | UseZxingOptionsWithDeviceId = {}
) => {
  const {
    hints,
    timeBetweenDecodingAttempts = DEFAULT_TIME_BETWEEN_SCANS_MS,
    onResult = () => {},
    onError = () => {},
  } = options;
  const ref = useRef<HTMLVideoElement>(null);

  const reader = useMemo<BrowserMultiFormatReader>(() => {
    const instance = new BrowserMultiFormatReader(hints);
    instance.timeBetweenDecodingAttempts = timeBetweenDecodingAttempts;
    return instance;
  }, [hints, timeBetweenDecodingAttempts]);

  const decodeCallback = useCallback<DecodeContinuouslyCallback>(
    (result, error) => {
      if (result) onResult(result);
      if (error) onError(error);
    },
    [onResult, onError]
  );

  const startDecoding = useCallback(() => {
    if (!ref.current) return;
    if (isUseZxingOptionsWithDeviceId(options)) {
      const { deviceId } = options;
      reader.decodeFromVideoDevice(deviceId, ref.current, decodeCallback);
    } else {
      const constraints = options.constraints ?? DEFAULT_CONSTRAINTS;
      reader.decodeFromConstraints(constraints, ref.current, decodeCallback);
    }
  }, [reader, options, decodeCallback]);

  const stopDecoding = useCallback(() => {
    reader.reset();
  }, [reader]);

  useEffect(() => {
    startDecoding();
    return () => {
      stopDecoding();
    };
  }, [startDecoding, stopDecoding]);

  return { ref };
};
