import Handlebars from "handlebars";
import toml from '@iarna/toml';
import { marked } from 'marked';
import sanitizeHTML from 'sanitize-html';
import { readFileSync, readdirSync, writeFileSync } from "fs";

const sanitizerSettings: sanitizeHTML.IOptions = {
    allowedTags: sanitizeHTML.defaults.allowedTags.concat(['img']),
    disallowedTagsMode: 'escape',
}

interface ArticleConfig {
  title: string;
  author?: string;
  date: Date;
  content: string;
  published?: boolean;
}

class Article {
  readonly title: string;
  readonly content: string;
  readonly author: string;
  readonly date: string;
  readonly published: boolean;

  constructor(input: ArticleConfig) {
    this.title = input.title;
    this.author = input.author!;
    this.date = input.date.toISOString().split('T')[0];
    this.content = sanitizeHTML(marked.parse(input.content), sanitizerSettings);
    this.published = input.published ?? true;
  }

  compareDate(other: Article) {
    return this.date == other.date ? 0 : this.date > other.date ? 1 : -1;
  }
}

function getArticles(): Article[] {
  const config = readdirSync('../articles').map(file => readFileSync(`../articles/${file}`).toString()).join('\n');
  return (toml.parse(config)['articles'] as unknown as ArticleConfig[]).map(article => new Article(article));
}

function renderIndex(articles: Article[]): void {
  articles.sort((a: Article, b: Article) => a.compareDate(b));
  articles.reverse();
  const index = readFileSync('../templates/index.hb.html').toString();
  const output = Handlebars.compile(index)({ articles });
  writeFileSync('../../dist/index.html', output);
}

const articles = getArticles();
renderIndex(articles);

