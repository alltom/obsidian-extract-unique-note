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

        void this.extractUniqueNote(editor);
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

  async extractUniqueNote(editor: Editor): Promise<void> {
    const timestamp = toLocalTimestamp(new Date());
    const filename = `${timestamp}.md`;
    const title = this.getTitleFromSelection(editor);
    const noteBody = this.getSelection(editor);

    const contents = `---
aliases:
- ${title}
tags:
- review
---
# ${noteBody}
`;

    const newFile = await this.app.vault.create(filename, contents);
    this.app.workspace.getLeaf("split").openFile(newFile, { active: false });
    editor.replaceSelection(`[[${timestamp}|${title}]]`);
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
