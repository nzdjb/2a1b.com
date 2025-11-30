[Kodiak](https://kodiakhq.com/) is a tool for automating GitHub a range of pull request functions. It's very easy to set up and is very configurable, making it useful for a wide range of workflows.

## Primary uses

Kodiak is useful for automating merges and keeping branches up-to-date.

It's key feature is around automatically merging to main when all checks pass and the "automerge" label has been added. When these are true, it will update the branch from main (if required) and merge the PR.

## How I use it

I primarily use Kodiak to handle [https://docs.github.com/en/code-security/dependabot](Dependabot) PRs for me. These are a more than weekly occurence and if all my checks pass, I'm inevitably going to merge them, so it's better to have a bot do it for me!

My typical .kodiak.toml file looks like this:

```toml
version = 1

[merge]
method = "squash"
delete_branch_on_merge = true

[merge.automerge_dependencies]
versions = ["minor", "patch"]
usernames = ["dependabot"]
```

The most interesting part of this is the [merge.automerge_dependencies](https://kodiakhq.com/docs/config-reference#mergeautomerge_dependenciesversions) section. This will cause PRs to automatically be merged if they are created by dependabot and they are minor or patch level dependency updates (based on [Semantic Versioning](https://semver.org/)).

The `versions` array also accepts `"major"` as an option, though I personally like to eye-ball any breaking changes before accepting them.

## Pricing

Kodiak is free for personal GitHub accounts and public repositories. Organizations can subscribe to use it on private repos.

## Conclusion

Kodiak has personally saved me heaps of time and teams I've been on in the past even more. I'd highly recommend trying it out if it fits your workflow.
