1→# AGENTS.md
2→
3→## Setup & Commands
4→
5→**Initial Setup:**
6→```bash
7→npm install
8→```
9→
10→**Running Dev Server:**
11→```bash
12→npm start                                    # with existing backup
13→node server.js <backup_file.daylio>         # with new backup file
14→```
15→
16→**Build/Lint/Tests:** Not configured in this project.
17→
18→## Tech Stack
19→
20→- **Backend:** Node.js + Express.js server
21→- **Templating:** Pug.js for server-side rendering
22→- **Frontend:** Vanilla JavaScript, Bootstrap CSS, Chartist.js for charts
23→- **Key Libraries:** moment.js (date handling), extract-zip (backup extraction)
24→
25→## Architecture
26→
27→- `server.js` - Main entry point, handles data extraction, processing, and serves web app
28→- `views/` - Pug templates for UI components
29→- `public/` - Static assets (CSS, JS, icons)
30→- `data/` - Extracted Daylio backup data (gitignored)
31→- `activity_icons/` - Activity icon assets from Daylio app
32→
33→## Code Conventions
34→
35→- Use `const`/`let` over `var` where possible
36→- Function declarations for top-level functions
37→- Inline comments for complex logic blocks
38→- Snake_case for data object keys, camelCase for variables
39→- Port defaults to 5000 (or PORT env var)
40→