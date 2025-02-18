<script>
    import { createEventDispatcher } from 'svelte';
    
    export let data;
    export let selectedDataset;
    
    const dispatch = createEventDispatcher();
    
    // Create organized options for the dropdown
    const options = [
  
      {
        label: "Rockwool Early Stage",
        options: [
          { value: "r_healthy_e_sparcc", label: "Healthy - SparCC" },
          { value: "r_infected_e_sparcc", label: "Infected - SparCC" },
          { value: "r_healthy_e_spearman", label: "Healthy - Spearman" },
          { value: "r_infected_e_spearman", label: "Infected - Spearman" },
        ]
      }
    ];
  
    function handleChange(event) {
      const newValue = event.target.value;
      dispatch('change', { value: newValue });
    }
  </script>
  
  <div class="selector-container">
    <select 
      value={selectedDataset} 
      on:change={handleChange}
      class="network-select"
    >
      {#each options as group}
        <optgroup label={group.label}>
          {#each group.options as option}
            <option value={option.value}>
              {option.label}
            </option>
          {/each}
        </optgroup>
      {/each}
    </select>
  </div>
  
  <style>
    .selector-container {
      margin-bottom: 1rem;
    }
    
    .network-select {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid #ccc;
      border-radius: 4px;
      background-color: white;
    }
    
    .network-select:focus {
      outline: none;
      border-color: #666;
    }
  </style>