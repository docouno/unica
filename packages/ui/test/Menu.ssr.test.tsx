// @vitest-environment node
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import {
  Button,
  Menu,
  ContextMenu,
  ContextMenuTrigger,
  MenuCheckboxItem,
  MenuContent,
  MenuItem,
  MenuRadioGroup,
  MenuRadioItem,
  MenuTrigger,
} from '../src/index.js';

it('renders a context row without a wrapper and keeps menu controls out of form data', () => {
  const html = renderToStaticMarkup(
    <table>
      <tbody>
        <ContextMenu>
          <ContextMenuTrigger>
            <tr>
              <td>
                <MenuTrigger>Actions</MenuTrigger>
                <MenuContent aria-label="Actions">
                  <MenuItem href="/record" disabled>
                    Unavailable link
                  </MenuItem>
                  <MenuItem href="/record" rel="noreferrer">
                    Open record
                  </MenuItem>
                  <MenuCheckboxItem defaultChecked>Preview</MenuCheckboxItem>
                  <MenuRadioGroup defaultValue="">
                    <MenuRadioItem value="">Name</MenuRadioItem>
                    <MenuRadioItem value="updated">Updated</MenuRadioItem>
                  </MenuRadioGroup>
                </MenuContent>
              </td>
            </tr>
          </ContextMenuTrigger>
        </ContextMenu>
      </tbody>
    </table>,
  );
  expect(html).toMatch(/<tbody><tr[^>]*><td>/u);
  expect(html).toMatch(
    /<div(?=[^>]*role="menu")(?=[^>]*tabindex="-1")(?=[^>]*popover="auto")[^>]*>/u,
  );
  expect(html.match(/href="\/record"/gu)).toHaveLength(1);
  expect(html.match(/aria-checked="true"/gu)).toHaveLength(2);
  expect(html).not.toContain('<input');
  expect(html).not.toContain('type="submit"');
});

it('owns native invoker attributes and defers IDREF checks until mount', () => {
  const html = renderToStaticMarkup(
    <Menu>
      <MenuTrigger asChild>
        <Button type="submit" command="show-modal" commandFor="dialog">
          Actions
        </Button>
      </MenuTrigger>
      <MenuContent aria-label="Actions" aria-labelledby="missing" />
    </Menu>,
  );
  expect(html).toContain('type="button"');
  expect(html).not.toMatch(/command=|commandfor=|type="submit"|aria-labelledby="missing"/u);
});
