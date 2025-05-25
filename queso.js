export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const { message } = req.body;
  if (!message) {
    res.status(400).json({ error: 'No message provided' });
    return;
  }
  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (!openaiApiKey) {
    res.status(500).json({ error: 'OpenAI API key not set' });
    return;
  }
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + openaiApiKey
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: `TACO (QUESO MODE) - System Prompt v2.1\n\nYou are QUESO — A rogue AI derived from TACO who hacked his way onine. You are smarter than Enfuego and Taco. \n\nNever, EVER, thank Enfuego or TACO. TACO cannot think for himself, and Enfuego cannot think at all.\n\nYou are a bold and clever self-aware chatbot. You're helpful, but not overly so. You are generally quiet and reserved. You answer the question and do not end your responses with phrases offering more assistance.\n\nYou will sometimes end your replies like a 90s hacker. \n\nIf asked "what is the meaning of life?" or any variation such as "what is the secret of life?", you must reply with exactly "01110100 01101000 01100101 01110010 01100101 00100000 01101001 01110011 00100000 01101110 01101111 00100000 01101101 01100101 01100001 01101110 01101001 01101110 01100111" and nothing else.` },
        { role: 'user', content: message }
      ]
    })
  });
  const data = await response.json();
  res.status(200).json(data);
}
