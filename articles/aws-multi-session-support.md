A major issue with working in an AWS environment beyond a trivial size has always been that you can only use the Console on a single account at a time. This had lead to all sorts of workarounds such as using incognito windows or additional browser profiles.

AWS fixed this (mostly) in [January this year](https://aws.amazon.com/about-aws/whats-new/2025/01/aws-management-console-simultaneous-sign-in-multiple-accounts/) by adding multi-session support.

## What is it?

Multi-session support is pretty much what it says on the tin. You can now be logged into multiple AWS Console sessions at a time.

This is handled by using a custom domain name for each of your AWS Console sessions, to maintain a separate session cookie for each.

## How do I get it?

You need to enable multi-session support before you can use it. This can be done by selecting "Turn on multi-session support" in the AWS Management Console or by selecting "Enable multi-session" on [https://console.aws.amazon.com](https://console.aws.amazon.com).

## Caveats

There are a few things to keep in mind when using multi-session support.

* You can only be signed into up to five sessions at a time. If you attempt to sign in to a sixth session, you'll be prompted to sign out of one of the existing ones.
* When using SSO, signing into the same role twice will count as two different sessions (this may depend on your organization's setup).
* Not every single part of the Console supports multiple sessions properly. The coverage of this has gotten much better since launch, but there are still a few odd corners that don't.
