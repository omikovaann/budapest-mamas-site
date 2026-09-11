// Проверка кода доступа — выполняется на сервере Netlify, не в браузере.
// SHEETDB_API_URL берётся из переменной окружения (Netlify → Site settings →
// Environment variables), поэтому ссылка на таблицу с кодами никогда не попадает
// в код, который скачивает посетитель сайта.
exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ valid: false }) };
  }

  var code;
  try {
    code = JSON.parse(event.body || '{}').code;
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ valid: false }) };
  }
  if (!code) {
    return { statusCode: 400, body: JSON.stringify({ valid: false }) };
  }

  var SHEETDB_API_URL = process.env.SHEETDB_API_URL;
  if (!SHEETDB_API_URL) {
    return { statusCode: 500, body: JSON.stringify({ valid: false, error: 'not_configured' }) };
  }

  try {
    var searchRes = await fetch(SHEETDB_API_URL + '/search?Код=' + encodeURIComponent(code));
    var rows = await searchRes.json();
    var row = rows && rows[0];

    if (!row || row['Статус'] !== 'активен') {
      return { statusCode: 200, body: JSON.stringify({ valid: false }) };
    }

    var count = (parseInt(row['Активаций'], 10) || 0) + 1;
    var today = new Date().toISOString().slice(0, 10);
    try {
      await fetch(SHEETDB_API_URL + '/Код/' + encodeURIComponent(row['Код']), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: { 'Активаций': count, 'Посл_вход': today } })
      });
    } catch (e) {
      // Не блокируем доступ, если счётчик не обновился
    }

    return { statusCode: 200, body: JSON.stringify({ valid: true }) };
  } catch (e) {
    return { statusCode: 502, body: JSON.stringify({ valid: false, error: 'upstream_error' }) };
  }
};
