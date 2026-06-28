# Screenshots

The `screenshots` folder contains GitHub-ready images for the README, project report, PPT, and demo review.

## Generated Files

| File | Purpose |
| --- | --- |
| `screenshots/01-portal-overview.png` | Academy homepage hero and learning-path positioning |
| `screenshots/02-report-dashboard.png` | Dashboard with sidebar, progress, lab grid, activity, and student access |
| `screenshots/03-sqli-lab.png` | SQL Injection lab detail page |
| `screenshots/04-stored-xss-lab.png` | Stored XSS lab detail page |

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

Use the homepage and dashboard screenshots in the first few slides. Use lab detail screenshots when explaining how a student starts a lab, requests hints, submits a flag, and unlocks the explanation.
