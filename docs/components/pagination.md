# Pagination

Use Pagination to move through a collection with a known number of pages. Local buttons update items in place. Links give each page an address people can bookmark, copy, or open in another tab. Place result counts, page-size controls, request status, and recovery actions in the collection.

## Quick start

```tsx
import { Pagination } from "@docouno/unica";
import "@docouno/unica/styles.css";

<Pagination pageCount={24} defaultPage={4} aria-label="Search result pages" />;
```

Pass `onPageChange` to update the collection. With `page`, the handler requests a change and the application supplies the confirmed page. Keep the current page while a request is pending and update it when the corresponding results are ready.

```tsx
<Pagination
  pageCount={pageCount}
  page={committedPage}
  onPageChange={requestPage}
/>
```

For URL navigation, pass the page from the current route and build an address for each page.

```tsx
<Pagination
  aria-label="Archive pages"
  pageCount={24}
  page={route.page}
  getPageHref={(page) => `/archive?page=${page}`}
/>
```

The default is an anchor. To integrate a router with a `to` prop, use `renderLink={({ href, ...anchor }) => <RouterLink to={href} {...anchor} />}`. Forward the supplied props, children, and any ref to the final anchor. Preserve the anchor's native behavior for modified clicks and new tabs. The destination manages history, scroll, title, and focus for the new view.

## API

| Prop           | Contract                                                                                                                                                                                                                                                      |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pageCount`    | Required positive safe integer. The landmark is omitted for zero, one, or an invalid count.                                                                                                                                                                   |
| `defaultPage`  | Initial page for local buttons. Defaults to `1` and is read when the instance mounts.                                                                                                                                                                         |
| `page`         | Confirmed page for controlled buttons or links. Omit `defaultPage` in either mode.                                                                                                                                                                            |
| `onPageChange` | Optional `(page: number) => void` for button modes. Fires when a user activates a different, available page.                                                                                                                                                  |
| `getPageHref`  | `(page: number) => string` for link mode. Requires `page`. Omit `onPageChange` and `defaultPage`.                                                                                                                                                             |
| `renderLink`   | Optional `(props: PaginationLinkProps) => ReactElement` for link mode. Render one link using the supplied anchor props.                                                                                                                                       |
| `size`         | `s`, `m`, or `l`. Defaults to `m`.                                                                                                                                                                                                                            |
| `format`       | `auto` shows page numbers if the row fits and the container is at least 360 CSS pixels wide. `pages` shows numbers whenever the row fits. Both fall back to the compact position. `compact` always shows the position between the arrows. Defaults to `auto`. |
| `messages`     | Optional `Partial<PaginationMessages>` for the control names, position, and digits.                                                                                                                                                                           |

The root is a native `nav`. It accepts native attributes such as `id`, `className`, `style`, `dir`, and `lang`, and a ref to the `HTMLElement`. Use different `aria-label` or `aria-labelledby` values for distinct pagination landmarks on the same screen. The fallback label is “Pagination.”

Page numbers start at one. Finite fractions are truncated towards zero. Nonfinite page values start at one. The displayed page is constrained to the available range. If a valid range shrinks, a local page stays at the clamped position when the range grows again. A controlled page continues to reflect the supplied value projected onto the current range. Changing the range never emits a request. Switching from a supplied page to local buttons on the same instance continues from the last confirmed page. To intentionally reset local state, mount a new instance with a new React key.

## Interaction and layout

Tab and Shift+Tab follow the visible controls. Enter activates buttons and links, while Space activates buttons. The current number has `aria-current="page"`. Its button remains focusable. Activating a different button requests a page change. The current link retains its address. Both arrows keep their places at the ends of the range. An unavailable arrow has no Tab stop.

A surviving focused control keeps focus. If the focused control disappears or becomes unavailable, focus moves to the current number or an available arrow. When resizing hides a focused number, focus goes to Next if available and Previous otherwise. Focus already placed outside the landmark stays where it was. If the whole navigation disappears, the collection can direct focus to its results heading.

The buttons work inside forms without submitting, serializing a field, or changing page on reset. A disabled fieldset disables its pagination buttons. Assistive technology reads the compact position as ordinary text. Use a neighboring status to announce updates to the result range.

Pagination fits its container and uses the theme's geometry and colors. Provide room for the focus outline when placing the control beside a clipping edge. Apply `justify-items: end` to the navigation root when the footer places the control at the logical end. At narrow widths, place the result range and pagination on two rows starting at the same logical edge.

## Translate labels and numbers

The defaults are “Previous page,” “Next page,” “Page {page},” “Page {page} of {pageCount},” and `0123456789`. `pageLabel` accepts one `{page}` marker. `position` accepts one `{page}` and one `{pageCount}` marker in either order. Use a nonbreaking space to keep a label and number together in a translation. Supply ten distinct printable Unicode characters in numeric order for `digits`. Each missing or invalid message falls back independently.

```tsx
<Pagination
  aria-label="صفحات النتائج"
  dir="rtl"
  lang="ar"
  pageCount={24}
  defaultPage={12}
  messages={{
    previousPage: "الصفحة السابقة",
    nextPage: "الصفحة التالية",
    pageLabel: "الصفحة {page}",
    position: "من أصل {pageCount}، الصفحة {page}",
    digits: "٠١٢٣٤٥٦٧٨٩",
  }}
/>
```

The supplied digits are used in the text and accessible names on the server and in the browser. The controls follow `dir`, and the compact position follows the direction of its text. CSS selects the visible representation before hydration. Both layouts share the same arrows.
