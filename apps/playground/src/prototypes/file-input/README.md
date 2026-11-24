# FileInput, Dropzone, FileList, and FileItem design reference

Open `?item=file-input` and `?item=dropzone` in the workbench to inspect the approved designs. This reference specifies the intended experience for the library implementation.

## Purpose and boundaries

FileInput is a compact form or inspector slot for local file selection. Dropzone is a visible intake for one or several files. FileList and FileItem show local selections, application-owned operations, or saved attachments. Selecting a file does not upload it. A completed transfer does not imply successful verification.

Network transport, resumable uploads, scheduling, server deletion, archive extraction, directory import, image editing, and media playback belong to the application. The family supplies a coherent presentation and clear recovery actions without inventing their results. Image preview is optional; an ordinary file glyph remains the default. A saved attachment can have a download link without pretending to be a new local File.

## Anatomy and geometry

| Part                                | S          | M          | L          |
| ----------------------------------- | ---------- | ---------- | ---------- |
| FileInput button minimum height     | 30px       | 40px       | 48px       |
| Gap between button and selection    | 12px       | 16px       | 20px       |
| Dropzone minimum height / padding   | 160 / 12px | 200 / 16px | 250 / 24px |
| FileItem block padding / column gap | 8 / 8px    | 12 / 12px  | 16 / 12px  |
| Optional thumbnail frame            | 28px       | 32px       | 40px       |

FileInput starts with one **Choose file** button. The same button remains available after selection. The filename and optional size appear beside it as text. Click, Enter or Space on the button to choose again. Remove is the single trailing icon action in the selection group, sized like a small IconButton, with a 30px target on fine pointers and 44px on coarse pointers. When inline space runs out, the selection and Remove move down together and the filename can wrap. Multiple selection uses a stable **Add files** label, a count and optional total size. Individual actions live in a sibling FileList.

Default uses a neutral Secondary Button, and Ghost uses a neutral Ghost Button. Their material, hover and press behavior follow Button. The filename stays neutral and selectable. The button's accessible name includes the action and the field label when supplied. Its description includes the current selection and whether a selection is required. Put validation in the message below the control. Keyboard focus surrounds the active button. An incoming file drag gives the action and selection group a stronger neutral dashed contour and changes the button copy to **Drop file** or **Drop files**.

Dropzone centers a short invitation, **Drop files or browse**, above format and size constraints inside the same receiving surface. Neutral primary ink, semibold weight and an underline identify the browse action. The description uses `caption-m`, muted ink and an 8px gap. It remains visible during drag and provides the picker's accessible description. Use S for a supplementary intake, M for standard intake in a form such as Folio Batch Import and L when upload is the primary task. The surface stays transparent with a neutral solid contour and surface-m radius. The whole surface opens the native picker as one keyboard target. During drag, a stronger neutral dashed contour and **Release to add** identify the receiving target. The prompt uses the invitation's grid cell to avoid a height shift. The picker keeps its accessible name. Rejection appears as a danger message below the surface.

FileList is a flat collection. A single subtle divider separates adjacent visible rows. Each row consists of a small unboxed file glyph, a filename with optional metadata, and trailing actions. Thumbnail rows use `object-fit: cover` and radius-xs. In mixed lists, the leading column reserves the thumbnail width so names line up. Provide a file glyph fallback for a missing or broken image. Pixel keeps rectangular corners at 0px.

The filename aligns to the start of the row and uses its own text direction. Size, phase and percentage sit together beneath it. Status glyphs and spinners inherit the caption size and center on the first line of the phase text, including when application-provided text wraps. The 4px Progress track sits beneath the metadata with a 6px gap, capped at 16rem. Metadata wraps as needed and the track follows the available width. Remove stays at the top inline end across phases. Retry appears as text before Remove. At 340px and below, Retry moves beneath the text while Remove holds its position. Row actions are 30px tall with a fine pointer and occupy at least 44×44px each with a coarse pointer.

## States and priorities

| State                                   | Appearance and expected result                                                                                                                                                                                                    |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rest / hover                            | FileInput follows Button. Dropzone hover strengthens the contour.                                                                                                                                                                 |
| Press                                   | FileInput follows Button. Dropzone thickens the underline on its browse action.                                                                                                                                                   |
| Keyboard focus                          | Button focus stays local. Dropzone uses a 2px outline, offset 3px. Remove, Retry and download retain local focus.                                                                                                                 |
| File drag                               | FileInput shows “Drop file” or “Drop files” and Dropzone shows “Release to add”. Both use a stronger neutral dashed contour on the transparent surface. Validate after drop. Text and URL drags leave the intake at rest.         |
| Field info / success / warning / danger | Both button roles use a glyph and an informative or corrective message below.                                                                                                                                                     |
| Checking selection                      | The picker uses Button’s waiting indicator and an adjacent “Checking…” label. Keep the current selection visible and restore actions on completion.                                                                               |
| Read-only                               | Preserve text contrast, selection and keyboard inspection. FileInput says “Read only” beside its value. Dropzone replaces the invitation with an availability label and relevant guidance. Saved-file download remains available. |
| Disabled                                | Mute the unavailable control and suppress its status and activity. Keep the reason legible outside its disabled paint. The picker and mutation actions are unavailable.                                                           |

Availability takes precedence, followed by drag, validation and ordinary hover. Drag keeps a keyboard focus ring and leaves earlier corrective text in place until the next attempt. Static and live states share this priority.

Soft uses its matte contextual controls, Frost picks up the active base or translucent overlay context, and Pixel has square geometry. The theme owns Button, Progress and Spinner. Reduced motion keeps the waiting indicator legible and removes progress interpolation. Forced colors keeps system borders and Highlight focus. Text and shape convey the outcome independently of status color.

## Intake and recovery

Both picker and drop have the same intended acceptance rules. Constraints appear before the attempt: allowed formats, per-file size, and count when relevant. Do not rely on the native `accept` hint alone. Folder drops are rejected with “Choose files, not folders.” The drop scope stays local; the family does not take over the page.

Single selection replaces the old reference only after acceptance. Canceling the native dialog, choosing the same file again, or rejecting a replacement preserves the current reference. Clear removes it and returns focus to the picker. Multiple selection appends accepted files and leaves the intake visible. Duplicate identity is name + size + type + lastModified; a duplicate does not create another row.

Mixed type/size/duplicate results retain accepted neighbors and say how many were added, naming the rejected files and correction. Errors belong below intake, not in a fake failed-upload row. If the incoming batch would exceed the count limit, reject the whole incoming batch before per-file admission; preserve the previous collection. Full rejection also preserves it. Do not silently keep an arbitrary subset to fill the limit. On correction clear stale errors; reset clears local selection and attempt feedback.

The live intake accepts `.md` and `.zip` from the chooser or a drop, up to 2 MB each and three files total. Its polite status reports the accepted count and explains every rejection in the same update. Sample controls let reviewers exercise partial acceptance and atomic count rejection without their own files. Its intentionally small identity check uses name + size; production must use the full identity above. The FileInput local study accepts one PDF/Markdown up to 2 MB. The named FileInput Playground uses the browser’s file field for selection, drop, submission, and reset. Dropping several files into its single-file mode preserves the existing selection. The multiple-file list case demonstrates an application that accumulates selections separately. The two FileInput compositions read the submitted attachment metadata and preview the contents of a small local text file. The image replacement composition accepts one PNG or JPEG up to 10 MB and keeps its original bytes available for download until removal or an accepted replacement. Generic visual samples do not implement these admission rules.

The stand uses local Noto Sans Arabic text subsets for its mixed-script filenames and feedback. Latin extensions retain the preset font. Consumer applications provide fonts for their supported scripts. See the [file](../../../public/assets/licenses/file-input-arabic-400.txt), [alert](../../../public/assets/licenses/alert-arabic.txt), and [avatar](../../../public/assets/licenses/avatar-arabic-400.txt) fixture records.

## File lifecycle

| Phase                          | Presentation                                                                                                                    |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| Selected / queued              | Filename and optional size. Use “Selected locally” or “Waiting to upload” when the phase needs explanation.                     |
| Known transfer                 | Explicit phase, 4px measured track and percentage. Zero is an empty range.                                                      |
| Unknown transfer               | Waiting track and “Connecting…”; no invented percentage or extra spinner.                                                       |
| Transfer at 100%               | Full measured track and “Transfer complete · Awaiting verification.” Keep neutral outcome.                                      |
| Unknown verification           | Spinner with “Checking file…”; no second waiting track by default.                                                              |
| Measured verification          | Same track and percentage, labeled for that phase; no redundant spinner.                                                        |
| Paused                         | Retain the last measured amount, quiet neutral fill, explicit reason; any Resume belongs to application actions.                |
| Confirmed success              | Small success glyph beside neutral result text. Remove the progress track and preserve focus.                                   |
| Failed transfer / verification | Reason in danger text. Retain the last measured amount when supplied. Show Retry when the operation can be repeated.            |
| Removing                       | Keep the row and show “Removing…” with Spinner. Remove becomes unavailable in its existing slot until the app confirms removal. |

Remove has one name throughout the lifecycle. During transfer it also asks the application to stop that operation; it never changes into a different Cancel button. A rejected removal keeps the file, restores its prior phase, and explains the failure inline; the existing Remove action can be tried again. A retry retains the filename and row position, switches to the app's new phase, and clears stale failure feedback. If a focused Retry disappears, move focus to the row's surviving Remove action. Asynchronous phase changes never steal focus from elsewhere.

After confirmed removal, move focus to the next available Remove, then the previous one, then the picker. Clear returns to the picker. Announce accepted counts, rejected attempts, meaningful phases, confirmed outcomes, and removals politely; never announce every percentage. New feedback should not erase the constraint summary or hide unrelated actions. A long rejection batch may wrap below the well; it is not a toast or a modal interruption.

## Inspection and implementation boundary

`file-input`: roles, interaction, feedback, availability, multiple, live, overflow, surfaces. `dropzone`: sizes, interaction, feedback, availability, row-sizes, lifecycle, live, overflow, surfaces. Cases identify pinned appearances and actions. Live cases provide working local behavior. Surface plates are in-flow material studies, not dialogs. The existing `10-workspace-admin` scene consumes the same family and remains a product-fit reference.

Inspect all six presets, Base/Overlay, 360/768/1280/1440px, 120% text, RTL, keyboard focus and pointer/drop interaction. Empty, long, unavailable, failed, and waiting cases matter as much as the standard intake. Do not treat a contrast measurement as proof of optical balance.

The local phase study is explicitly controlled: no bytes are transmitted and no timer invents speed or success. Its Confirm removal control supplies the app's acknowledgement. Full form integration, native required validation, controlled/uncontrolled authority, disabled fieldsets, complete readonly submission behavior, picker-cancel differences across browsers, announcement batching, reliable directory detection, Object URL cleanup, failed-image fallback, and reusable focus recovery are library implementation obligations. Preserve the outcomes above while designing the exact TypeScript API and DOM/ARIA mechanism. Then switch consumers to the package, remove temporary prototype/CSS, and publish the verified contract in `docs/components/file-input.md`.

References for picker discoverability and attachment workflows. [GOV.UK File upload](https://design-system.service.gov.uk/components/file-upload/), [Linear comments](https://linear.app/docs/comment-on-issues), [React Aria DropZone](https://react-aria.adobe.com/DropZone).
