# Privacy

The personal data this product stores, why, for how long, who else receives it, and how a person's data is exported and erased (fleet convention F29). A PR that adds a column or an outbound call with personal data updates this page.

## Personal data

| Table.column                                   | What                | Why                    | Kept until                  |
| ---------------------------------------------- | ------------------- | ---------------------- | --------------------------- |
| `users.email`                                  | email address       | sign-in, notifications | the account is erased       |
| `activity_log.properties` (`ip`, `user_agent`) | IP address, browser | security audit         | the activity log prune (F9) |

## Processors and outbound destinations

| Destination                   | Receives                        | Configured by |
| ----------------------------- | ------------------------------- | ------------- |
| Mail provider (`MAIL_MAILER`) | recipient address, mail content | the operator  |

## Export and erasure

- **Export:** <!-- the screen or command, and the format -->
- **Erasure:** <!-- the screen or command; what is kept afterwards (anonymised activity log) and why -->

## Telemetry

None. Nothing is sent off the server unless the operator turns a feature on and configures its destination; each such feature is listed under processors above.
