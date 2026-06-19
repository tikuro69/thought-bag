# Thought Bag

Thought Bag is a small, loose thinking tool for catching words and ideas that come up during casual conversation.

Instead of turning everything into a rigid note or clean diagram, it lets you drop ideas as soft floating bubbles, move them around, gather them into groups, and come back later to see what was there.

## Live Demo

https://tikuro69.github.io/thought-bag/

## Screenshot

![Thought Bag screenshot](./screenshot.png)

## Why I Made This

Sometimes good ideas do not arrive as neat bullet points.

They show up in conversation, in half-finished thoughts, in random associations, or in things you say before you fully know what you mean. I wanted a tiny tool that feels lighter than a document and less formal than a mind map.

Thought Bag is meant for that in-between space: not polished notes, not task management, just a place to hold thoughts for a while.

## What It Can Do

- Add keyword bubbles from text input
- Add floating text for notes or fragments that should stay as plain text
- Drag bubbles around freely
- Drag floating text around freely
- Draw around multiple bubbles to group them into a larger bubble
- Ungroup a large bubble back into small bubbles
- Change colors manually
- Save and reopen your current state with `Save Local` / `Open Local`
- Restore grouped states and floating text, not just individual bubbles
- Keep your data local as JSON files without server-side storage

## Basic Use

1. Type a word or short phrase into the input field.
2. Press `Cmd + Enter` to add it as a bubble.
3. Press `Shift + Cmd + Enter` to add the input as floating text instead.
4. Drag bubbles or floating text around to make space or place related ideas near each other.
5. Double-click floating text to edit it. Press `Cmd + Enter` to finish editing, or `Escape` to cancel.
6. Select floating text and press `Delete` or `Backspace` to remove it.
7. Draw a loose shape around several bubbles to turn them into a group.
8. Click the `×` on a group bubble to break it back into small bubbles.
9. Click a bubble to change its color if you want to reorganize visually.
10. Use `Save Local` to download the current state as a JSON file, and `Open Local` to restore it later.

## Run Locally

Thought Bag is a static browser-based web app.

Open `docs/index.html` directly in your browser.

No server-side storage is used. Your data is saved and restored locally as JSON files.

## Good For

Thought Bag works well for:

- collecting words that come up during conversation
- capturing early-stage ideas before they become structured notes
- clustering related themes in a soft, visual way
- personal reflection, brainstorming, and small creative sessions

It is especially useful when you want to notice patterns without forcing everything into categories too early.

## Notes / Limitations

- This is a lightweight local tool, not a full note-taking system.
- It is designed for short words and small idea fragments, not long-form writing.
- Floating text is useful for loose notes, labels, or context that should not become a bubble or group.
- Grouping keeps items in a flat internal structure for simplicity.
- Local saves are exported as JSON files and restored through the browser.
- There is no voice input feature anymore; the app now focuses on simple keyboard-based capture.

## Current Name

The current name of the project is `Thought Bag`.

Earlier versions used the name `Thought Recorder`, but that is no longer the active title.
