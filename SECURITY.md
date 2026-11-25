# Security policy

## Supported versions

| Version                   | Security fixes                    |
| ------------------------- | --------------------------------- |
| Latest release `0.Y.x`    | Yes, as a patch release           |
| Older versions, `develop` | No: upgrade to the latest release |

## Reporting a vulnerability

Please do not open a public issue. Use GitHub's private vulnerability reporting: **Report a vulnerability** on this repository's **Security** tab. We acknowledge a report within 72 hours and agree a disclosure date with you.

A fix ships as a patch release with a `Security` entry in the CHANGELOG and a GitHub security advisory. A finding that spans several qiick repositories is coordinated in each one's advisory.

## What we treat as critical

app-ui is copied into every qiick app and runs in every qiick repo's CI, so a flaw here spreads to the whole fleet. Treated as critical: script injection or unsafe HTML in a registry component, a reusable workflow that leaks a token, runs code from a pull request with write permissions or calls an unpinned action, and a standards script that executes code from the repo it checks.

## Release integrity

Release tags are signed by the maintainer and show as **Verified** on GitHub; a release whose tag is not Verified is not ours.
