# Vendored skills — ui-ux-pro-max-skill

These seven skills are vendored from the upstream Claude Code plugin
**ui-ux-pro-max-skill** v2.13.0 by NextLevelBuilder (MIT).

- Source: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
- Commit: 7f69fed
- Upstream path: `.claude/skills/` (copied verbatim)
- License: MIT — see `LICENSE.ui-ux-pro-max-skill`

## Local modification

Upstream ships as a *plugin*, so `ui-ux-pro-max/SKILL.md` resolved its
search script through `${CLAUDE_PLUGIN_ROOT}`, a variable that is only set
for installed plugins. Installed here as project skills instead, those 11
command lines were rewritten to the project-relative path:

    python .claude/skills/ui-ux-pro-max/scripts/search.py "<query>" --domain <domain>

Run them with the working directory at the project root. No other file was changed.

## Updating

    git clone --depth 1 https://github.com/nextlevelbuilder/ui-ux-pro-max-skill /tmp/uipm
    cp -a /tmp/uipm/.claude/skills/. .claude/skills/
    sed -i 's#\${CLAUDE_PLUGIN_ROOT}/\.claude/skills/ui-ux-pro-max/scripts/#.claude/skills/ui-ux-pro-max/scripts/#g' \
      .claude/skills/ui-ux-pro-max/SKILL.md

## Alternative (not used here)

In local Claude Code it can be installed as a plugin instead, which keeps it
out of the repo and makes it updatable in place:

    /plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill
    /plugin install ui-ux-pro-max@ui-ux-pro-max-skill
