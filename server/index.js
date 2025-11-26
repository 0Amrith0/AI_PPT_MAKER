import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { GoogleGenerativeAI } from '@google/generative-ai';
import PptxGenJS from 'pptxgenjs';
import dotenv from 'dotenv' 
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();


const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve frontend build
app.use(express.static(path.join(__dirname, "../frontend/build")));

app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/build", "index.html"));
});


const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/api/chat', async (req, res) => {
  try {
    const { message, conversationHistory, currentPresentation } = req.body;

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    let prompt = `You are an AI assistant that helps create and edit PowerPoint presentations.

IMPORTANT RULES:
1. When creating a NEW presentation, generate slide content from scratch
2. When EDITING an EXISTING presentation, preserve all slides and only modify what the user asks
3. If user says "edit slide 2" or "update slide 3", modify ONLY that specific slide
4. Always return the COMPLETE presentation JSON with ALL slides (edited and unedited)

Current Presentation Data:
${currentPresentation ? JSON.stringify(currentPresentation, null, 2) : 'No presentation exists yet'}

Format your response as a valid JSON object:
{
 "type": "presentation",
 "title": "Presentation Title",
 "slides": [
   {
     "title": "Slide Title",
     "content": ["Point 1", "Point 2", "Point 3"]
   }
 ]
}

EDITING INSTRUCTIONS:
- If user says "edit slide 2", modify only slide at index 1 (slides[1])
- If user says "change slide 3 title", update only the title of slides[2]
- If user says "add a slide", append a new slide to the array
- If user says "remove slide 2", remove slides[1]
- Always return ALL slides in the presentation, not just the edited one

User message: ${message}

CRITICAL: Return ONLY a valid JSON object, nothing else. No explanations, no markdown, no extra text.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    res.json({
      response: text,
      success: true
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      error: 'Failed to generate response',
      success: false
    });
  }
});

app.post('/api/generate-ppt', async (req, res) => {
  try {
    const { slideData } = req.body;

    const pptx = new PptxGenJS();

    let slides = slideData;
    if (typeof slideData === 'string') {
      const jsonMatch = slideData.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        slides = JSON.parse(jsonMatch[0]);
      }
    }

    if (slides.title) {
      const titleSlide = pptx.addSlide();
      titleSlide.background = { color: '1F4788' };
      titleSlide.addText(slides.title, {
        x: 0.5,
        y: '40%',
        w: '90%',
        h: 1,
        fontSize: 44,
        color: 'FFFFFF',
        bold: true,
        align: 'center'
      });
    }

    if (slides.slides && Array.isArray(slides.slides)) {
      slides.slides.forEach(slideContent => {
        const slide = pptx.addSlide();
        slide.background = { color: 'FFFFFF' };

        slide.addText(slideContent.title || 'Slide Title', {
          x: 0.5,
          y: 0.5,
          w: '90%',
          h: 0.75,
          fontSize: 32,
          color: '1F4788',
          bold: true
        });

        if (slideContent.content && Array.isArray(slideContent.content)) {
          const bulletPoints = slideContent.content.map(point => ({
            text: point,
            options: { bullet: true, fontSize: 18, color: '333333' }
          }));

          slide.addText(bulletPoints, {
            x: 0.5,
            y: 1.5,
            w: '90%',
            h: 4
          });
        }
      });
    }

    const base64 = await pptx.write({ outputType: 'base64' });

    res.json({
      success: true,
      pptx: base64,
      message: 'Presentation generated successfully'
    });

  } catch (error) {
    console.error('Error generating PPT:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate presentation'
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
