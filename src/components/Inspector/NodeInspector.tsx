import React, { useRef, useEffect, useState } from 'react';
import { ZoomIn, ZoomOut, Download, RefreshCw } from 'lucide-react';
import type { NodeInspectorData, NodeInspectorEdge } from '../../types';

interface NodeInspectorProps {
  nodes: NodeInspectorData[];
  edges: NodeInspectorEdge[];
  onNodeClick?: (node: NodeInspectorData) => void;
}

export const NodeInspector: React.FC<NodeInspectorProps> = ({
  nodes,
  edges,
  onNodeClick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    ctx.save();
    ctx.translate(panX, panY);
    ctx.scale(zoom, zoom);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width / zoom, canvas.height / zoom);

    drawGrid(ctx, canvas.width / zoom, canvas.height / zoom);
    drawEdges(ctx, edges, nodes);
    drawNodes(ctx, nodes, selectedNode, hoveredNode);

    ctx.restore();
  }, [nodes, edges, zoom, panX, panY, selectedNode, hoveredNode]);

  const drawGrid = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) => {
    const gridSize = 40;
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 1;

    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  };

  const drawEdges = (
    ctx: CanvasRenderingContext2D,
    edges: NodeInspectorEdge[],
    nodes: NodeInspectorData[]
  ) => {
    edges.forEach((edge) => {
      const sourceNode = nodes.find((n) => n.id === edge.source);
      const targetNode = nodes.find((n) => n.id === edge.target);

      if (!sourceNode || !targetNode) return;

      ctx.strokeStyle = edge.animated ? '#3b82f6' : '#cbd5e1';
      ctx.lineWidth = edge.animated ? 2 : 1;

      if (edge.animated) {
        ctx.setLineDash([5, 5]);
      }

      ctx.beginPath();
      ctx.moveTo(sourceNode.x, sourceNode.y);
      ctx.lineTo(targetNode.x, targetNode.y);
      ctx.stroke();

      ctx.setLineDash([]);

      if (edge.animated) {
        const angle = Math.atan2(
          targetNode.y - sourceNode.y,
          targetNode.x - sourceNode.x
        );
        const headlen = 15;
        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();
        ctx.moveTo(targetNode.x, targetNode.y);
        ctx.lineTo(
          targetNode.x - headlen * Math.cos(angle - Math.PI / 6),
          targetNode.y - headlen * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
          targetNode.x - headlen * Math.cos(angle + Math.PI / 6),
          targetNode.y - headlen * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();
      }
    });
  };

  const drawNodes = (
    ctx: CanvasRenderingContext2D,
    nodes: NodeInspectorData[],
    selectedNodeId: string | null,
    hoveredNodeId: string | null
  ) => {
    nodes.forEach((node) => {
      const radius = 40;
      const isSelected = node.id === selectedNodeId;
      const isHovered = node.id === hoveredNodeId;

      ctx.fillStyle = isSelected
        ? '#1e40af'
        : isHovered
          ? '#3b82f6'
          : getNodeColor(node.type);
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
      ctx.fill();

      if (isSelected || isHovered) {
        ctx.strokeStyle = '#1e40af';
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.label, node.x, node.y);

      if (node.heat > 0) {
        const heatRadius = radius + 5 + node.heat * 10;
        ctx.strokeStyle = `rgba(239, 68, 68, ${0.5 * (node.heat / 100)})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(node.x, node.y, heatRadius, 0, Math.PI * 2);
        ctx.stroke();
      }
    });
  };

  const getNodeColor = (type: NodeInspectorData['type']): string => {
    switch (type) {
      case 'agent':
        return '#8b5cf6';
      case 'tool':
        return '#06b6d4';
      case 'data':
        return '#10b981';
      case 'model':
        return '#f59e0b';
      case 'memory':
        return '#ec4899';
      default:
        return '#6b7280';
    }
  };

  const getCanvasCoordinates = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left - panX) / zoom,
      y: (clientY - rect.top - panY) / zoom,
    };
  };

  const getNodeAtCoordinates = (x: number, y: number): string | null => {
    const tolerance = 50;
    for (const node of nodes) {
      const distance = Math.hypot(node.x - x, node.y - y);
      if (distance < tolerance) {
        return node.id;
      }
    }
    return null;
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoordinates(e.clientX, e.clientY);
    const nodeId = getNodeAtCoordinates(coords.x, coords.y);

    if (nodeId) {
      setSelectedNode(nodeId);
      onNodeClick?.(nodes.find((n) => n.id === nodeId)!);
    } else {
      setSelectedNode(null);
      setIsDragging(true);
      setDragStart({ x: e.clientX - panX, y: e.clientY - panY });
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoordinates(e.clientX, e.clientY);
    const nodeId = getNodeAtCoordinates(coords.x, coords.y);
    setHoveredNode(nodeId);

    if (isDragging) {
      setPanX(e.clientX - dragStart.x);
      setPanY(e.clientY - dragStart.y);
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => setZoom((z) => Math.min(z * 1.2, 3));
  const handleZoomOut = () => setZoom((z) => Math.max(z / 1.2, 0.5));

  const handleReset = () => {
    setZoom(1);
    setPanX(0);
    setPanY(0);
    setSelectedNode(null);
  };

  const downloadAsImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = 'node-inspector.png';
    link.click();
  };

  const selectedNodeData = nodes.find((n) => n.id === selectedNode);

  return (
    <div className="flex h-full gap-4">
      <div className="flex-1 bg-white rounded-lg border border-slate-200 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
          <h3 className="font-semibold text-slate-900">Network Topology</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handleZoomIn}
              className="p-2 hover:bg-slate-200 rounded transition-colors"
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4 text-slate-600" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-2 hover:bg-slate-200 rounded transition-colors"
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4 text-slate-600" />
            </button>
            <button
              onClick={handleReset}
              className="p-2 hover:bg-slate-200 rounded transition-colors"
              title="Reset view"
            >
              <RefreshCw className="w-4 h-4 text-slate-600" />
            </button>
            <button
              onClick={downloadAsImage}
              className="p-2 hover:bg-slate-200 rounded transition-colors"
              title="Download as image"
            >
              <Download className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>

        <canvas
          ref={canvasRef}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
          className="flex-1 cursor-grab active:cursor-grabbing bg-white"
        />

        <div className="px-4 py-2 border-t border-slate-200 bg-slate-50 text-xs text-slate-600">
          Zoom: {(zoom * 100).toFixed(0)}% | Nodes: {nodes.length} | Edges:{' '}
          {edges.length}
        </div>
      </div>

      {selectedNodeData && (
        <div className="w-80 bg-white rounded-lg border border-slate-200 p-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-slate-900">Node Details</h4>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-slate-400 hover:text-slate-600"
            >
              ×
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Label
              </div>
              <div className="text-sm text-slate-900">{selectedNodeData.label}</div>
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Type
              </div>
              <div className="inline-block px-2 py-1 bg-slate-200 text-xs font-medium text-slate-700 rounded">
                {selectedNodeData.type}
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Heat Level
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                  className="bg-red-600 h-2 rounded-full"
                  style={{ width: `${selectedNodeData.heat}%` }}
                />
              </div>
              <div className="text-xs text-slate-600 mt-1">
                {selectedNodeData.heat.toFixed(0)}% activity
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Connections
              </div>
              <div className="text-sm text-slate-900">
                {selectedNodeData.connections.length} nodes
              </div>
            </div>

            {selectedNodeData.value && (
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Value
                </div>
                <pre className="bg-slate-900 text-slate-100 p-3 rounded text-xs overflow-auto max-h-48">
                  {JSON.stringify(selectedNodeData.value, null, 2)}
                </pre>
              </div>
            )}

            {selectedNodeData.metadata && Object.keys(selectedNodeData.metadata).length > 0 && (
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Metadata
                </div>
                <pre className="bg-slate-900 text-slate-100 p-3 rounded text-xs overflow-auto max-h-48">
                  {JSON.stringify(selectedNodeData.metadata, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
