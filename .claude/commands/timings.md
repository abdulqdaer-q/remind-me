---
description: Open the Salah Times webapp in browser
---

Start the Salah Times webapp development server and open it in the browser.

Run the following commands:
1. Start the dev server in the background
2. Wait a moment for the server to start
3. Open the browser to the webapp URL

```bash
cd src/apps/salah-times && npm run dev &
sleep 3
xdg-open http://localhost:5173 || open http://localhost:5173 || echo "Please open http://localhost:5173 in your browser"
```

The webapp will open automatically in your default browser at http://localhost:5173.
