// Test-only network replacement. Never imported by the application entry point.
globalThis.fetch=async(url,options)=>{
 const b=JSON.parse(options.body);if(b.contents){if(!options.headers['x-goog-api-key'])return new Response('{}',{status:401});return Response.json({candidates:[{content:{parts:[{text:'Gemini adapter test response.'}]}}]});}if(b.messages?.at(-1)?.content.includes('__provider_error__'))return new Response('{}',{status:429});if(!b.messages?.[0]?.content.includes('You cannot access hidden tests.'))return new Response('{}',{status:400});
 return Response.json({choices:[{message:{content:'Review the boundary handling.\n```javascript\nfunction solve(input) { return input; }\n```'}}]});
};
