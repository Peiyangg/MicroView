export const styles = {
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
  
  export function applyNodeStyles(node, styleType) {
    const style = styles[styleType].node;
    node
      .style("opacity", style.opacity)
      .attr("stroke", style.stroke)
      .attr("stroke-width", style.strokeWidth);
  }
  
  export function applyLinkStyles(link, styleType) {
    const style = styles[styleType].link;
    link
      .style("opacity", style.opacity)
      .attr("stroke-width", style.strokeWidth)
      .attr("stroke", style.stroke);
  }
  
  export function applyTextStyles(text, styleType) {
    const style = styles[styleType].text;
    text.style("opacity", style.opacity);
  }
  
  export function resetStyles(nodes, links, texts) {
    nodes.each(function(d) {
      applyNodeStyles(d3.select(this), "default");
    });
    
    links.each(function(d) {
      applyLinkStyles(d3.select(this), "default");
    });
    
    if (texts) {
      texts.each(function(d) {
        applyTextStyles(d3.select(this), "default");
      });
    }
  }
  
  export function applyHighlighting(nodes, links, highlightedNodes, highlightedLinks, texts) {
    nodes.each(function(node) {
      const elem = d3.select(this);
      if (highlightedNodes.has(node)) {
        applyNodeStyles(elem, "clicked");
      } else {
        applyNodeStyles(elem, "dimmed");
      }
    });
  
    links.each(function(link) {
      const elem = d3.select(this);
      if (highlightedLinks.includes(link)) {
        applyLinkStyles(elem, "clicked");
      } else {
        applyLinkStyles(elem, "dimmed");
      }
    });
  
    if (texts) {
      texts.each(function(node) {
        const elem = d3.select(this);
        if (highlightedNodes.has(node)) {
          applyTextStyles(elem, "clicked");
        } else {
          applyTextStyles(elem, "dimmed");
        }
      });
    }
  }