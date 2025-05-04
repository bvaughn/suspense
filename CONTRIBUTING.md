# Contributing

## Installation

This project uses [PNPM](https://pnpm.io/) for package management and [Vite](https://vite.dev/) for bundling. Initial setup can be done like so:

```sh
git clone git@github.com:bvaughn/suspense.git

cd suspense

# Install Workspace dependencies (don't forget -r)
pnpm install -r

# Build various packages
pnpm prerelease

# Run tests to verify installation (optionally)
pnpm -r test
```

## Contributing code
> #### 💡 WARNING: Not following these rules will result in your PR being closed

Contributing to Open Source can be challenging. Mistakes –even small ones– can prevent a change from being accepted. We ask that you follow the rules below to make the process as smooth as possible!

1. Before posting a PR, please run all automated type checks and formatters:
   * Format your code (`pnpm prettier`)
   * Run TypeScript (`pnpm typescript`)
   * Run unit tests (`pnpm -r test`) to check if the change broke any code
   * Add new unit tests for your code and make sure that it also passes. (This helps the reviewer. It also verifies that your code works correctly now and does not get broken by future changes.)
1. Open a [PR on GitHub](https://github.com/bvaughn/suspense/pulls) with your changes. The PR description must include the following:
   * Link to the GitHub issue you are fixing (and any other relevant links)
   * Show how your change effects the UI/UX. (Screenshots, short Loom videos, or [Replays](https://www.replay.io/) are good ways to show changes.)
1. (Optionally) ask someone to review your PR by mentioning their GitHub username.
   * Please only mention someone if they opened the GitHub issue your PR is related to, or if they actively commented on it and seem to have an understanding of the topic.
   * Please be patient as it may take several days for a PR to be reviewed.

## Updating documentation

The website is automatically deployed for each comment on the `main` branch. It can be run locally like so:

```sh
cd packages/suspense-website

pnpm watch

open http://localhost:1234
```