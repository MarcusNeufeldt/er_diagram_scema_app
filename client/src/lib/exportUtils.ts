import html2canvas from "html2canvas";
import { Node } from "reactflow";

/**
 * Exports the ReactFlow canvas as a PNG image
 * This function captures the ReactFlow viewport containing all database tables and diagrams,
 * then automatically downloads it as a PNG file suitable for documentation or printing.
 * 
 * @param nodes - Array of ReactFlow nodes (tables, sticky notes, shapes)
 * @param filename - Name for the downloaded PNG file (default: 'diagram.png')
 * @throws {Error} When no nodes are present or ReactFlow viewport is not found
 */
export async function exportCanvasAsPNG(nodes: Node[], filename = "diagram.png"): Promise<void> {
  if (nodes.length === 0) {
    throw new Error("No nodes found to export");
  }
  
  // Find the ReactFlow viewport element that contains all the diagram content
  const viewport = document.querySelector(".react-flow__viewport") as HTMLElement;
  if (!viewport) {
    throw new Error("ReactFlow viewport not found");
  }
  
  try {
    // Capture the viewport with html2canvas
    const canvas = await html2canvas(viewport, { 
      useCORS: true,        // Allow cross-origin images
      allowTaint: true,     // Allow tainted canvas
      background: '#ffffff' // White background for clean appearance
    });
    
    // Convert canvas to PNG data URL
    const dataURL = canvas.toDataURL("image/png");
    
    // Create and trigger download
    const link = document.createElement("a");
    link.href = dataURL;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
  } catch (error) {
    console.error('Error capturing canvas:', error);
    throw new Error('Failed to export diagram as PNG');
  }
}
