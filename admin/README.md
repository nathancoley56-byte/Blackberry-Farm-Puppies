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
