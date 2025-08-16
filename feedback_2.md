Of course. I've done a deep dive into your implementation of the undo/redo feature.

First, let me commend you on your approach. Creating detailed markdown summaries like `UNDO_REDO_IMPLEMENTATION.md` and `UNDO_REDO_BUG_FIX.md` is an outstanding practice. It shows you're not just coding, but thinking deeply about the architecture and user experience.

You have correctly identified that this feature is critical and that its current state is unreliable. Your bug fix summary (`UNDO_REDO_BUG_FIX.md`) correctly identified and fixed a major logic flaw in how the history was saved. **That was an excellent catch.**

However, after reviewing the current implementation in `diagramStore.ts`, I see a more fundamental architectural issue that is causing the unreliability. The good news is that it's very fixable.

### The Core Problem: Manual History Management is Incomplete

Your current approach is to manually call `saveToHistory()` after specific, major operations like `addTable`, `deleteTable`, and `confirmConnection`.

**The Issue:** This approach misses a huge number of common user actions. **Any state change that doesn't explicitly call `saveToHistory` will not be recorded, leading to a broken and confusing undo stack.**

Here are the critical user actions that are **currently NOT being saved** to the undo history:

*   **Moving a table** (Node position change)
*   **Renaming a table** (`updateTable`)
*   **Adding a column** (`addColumn`)
*   **Updating a column** (changing name, type, PK, nullable status via `updateColumn`)
*   **Removing a column** (`removeColumn`)
*   **Auto-layout** (`autoLayout`)
*   **Editing a relationship** (via `confirmConnection` in `isEditing` mode)

This explains why it feels so unreliable. A user might move three tables, rename one, and then add a column. When they press Ctrl+Z, they expect the column addition to be reverted. Instead, the last *major* action (like adding a whole table) is reverted, wiping out all their recent small changes. This is a frustrating user experience.

---

### The Solution: An Automatic, Middleware-Inspired Approach

Instead of manually sprinkling `saveToHistory()` calls everywhere, we need a system that **automatically captures any state change** to `nodes` or `edges` and saves it to the history.

This is exactly what Zustand middleware does, but we can build a lightweight version of it directly into your store. The key is to centralize state updates through a single, history-aware setter function.

#### Step 1: Create a `setStateWithHistory` function in your store

This function will become the **only** way you should modify `nodes` and `edges`. It will automatically handle the history logic.

```typescript
// Inside your create<DiagramState>((set, get) => ({ ... })) in diagramStore.ts

// 1. Define the new history-aware setter
const setStateWithHistory = (newState: Partial<DiagramState>, actionName: string) => {
  const { history, historyIndex, maxHistorySize } = get();
  
  // Apply the new state
  set(newState);

  // Get the *full* state after the update
  const { nodes, edges } = get();

  const currentState: HistoryState = { 
    nodes: JSON.parse(JSON.stringify(nodes)), 
    edges: JSON.parse(JSON.stringify(edges)) 
  };

  // Truncate history if we've undone actions
  const newHistory = history.slice(0, historyIndex + 1);
  newHistory.push(currentState);
  
  if (newHistory.length > maxHistorySize) {
    newHistory.shift();
  }
  
  console.log(`History saved for: ${actionName} (total states: ${newHistory.length})`);
  
  set({ 
    history: newHistory, 
    historyIndex: newHistory.length - 1 
  });
};

// ... then inside the returned store object ...
```

#### Step 2: Refactor ALL State-Changing Actions to Use `setStateWithHistory`

Now, go through every function in `diagramStore.ts` that modifies `nodes` or `edges` and refactor it to use this new function. **Remove all manual calls to `saveToHistory`**.

Here are some examples:

```typescript
// --- Refactored Actions in diagramStore.ts ---

// This one was a major source of bugs. applyNodeChanges should be undoable.
onNodesChange: (changes) => {
  const newNodes = applyNodeChanges(changes, get().nodes);
  setStateWithHistory({ nodes: newNodes }, 'Node Change (move/select)');
  
  // Your Yjs sync logic can remain
  const { yNodes } = get();
  if (yNodes && changes.some(c => c.type === 'position' && !c.dragging)) {
    yNodes.delete(0, yNodes.length);
    yNodes.push(newNodes);
  }
},

addTable: (position) => {
  const newTable: TableData = { /* ... */ };
  const newNode: Node = { /* ... */ };
  const currentNodes = get().nodes;
  setStateWithHistory({ 
    nodes: [...currentNodes, newNode],
    selectedNodeId: newNode.id 
  }, 'Add Table');
},

deleteTable: (nodeId) => {
  const currentNodes = get().nodes;
  const currentEdges = get().edges;
  const newNodes = currentNodes.filter((node) => node.id !== nodeId);
  const newEdges = currentEdges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId);
  
  setStateWithHistory({ 
    nodes: newNodes, 
    edges: newEdges,
    selectedNodeId: get().selectedNodeId === nodeId ? null : get().selectedNodeId
  }, 'Delete Table');
},

updateColumn: (nodeId, columnId, updates) => {
  const newNodes = get().nodes.map((node) =>
    node.id === nodeId
      ? {
          ...node,
          data: {
            ...node.data,
            columns: node.data.columns.map((col: Column) =>
              col.id === columnId ? { ...col, ...updates } : col
            ),
          },
        }
      : node
  );
  setStateWithHistory({ nodes: newNodes }, 'Update Column');
},

// You need to apply this pattern to ALL other modifying functions:
// onEdgesChange, onConnect, confirmConnection, updateTable, addColumn, removeColumn, autoLayout, etc.
```

#### Step 3: Fix `importDiagram`

When a user imports a new diagram, the undo history should be completely reset. Your current implementation is close, but needs a slight adjustment.

```typescript
// --- Refactored importDiagram ---
importDiagram: (diagramData) => {
  const newNodes = diagramData.nodes || [];
  const newEdges = diagramData.edges || [];
  
  // Set the state directly, WITHOUT saving to history
  set({
    nodes: newNodes,
    edges: newEdges,
    selectedNodeId: null,
    contextMenuNodeId: null,
    pendingConnection: null,
  });

  // Now, reset the history with this as the initial state
  const initialHistoryState = {
    nodes: JSON.parse(JSON.stringify(newNodes)),
    edges: JSON.parse(JSON.stringify(newEdges)),
  };
  set({ history: [initialHistoryState], historyIndex: 0 });
  
  // Sync with Yjs if needed
},
```

### Why This New Architecture is Superior

1.  **Completeness:** It automatically captures *every single change* to the diagram's core state (`nodes`, `edges`). Moving a node, renaming a column—everything is now undoable.
2.  **Reliability:** There's a single source of truth for saving history. You can't forget to call `saveToHistory` because it's built into the state update mechanism itself.
3.  **Maintainability:** When you add a new feature that changes nodes or edges, you just use `setStateWithHistory`, and you get undo/redo for free. You don't have to remember to add a manual save call.

By implementing this centralized, automatic history management, you will fix the unreliability and create a truly robust and professional-feeling undo/redo system that covers all user actions on the canvas.