<script>
  import NetworkGraphLeft from '$lib/components/NetworkGraphLeft.svelte';
  import NetworkGraphRight from '$lib/components/NetworkGraphRight.svelte';
  import NetworkSelector from '$lib/components/NetworkSelector.svelte';
  import { createNetworkStores } from './stores';
  import { fade } from 'svelte/transition';

  export let data = {};
  let sizeTime = 7;
  let networkHeight;
  let networkWidth;

  // Create an array of all available datasets
  $: datasets = Object.keys(data);
  
  let leftGraphDataset = 'r_healthy_e_sparcc';
  let rightGraphDataset = 'r_infected_e_sparcc';

  function handleLeftGraphChange(event) {
    leftGraphDataset = event.detail.value;
  }
  
  function handleRightGraphChange(event) {
    rightGraphDataset = event.detail.value;
  }

  $: if (typeof window !== 'undefined') {
    networkWidth = Math.min(window.innerWidth * 0.45);
    networkHeight = window.innerHeight * 0.35;
  }

  const LinkedData = createNetworkStores();
</script>

<main>
  <h1>Network Graph</h1>

  <div class="graphs-container">
    <div class="graph-wrapper">
      <h2>Left Graph Dataset: {leftGraphDataset}</h2>
      <NetworkSelector 
        {data}
        selectedDataset={leftGraphDataset}
        on:change={handleLeftGraphChange}
      />
      <div class="graph-container">
        {#each datasets as dataset (dataset)}
          {#if dataset === leftGraphDataset}
            <div transition:fade>
              <NetworkGraphLeft 
                key={dataset}
                graph={data[dataset]} 
                {networkWidth} 
                {networkHeight} 
                {sizeTime} 
                stores={LinkedData}
              />
            </div>
          {/if}
        {/each}
      </div>
    </div>
  
    <div class="graph-wrapper">
      <h2>Right Graph Dataset: {rightGraphDataset}</h2>
      <NetworkSelector 
        {data}
        selectedDataset={rightGraphDataset}
        on:change={handleRightGraphChange}
      />
      <div class="graph-container">
        {#each datasets as dataset (dataset)}
          {#if dataset === rightGraphDataset}
            <div transition:fade>
              <NetworkGraphRight 
                key={dataset}
                graph={data[dataset]} 
                {networkWidth} 
                {networkHeight} 
                {sizeTime} 
                stores={LinkedData}
              />
            </div>
          {/if}
        {/each}
      </div>
    </div>
  </div>
</main>

<style>
  main {
    text-align: center;
    padding: 1em;
    margin: 0 auto;
  }

  h1 {
    color: #333;
  }

  .graphs-container {
    display: flex;
    justify-content: space-between;
    width: 100%;
    max-width: 100vw;
    padding: 0 20px;
    gap: 20px;
  }

  .graph-wrapper {
    flex: 0 0 48%;
    min-width: 300px;
  }

  .graph-container {
    position: relative;
    width: 100%;
    height: 100%;
  }

  :global(.graph-container > div) {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
</style>