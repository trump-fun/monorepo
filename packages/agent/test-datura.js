const options = {
  method: 'POST',
  headers: {
    Authorization: 'dt_$sN7MhNZanAZt7CNmhPref6UcFf7CBTFkgAT-4xhuT9I',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    prompt: 'Can you give me the most recent predictions on ukraine?',
    // model: "NOVA",

    model: 'HORIZON',
  }),
};

fetch('https://apis.datura.ai/desearch/ai/search/links/twitter', options)
  .then(response => response.json())
  .then(response => console.log(response))
  .catch(err => console.error(err));
