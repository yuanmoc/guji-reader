// Xinference API 封装
export async function fetchTranslation({ baseURL, apiKey, userPrompt, modelName, pageImageBase64 }) {
  const response = await fetch(`${baseURL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': apiKey ? `Bearer ${apiKey}` : undefined,
    },
    body: JSON.stringify({
      model: modelName,
      messages: [{
        role: "user",
        content: [
          {
            type: "text",
            text: userPrompt
          },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${pageImageBase64}`
            }
          }
        ]
      }],
      max_tokens: 2000
    })
  });
  if (!response.ok) throw new Error('API请求失败');
  return response.json();
}

export async function explainClassicalText({ baseURL, apiKey, modelName, systemPrompt, userPrompt, onMessage }) {
  const response = await fetch(`${baseURL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': apiKey ? `Bearer ${apiKey}` : undefined,
    },
    body: JSON.stringify({
      model: modelName,
      messages: [
        {
          role: "system",
          content: systemPrompt || "你是一位古籍研究专家，请用现代汉语解释以下古文内容："
        },
        {
          role: "user",
          content: userPrompt
        }
      ],
      stream: true,
      max_tokens: 1000
    })
  });
  if (!response.body) throw new Error('无响应体');
  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let done = false;
  while (!done) {
    const { value, done: doneReading } = await reader.read();
    done = doneReading;
    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.replace('data: ', '');
        if (data === '[DONE]') return;
        try {
          const json = JSON.parse(data);
          const content = json.choices?.[0]?.delta?.content || "";
          if (content && onMessage) onMessage(content);
        } catch (e) {
          // 跳过解析错误
        }
      }
    }
  }
} 