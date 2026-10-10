# Personal navigation

Rounded sidebar with Iconsax Linear SVGs from the official `iconsax` 0.1.1 npm package (Iconsax, MIT; https://github.com/iconsax/iconsax-npm). SVG geometry is unchanged; white strokes become currentColor. Assets are embedded in the PHP page to avoid extra requests and remain covered by the existing CSP.

Desktop collapse preference is stored locally under `life.sidebar.collapsed`. This is an interface preference only. Mobile uses a modal drawer with inert background, focus containment, Escape dismissal, backdrop dismissal, and automatic closure on view selection. At shorter screen heights the decorative note is hidden to keep controls accessible. No database migration or authentication change.

Checked local PHP preview: expanded/sidebar rail, collapse persistence after refresh, mobile drawer at 390px, navigation to Calendar and This week, Escape dismissal, and no horizontal page overflow. Public site validation passed. Live smoke checks recorded in the deployment checkpoint.
