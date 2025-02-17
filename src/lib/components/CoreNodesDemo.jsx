import React, { useState, useEffect } from 'react';

const CoreNodesDemo = ({ nodes = [], sizeBy = "st1_per_log", onNodesUpdate }) => {
  const [coreNodes, setCoreNodes] = useState([]);
  const [availableNodes, setAvailableNodes] = useState([]);

  useEffect(() => {
    const nonSelectedNodes = nodes.filter(
      node => !coreNodes.some(selected => selected.id === node.id)
    );
    const sorted = [...nonSelectedNodes].sort((a, b) => b[sizeBy] - a[sizeBy]);
    setAvailableNodes(sorted);

    const updatedNodes = nodes.map(node => ({
      ...node,
      level: coreNodes.some(core => core.id === node.id) ? "core" : node.level
    }));
    onNodesUpdate?.(updatedNodes);
  }, [nodes, sizeBy, coreNodes]);

  const handleSelect = (e) => {
    const selectedId = e.target.value;
    if (selectedId) {
      const node = availableNodes.find(n => n.id === selectedId);
      if (node) {
        setCoreNodes(prev => [...prev, node]);
      }
      e.target.value = "";
    }
  };

  return (
    <div className="p-4">
      <h3 className="text-lg font-bold mb-4">Core Nodes</h3>
      <div className="space-y-2">
        {coreNodes.sort((a,b) => a.id.localeCompare(b.id)).map(node => (
          <div key={node.id} className="flex items-center bg-gray-100 p-2 rounded">
            <span className="flex-1 font-mono">{node.id}</span>
            <button 
              onClick={() => setCoreNodes(prev => prev.filter(n => n.id !== node.id))}
              className="ml-2 text-gray-500 hover:text-red-500"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <select 
        className="mt-4 p-2 border rounded w-full"
        onChange={handleSelect}
      >
        <option value="">Select node...</option>
        {availableNodes.map(node => (
          <option key={node.id} value={node.id}>
            {node.id} ({sizeBy}: {node[sizeBy].toFixed(3)})
          </option>
        ))}
      </select>
    </div>
  );
};

export default CoreNodesDemo;