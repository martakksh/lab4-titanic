import http from 'http';
import fs from 'fs';
import { Command } from 'commander';

const program = new Command();

program.helpOption('-H, --help', 'Вивести довідку');

program
  .requiredOption('-i, --input <path>', 'шлях до файлу даних')
  .requiredOption('-h, --host <address>', 'адреса сервера')
  .requiredOption('-p, --port <number>', 'порт сервера');

program.parse(process.argv);
const options = program.opts();

// Перевірка існування вхідного файлу через callback-API (без Sync)
fs.stat(options.input, (err, stats) => {
  if (err || !stats.isFile()) {
    console.error('Cannot find input file');
    process.exit(1);
  }

  console.log(`Файл ${options.input} успішно знайдено!`);
});