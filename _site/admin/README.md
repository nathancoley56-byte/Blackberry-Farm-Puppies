# Content manager previews

The page and litter previews use the site's Jekyll layouts, includes, theme and
stylesheet. Jekyll generates `admin/preview-data.json` during each build; rebuild
the site after changing templates, theme data, or other entries that a preview
references. The entry currently being edited is rendered from its unsaved fields.
The global theme preview offers Bernedoodles and home page views.

The browser renders Liquid and Markdown separately from Jekyll, so unusual
Markdown or Liquid syntax may differ from the published build. Site scripts and
third-party widgets are not run inside the preview.

For local editing, run `bundle exec jekyll serve` and `npx decap-server` from
the site directory, then open `http://localhost:4000/admin/`. The local proxy
can read and write site files without authentication; keep it bound to localhost.

## Editing Bernedoodles

Open **Pages > All Bernedoodles** to edit the breed page and all Bernedoodle
litters together. One publish saves the shared data file and the next site build
updates both the breed page and each individual litter page. The separate
**Cavapoo Litters** collection is for Cavapoos only.

Reorder the Bernedoodle Litters list in the editor to change both the breed
page and the navigation dropdown. The preview reflects the new order before
publishing; the live site changes after publishing and the site build completes.

Each litter's individual page address must be unique and contain only lowercase
letters, numbers and hyphens. Keep an existing address unchanged to preserve its
link. Removing a litter removes its individual page on the next build. The build
fails if an address is invalid or conflicts with another litter.

Use **Preview page** at the top of the All Bernedoodles preview to switch
between the breed page and each individual puppy page. Both views reflect
unsaved edits, including details that appear only on individual pages. Continue
editing in the shared fields and publish once to update all the pages.

## Seasonal banner design

Under **Site Design > Global Theme**, upload a **Seasonal Design** image to
repeat it across the green separators between puppy groups. Select the
Bernedoodles preview to see those areas; a sample separator and image-load status
also appear at the top of the theme preview. Banners with text remain solid Brand
Green. Remove the image to restore the solid Brand Green color to the separators.

## Litter format

Under **Site Design > Litter Format**, adjust font size, bold and alignment for
each labeled piece of text. Sizes use rem units; 1 rem normally equals 16 pixels.
Font-size boxes show the desktop reference values; text scales together to 80%
of those sizes on narrow screens. Spacing defaults reflect the preview width,
and custom spacing scales with the text. Editing a size sets its desktop value, and
**Use default** restores responsive styling. The fixed preview labels are
examples, not editable puppy information. Changes apply to current and future
Bernedoodle and Cavapoo groups on both breed and individual pages after
publishing and rebuilding. Parent details appear in the preview expanded, but
remain expandable on the customer site.

Puppy color and price normally share a line; choosing an explicit alignment for
either places them on separate lines so each alignment can work independently.
The controls between the text sections on the left adjust vertical spacing in
rem for both breeds. Use the arrows or type a value from -5 to 10. Negative
values move lines closer and may cause text to overlap; use
**Use default** to restore the previous setting. Changing the space between color and price places them on separate
lines. The example controls follow the order shown; actual parent details remain
inside their expandable sections on customer pages.

The parent photo controls set the maximum width of each photo and maximum gap
between them. Both shrink proportionally on narrow screens.
