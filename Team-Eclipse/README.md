# Pixel Art Editor

> Draw pixel art in the browser, save it and share it.

Hack Day Haldia x GRID community - 6-hour build challenge

**Repo:** `team-eclipse` | **Stack:** HTML + vanilla JavaScript | **Difficulty:** Hard | **Time:** 6 hours

## Brief
Pixel art needs fast, forgiving tools. Build an editor with proper undo, fill and export.

## Core tasks (must-do)
- [ ] Canvas grid with selectable size (16 / 32 / 64) and zoom
- [ ] Tools: pencil, eraser, flood fill, colour picker, line and rectangle
- [ ] Editable palette
- [ ] Undo / redo
- [ ] Export the artwork as a scaled PNG
- [ ] Gallery of saved drawings in localStorage (save, reopen, delete)
- [ ] Works with touch as well as mouse

## Bonus tasks (only after the core works)
- [ ] Shareable link (encode the art in the URL hash)
- [ ] Animation frames with a live preview
- [ ] Mirror / symmetry drawing mode
- [ ] Import an image and pixelate it

## What is already here
- `index.html` - base page
- `script.js` - state, `save()` / `load()` (localStorage), `render()` and TODO function stubs
- `package.json` - `npm start` serves this folder

## Run locally
```bash
npm start   # or simply open index.html in your browser
```

## Deploy
Any static host works (for example GitHub Pages, Netlify or Vercel). There is no build step.

## Suggested pacing
- Hour 1: read this README, agree on a plan and split the work
- Hours 2-4: build the core tasks
- Hour 5: integrate, polish, then bonus tasks if time allows
- Hour 6: deploy, open the Pull Request, submit on the MLH platform (OrganizerHQ)

## Submission checklist
- [ ] All core tasks work end to end
- [ ] Project is deployed and the live link opens
- [ ] Pull Request created on the Voyage GitHub repository assigned to your team
- [ ] Project submitted on the MLH platform (OrganizerHQ) - instructions are shared at the start of the event

## Rules
- Build new features on top of this starter project and integrate them.
- Teams of 3-4; every member must be present.
- AI tools and open-source / open-weight models are fully allowed.
