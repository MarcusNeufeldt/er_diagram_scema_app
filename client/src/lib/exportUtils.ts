import html2canvas from 'html2canvas';
import { Node } from 'reactflow';

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Calculates the bounding box that encompasses all nodes on the canvas
 * @param nodes Array of ReactFlow nodes
 * @param padding Optional padding around the bounding box (default: 50px)
 * @returns BoundingBox object with position and dimensions
 */
export function calculateNodesBoundingBox(nodes: Node[], padding: number = 50): BoundingBox | null {
  if (nodes.length === 0) {
    return null;
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  nodes.forEach(node => {
    // Get node dimensions - use more accurate defaults based on content
    let nodeWidth = node.width || 300; // Default width
    let nodeHeight = node.height || 200; // Default height

    // Adjust based on node type
    if (node.type === 'table') {
      nodeWidth = node.width || 300;
      nodeHeight = node.height || Math.max(200, 60 + (node.data?.columns?.length || 5) * 30);
    } else if (node.type === 'sticky-note') {
      nodeWidth = node.width || 200;
      nodeHeight = node.height || 150;
    } else if (node.type === 'shape') {
      nodeWidth = node.width || node.data?.width || 150;
      nodeHeight = node.height || node.data?.height || 100;
    }

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
 * Exports the ReactFlow canvas as a PNG image
 * @param nodes Array of ReactFlow nodes
 * @param filename Name for the downloaded file (default: 'diagram.png')
 * @param options Export options
 */
export async function exportCanvasAsPNG(
  nodes: Node[], 
  filename: string = 'diagram.png',
  options: {
    padding?: number;
    backgroundColor?: string;
    scale?: number;
  } = {}
): Promise<void> {
  const {
    backgroundColor = '#ffffff',
    scale = 2
  } = options;

  if (nodes.length === 0) {
    throw new Error('No nodes found to export');
  }

  // Find the ReactFlow viewport element
  const reactFlowViewport = document.querySelector('.react-flow__viewport') as HTMLElement;
  
  if (!reactFlowViewport) {
    throw new Error('ReactFlow viewport not found');
  }

  try {
    // Capture the entire ReactFlow viewport
    const canvas = await html2canvas(reactFlowViewport, {
      backgroundColor,
      scale,
      useCORS: true,
      allowTaint: true,
      logging: false,
      removeContainer: false
    });

    // Create download link
    const dataURL = canvas.toDataURL('image/png');
    const downloadLink = document.createElement('a');
    downloadLink.href = dataURL;
    downloadLink.download = filename;
    
    // Trigger download
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    
  } catch (error) {
    console.error('Error exporting PNG:', error);
    throw new Error('Failed to export diagram as PNG');
  }
}

/**
 * Alternative export method using ReactFlow's viewport transformation
 * This method captures the entire ReactFlow container and crops it to the bounding box
 */
export async function exportReactFlowAsPNG(
  nodes: Node[],
  filename: string = 'diagram.png',
  options: {
    padding?: number;
    backgroundColor?: string;
    scale?: number;
  } = {}
): Promise<void> {
  const {
    padding = 50,
    backgroundColor = '#ffffff',
    scale = 2
  } = options;

  const boundingBox = calculateNodesBoundingBox(nodes, padding);
  
  if (!boundingBox) {
    throw new Error('No nodes found to export');
  }

  // Find the ReactFlow container
  const reactFlowContainer = document.querySelector('.react-flow__viewport') as HTMLElement;
  
  if (!reactFlowContainer) {
    throw new Error('ReactFlow viewport not found');
  }

  try {
    // Capture the entire ReactFlow container
    const fullCanvas = await html2canvas(reactFlowContainer, {
      backgroundColor,
      scale,
      useCORS: true,
      allowTaint: true
    });

    // Create a new canvas with the bounding box dimensions
    const croppedCanvas = document.createElement('canvas');
    const ctx = croppedCanvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    croppedCanvas.width = boundingBox.width * scale;
    croppedCanvas.height = boundingBox.height * scale;

    // Draw the cropped portion
    ctx.drawImage(
      fullCanvas,
      boundingBox.x * scale,
      boundingBox.y * scale,
      boundingBox.width * scale,
      boundingBox.height * scale,
      0,
      0,
      boundingBox.width * scale,
      boundingBox.height * scale
    );

    // Create download link
    const dataURL = croppedCanvas.toDataURL('image/png');
    const downloadLink = document.createElement('a');
    downloadLink.href = dataURL;
    downloadLink.download = filename;
    
    // Trigger download
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    
  } catch (error) {
    console.error('Error exporting PNG:', error);
    throw new Error('Failed to export diagram as PNG');
  }
}