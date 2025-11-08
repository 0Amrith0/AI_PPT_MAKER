
### 1. Install Dependencies
```bash
npm install
cd client && npm install && cd ..
```

### 2. Update API Key
Edit `server/index.js` line 13:
```javascript
const API_KEY = 'YOUR_GEMINI_API_KEY_HERE';
```

### 3. Run the App
```bash
# Terminal 1 - Start Backend
node server/index.js


# Terminal 2 - Start Frontend
cd client && npm start
```

- Frontend: http://localhost:3000
- Backend: http://localhost:5000


## Example Prompts

Try these in the chat:

1. **Create a presentation:**
  - "Create a 5-slide presentation about artificial intelligence"
  - "Make a presentation on climate change solutions"
  - "Generate slides about healthy lifestyle tips"


2. **Edit presentations:**
  - "Add more details to slide 2"
  - "Change the title to 'AI Revolution'"
  - "Add a conclusion slide"


3. **After AI responds with slide data:**
  - Click **"Generate PPT"** button
  - Click **"Download PPT"** to save


## Features

- Chat with AI to create presentations
- Real-time slide preview
- Edit and update slides through chat
- Download as PPTX file
- Clean and modern UI


## Troubleshooting


**Can't connect to server?**
- Make sure both backend (port 5000) and frontend (port 3000) are running
- Check that your API key is configured correctly


**Model not found error?**
- The app uses `gemini-2.0-flash-exp` model (could not use 2.5-pro-preview due to some issues)
- Make sure your API key has access to this model


## 📦 Project Structure

```
ppt-chat-app/
├── server/
│   └── index.js        # Backend API
├── client/
│   └── src/
│       ├── App.js      # Main React component
│       └── App.css     # Styles
├── package.json        # Backend deps
```


## How It Works


1. **Send a message** → Frontend sends to backend
2. **Backend calls Gemini AI** → AI generates slide structure
3. **AI returns JSON data** → Frontend displays slide preview
4. **User clicks "Generate PPT"** → Backend creates PPTX file
5. **User downloads** → File saved to computer


## Notes

- Internet connection required (for Gemini API)
- API key must be valid and have quota
- Supports multiple slides with bullet points
- Can edit presentations through natural conversation
