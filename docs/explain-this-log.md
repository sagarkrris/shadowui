# Explain This Log

`/explain-log` publishes four static, fictional teaching artifacts: a Java stack trace, PostgreSQL execution plan, Java thread dump, and HTTP exchange. Readers select each line to reveal a bounded explanation, then see what the artifact proves, what it does not prove, and the next inspection steps. The feature accepts no uploads and stores no artifact text.

The detail page records `explain_log_viewed`, `explain_log_started`, `explain_log_completed`, and later-day `explain_log_returned` through the existing allowlisted analytics path. Values contain only the published slug. Completion means every displayed line was selected; it does not certify diagnosis quality. Return is a later UTC calendar day in a new tab session and remains a local browser measurement, not a distinct-reader metric.

When adding an artifact, retain its slug, include at least four line explanations, state evidence limits explicitly, use a primary reference, and update the review date and test coverage together.
