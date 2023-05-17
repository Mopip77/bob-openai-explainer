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
    return ['auto', 'zh-Hans', 'zh-Hant', 'en'];
}

function translate(query, completion) {

    var header = {
        'Authorization': 'Bearer ' + $option.openaiApiKey,
        'Content-Type': 'application/json'
    }

    var body = {
        'model': $option.model,
        'messages': [
            {
                'role': 'system',
                'content': `${$option.prompt}\n\n${query.text}`
            }
        ]
    }

    $http.request({
        method: "POST",
        url: 'https://api.openai.com/v1/chat/completions',
        header,
        body,
        handler: function(response) {
            $log.error(`response: ${JSON.stringify(response)}`)

            var result = response['data']['choices'][0]['message']['content']

            completion({
                'result': {
                    'toParagraphs': [result]
                }
            })
        }
    })
}
