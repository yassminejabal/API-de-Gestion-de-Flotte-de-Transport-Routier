# Backend versioning and GitHub releases

This procedure versions the Node.js API at the repository root. It does not version or package `fleettrack-front/`.

## Version rule

Follow Semantic Versioning (`MAJOR.MINOR.PATCH`):

- **MAJOR** for incompatible API or data-contract changes.
- **MINOR** for backward-compatible API capabilities.
- **PATCH** for backward-compatible fixes.

The root `package.json` and `package-lock.json` must carry the same backend version. Record the user-visible changes in `CHANGELOG.md`.

## Release steps

1. Finish and verify backend changes; review `git diff` and run `npm test`.
2. Update `package.json`, `package-lock.json`, and `CHANGELOG.md` for the next backend version.
3. Commit only backend files. Keep `fleettrack-front/` out of the backend release commit.
4. Create an annotated tag, for example `git tag -a v2.0.0 -m "Release backend v2.0.0"`.
5. Push the release branch and tag with `git push origin <branch> --follow-tags`.
6. On GitHub, create a Release from that tag and use the matching changelog entry as the release notes.

The stable baseline is `v1.0.0`. Backend tag `v2.0.0` has been pushed to GitHub. The current backend manifest is being prepared for `2.0.1`; create its tag and GitHub Release after the patch is reviewed and verified.
