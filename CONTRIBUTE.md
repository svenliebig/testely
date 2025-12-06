# Contributing to Testely

For now this is just a reminder for myself how to do things.

## How to release a new version

1. Update the version in the `package.json` file
2. Update the `CHANGELOG.md` file
3. `git commit`
4. Run `./scripts/release.sh $VERSION`
5. Run `vsce publish`
