# Docker (Dev)

This setup runs the Next.js dev server in a container.

## Usage

From the project root:

```bash
docker compose -f docker/compose.yml up --build
```

Then open [http://localhost:3000].

## Notes

- Uses .env.local from the project root.
- Hot reload uses polling for Windows file systems.
