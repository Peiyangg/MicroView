import { writable } from 'svelte/store';

export function createNetworkStores() {
  const selectedNodes = writable([]);
  const relatedLinks = writable([]);
  const brushActiveStore = writable(false);
  const coreNodesStore = writable([]); // Added for core nodes selection
  const sizeByStore = writable('st1_per_log'); // Added to track size metric

  // Subscribe for debugging
  selectedNodes.subscribe(value => console.log('Selected nodes updated:', value));
  relatedLinks.subscribe(value => console.log('Related links updated:', value));
  coreNodesStore.subscribe(value => console.log('Core nodes updated:', value));

  return {
    selectedNodes,
    relatedLinks,
    brushActiveStore,
    coreNodesStore,
    sizeByStore
  };
}