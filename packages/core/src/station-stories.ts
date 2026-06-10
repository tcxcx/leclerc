export interface StationStory {
  id: string;
  delegateTest: {
    userPrompt: string;
  };
}

export const DEFAULT_STATION_STORY: StationStory = {
  id: "p2p-station-delegate-smoke",
  delegateTest: {
    userPrompt: "Responde exactamente: enlace operativo listo",
  },
};

export function stationDelegateTestPrompt(story: StationStory = DEFAULT_STATION_STORY): string {
  return story.delegateTest.userPrompt;
}
