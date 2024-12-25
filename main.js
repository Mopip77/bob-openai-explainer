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
    "ar",
  ];
}

function translate(query, completion) {
  var header = {
    Authorization: "Bearer " + $option.openaiApiKey,
    "Content-Type": "application/json",
  };

  var body = {
    model: $option.specificModel || $option.model,
    stream: true,
    stream_options: {
      include_usage: true,
    },
    messages: [
      {
        role: "system",
        content: `${$option.prompt}\n\n${query.text}`,
      },
    ],
  };

  let targetText = "";
  let model = "";
  let usage = {};
  let streamBuffer = "";
  function handleStreamData(streamText, query) {
    $log.info(`[handleStreamData] received streamText => ${streamText}`);
    if (streamText.startsWith("data: ")) {
      streamText = streamText.slice(6);
    }

    if (streamText === "[DONE]") {
      query.onCompletion({
        result: {
          from: query.detectFrom,
          to: query.detectTo,
          toParagraphs: [targetText],
          toDict:
            $option.showExtraInfo === "true"
              ? {
                  parts: [
                    {
                      part: "model.",
                      means: [model],
                    },
                    {
                      part: "tokens.",
                      means: [
                        `I:${usage.prompt_tokens}`,
                        `O: ${usage.completion_tokens}`,
                        `T: ${usage.total_tokens}`,
                      ],
                    },
                  ],
                }
              : {},
        },
      });
      return;
    }

    streamBuffer += streamText;

    let dataObj;
    try {
      dataObj = JSON.parse(streamBuffer.trim());
    } catch (err) {
      $log.info(`[handleStreamData] json not assembled, streamBuffer => ${streamBuffer}`);
      return;
    }

    usage = dataObj.usage || usage;
    model = dataObj.model;
    if (dataObj.choices.length == 0) {
      return;
    }
    const content = dataObj.choices[0].delta.content;
    if (content) {
      targetText += content;
    }

    query.onStream({
      result: {
        from: query.detectFrom,
        to: query.detectTo,
        toParagraphs: [targetText],
      },
    });

    streamBuffer = "";
  }

  $http.streamRequest({
    method: "POST",
    url: `${$option.endpoint}/chat/completions`,
    header,
    body,
    streamHandler: function (streamData) {
      streamData.text
        .split("\n")
        .filter((line) => line)
        .forEach((line) => {
          handleStreamData(line, query);
        });
    },
  });
}
