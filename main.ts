import { Editor, MarkdownView, MarkdownFileInfo, Plugin } from "obsidian";

export default class MyPlugin extends Plugin {
  async onload() {
    this.addCommand({
      id: "extract-unique-note",
      name: "Extract unique note",
      editorCheckCallback: (
        checking: boolean,
        editor: Editor,
        view: MarkdownView | MarkdownFileInfo,
      ) => {
        if (checking) {
          return this.getTitleFromSelection(editor).length > 0;
        }

        void this.extractUniqueNote(editor, view);
      },
    });
  }

  getSelection(editor: Editor): string {
    return editor.getSelection().trim();
  }

  getTitleFromSelection(editor: Editor): string {
    return this.getSelection(editor)
      .split("\n")[0]
      .replace(/\[\[([^\]|]*)\]\]/gm, "$1")
      .replace(/\[\[[^\]]*\|([^\]]*)\]\]/gm, "$1");
  }

  async extractUniqueNote(
    editor: Editor,
    view: MarkdownView | MarkdownFileInfo,
  ): Promise<void> {
    const currentFilename = view.file?.basename;

    const timestamp = toLocalTimestamp(new Date());
    const filename = `${timestamp}.md`;
    const title = this.getTitleFromSelection(editor);
    const noteBody = this.getSelection(editor).trim();

    let contents = `# `;
    if (currentFilename) {
      contents += `[[${currentFilename}]]: `;
    }
    contents += `${noteBody}\n`;

    contents += `## Inspired notes\n`;
    contents += `## Raw notes\n`;
    contents += `## Source material\n`;

    const newFile = await this.app.vault.create(filename, contents);
    this.app.fileManager.processFrontMatter(newFile, (frontmatter) => {
      frontmatter["tags"] = ["review"];
      frontmatter["aliases"] = [title];
    });

    // Link to the new file.
    editor.replaceSelection(`[[${timestamp}|${title}]]`);

    // Open the new file.
    const newFileLeaf = this.app.workspace.getLeaf("split");
    newFileLeaf.openFile(newFile, { active: false });
    setTimeout(() => {
      this.app.workspace.setActiveLeaf(newFileLeaf, { focus: true });
    });
  }
}

function toLocalTimestamp(date: Date): string {
  function pad(n: number): string {
    return ("0" + n).slice(-2);
  }

  return (
    date.getFullYear() +
    pad(date.getMonth() + 1) +
    pad(date.getDate()) +
    pad(date.getHours()) +
    pad(date.getMinutes()) +
    pad(date.getSeconds())
  );
}
