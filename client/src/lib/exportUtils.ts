import html2canvas from "html2canvas";
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
 * This captures exactly what's visible on screen at the current zoom/pan level
 */
export async function exportCurrentViewportAsPNG(nodes: Node[], filename = "current-view.png"): Promise<void> {
  if (nodes.length === 0) {
    throw new Error("No nodes found to export");
  }
  
  // Find the ReactFlow container (what's currently visible)
  const reactFlowContainer = document.querySelector(".react-flow") as HTMLElement;
  if (!reactFlowContainer) {
    throw new Error("ReactFlow container not found");
  }
  
  try {
    const canvas = await html2canvas(reactFlowContainer, { 
      useCORS: true,
      allowTaint: true,
      background: '#ffffff'
    });
    
    const dataURL = canvas.toDataURL("image/png");
    downloadImage(dataURL, filename);
    
  } catch (error) {
    console.error('Error capturing current viewport:', error);
    throw new Error('Failed to export current view as PNG');
  }
}

/**
 * Exports the full diagram (all tables regardless of current zoom/pan) as PNG
 * This creates a comprehensive view of the entire database schema
 */
export async function exportFullDiagramAsPNG(nodes: Node[], filename = "full-diagram.png"): Promise<void> {
  if (nodes.length === 0) {
    throw new Error("No nodes found to export");
  }

  const boundingBox = calculateNodesBoundingBox(nodes, 50);
  if (!boundingBox) {
    throw new Error("Could not calculate diagram bounds");
  }

  // Find the ReactFlow viewport
  const viewport = document.querySelector(".react-flow__viewport") as HTMLElement;
  if (!viewport) {
    throw new Error("ReactFlow viewport not found");
  }

  // Store original styles
  const originalTransform = viewport.style.transform;
  const originalWidth = viewport.style.width;
  const originalHeight = viewport.style.height;

  try {
    // Temporarily adjust the viewport to show all content
    // Reset transform to show everything from origin
    viewport.style.transform = 'translate(0px, 0px) scale(1)';
    viewport.style.width = `${boundingBox.width}px`;
    viewport.style.height = `${boundingBox.height}px`;

    // Wait a brief moment for the DOM to update
    await new Promise(resolve => setTimeout(resolve, 100));

    // Capture with specific dimensions
    const canvas = await html2canvas(viewport, {
      useCORS: true,
      allowTaint: true,
      background: '#ffffff',
      width: boundingBox.width,
      height: boundingBox.height
    });

    const dataURL = canvas.toDataURL("image/png");
    downloadImage(dataURL, filename);

  } catch (error) {
    console.error('Error capturing full diagram:', error);
    throw new Error('Failed to export full diagram as PNG');
  } finally {
    // Restore original styles
    viewport.style.transform = originalTransform;
    viewport.style.width = originalWidth;
    viewport.style.height = originalHeight;
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
