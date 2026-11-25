# Security policy

## Supported versions

| Version                   | Security fixes                           |
| ------------------------- | ---------------------------------------- |
| Latest stable `X.Y.x`     | Yes, as a patch release                  |
| Latest pre-release        | Yes, in the next pre-release             |
| Older versions, `develop` | No: upgrade to the latest stable release |

## Reporting a vulnerability

Please do not open a public issue. Use GitHub's private vulnerability reporting: **Report a vulnerability** on this repository's **Security** tab. We acknowledge a report within 72 hours and agree a disclosure date with you.

A fix ships as a patch release with a `Security` entry in the CHANGELOG and a GitHub security advisory. A finding that spans several qiick repositories is coordinated in each one's advisory.

## What we treat as critical

<!-- Name this repository's critical areas: authentication, tokens and keys, tenant isolation, … -->

## Release integrity

Release tags are signed by the maintainer and show as **Verified** on GitHub; a release whose tag is not Verified is not ours.
