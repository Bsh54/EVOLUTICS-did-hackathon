export let lastOutOfBandId: string | null = null;

export function setOutOfBandId(id: string) {
  lastOutOfBandId = id;
}
