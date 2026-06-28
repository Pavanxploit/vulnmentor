# Screenshots

The `screenshots` folder contains GitHub-ready images for the README, project report, PPT, and demo review.

## Generated Files

| File | Purpose |
| --- | --- |
| `screenshots/01-portal-overview.png` | Main VulnMentor portal and lab catalogue |
| `screenshots/02-report-dashboard.png` | Student progress and export-ready reporting view |
| `screenshots/03-sqli-lab.png` | Live SQL Injection web lab |
| `screenshots/04-stored-xss-lab.png` | Live Stored XSS web lab |

## Regenerate Screenshots

Start the portal and labs first:

```bash
docker compose up --build -d
npm run dev
```

Then run:

```bash
npm run screenshots
```

The capture script uses a local Chromium-based browser such as Microsoft Edge, Chrome, Brave, or Chromium. If the browser is installed in a custom location, set:

```bash
BROWSER_EXECUTABLE="C:\\Path\\To\\Browser\\browser.exe"
```

On PowerShell:

```powershell
$env:BROWSER_EXECUTABLE="C:\Path\To\Browser\browser.exe"
```

## Presentation Tip

Use the portal overview and report dashboard screenshots in the first few slides. Use lab screenshots only when explaining how the sandbox works internally.
