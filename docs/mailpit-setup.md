# Mailpit setup

The Docker Compose stack includes Mailpit as the default local email transport.
Set `EMAIL_TRANSPORT=smtp` in `.env` and start the stack with:

```bash
./start.sh
```

Open the inbox at http://localhost:8025. SMTP is available to containers at
`mailpit:1025`; a host process can use `localhost:1025`.

Mailpit captures alert messages without sending them to external recipients.
Use Resend only when real delivery is required in a production environment.
