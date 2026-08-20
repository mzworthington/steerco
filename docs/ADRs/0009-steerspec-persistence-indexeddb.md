---
status: Accepted
date: 2026-08-20
deciders: ['SteerCo']
---

# 0009. SteerSpec persistence using IndexedDB and File System Access API

## Context and Problem Statement

SteerCo is designed as a local-first application where the primary source of truth is a `steertree.yaml` file stored in a user-selected local directory. While the browser's File System Access API allows reading and writing directly to the user's local disk, the raw `FileSystemDirectoryHandle` is lost when the page is reloaded. Prompting the user to select their workspace folder on every page refresh or tab reopening results in a poor user experience.

## Decision Drivers

- Provide a seamless, desktop-like experience for local-first users.
- Keep data strictly local and secure without cloud databases or authentication in Slice 1.
- Avoid losing user progress on accidental reload or browser crash.

## Considered Options

- **Option A: Re-prompt on refresh**. Do not persist the handle; ask the user to pick the directory again.
- **Option B: Session or LocalStorage only**. Save the text content of the file in local storage but lose the connection to the actual file on disk.
- **Option C: Store the `FileSystemDirectoryHandle` in IndexedDB**. IndexedDB is capable of serializing and storing directory handles. Upon reload, the app can retrieve the handle, though the browser may require a one-click permission re-prompt before the handle can be read or written.

## Decision Outcome

Chosen option: "**Option C**", because it provides the best UX balance.

- Working drafts/session state live in `sessionStorage` (so edits are not lost on refresh).
- The `FileSystemDirectoryHandle` itself is serialized and saved in IndexedDB (`steerco-workspace`).
- On application reload, the directory handle is restored, and the user is only asked to grant read/write permission rather than having to locate the directory again on disk.

### Consequences

- Good, because folder workspace connections survive browser refreshes.
- Good, because it requires zero server-side state or auth.
- Bad, because browser permission re-prompts are still occasionally required due to browser security models (though it's only a single-click prompt).

## Links

- Implemented in `app/src/adapters/workspaceDirectoryStore.ts`
- PRD reference: [F09 - SteerSpec persistence](../prds/F09-steerspec-persistence.md)
