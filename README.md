# generate-batched-pr-manifest

Generate a manifest of all the PRs included in a batched PR.

## Why?
In some projects, multiple PRs are deployed together to minimize CI runs or deploys.

However, when the PRs are aggregated in a batched PR, it can be hard to see what PRs are included in the batch.

This tool generates a manifest of all the PRs that are included in a batched PR.

You can add it to the PR description so it's easy to see what PRs are included in the batch.

## Usage

> ⚠️ Requires [GitHub CLI](https://cli.github.com/) to be installed

```sh
# Enter the GitHub repository directory
$ cd <repo>

$ npx generate-batched-pr-manifest <batched pr number>
```

### Update the PR title & description

Automatically the PR title & description with the manifest.

```sh
# Enter the GitHub repository directory
$ cd <repo>

$ npx generate-batched-pr-manifest <batched pr number> --update
```

The PR title will be set to: `batch: <ISO date> (<number of PRs> PRs)`

The PR body will be set to:

```
# Pull requests
- <PR URL>
- ...
- ...
```

## What does this script do?

1. Fetches the commits from the provided batched PR
2. Searches the repository for PRs that include commits from the batched PR and either has the same base branch or the base branch set to the batched PR.
3. Filters out closed PRs and duplicates
4. Update the PR title & description if `--update` is provided
5. Log manifest to the console
