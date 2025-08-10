# Marking Copilot Demo

Web application for reviewing student assignments with PDF viewing, commenting, and text highlighting.

## Setup

```bash
cd demo/backend
npm install
npm run dev
```

Frontend served at http://localhost:3001

## Structure

- `index.html` - Main application
- `js/` - JavaScript modules
- `css/` - Stylesheets  
- `backend/` - Node.js server
- `backend/uploads/` - PDF storage

## Usage

- Upload PDFs or navigate through existing assignments
- Click PDF to add comments
- Use highlighting tools to mark similar text
- Navigate with keyboard arrows (overview mode) or mouse controls

## AI Integration (Planned)

Future versions will integrate ChatGPT API to:

- Analyze rubrics and marking criteria
- Automatically identify common student errors
- Generate intelligent feedback suggestions
- Provide grading assistance based on assignment requirements
- Offer consistency checking across similar assignments

The AI will read uploaded rubrics and use them to guide the marking process, making grading faster and more consistent.
