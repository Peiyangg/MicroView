<script>
  import { onMount, onDestroy } from "svelte";
  import * as d3 from "d3";

  export let stores;
  const { selectedNodes, relatedLinks, brushActiveStore } = stores;
  $: brushActive = $brushActiveStore;

  export let graph;
  export let width = 800;
  export let height = 800;
  export let sizeTime = 7;

  // Internal state for arc selection and local UI
  let selectedArc = null;
  let svgContainer;
  let tooltip;
  let brushGroup;

  // Component state
  let filteredSubcoreNodes = [];
  let filteredCoreNodes = [];
  let filteredLinks = [];
  let simulation;
  let sizeBy = "st1_per";
  const textThreshold = 1;

  const brush = d3.brush().on("start brush end", brushed);

    // Cleanup on component destroy
    onDestroy(() => {
    if (tooltip) tooltip.remove();
    if (brushGroup) brushGroup.remove();
    if (simulation) simulation.stop();
  });


  function brushed(event) {
    if (!event.selection) return;

    const [[x0, y0], [x1, y1]] = event.selection;
    const selectedNodesArray = [];
    const relatedLinksArray = [];

    [...filteredSubcoreNodes, ...filteredCoreNodes].forEach(node => {
      if (x0 <= node.x && node.x < x1 && y0 <= node.y && node.y < y1) {
        node.RelatedOrNot = true;
        selectedNodesArray.push(node);
      } else {
        node.RelatedOrNot = false;
      }
    });

    filteredLinks.forEach(link => {
      if (link.source.RelatedOrNot || link.target.RelatedOrNot) {
        link.RelatedOrNot = true;
        relatedLinksArray.push(link);
      } else {
        link.RelatedOrNot = false;
      }
    });

    selectedNodes.set(selectedNodesArray);
    relatedLinks.set(relatedLinksArray);
    applyHighlighting(new Set(selectedNodesArray), relatedLinksArray);
  }

  function toggleBrush() {
    brushActiveStore.update((v) => !v);

    if ($brushActiveStore) {
      brushGroup = svgContainer.append("g").attr("class", "brush");
      brush.extent([
        [0, 0],
        [width, height],
      ]);
      brushGroup.call(brush);

      if (simulation) {
        simulation.alpha(0).stop();
      }
    } else {
      if (brushGroup) {
        brushGroup.call(brush.move, null).remove();
        brushGroup = null;
      }

      if (simulation) {
        simulation.alpha(1).restart();
      }

      resetStyles();
      selectedNodes.set([]);
      relatedLinks.set([]);
    }
  }

  selectedNodes.subscribe((value) => {
    if (simulation) {
      if (value.length > 0) {
        console.log("Stopping simulation because selectedNodes is not empty");
        simulation.alpha(0).stop(); // Stop the simulation
        //} else {
        //  console.log('Starting simulation because selectedNodes is empty');
        //  simulation.alpha(1).restart(); // Restart the simulation
      }
    }
  });

  onMount(() => {
    const svg = d3
      .select(svgContainer)
      .attr("width", width)
      .attr("height", height);

    tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("background-color", "white")
      .style("border", "solid")
      .style("border-width", "1px")
      .style("border-radius", "5px")
      .style("padding", "5px")
      .style("opacity", 0);

    if (typeof document !== "undefined") {
      createGraph(svg);
    }
  });

  const styles = {
    default: {
      node: {
        opacity: 1,
        stroke: "#fff",
        strokeWidth: (d) => (d.level === "core" ? 2 : 0.5),
      },
      link: {
        opacity: 1,
        strokeWidth: (d) =>
          d.source.level === "core" || d.target.level === "core"
            ? 1
            : d.sparcc < 0
              ? 1.5
              : 0.75,
        stroke: (d) => {
          if (d.sparcc < 0) {
            return "rgba(255, 0, 0, 0.7)";
          } else {
            const alpha =
              d.source.level === "core" || d.target.level === "core"
                ? "0.4"
                : "0.1";
            return `rgba(0, 128, 0, ${alpha})`;
          }
        },
      },
      text: {
        opacity: 1,
      },
    },
    clicked: {
      node: {
        opacity: 0.75,
        stroke: "red",
        strokeWidth: 1,
      },
      link: {
        opacity: 0.9,
        strokeWidth: 2,
        stroke: (d) => {
          if (d.sparcc < 0) {
            return "rgba(255, 0, 0, 0.7)";
          } else {
            return `rgba(0, 128, 0, 0.3)`;
          }
        },
      },
      text: {
        opacity: 0.75,
      },
    },
    dimmed: {
      node: {
        opacity: 0.01,
        stroke: "#fff",
        strokeWidth: (d) => (d.level === "core" ? 2 : 0.5),
      },
      link: {
        opacity: 0.01,
        strokeWidth: 0.5,
        stroke: "rgba(128, 128, 128, 0.1)",
      },
      text: {
        opacity: 0.01,
      },
    },
  };

  function handleMouseOver(event, d) {
    d3.select(this).attr("stroke", "orange").attr("stroke-width", 2);
    tooltip
      .style("opacity", 1)
      .html(`Label: ${d.label}`)
      .style("left", `${event.pageX + 10}px`)
      .style("top", `${event.pageY - 10}px`);
  }

  function handleMouseOut(event, d) {
    d3.select(this)
      .attr("stroke", "#fff")
      .attr("stroke-width", d.level === "core" ? 2 : 0.5);
    tooltip.style("opacity", 0);
  }

  $: {
    if (graph) {
      filteredSubcoreNodes = graph.nodes
        .filter((node) => node.level === "subcore")
        .map((d) => ({ ...d, RelatedOrNot: false }));
      filteredCoreNodes = graph.nodes
        .filter((node) => node.level === "core")
        .map((d) => ({ ...d, RelatedOrNot: false }));

      const filteredNodeIds = new Set(
        [...filteredSubcoreNodes, ...filteredCoreNodes].map((node) => node.id),
      );

      filteredLinks = graph.links
        .filter(
          (link) =>
            filteredNodeIds.has(link.Source) &&
            filteredNodeIds.has(link.Target),
        )
        .map((d) => ({ ...d, RelatedOrNot: false }));
    }
  }

  $: if (sizeBy) {
    updateNodeSizes();
  }

  $: if (graph) {
    filteredSubcoreNodes = graph.nodes
      .filter((node) => node.level === "subcore")
      .map((d) => ({ ...d, RelatedOrNot: false }));

    filteredCoreNodes = graph.nodes
      .filter((node) => node.level === "core")
      .map((d) => ({ ...d, RelatedOrNot: false }));

    const nodeIds = new Set(
      [...filteredSubcoreNodes, ...filteredCoreNodes].map((n) => n.id),
    );
    filteredLinks = graph.links
      .filter((link) => nodeIds.has(link.Source) && nodeIds.has(link.Target))
      .map((d) => ({ ...d, RelatedOrNot: false }));
  }

  function createGraph(svg) {
    const radius = Math.min(width, height) / 2;

    svgContainer = svg
      .append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2})`);

    if (typeof document !== "undefined") {
      const svg = d3.select("svg").attr("width", width).attr("height", height);

      const nodeMap = new Map(
        [...filteredSubcoreNodes, ...filteredCoreNodes].map((node) => [
          node.id,
          node,
        ]),
      );

      filteredLinks.forEach((link) => {
        link.source = nodeMap.get(link.Source);
        link.target = nodeMap.get(link.Target);
      });

      const tree = d3.tree().size([2 * Math.PI, radius - 100]);

      const root = d3.hierarchy({ children: filteredSubcoreNodes });
      tree(root);

      root.descendants().forEach((d) => {
        const angle = d.x;
        const radialDistance = d.y;

        d.x = radialDistance * Math.cos(angle - Math.PI / 2);
        d.y = radialDistance * Math.sin(angle - Math.PI / 2);
      });

      filteredSubcoreNodes.forEach((node) => {
        const correspondingNode = root
          .descendants()
          .find((d) => d.data.id === node.id);
        node.x = correspondingNode.x;
        node.y = correspondingNode.y;
      });

      simulation = d3
        .forceSimulation(filteredCoreNodes)
        .force(
          "link",
          d3
            .forceLink(filteredLinks)
            .id((d) => d.id)
            .distance(100),
        )
        .force("charge", d3.forceManyBody().strength(-50))
        .force("center", d3.forceCenter(0, 0))
        .force(
          "collide",
          d3.forceCollide().radius((d) => d[sizeBy] * sizeTime + 5),
        )
        .on("tick", ticked);

      function ticked() {
        console.log("Simulation is ticking");

        link
          .attr("x1", (d) => d.source.x)
          .attr("y1", (d) => d.source.y)
          .attr("x2", (d) => d.target.x)
          .attr("y2", (d) => d.target.y);

        node
          .select("circle")
          .attr("cx", (d) => d.x)
          .attr("cy", (d) => d.y);

        node
          .select("text")
          .attr("x", (d) => d.x)
          .attr("y", (d) => d.y - 10);
      }

      const link = svgContainer
        .append("g")
        .selectAll("line")
        .data(filteredLinks)
        .enter()
        .append("line")
        .attr("stroke-width", (d) => styles.default.link.strokeWidth(d))
        .attr("stroke", (d) => styles.default.link.stroke(d))
        .each(function (d) {
          d.element = this;
        });

      // Aggregate nodes by their cluster_hdbscan values
      const clusters = d3.group(filteredSubcoreNodes, (d) => d.cluster_hdbscan);

      // Convert clusters to array of objects for pie chart
      const clusterData = Array.from(clusters, ([key, value]) => ({
        cluster_hdbscan: key,
        size: value.length,
      }));

      // Define rainbow color scale starting with pink
      const color = d3
        .scaleSequential(d3.interpolateRainbow)
        .domain([0, clusterData.length - 1]);

      // Arc Generation based on cluster sizes
      const arcPie = d3
        .pie()
        .sort(null) // Disable sorting; this is important to maintain the original order
        .value((d) => d.size);

      const arc = d3
        .arc()
        .innerRadius(radius - 50)
        .outerRadius(radius - 40);

      // Append Arcs to the Existing SVG Container
      const arcs = svgContainer
        .selectAll(".hdbscanArc")
        .data(arcPie(clusterData))
        .enter()
        .append("path")
        .attr("class", "hdbscanArc")
        .attr("id", function (d, i) {
          return "hdbscanArc_" + i;
        }) // Unique id for each slice
        .attr("d", arc)
        .style("fill", (d, i) => color(i)) // Apply rainbow color scale
        .attr("stroke", "#fff") // Add white stroke
        .attr("stroke-width", 2)
        .on("mouseover", function (event, d) {
          d3.select(this).attr("stroke", "red");
        })
        .on("mouseout", function (event, d) {
          if (selectedArc !== d) {
            d3.select(this).attr("stroke", "#fff");
          }
        })
        .on("click", function (event, d) {
          // Apply red stroke to the clicked arc
          d3.selectAll(".hdbscanArc").attr("stroke", "#fff"); // Reset all arcs' stroke to default
          d3.select(this).attr("stroke", "red");
          handleArcClick(event, d);
        });

      // Create a map for color assignment to clusters
      const clusterColorMap = new Map();
      arcs.each(function (d, i) {
        clusterColorMap.set(d.data.cluster_hdbscan, color(i));
      });

      const node = svgContainer
        .append("g")
        .selectAll("g")
        .data([...filteredSubcoreNodes, ...filteredCoreNodes])
        .enter()
        .append("g");

      node
        .append("circle")
        .attr("r", (d) => d[sizeBy] * 6)
        .attr("fill", (d) => {
          if (d.level === "core") {
            return d3.color("#7fcdbb").copy({ opacity: 0.85 });
          } else {
            return clusterColorMap.get(d.cluster_hdbscan);
          }
        })
        .attr("cx", (d) => d.x)
        .attr("cy", (d) => d.y)
        .attr("stroke", "#fff")
        .attr("stroke-width", (d) => (d.level === "core" ? 2 : 0.5))
        .call(drag(simulation))
        .on("mouseover", handleMouseOver)
        .on("mouseout", handleMouseOut)
        .on("click", handleClick)
        .each(function (d) {
          d.element = this;
        }); // Store a reference to the element

      node
        .filter((d) => d[sizeBy] >= textThreshold)
        .append("text")
        .attr("x", (d) => d.x)
        .attr("y", (d) => d.y - 10)
        .attr("text-anchor", "middle")
        .text((d) => d.label)
        .attr("font-size", "10px")
        .attr("font-family", "Arial, sans-serif")
        .attr("fill", "#000");

      // Add text labels to each arc
      svgContainer
        .selectAll(".hdbscanArcText")
        .data(arcPie(clusterData))
        .enter()
        .append("text")
        .attr("class", "hdbscanArcText")
        .attr("transform", function (d) {
          const _d = arc.centroid(d);
          _d[0] *= 1.05; // Adjust multiplier as needed
          _d[1] *= 1.05; // Adjust multiplier as needed
          return `translate(${_d})`;
        })
        .attr("dy", ".35em")
        .attr("text-anchor", "middle")
        .text(function (d) {
          return d.data.cluster_hdbscan;
        })
        .style("font-family", "Arial, sans-serif")
        .style("font-size", "14px");

      function drag(simulation) {
        function dragstarted(event, d) {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        }

        function dragged(event, d) {
          d.fx = event.x;
          d.fy = event.y;
        }

        function dragended(event, d) {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }

        return d3
          .drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended);
      }
    }
  }

  $: if (sizeBy && typeof document !== "undefined") {
    updateNodeSizes();
  }
  function updateNodeSizes() {
    if (!svgContainer) return;

    d3.selectAll("circle").attr("r", (d) => d[sizeBy] * sizeTime);

    // Remove ALL existing text elements within nodes
    d3.selectAll("g text").remove();

    // Add text labels only for nodes that meet the threshold
    d3.selectAll("g")
      .filter((d) => d && d[sizeBy] >= textThreshold)
      .append("text")
      .attr("class", "node-label")
      .attr("x", (d) => d.x)
      .attr("y", (d) => d.y - 10)
      .attr("text-anchor", "middle")
      .text((d) => d.label)
      .attr("font-size", "10px")
      .attr("font-family", "Arial, sans-serif")
      .attr("fill", "#000");
  }
  function handleClick(event, d) {
    // If clicking the same node, clear selection
    if ($selectedNodes.includes(d)) {
      selectedNodes.set([]);
      relatedLinks.set([]);
      resetStyles();
      return;
    }

    // Find related nodes and links
    const relatedNodesArray = [d];
    const relatedLinksArray = [];
    
    filteredLinks.forEach(link => {
      if (link.source.id === d.id || link.target.id === d.id) {
        link.source.RelatedOrNot = true;
        link.target.RelatedOrNot = true;
        relatedNodesArray.push(link.source, link.target);
        relatedLinksArray.push(link);
      }
    });

    // Update stores
    selectedNodes.set(relatedNodesArray);
    relatedLinks.set(relatedLinksArray);
    
    applyHighlighting(new Set(relatedNodesArray), relatedLinksArray);
  }

  function handleArcClick(event, d) {
    // Local arc selection logic
    if (selectedArc === d) {
      selectedArc = null;
      resetStyles();
      return;
    }

    selectedArc = d;
    const selectedCluster = d.data.cluster_hdbscan;
    
    const clusterNodes = filteredSubcoreNodes.filter(node => 
      node.cluster_hdbscan === selectedCluster
    );
    
    clusterNodes.forEach(node => node.RelatedOrNot = true);
    
    // Apply highlighting only for arc selection
    d3.selectAll("circle").each(function(node) {
      const elem = d3.select(this);
      if (node.cluster_hdbscan === selectedCluster) {
        applyNodeStyles(elem, styles.clicked);
      } else {
        applyNodeStyles(elem, styles.dimmed);
      }
    });

    d3.selectAll("line").each(function(link) {
      const elem = d3.select(this);
      if (link.source.cluster_hdbscan === selectedCluster || 
          link.target.cluster_hdbscan === selectedCluster) {
        applyLinkStyles(elem, styles.clicked);
      } else {
        applyLinkStyles(elem, styles.dimmed);
      }
    });
  }

  function resetStyles() {
    selectedArc = null;
    d3.selectAll("circle")
      .style("opacity", 1)
      .attr("stroke", "#fff")
      .attr("stroke-width", d => d.level === "core" ? 2 : 0.5);

    d3.selectAll("line")
      .style("opacity", 1)
      .attr("stroke-width", d => 
        d.source.level === "core" || d.target.level === "core" ? 1 : 
        d.sparcc < 0 ? 1.5 : 0.75
      )
      .attr("stroke", d => {
        if (d.sparcc < 0) {
          return "rgba(255, 0, 0, 0.7)";
        } else {
          const alpha = d.source.level === "core" || d.target.level === "core" ? "0.4" : "0.1";
          return `rgba(0, 128, 0, ${alpha})`;
        }
      });
  }

  function applyHighlighting(highlightedNodes, highlightedLinks) {
    d3.selectAll("circle").each(function (node) {
      const elem = d3.select(this);
      if (highlightedNodes.has(node)) {
        elem
          .style("opacity", 0.75)
          .attr("stroke", "red")
          .attr("stroke-width", 1);
      } else {
        elem
          .style("opacity", 0.01)
          .attr("stroke", "#fff")
          .attr("stroke-width", (d) => (d.level === "core" ? 2 : 0.5));
      }
    });

    d3.selectAll("line").each(function (link) {
      const elem = d3.select(this);
      if (highlightedLinks.includes(link)) {
        elem
          .style("opacity", 0.9)
          .attr("stroke-width", 2)
          .attr("stroke", (d) =>
            d.sparcc < 0 ? "rgba(255, 0, 0, 0.7)" : "rgba(0, 128, 0, 0.3)",
          );
      } else {
        elem
          .style("opacity", 0.01)
          .attr("stroke-width", 0.5)
          .attr("stroke", "rgba(128, 128, 128, 0.1)");
      }
    });
  }

  function applyNodeStyles(node, styles) {
    node
      .style("opacity", styles.node.opacity)
      .attr("stroke", styles.node.stroke)
      .attr("stroke-width", styles.node.strokeWidth);
  }

  function applyLinkStyles(link, styles) {
    link
      .style("opacity", styles.link.opacity)
      .attr("stroke-width", styles.link.strokeWidth)
      .attr("stroke", styles.link.stroke);
  }

  function applyTextStyles(text, styles) {
    text.style("opacity", styles.text.opacity);
  }
</script>

<button on:click={toggleBrush} class:brush-active={brushActive}>Toggle Brush</button>

<select bind:value={sizeBy}>
  <option value="st1_per">st1_per</option>
  <option value="st2_per">st2_per</option>
  <option value="st3_per">st3_per</option>
  <option value="st4_per">st4_per</option>
</select>

<svg bind:this={svgContainer} {width} {height}></svg>

<style>
  svg {
    background: #f9f9f9;
    border: 1px solid #ccc;
    margin: auto;
    display: block;
  }
  select {
    display: block;
    margin: 10px auto;
  }

  .brush-active {
    background-color: #007bff; /* Example color */
    color: white;
    border: 1px solid #0056b3;
  }
  button {
    padding: 10px 20px;
    font-size: 16px;
    cursor: pointer;
  }
</style>
