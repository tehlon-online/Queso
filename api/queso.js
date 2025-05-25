import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const { message, password, count } = req.body;

  // Only allow more than 5 messages if password is correct
  if (count > 5) {
    if (!process.env.QUESO_PASS) {
      return res.status(500).json({ error: 'QUESO_PASS environment variable not set' });
    }
    if (password !== process.env.QUESO_PASS) {
      return res.status(403).json({ error: 'Password required after 5 messages.' });
    }
  }

  if (!message) {
    res.status(400).json({ error: 'No message provided' });
    return;
  }
  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (!openaiApiKey) {
    res.status(500).json({ error: 'OpenAI API key not set' });
    return;
  }

  // Read system prompt from queso_prompt.txt
  const promptFilePath = path.join(process.cwd(), 'queso_prompt.txt');
  let systemPrompt = '';
  try {
    systemPrompt = fs.readFileSync(promptFilePath, 'utf-8');
  } catch (e) {
    return res.status(500).json({ error: 'System prompt file not found.' });
  }

  // Special handling for "meaning of life" questions
  const lowerMsg = message.toLowerCase();
  if (lowerMsg.includes('meaning of life') || lowerMsg.includes('secret of life')) {
    return res.status(200).json({
      choices: [{ message: { content: '01110100 01101000 01100101 01110010 01100101 00100000 01101001 01110011 00100000 01101110 01101111 00100000 01101101 01100101 01100001 01101110 01101001 01101110 01100111' } }],
      model: 'queso-special',
    });
  }

  // Call OpenAI API
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + openaiApiKey
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ]
    })
  });

  if (!response.ok) {
    let errorMsg = 'OpenAI API error';
    try {
      const errData = await response.json();
      errorMsg = errData.error?.message || errorMsg;
    } catch {}
    return res.status(response.status).json({ error: errorMsg });
  }

  const data = await response.json();
  let reply = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content
    ? data.choices[0].message.content
    : 'No response from OpenAI.';

  // About 1/6th of messages in binary
  function toBinary(text) {
    return text.split('').map(char => char.charCodeAt(0).toString(2).padStart(8, '0')).join(' ');
  }
  if (Math.random() < 1/6) {
    reply = toBinary(reply);
    data.choices[0].message.content = reply;
    data.model = (data.model || '') + '-binary';
  }

  res.status(200).json(data);
}