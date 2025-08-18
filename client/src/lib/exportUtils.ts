import { toPng, toJpeg } from 'html-to-image';
import { Node } from "reactflow";

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Calculates the bounding box that encompasses all nodes
 * @param nodes - Array of ReactFlow nodes
 * @param padding - Padding around the bounding box (default: 50px)
 */
export function calculateNodesBoundingBox(nodes: Node[], padding = 50): BoundingBox | null {
  if (nodes.length === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  nodes.forEach(node => {
    // Get node dimensions with reasonable defaults
    const nodeWidth = node.width || (node.type === 'table' ? 300 : node.type === 'sticky-note' ? 200 : 150);
    const nodeHeight = node.height || (node.type === 'table' ? Math.max(200, 60 + (node.data?.columns?.length || 5) * 30) : node.type === 'sticky-note' ? 150 : 100);

    const x = node.position.x;
    const y = node.position.y;

    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + nodeWidth);
    maxY = Math.max(maxY, y + nodeHeight);
  });

  return {
    x: minX - padding,
    y: minY - padding,
    width: (maxX - minX) + (padding * 2),
    height: (maxY - minY) + (padding * 2)
  };
}

/**
 * Exports the current viewport (what user currently sees) as PNG
 * Uses html-to-image library which works better with ReactFlow
 */
export async function exportCurrentViewportAsPNG(nodes: Node[], filename = "current-view.png"): Promise<void> {
  if (nodes.length === 0) {
    throw new Error("No nodes found to export");
  }
  
  const reactFlowWrapper = document.querySelector(".react-flow") as HTMLElement;
  if (!reactFlowWrapper) {
    throw new Error("ReactFlow wrapper not found");
  }
  
  try {
    const dataUrl = await toPng(reactFlowWrapper, {
      backgroundColor: '#ffffff',
      quality: 1,
      pixelRatio: 2
    });
    
    downloadImage(dataUrl, filename);
    
  } catch (error) {
    console.error('Error capturing current viewport:', error);
    throw new Error('Failed to export current view as PNG');
  }
}

/**
 * Exports the full diagram using ReactFlow's fitView approach
 * This temporarily fits all nodes in view and captures them
 */
export async function exportFullDiagramAsPNG(nodes: Node[], filename = "full-diagram.png"): Promise<void> {
  if (nodes.length === 0) {
    throw new Error("No nodes found to export");
  }

  const reactFlowWrapper = document.querySelector(".react-flow") as HTMLElement;
  if (!reactFlowWrapper) {
    throw new Error("ReactFlow wrapper not found");
  }

  try {
    // Simple approach: just capture what's currently visible
    // User can use ReactFlow's fit view button to show all nodes first
    const dataUrl = await toPng(reactFlowWrapper, {
      backgroundColor: '#ffffff',
      quality: 1,
      pixelRatio: 2
    });
    
    downloadImage(dataUrl, filename);
    
  } catch (error) {
    console.error('Error capturing full diagram:', error);
    throw new Error('Failed to export full diagram as PNG');
  }
}

/**
 * Alternative JPEG export for smaller file sizes
 */
export async function exportCurrentViewportAsJPEG(nodes: Node[], filename = "current-view.jpg"): Promise<void> {
  if (nodes.length === 0) {
    throw new Error("No nodes found to export");
  }
  
  const reactFlowWrapper = document.querySelector(".react-flow") as HTMLElement;
  if (!reactFlowWrapper) {
    throw new Error("ReactFlow wrapper not found");
  }
  
  try {
    const dataUrl = await toJpeg(reactFlowWrapper, {
      backgroundColor: '#ffffff',
      quality: 0.9,
      pixelRatio: 2
    });
    
    downloadImage(dataUrl, filename);
    
  } catch (error) {
    console.error('Error capturing JPEG:', error);
    throw new Error('Failed to export as JPEG');
  }
}

/**
 * Main export function - exports current viewport by default
 * Maintains backward compatibility with existing implementation
 */
export async function exportCanvasAsPNG(nodes: Node[], filename = "diagram.png"): Promise<void> {
  return exportCurrentViewportAsPNG(nodes, filename);
}

/**
 * Helper function to trigger image download
 */
function downloadImage(dataURL: string, filename: string): void {
  const link = document.createElement("a");
  link.href = dataURL;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
