import React, { useState } from 'react';
import './App.css';


function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pptData, setPptData] = useState(null);
  const [currentPptBase64, setCurrentPptBase64] = useState(null);


  const sendMessage = async () => {
    if (!input.trim()) return;


    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);


    try {
      // Send to AI with current presentation data for editing
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          conversationHistory: messages,
          currentPresentation: pptData
        })
      });


      const data = await response.json();

      let presentationUpdated = false;
      let userFriendlyMessage = data.response;

      try {
        const jsonMatch = data.response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsedData = JSON.parse(jsonMatch[0]);
          if (parsedData.type === 'presentation' || parsedData.slides) {
            setPptData(parsedData);
            setCurrentPptBase64(null);
            presentationUpdated = true;

            // Create user-friendly message instead of showing JSON
            const slideCount = parsedData.slides?.length || 0;
            const isEdit = pptData !== null;

            if (isEdit) {
              userFriendlyMessage = `✅ Presentation updated! Your presentation now has ${slideCount} slide${slideCount !== 1 ? 's' : ''}. Check the preview on the right.`;
            } else {
              userFriendlyMessage = `✅ Presentation created successfully! I've generated ${slideCount} slide${slideCount !== 1 ? 's' : ''} for "${parsedData.title}". Check the preview on the right and click "Generate PPT" when ready.`;
            }
          }
        }
      } catch (e) {
        console.log('No JSON data in response');
      }

      const aiMessage = { role: 'assistant', content: userFriendlyMessage };
      setMessages(prev => [...prev, aiMessage]);


    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Error: Could not connect to server'
      }]);
    } finally {
      setLoading(false);
    }
  };


  const generatePPT = async () => {
    if (!pptData) return;


    setLoading(true);
    try {
      const response = await fetch('/api/generate-ppt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slideData: pptData })
      });


      const data = await response.json();

      if (data.success) {
        setCurrentPptBase64(data.pptx);
        alert('Presentation generated! Click "Download PPT" to save.');
      }
    } catch (error) {
      console.error('Error generating PPT:', error);
      alert('Failed to generate presentation');
    } finally {
      setLoading(false);
    }
  };


  const downloadPPT = () => {
    if (!currentPptBase64) return;


    const link = document.createElement('a');
    link.href = `data:application/vnd.openxmlformats-officedocument.presentationml.presentation;base64,${currentPptBase64}`;
    link.download = 'presentation.pptx';
    link.click();
  };


  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };


  return (
    <div className="App">
      <div className="container">
        {/* Chat Section */}
        <div className="chat-section">
          <div className="chat-header">
            <h2>AI PPT Generator</h2>
            <p>Ask me to create or edit presentations</p>
          </div>


          <div className="messages-container">
            {messages.length === 0 && (
              <div className="welcome-message">
                <h3>👋 Welcome!</h3>
                <p><strong>Create:</strong> "Create a presentation about AI in healthcare"</p>
                <p><strong>Edit:</strong> "Edit slide 2 to add more details about AI benefits"</p>
                <p><strong>Update:</strong> "Change slide 3 title to 'Future of AI'"</p>
              </div>
            )}

            {messages.map((msg, index) => (
              <div key={index} className={`message ${msg.role}`}>
                <div className="message-content">
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="message assistant">
                <div className="message-content loading">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
          </div>


          <div className="input-container">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message here..."
              rows="3"
              disabled={loading}
            />
            <button onClick={sendMessage} disabled={loading || !input.trim()}
              className="send-button"
            >
              {loading ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>

        <div className="ppt-section">
          <div className="ppt-header">
            <h3>Presentation Preview</h3>
          </div>

          {pptData ? (
            <div className="ppt-preview">
              <div className="ppt-info">
                <h2>{pptData.title || 'Presentation'}</h2>
                <p>{pptData.slides?.length || 0} slides</p>
              </div>

              <div className="slides-preview">
                {pptData.slides?.map((slide, index) => (
                  <div key={index} className="slide-card" id={`slide-${index + 1}`}>
                    <div className="slide-number">Slide {index + 1}</div>
                    <h4>{slide.title}</h4>
                    <ul>
                      {slide.content?.map((point, i) => (
                        <li key={i}>{point}</li>
                      ))}
                    </ul>
                    <div className="slide-actions">
                      <button className="edit-slide-btn"
                        onClick={() => setInput(`Edit slide ${index + 1} to `)}
                      >
                        ✏️ Edit
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="ppt-actions">
                <button onClick={generatePPT} className="generate-button"
                  disabled={loading} >
                  {loading ? 'Generating...' : 'Generate PPT'}
                </button>

                {currentPptBase64 && (
                  <button onClick={downloadPPT} className="download-button" >
                    Download PPT
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <p>📊</p>
              <p>Your presentation will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


export default App;
