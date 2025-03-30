// import { Client } from 'langsmith';
// import OpenAI from 'openai';
// import { z } from 'zod';
// import { zodResponseFormat } from 'openai/helpers/zod';
// import type { EvaluationResult } from 'langsmith/evaluation';
// import { evaluate } from 'langsmith/evaluation';

// const client = new Client();

// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

// const examples: [string, string][] = [
//   ['Which country is Mount Kilimanjaro located in?', 'Mount Kilimanjaro is located in Tanzania.'],
//   ["What is Earth's lowest point?", "Earth's lowest point is The Dead Sea."],
// ];

// const inputs = examples.map(([inputPrompt]) => ({
//   question: inputPrompt,
// }));
// const outputs = examples.map(([, outputAnswer]) => ({
//   answer: outputAnswer,
// }));

// // Programmatically create a dataset in LangSmith
// const dataset = await client.createDataset('Sample dataset', {
//   description: 'A sample dataset in LangSmith.',
// });

// // Add examples to the dataset
// await client.createExamples({
//   inputs,
//   outputs,
//   datasetId: dataset.id,
// });
