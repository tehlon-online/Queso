export default async function handler(req, res) {
  // --- CORS Headers ---
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  // Environment variables
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  const QUESO_PASS = process.env.QUESO_PASS;

  if (!OPENAI_API_KEY) {
    res.status(500).json({ error: 'OpenAI API key not set' });
    return;
  }

  const { message, count, password } = req.body;

  // Password protection for more than 5 messages
  if (count > 5 && password !== QUESO_PASS) {
    res.status(401).json({ error: 'Password required or incorrect to continue' });
    return;
  }

  if (!message) {
    res.status(400).json({ error: 'No message provided' });
    return;
  }

  // Call OpenAI API
  try {
    const apiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: message }]
      })
    });
    const data = await apiRes.json();

    if (apiRes.status !== 200) {
      return res.status(apiRes.status).json({
        error: data.error?.message || 'Error from OpenAI API'
      });
    }

    // Return OpenAI response
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Server error contacting OpenAI' });
  }
}
