import { createLeclercWorkletHost, createNativeWorkletAdapter } from "./index";

export const leclercWorkletAdapter = createNativeWorkletAdapter();
export const leclercWorkletHost = createLeclercWorkletHost({ adapter: leclercWorkletAdapter });

export type LeclercWorkletHost = typeof leclercWorkletHost;
