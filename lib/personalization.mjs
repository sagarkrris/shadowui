import { getPrepLabel } from "./prepTopics.mjs";
import { getTechTheme } from "./techTheme.mjs";

const FALLBACK_NAME = "there";

function cleanName(name) {
  return String(name || "")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 40);
}

function escapeForDoubleQuotedString(value) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function toIdentifier(name, suffix = "") {
  const cleaned = cleanName(name)
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");

  const identifier = cleaned || "Candidate";
  return `${/^[0-9]/.test(identifier) ? "Candidate" : ""}${identifier}${suffix}`;
}

export function getDisplayName(profile) {
  return cleanName(profile?.name) || FALLBACK_NAME;
}

export function buildUserPrepLabel(profile) {
  const name = getDisplayName(profile);
  const prepLabel = getPrepLabel(profile?.stack);

  return name === FALLBACK_NAME ? prepLabel : `${name}'s ${prepLabel}`;
}

export function getStackGreeting(profile) {
  const name = getDisplayName(profile);
  const escapedName = escapeForDoubleQuotedString(name);
  const theme = getTechTheme(profile?.stack);
  const prepLabel = getPrepLabel(profile?.stack);
  const prepNoun = prepLabel.replace(/\bPrep\b/, "prep");
  const salutation = `Namaskara, ${name}`;
  const context =
    name === FALLBACK_NAME
      ? `${prepNoun} ready.`
      : `${prepNoun} ready for ${name}.`;

  const greetings = {
    java: `public class ${toIdentifier(name, "Prep")} { ready(); }`,
    python: `print("Namaskara, ${escapedName}")`,
    react: `<${toIdentifier(name, "Prep")} ready />`,
    node: `npm run prep -- --user="${escapedName}"`,
    javascript: `console.log("Namaskara, ${escapedName}")`,
    ruby: `puts "Namaskara, ${escapedName}"`,
    rust: `println!("Namaskara, ${escapedName}");`,
    sap: `CALL FUNCTION 'INTERVIEWIQ_PREP' EXPORTING candidate = '${name.replace(/'/g, "''")}';`,
    sql: `SELECT prep_plan FROM interviewiq WHERE candidate = '${name.replace(/'/g, "''")}';`,
    postgresql: `SELECT prep FROM shadowprep WHERE candidate = '${name.replace(/'/g, "''")}';`,
    mongodb: `db.prep.findOne({ candidate: "${escapedName}" })`,
    aws: `aws prep start --candidate "${escapedName}"`,
    azure: `az prep start --candidate "${escapedName}"`,
    docker: `docker compose up ${toIdentifier(name, "Prep").toLowerCase()}`,
    go: `fmt.Println("Namaskara, ${escapedName}")`,
  };

  return {
    salutation,
    headline: greetings[theme.key] || salutation,
    context,
    stackBadge: theme.label,
  };
}
