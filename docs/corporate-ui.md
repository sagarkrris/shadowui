# InterviewIQ corporate interface

The product uses a shared neutral palette, blue actions, Arial typography, flat surfaces, small corner radii and explicit borders. The reference is the clarity and restraint of Google Cloud product pages; InterviewIQ retains its own name, content and navigation.

Public pages use a white document canvas with gray sections. Workspaces share one palette regardless of stack, retain stack names and icons, and support charcoal dark mode. The main menu, reading tools, search, notebooks and practice links remain functional. Workspace account, profile, help and session controls live under More; prep controls retain their dedicated menu. The watermark is one small noninteractive corner label.

`styles/corporate.css` supplies shared product tokens and adapts legacy inline workspace styles. Home, public navigation and reading layouts use their own CSS modules. `lib/corporateTheme.mjs` supplies the same colors to existing workspace components without changing their data contracts. No font or component-library dependency was added.

## Independent semantic review

This change adjusts presentation and control placement. Java lesson examples, claims, fixture declarations, diagram relationships, scenario transitions and backend contracts are unchanged by this redesign. Color changes retain diagram warning and selection distinctions; the diagram text view and interactive scenarios remain available. Invalid input, cancellation, retry, concurrency and ownership logic are outside this presentation change and remain covered by the mandatory existing behavioral gate.

Validation includes desktop/mobile public template and workspace accessibility checks, dark workspace checks, menu/search/account/profile/chat flows, reading and book mode, the full tech-blog gate, and visual inspection of the homepage, Company Prep, Today and article layouts. Actual results and infrastructure limitations are recorded in the delivered review artifacts. Automated accessibility checks do not establish assistive-technology usability.
