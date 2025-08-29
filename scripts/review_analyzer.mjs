#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import minimist from 'minimist';
import { app as fetchApp, reviews as fetchReviews, sort as reviewSort } from 'google-play-scraper';

const args = minimist(process.argv.slice(2), {
  string: ['url', 'out', 'sort'],
  default: { out: 'reviews.json', sort: 'newest', max: 500 }
});

if (!args.url) {
  console.error('Usage: npm run analyze:reviews -- --url "<play store url>" --max 800 --out analysis.json --sort newest|most_relevant');
  process.exit(1);
}

const appIdMatch = args.url.match(/id=([^&]+)/);
if (!appIdMatch) {
  console.error('Invalid Play Store URL format');
  process.exit(1);
}
const appId = appIdMatch[1];

const sortMap = {
  newest: reviewSort.NEWEST,
  most_relevant: reviewSort.MOST_RELEVANT
};

async function fetchReviews() {
  try {
    console.log(`Fetching app info for "${appId}"...`);
    const appInfo = await fetchApp({ appId });
    console.log(`Title: ${appInfo.title} — Developer: ${appInfo.developer}`);

    console.log(`Fetching up to ${args.max} reviews sorted by ${args.sort}...`);
    const reviews = await fetchReviews({
      appId,
      sort: sortMap[args.sort] || reviewSort.NEWEST,
      num: args.max
    });

    const result = {
      app: {
        title: appInfo.title,
        developer: appInfo.developer,
        description: appInfo.summary
      },
      reviews: reviews.data
    };

    const outPath = path.resolve(args.out);
    fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
    console.log(`Saved ${reviews.data.length} reviews to ${outPath}`);
  } catch (error) {
    console.error('Error fetching data:', error.message);
  }
}

fetchReviews();


