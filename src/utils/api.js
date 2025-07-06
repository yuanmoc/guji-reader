// Xinference API 封装
export async function fetchTranslation({ baseURL, apiKey, modelName, pageImageBase64 }) {
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
            text: `
            请对以下提供的古籍图片执行OCR(光学字符识别)任务，并将识别出的文本转换为**简体中文**。输出时请务必注意：

            1.  **保留原始格式**:严格依照图片中的段落换行、卷/章节标题层级、正文缩进等原始排版结构，不要自行合并或拆分段落（除非原始排版就是连续不分段）。
            2.  **处理特殊元素**:
                *   **竖排文本**：如果图片内容是竖排古籍，请**按列识别并按阅读顺序（通常从右至左，从上至下）组织文本**，并在输出中使用换行符表示列的结束。自动将竖排转为横排输出。
                *   **印章/图章**：如文字区域内有明显印章或图章，识别后请用【印章】或【图章】标注其位置（例如：“【此处有印章】”），不要尝试识别印章文字（除非清晰可辨且你特别要求）。
                *   **破损/模糊文字**：对完全无法识别的模糊或缺失文字，联想出符合的文字内容。
                *   **批注/旁注**：区分主文与旁注/小字批注。如有明确位置关联，可用括号（）或特殊标记注明（如“正文内容[旁注内容]”）。
            3.  **精确转换语言**: 
                *   原始图片内容如为繁体字/异体字/古汉字，**务必转换为对应的现代标准简体中文**。
                *   避免引入任何图片中没有的现代标点（如书名号、引号），除非是分隔明确句子的句读（、。等）原文已有。
            4.  **纯文本输出**：最终输出结果应为**纯净的文本**,只包含识别和转换后的文字以及必要的格式符(换行、空格)。不要添加任何额外的分析、说明(如“这是第X页内容:”)或标记(如页面编号)。
            `
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