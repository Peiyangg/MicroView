// Helper functions stay the same
const get_weight = (w) => {
    if (w == -2) { return 0 }
    return Math.abs(w);
}

const get_sign = (w) => {
    return w < 0 ? 'negative' : 'positive';
}

// Helper function to process nodes and links
const processData = async (fetch, filename, valueKey = 'sparcc') => {
    const response = await fetch(`/${filename}`);
    const data = await response.json();

    const nodes = data.nodes.map((d) => ({ 
        ...d, 
        cluster: d.cluster_hdbscan.toString(), 
        RelatedOrNot: false 
    }));
    
    const links = data.links.map((d) => ({
        ...d,
        weight: get_weight(d[valueKey]),
        sign: get_sign(d[valueKey]),
        RelatedOrNot: false
    }));

    return { nodes, links };
}

export const load = async ({ fetch }) => {
    try {
        // Load original network data
        const [sparcc_data_e, sparcc_data_l] = await Promise.all([
            processData(fetch, 'e_scc_network.json', 'value'),
            processData(fetch, 'l_scc_network.json', 'value')
        ]);

        // Load water culture data
        const [healthy_data, infested_data] = await Promise.all([
            processData(fetch, 'w_h.json'),
            processData(fetch, 'w_i.json')
        ]);

        // Load rockwool early stage data for all correlation methods
        const early_data = await Promise.all([
            // Sparcc correlations
            processData(fetch, 'healthy_sparcc_e.json'),
            processData(fetch, 'infected_sparcc_e.json'),
            processData(fetch, 'inbetween_sparcc_e.json'),
            // Pearson correlations
            processData(fetch, 'healthy_pearson_e.json', 'pearson'),
            processData(fetch, 'infected_pearson_e.json', 'pearson'),
            processData(fetch, 'inbetween_pearson_e.json', 'pearson'),
            // Spearman correlations
            processData(fetch, 'healthy_spearman_e.json', 'spearman'),
            processData(fetch, 'infected_spearman_e.json', 'spearman'),
            processData(fetch, 'inbetween_spearman_e.json', 'spearman')
        ]);

        // Load rockwool late stage data for all correlation methods
        const late_data = await Promise.all([
            // Sparcc correlations
            processData(fetch, 'healthy_sparcc_l.json'),
            processData(fetch, 'infected_sparcc_l.json'),
            processData(fetch, 'inbetween_sparcc_l.json'),
            // Pearson correlations
            processData(fetch, 'healthy_pearson_l.json', 'pearson'),
            processData(fetch, 'infected_pearson_l.json', 'pearson'),
            processData(fetch, 'inbetween_pearson_l.json', 'pearson'),
            // Spearman correlations
            processData(fetch, 'healthy_spearman_l.json', 'spearman'),
            processData(fetch, 'infected_spearman_l.json', 'spearman'),
            processData(fetch, 'inbetween_spearman_l.json', 'spearman')
        ]);

        return {
            // Original network data
            "e_sparcc": { nodes: sparcc_data_e.nodes, links: sparcc_data_e.links },
            "l_sparcc": { nodes: sparcc_data_l.nodes, links: sparcc_data_l.links },
            
            // Water culture data
            "w_healthy": { nodes: healthy_data.nodes, links: healthy_data.links },
            "w_infested": { nodes: infested_data.nodes, links: infested_data.links },
            
            // Rockwool early stage data - Sparcc
            "r_healthy_e_sparcc": { nodes: early_data[0].nodes, links: early_data[0].links },
            "r_infected_e_sparcc": { nodes: early_data[1].nodes, links: early_data[1].links },
            "r_inbetween_e_sparcc": { nodes: early_data[2].nodes, links: early_data[2].links },
            
            // Rockwool early stage data - Pearson
            "r_healthy_e_pearson": { nodes: early_data[3].nodes, links: early_data[3].links },
            "r_infected_e_pearson": { nodes: early_data[4].nodes, links: early_data[4].links },
            "r_inbetween_e_pearson": { nodes: early_data[5].nodes, links: early_data[5].links },
            
            // Rockwool early stage data - Spearman
            "r_healthy_e_spearman": { nodes: early_data[6].nodes, links: early_data[6].links },
            "r_infected_e_spearman": { nodes: early_data[7].nodes, links: early_data[7].links },
            "r_inbetween_e_spearman": { nodes: early_data[8].nodes, links: early_data[8].links },
            
            // Rockwool late stage data - Sparcc
            "r_healthy_l_sparcc": { nodes: late_data[0].nodes, links: late_data[0].links },
            "r_infected_l_sparcc": { nodes: late_data[1].nodes, links: late_data[1].links },
            "r_inbetween_l_sparcc": { nodes: late_data[2].nodes, links: late_data[2].links },
            
            // Rockwool late stage data - Pearson
            "r_healthy_l_pearson": { nodes: late_data[3].nodes, links: late_data[3].links },
            "r_infected_l_pearson": { nodes: late_data[4].nodes, links: late_data[4].links },
            "r_inbetween_l_pearson": { nodes: late_data[5].nodes, links: late_data[5].links },
            
            // Rockwool late stage data - Spearman
            "r_healthy_l_spearman": { nodes: late_data[6].nodes, links: late_data[6].links },
            "r_infected_l_spearman": { nodes: late_data[7].nodes, links: late_data[7].links },
            "r_inbetween_l_spearman": { nodes: late_data[8].nodes, links: late_data[8].links }
        }
    } catch (error) {
        console.error('Error loading data:', error);
        throw error;
    }
}