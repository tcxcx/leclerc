import { createLeclercWorkletHost } from "./index";

export const leclercWorkletHost = createLeclercWorkletHost();

export type LeclercWorkletHost = typeof leclercWorkletHost;
