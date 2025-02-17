<script>
    import { createEventDispatcher } from 'svelte';
    
    export let data;
    export let selectedDataset;
    
    const dispatch = createEventDispatcher();
    
    // Create organized options for the dropdown
    const options = [
      
      {
        label: "Water Sample",
        options: [
          { value: "w_healthy", label: "Healthy" },
          { value: "w_infested", label: "Infested" }
        ]
      },
      {
        label: "Rockwool Early Stage",
        options: [
          { value: "r_healthy_e_sparcc", label: "Healthy - SparCC" },
          { value: "r_infected_e_sparcc", label: "Infected - SparCC" },
          { value: "r_inbetween_e_sparcc", label: "In-between - SparCC" },
          { value: "r_healthy_e_pearson", label: "Healthy - Pearson" },
          { value: "r_infected_e_pearson", label: "Infected - Pearson" },
          { value: "r_inbetween_e_pearson", label: "In-between - Pearson" },
          { value: "r_healthy_e_spearman", label: "Healthy - Spearman" },
          { value: "r_infected_e_spearman", label: "Infected - Spearman" },
          { value: "r_inbetween_e_spearman", label: "In-between - Spearman" }
        ]
      },
      {
        label: "Rockwool Late Stage",
        options: [
          { value: "r_healthy_l_sparcc", label: "Healthy - SparCC" },
          { value: "r_infected_l_sparcc", label: "Infected - SparCC" },
          { value: "r_inbetween_l_sparcc", label: "In-between - SparCC" },
          { value: "r_healthy_l_pearson", label: "Healthy - Pearson" },
          { value: "r_infected_l_pearson", label: "Infected - Pearson" },
          { value: "r_inbetween_l_pearson", label: "In-between - Pearson" },
          { value: "r_healthy_l_spearman", label: "Healthy - Spearman" },
          { value: "r_infected_l_spearman", label: "Infected - Spearman" },
          { value: "r_inbetween_l_spearman", label: "In-between - Spearman" }
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