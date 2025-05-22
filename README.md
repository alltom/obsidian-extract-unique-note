# Extract Unique Note (the way alltom wants it)

You'll probably be unhappy with this extension without modification. Instead of reading any settings and trying to fit into the workflow of the current user, I just hard-coded all my preferences. Sorry!

## Usage

1. Select the text that you want to become the body of a new unique note. The first line will become the title.
2. Invoke the "extract-unique-note" command.

Effects:

1. Creates a new note with a timestamp name like YYYYMMDDHHMMSS.md.
    - Replaces the note's body with the selection, prepending "#" so that the first line becomes the note's title.
    - Adds the "review" tag to the page.
    - Adds the first line of the page as an alias for the page.
2. Opens the new note in a new tab.
3. Replaces the original selection with a link to the new note, with the first line as its link text.

## Development

- Install dependencies: `npm install`
- Update dependencies: `npm update`
- Compile: `npm run dev` (produces manifest.json, main.js, and styles.css)
- Bump version: `npm version patch|minor|major`
