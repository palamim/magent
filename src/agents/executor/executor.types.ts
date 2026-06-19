interface Edit {
  path: string;
  oldText: string;
  newText: string;
}

interface Create {
  path: string;
  content: string;
}

export interface Execution {
  edits: Edit[];
  creates: Create[];
}
