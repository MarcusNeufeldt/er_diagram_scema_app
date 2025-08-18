import html2canvas from "html2canvas";
import { Node } from "reactflow";

export async function exportCanvasAsPNG(nodes: Node[], filename = "diagram.png") {
  if (nodes.length === 0) throw new Error("No nodes found to export");
  
  const viewport = document.querySelector(".react-flow__viewport") as HTMLElement;
  if (!viewport) throw new Error("ReactFlow viewport not found");
  
  const canvas = await html2canvas(viewport, { useCORS: true, allowTaint: true, scale: 2 });
  const dataURL = canvas.toDataURL("image/png");
  const link = document.createElement("a");
  link.href = dataURL;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
