/**
 * 由于各大服务商的语言代码都不大一样，
 * 所以我定义了一份 Bob 专用的语言代码，以便 Bob 主程序和插件之间互传语种。
 * Bob 语言代码列表 https://ripperhe.gitee.io/bob/#/plugin/addtion/language
 *
 * 转换的代码建议以下面的方式实现，
 * `xxx` 代表服务商特有的语言代码，请替换为真实的，
 * 具体支持的语种数量请根据实际情况而定。
 *
 * Bob 语言代码转服务商语言代码(以为 'zh-Hans' 为例): var lang = langMap.get('zh-Hans');
 * 服务商语言代码转 Bob 语言代码: var standardLang = langMapReverse.get('xxx');
 */

function supportLanguages() {
  return [
      "auto",
      "zh-Hans",
      "zh-Hant",
      "yue",
      "wyw",
      "pysx",
      "en",
      "ja",
      "ko",
      "fr",
      "de",
      "es",
      "it",
      "ru",
      "pt",
      "nl",
      "pl",
      "ar"
  ];
}

function translate(query, completion) {
  var header = {
    Authorization: "Bearer " + $option.openaiApiKey,
    "Content-Type": "application/json",
  };

  var body = {
    model: $option.model,
    stream: true,
    messages: [
      {
        role: "system",
        content: `${$option.prompt}\n\n${query.text}`,
      },
    ],
  };

  let targetText = '';
  $http.streamRequest({
    method: "POST",
    url: `${$option.endpoint}/chat/completions`,
    header,
    body,
    streamHandler: function (streamData) {
      const lines = streamData.text.split("\n").filter((line) => line);
      // 遍历分割后的数组，判断是否为 `data: ` 开头，如果是，则进行处理
      lines.forEach((line) => {
        const match = line.match(/^data: (.*)/);
        if (match) {
          const dataStr = match[1].trim();
          if (dataStr !== "[DONE]") {
            try {
              const dataObj = JSON.parse(dataStr);
              const content = dataObj.choices[0].delta.content;
              if (content !== undefined) {
                targetText += content;
                query.onStream({
                  result: {
                    from: query.detectFrom,
                    to: query.detectTo,
                    toParagraphs: [targetText],
                  },
                });
              }
            } catch (err) {
              query.onCompletion({
                error: {
                  type: err._type || "unknown",
                  message: err._message || "Failed to parse JSON",
                  addtion: err._addition,
                },
              });
            }
          } else {
            query.onCompletion({
              result: {
                from: query.detectFrom,
                to: query.detectTo,
                toParagraphs: [targetText],
              },
            });
          }
        }
      });
    },
  });
}
