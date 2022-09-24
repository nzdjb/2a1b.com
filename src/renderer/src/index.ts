import Handlebars from "handlebars";
import toml from '@iarna/toml';
import { readFileSync, readdirSync, writeFileSync } from "fs";

interface Article {
  title: string;
  author?: string;
  date: Date;
  dateString?: string;
  content: string;
}
const config = readdirSync('../articles').map(file => readFileSync(`../articles/${file}`).toString()).join('\n');
const articles = toml.parse(config)['articles'] as unknown as Article[]
articles.forEach(article => {
  article.dateString = article.date.toISOString().split('T')[0];
});
articles.sort((a: Article, b: Article) => a.date.getTime() - b.date.getTime());
articles.reverse();
const index = readFileSync('../templates/index.hb.html').toString();
const output = Handlebars.compile(index)({ articles });
writeFileSync('../../dist/index.html', output);
