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
					return !!this.getTitleFromSelection(editor);
				}

				void this.extractUniqueNote(editor, view);
			},
		});

		this.addCommand({
			id: "create-unique-note",
			name: "Create unique note",
			callback: () => {
				void this.createUniqueNote();
			},
		});
	}

	getSelection(editor: Editor): string {
		return editor.getSelection().trim();
	}

	getTitleFromSelection(editor: Editor): string | undefined {
		const title = this.getSelection(editor)
			.split("\n")[0]
			.replace(/\[\[([^\]|]*)\]\]/gm, "$1")
			.replace(/\[\[[^\]]*\|([^\]]*)\]\]/gm, "$1");
		return title ? title : undefined;
	}

	async extractUniqueNote(editor: Editor, view: MarkdownView | MarkdownFileInfo): Promise<void> {
		const currentFilename = view.file?.basename;

		const timestamp = toLocalTimestamp(new Date());
		const filename = `${timestamp}.md`;
		const title = this.getTitleFromSelection(editor);
		const noteBody = this.getSelection(editor).trim();

		let contents = `# `;
		const linkToParent = currentFilename ? `[[${currentFilename}]]: ` : undefined;
		if (linkToParent) contents += linkToParent;
		contents += `${noteBody}\n`;

		const newFile = await this.app.vault.create(filename, contents);

		await this.app.fileManager.processFrontMatter(newFile, (frontmatter) => {
			if (title) {
				frontmatter["aliases"] = [title];
			}
			frontmatter["tags"] = ["daily-inbox"];
		});

		// Link to the new file.
		if (title) {
			editor.replaceSelection(`[[${timestamp}|${title}]]`);
		} else {
			editor.replaceSelection(`[[${timestamp}]]`);
		}

		// Open the new file in a new tab.
		const newFileLeaf = this.app.workspace.getLeaf("tab");
		await newFileLeaf.openFile(newFile, { active: false });
		setTimeout(() => {
			this.app.workspace.setActiveLeaf(newFileLeaf, { focus: true });

			if (linkToParent) {
				const view = newFileLeaf.view as MarkdownView;
				const editor = view.editor;
				const content = editor.getValue();
				const index = content.indexOf(linkToParent);
				if (index === -1) {
					console.error("could not find link to parent in new note", {
						content,
						linkToParent,
					});
					return;
				}
				const pos = editor.offsetToPos(index);
				const endPos = editor.offsetToPos(index + linkToParent.length);
				editor.setSelection(pos, endPos);
			}
		});
	}

	async createUniqueNote(): Promise<void> {
		const now = new Date();
		const yyyyMmDd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
		const newFile = await this.app.vault.create(
			`${toLocalTimestamp(now)}.md`,
			`[[${yyyyMmDd}]]\n`,
		);
		await this.app.fileManager.processFrontMatter(newFile, (frontmatter) => {
			frontmatter["tags"] = ["daily-inbox"];
		});

		const newFileLeaf = this.app.workspace.getLeaf("tab");
		await newFileLeaf.openFile(newFile, { active: false });
		this.app.workspace.setActiveLeaf(newFileLeaf, { focus: true });

		const editor = (newFileLeaf.view as MarkdownView).editor;
		editor.setSelection(editor.offsetToPos(editor.getValue().length));
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
