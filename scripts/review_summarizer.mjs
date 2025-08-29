#!/usr/bin/env node
import fs from 'fs';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const jsonFile = process.argv[2] || 'analysis.json';

function loadReviews(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed)) return parsed;
    const possibleKeys = ['reviews', 'data', 'results', 'entries'];
    for (const key of possibleKeys) {
      if (Array.isArray(parsed[key])) return parsed[key];
    }
    console.error(`JSON file does not contain a reviews array: ${filePath}`);
    return [];
  } catch (err) {
    console.error(`Error reading or parsing JSON file (${filePath}):`, err.message);
    return [];
  }
}

async function summarizeReviews() {
  const reviews = loadReviews(jsonFile);
  if (!reviews.length) {
    console.log('No reviews found in JSON file.');
    return;
  }

  const textSample = reviews
    .slice(0, 250)
    .map((r) => {
      if (typeof r === 'string') return r;
      if (r.comment) return r.comment;
      if (r.text) return r.text;
      return JSON.stringify(r);
    })
    .join('\n\n');

  const prompt = `You are an expert in mobile game LiveOps. Analyze all the following user reviews and identify ONLY LiveOps-related pain points (events, A/B tests, offers, engagement loops, retention mechanics, rewards, progression pacing, etc.).\n\nYou must:\n1. Count and state how many reviews were analyzed.\n2. Summarize ONLY the key LiveOps-related complaints or frustrations in EXACTLY two concise lines.\n\nWarning: Don't dream up stats, numbers, reviews or update types apart from what the reviews actually say. Do not make up any stats, numbers, reviews or update types. Do not hallucinate.\n\nReviews:\n${textSample}`;

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-5',
      messages: [{ role: 'user', content: prompt }]
    });
    console.log('\n--- SUMMARY ---\n');
    console.log(response.choices[0].message.content);
    console.log('\n--- END ---\n');
  } catch (err) {
    console.error('Error summarizing reviews:', err.message);
  }
}

summarizeReviews();


