import http from 'http';
import fs from 'fs';
import { Command } from 'commander';

const program = new Command();

program.helpOption('-H, --help', 'Вивести довідку');

program
  .requiredOption('-i, --input <path>', 'шлях до файлу даних')
  .requiredOption('-h, --host <address>', 'адреса сервера')
  .requiredOption('-p, --port <number>', 'порт сервера')
  .option('-o, --output <path>', 'файл, у який записується остання надіслана відповідь');

program.parse(process.argv);
const options = program.opts();

// Перевірка існування вхідного файлу через callback-API
fs.stat(options.input, (err, stats) => {
  if (err || !stats.isFile()) {
    console.error('Cannot find input file');
    process.exit(1);
  }

  const server = http.createServer((req, res) => {
    const baseUrl = `http://${options.host}:${options.port}`;
    let parsedUrl;
    try {
      parsedUrl = new URL(req.url, baseUrl);
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'Некоректний URL запиту' }));
      return;
    }

    if (parsedUrl.pathname !== '/') {
      res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'Маршрут не знайдено' }));
      return;
    }

    const query = parsedUrl.searchParams;
    const survivedParam = query.get('survived');
    const ageParam = query.get('age');

    // Асинхронне читання файлу через callback API
    fs.readFile(options.input, 'utf8', (readErr, data) => {
      if (readErr) {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: 'Помилка читання файлу даних' }));
        return;
      }

      try {
        const lines = data.split('\n');
        const results = [];

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue; // Ігноруємо порожні рядки

          const item = JSON.parse(line);

          // Фільтрація для варіанта 6: ?survived=true
          if (survivedParam === 'true') {
            if (Number(item.Survived) !== 1) {
              continue;
            }
          }

          // Формування об'єкта (name <- Name, ticket <- Ticket)
          const record = {
            name: item.Name,
            ticket: item.Ticket
          };

          // Додавання віку при ?age=true
          if (ageParam === 'true') {
            record.age = item.Age !== null && item.Age !== undefined ? Number(item.Age) : null;
          }

          results.push(record);
        }

        const responseJson = JSON.stringify(results, null, 2);

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(responseJson);

        // Якщо передано параметр --output (-o)
        if (options.output) {
          fs.writeFile(options.output, responseJson, 'utf8', (writeErr) => {
            if (writeErr) {
              console.error('Помилка запису у вихідний файл:', writeErr.message);
            }
          });
        }

      } catch (parseErr) {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: 'Помилка парсингу NDJSON даних' }));
      }
    });
  });

  server.listen(options.port, options.host, () => {
    console.log(`Сервер успішно запущено на http://${options.host}:${options.port}`);
  });
});